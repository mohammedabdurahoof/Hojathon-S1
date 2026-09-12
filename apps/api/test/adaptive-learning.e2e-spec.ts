import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Phase 5 Adaptive Learning & Mastery Intelligence (E2E Integration Tests)', () => {
  let app: INestApplication;

  let studentId: string;
  let conceptId: string;
  let sessionId: string;
  let questionId: string;

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

  it('1. Setup: Fetch active student and concept IDs', async () => {
    const studentsRes = await request(app.getHttpServer()).get('/api/students').expect(200);
    expect(studentsRes.body.length).toBeGreaterThan(0);
    studentId = studentsRes.body[0].id;

    const conceptsRes = await request(app.getHttpServer()).get('/api/concepts').expect(200);
    expect(conceptsRes.body.length).toBeGreaterThan(0);
    conceptId = conceptsRes.body[0].id;
  });

  it('2. POST /api/adaptive/sessions -> should start an adaptive learning session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/adaptive/sessions')
      .send({
        studentId,
        conceptId,
      })
      .expect(201);

    expect(res.body.session).toBeDefined();
    expect(res.body.session.id).toBeDefined();
    expect(res.body.difficulty).toBeDefined();
    expect(res.body.recommendedAction).toBeDefined();

    sessionId = res.body.session.id;
    if (res.body.currentQuestion) {
      questionId = res.body.currentQuestion.id;
    }
  });

  it('3. POST /api/adaptive/sessions/:id/respond -> should evaluate incorrect turn and record misconception', async () => {
    if (!questionId) {
      const qRes = await request(app.getHttpServer()).get('/api/questions').expect(200);
      questionId = qRes.body[0].id;
    }

    const res = await request(app.getHttpServer())
      .post(`/api/adaptive/sessions/${sessionId}/respond`)
      .send({
        questionId,
        studentAnswer: '2/5 (Adding 1/2 and 1/3 directly)',
        responseTimeMs: 3500,
      })
      .expect(201);

    expect(res.body.evaluation).toBeDefined();
    expect(res.body.isCorrect).toBe(false);
    expect(res.body.mastery).toBeDefined();
    expect(res.body.nextDifficulty).toBeDefined();
  });

  it('4. POST /api/adaptive/sessions/:id/hint -> should provide guided hint', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/adaptive/sessions/${sessionId}/hint`)
      .send({
        questionId,
      })
      .expect(201);

    expect(res.body.hintText).toBeDefined();
    expect(res.body.hintLevel).toBe(1);
  });

  it('5. POST /api/adaptive/sessions/:id/respond -> should process correct turn and update mastery evidence', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/adaptive/sessions/${sessionId}/respond`)
      .send({
        questionId,
        studentAnswer: '5/6',
        responseTimeMs: 2800,
      })
      .expect(201);

    expect(res.body.isCorrect).toBe(true);
    expect(res.body.mastery).toBeGreaterThan(0);
  });

  it('6. GET /api/students/:studentId/learning-state -> should return aggregated student learning state', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/students/${studentId}/learning-state`)
      .expect(200);

    expect(res.body.studentId).toBe(studentId);
    expect(res.body.mastery).toBeDefined();
    expect(res.body.masteryStatus).toBeDefined();
    expect(res.body.recentPerformance).toBeDefined();
  });

  it('7. GET /api/students/:studentId/mastery-history -> should return mastery update audit trail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/students/${studentId}/mastery-history`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].previousScore).toBeDefined();
    expect(res.body[0].newScore).toBeDefined();
  });

  it('8. GET /api/students/:studentId/misconceptions -> should return tracked misconceptions', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/students/${studentId}/misconceptions`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('9. POST /api/adaptive/sessions/:id/complete -> should complete adaptive learning session', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/adaptive/sessions/${sessionId}/complete`)
      .expect(201);

    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.status).toBe('COMPLETED');
  });
});
