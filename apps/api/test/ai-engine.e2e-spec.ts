import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AI Learning Layer (E2E Integration Tests)', () => {
  let app: INestApplication;

  let studentId: string;
  let unauthorizedStudentId: string;
  let conceptId: string;
  let sessionId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('Setup: Fetch student and concept IDs', async () => {
    const studentsRes = await request(app.getHttpServer()).get('/api/students').expect(200);
    expect(studentsRes.body.length).toBeGreaterThan(0);
    studentId = studentsRes.body[0].id;

    // Create secondary student for authorization tests
    const userRes = await request(app.getHttpServer())
      .post('/api/users')
      .send({})
      .catch(() => null);

    unauthorizedStudentId = 'unauthorized-student-999';

    const conceptsRes = await request(app.getHttpServer()).get('/api/concepts').expect(200);
    expect(conceptsRes.body.length).toBeGreaterThan(0);
    conceptId = conceptsRes.body[0].id;
  });

  // 1 & 7. Start AI Session
  it('1. POST /api/ai/sessions -> should start a structured AI tutoring session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/sessions')
      .send({
        studentId,
        conceptId,
      })
      .expect(201);

    expect(res.body.sessionId).toBeDefined();
    expect(res.body.context).toBeDefined();
    expect(res.body.context.student.id).toBe(studentId);
    sessionId = res.body.sessionId;
  });

  // 8. Send Session Message & Response Validation
  it('2. POST /api/ai/sessions/:id/message -> should return structured tutor response', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/ai/sessions/${sessionId}/message`)
      .send({
        studentId,
        message: 'How do I add fractions?',
      })
      .expect(201);

    expect(res.body.tutorResponse).toBeDefined();
    expect(res.body.tutorResponse.type).toBeDefined();
    expect(res.body.tutorResponse.message).toBeDefined();
    expect(res.body.tutorResponse.requiresStudentResponse).toBeDefined();
  });

  // 9. Unauthorized Student Access Protection
  it('3. POST /api/ai/sessions/:id/message -> should reject unauthorized student access', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/ai/sessions/${sessionId}/message`)
      .send({
        studentId: unauthorizedStudentId,
        message: 'Malicious attempt',
      })
      .expect(400);

    expect(res.body.message).toContain('does not belong to student');
  });

  // 4. Lesson Generation Schema Validation
  it('4. POST /api/ai/lessons/generate -> should generate structured lesson plan', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/lessons/generate')
      .send({
        studentId,
        conceptId,
      })
      .expect(201);

    expect(res.body.concept).toBeDefined();
    expect(res.body.objective).toBeDefined();
    expect(Array.isArray(res.body.sections)).toBe(true);
  });

  // 5. Practice Question Validation
  it('5. POST /api/ai/practice/generate -> should generate validated practice questions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/practice/generate')
      .send({
        studentId,
        conceptId,
        count: 2,
        difficulty: 3,
      })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].question).toBeDefined();
    expect(res.body[0].options).toBeDefined();
    expect(res.body[0].correctAnswer).toBeDefined();
  });

  // 6 & 10. Answer Evaluation & Misconception Detection
  it('6 & 10. POST /api/ai/evaluate -> should evaluate answer, detect misconception, and trigger mastery update', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/evaluate')
      .send({
        studentId,
        conceptId,
        question: 'What is 1/2 + 1/3?',
        expectedAnswer: '5/6',
        studentAnswer: '2/5',
      })
      .expect(201);

    expect(res.body.correct).toBe(false);
    expect(res.body.status).toBe('INCORRECT');
    expect(res.body.misconception).toBeDefined();
    expect(res.body.hint).toBeDefined();
  });

  // 13. Get Usage Metrics & Observability
  it('7. GET /api/ai/usage -> should return AI observability and token usage logs', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/ai/usage')
      .expect(200);

    expect(res.body.totalRequests).toBeGreaterThan(0);
    expect(res.body.successfulRequests).toBeGreaterThan(0);
    expect(Array.isArray(res.body.recentLogs)).toBe(true);
  });
});
