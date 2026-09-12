import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('RAG Pipeline & Grounded AI Teaching (E2E Integration Tests)', () => {
  let app: INestApplication;

  let studentId: string;
  let conceptId: string;
  let documentId: string;
  let chunkId: string;
  let sessionId: string;
  let sampleMdContent: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    // Read sample curriculum document
    const filePath = path.join(__dirname, 'data', 'class-8-mathematics-sample.md');
    if (fs.existsSync(filePath)) {
      sampleMdContent = fs.readFileSync(filePath, 'utf-8');
    } else {
      sampleMdContent = '# Sample Math Guide\n\nAddition combines numbers. 1/3 + 2/5 = 11/15.';
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Setup: Fetch active student and concept IDs', async () => {
    const studentsRes = await request(app.getHttpServer()).get('/api/students').expect(200);
    expect(studentsRes.body.length).toBeGreaterThan(0);
    studentId = studentsRes.body[0].id;

    const conceptsRes = await request(app.getHttpServer()).get('/api/concepts').expect(200);
    expect(conceptsRes.body.length).toBeGreaterThan(0);
    conceptId = conceptsRes.body[0].id;
  });

  it('2. POST /api/rag/documents -> should upload, parse, chunk, and embed curriculum document', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/rag/documents')
      .send({
        title: 'Grade 8 Mathematics Curriculum Guide',
        description: 'Comprehensive math guide covering fractions, decimals, and basic algebra',
        fileName: 'class-8-mathematics-sample.md',
        mimeType: 'text/markdown',
        content: sampleMdContent,
      });

    if (res.status !== 201) {
      console.error('Document Upload Failed Error:', res.status, res.body);
    }
    expect(res.status).toBe(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('PROCESSED');
    expect(res.body.visibility).toBe('DRAFT');
    expect(res.body.chunks).toBeDefined();
    expect(res.body.chunks.length).toBeGreaterThan(0);

    documentId = res.body.id;
    chunkId = res.body.chunks[0].id;
  });

  it('3. POST /api/rag/search (Draft Document Isolation) -> should NOT retrieve draft chunks when onlyPublished=true', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/rag/search')
      .send({
        query: 'Least Common Denominator fraction addition',
        studentId,
        limit: 5,
      })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    // Draft document chunks must NOT be accessible to student queries
    const foundDraftChunk = res.body.find((item: any) => item.documentId === documentId);
    expect(foundDraftChunk).toBeUndefined();
  });

  it('4. PATCH /api/rag/documents/:id/publish -> should publish document for student AI grounding', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/rag/documents/${documentId}/publish`)
      .expect(200);

    expect(res.body.id).toBe(documentId);
    expect(res.body.visibility).toBe('PUBLISHED');
  });

  it('5. POST /api/rag/search (Hybrid Vector Search) -> should return ranked chunks with similarity scores', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/rag/search')
      .send({
        query: 'How do I add fractions with different denominators?',
        studentId,
        limit: 5,
      })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].chunkId).toBeDefined();
    expect(res.body[0].content).toBeDefined();
    expect(res.body[0].score ?? res.body[0].semanticScore).toBeGreaterThan(0);
  });

  it('6. POST /api/rag/concepts/:conceptId/associate -> should manually associate chunk with concept', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/rag/concepts/${conceptId}/associate`)
      .send({
        documentChunkId: chunkId,
        isPrimary: true,
      })
      .expect(201);

    expect(res.body.conceptId).toBe(conceptId);
    expect(res.body.documentChunkId).toBe(chunkId);
    expect(res.body.associationStatus).toBe('CONFIRMED');
  });

  it('7. Grounded AI Tutor Session -> should provide AI tutoring with RAG citations', async () => {
    // Start session
    const sessionRes = await request(app.getHttpServer())
      .post('/api/ai/sessions')
      .send({
        studentId,
        conceptId,
      })
      .expect(201);

    sessionId = sessionRes.body.sessionId;
    expect(sessionId).toBeDefined();

    // Send question requiring grounding
    const msgRes = await request(app.getHttpServer())
      .post(`/api/ai/sessions/${sessionId}/message`)
      .send({
        studentId,
        message: 'How do I calculate fraction addition 1/3 + 2/5?',
      })
      .expect(201);

    expect(msgRes.body.tutorResponse).toBeDefined();
    expect(msgRes.body.tutorResponse.message).toBeDefined();
    const citations = msgRes.body.tutorResponse.sources ?? msgRes.body.tutorResponse.citations;
    expect(citations).toBeDefined();
    expect(Array.isArray(citations)).toBe(true);
  });

  it('8. POST /api/rag/documents/:id/reprocess -> should reprocess document content cleanly', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/rag/documents/${documentId}/reprocess`)
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('9. DELETE /api/rag/documents/:id -> should delete document and associated chunks', async () => {
    await request(app.getHttpServer())
      .delete(`/api/rag/documents/${documentId}`)
      .expect(200);

    // Verify document deleted
    await request(app.getHttpServer())
      .get(`/api/rag/documents/${documentId}`)
      .expect(200, '');
  });
});
