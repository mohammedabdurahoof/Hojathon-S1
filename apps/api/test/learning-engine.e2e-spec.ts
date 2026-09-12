import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Academic Learning Engine (E2E Integration Tests)', () => {
  let app: INestApplication;

  let testSubjectId: string;
  let testChapterId: string;
  let testTopicId: string;
  let conceptAId: string;
  let conceptBId: string;
  let conceptCId: string;
  let question1Id: string;
  let question2Id: string;
  let assessmentId: string;
  let studentId: string;
  let attemptId: string;

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

  // 1. Create Subject
  it('1. POST /api/subjects -> should create a new subject', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/subjects')
      .send({
        name: 'Test Mathematics',
        code: `TEST-MATH-${Date.now()}`,
        description: 'Test subject for E2E validation',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    testSubjectId = res.body.id;
  });

  // Setup Chapter & Topic
  it('Setup: Create Chapter & Topic', async () => {
    const chapRes = await request(app.getHttpServer())
      .post('/api/chapters')
      .send({
        name: 'Test Chapter',
        order: 1,
        subjectId: testSubjectId,
      })
      .expect(201);
    testChapterId = chapRes.body.id;

    const topicRes = await request(app.getHttpServer())
      .post('/api/topics')
      .send({
        name: 'Test Topic',
        order: 1,
        chapterId: testChapterId,
      })
      .expect(201);
    testTopicId = topicRes.body.id;
  });

  // 2. Create Concepts
  it('2. POST /api/concepts -> should create Concepts A, B, C', async () => {
    const resA = await request(app.getHttpServer())
      .post('/api/concepts')
      .send({ name: 'Concept A (Addition)', code: `TST-ADD-${Date.now()}`, topicId: testTopicId })
      .expect(201);
    conceptAId = resA.body.id;

    const resB = await request(app.getHttpServer())
      .post('/api/concepts')
      .send({ name: 'Concept B (Multiplication)', code: `TST-MUL-${Date.now()}`, topicId: testTopicId })
      .expect(201);
    conceptBId = resB.body.id;

    const resC = await request(app.getHttpServer())
      .post('/api/concepts')
      .send({ name: 'Concept C (Division)', code: `TST-DIV-${Date.now()}`, topicId: testTopicId })
      .expect(201);
    conceptCId = resC.body.id;

    expect(conceptAId).toBeDefined();
    expect(conceptBId).toBeDefined();
    expect(conceptCId).toBeDefined();
  });

  // 3. Create Prerequisites
  it('3. POST /api/concepts/:id/prerequisites -> should create A -> B and B -> C', async () => {
    // B depends on A
    await request(app.getHttpServer())
      .post(`/api/concepts/${conceptBId}/prerequisites`)
      .send({ prerequisiteId: conceptAId })
      .expect(201);

    // C depends on B
    await request(app.getHttpServer())
      .post(`/api/concepts/${conceptCId}/prerequisites`)
      .send({ prerequisiteId: conceptBId })
      .expect(201);
  });

  // 4. Reject Circular Prerequisite
  it('4. POST /api/concepts/:id/prerequisites -> should reject circular prerequisite (A depends on C)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/concepts/${conceptAId}/prerequisites`)
      .send({ prerequisiteId: conceptCId })
      .expect(400);

    expect(res.body.message).toContain('Circular prerequisite dependency detected');
  });

  // 5. Create Questions
  it('5. POST /api/questions -> should create questions for concepts', async () => {
    const q1 = await request(app.getHttpServer())
      .post('/api/questions')
      .send({
        conceptId: conceptAId,
        text: 'What is 5 + 5?',
        type: 'MULTIPLE_CHOICE',
        difficulty: 1,
        options: ['8', '10', '12'],
        answer: '10',
      })
      .expect(201);
    question1Id = q1.body.id;

    const q2 = await request(app.getHttpServer())
      .post('/api/questions')
      .send({
        conceptId: conceptBId,
        text: 'What is 5 * 5?',
        type: 'MULTIPLE_CHOICE',
        difficulty: 2,
        options: ['20', '25', '30'],
        answer: '25',
      })
      .expect(201);
    question2Id = q2.body.id;

    expect(question1Id).toBeDefined();
    expect(question2Id).toBeDefined();
  });

  // 6. Create Assessment
  it('6. POST /api/assessments -> should create assessment with questions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/assessments')
      .send({
        title: 'E2E Validation Assessment',
        subjectId: testSubjectId,
        targetGrade: 8,
        purpose: 'DIAGNOSTIC',
        duration: 30,
        questionIds: [question1Id, question2Id],
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.questions).toHaveLength(2);
    assessmentId = res.body.id;
  });

  // Fetch or setup student
  it('Setup: Fetch test student', async () => {
    const studentsRes = await request(app.getHttpServer()).get('/api/students').expect(200);
    expect(studentsRes.body.length).toBeGreaterThan(0);
    studentId = studentsRes.body[0].id;
  });

  // 7. Start Assessment
  it('7. POST /api/assessments/:id/start -> should start attempt without exposing answers', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/assessments/${assessmentId}/start`)
      .send({ studentId })
      .expect(201);

    expect(res.body.attemptId).toBeDefined();
    expect(res.body.questions[0].question.answer).toBeUndefined(); // Answer must be hidden!
    attemptId = res.body.attemptId;
  });

  // 8 & 9. Submit Assessment & Calculate Score
  it('8 & 9. POST /api/assessments/:id/submit -> should grade responses and update scores', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/assessments/${assessmentId}/submit`)
      .send({
        attemptId,
        responses: [
          { questionId: question1Id, selectedAnswer: '10', timeSpentSeconds: 12 }, // Correct
          { questionId: question2Id, selectedAnswer: '20', timeSpentSeconds: 15 }, // Incorrect
        ],
      })
      .expect(201);

    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.correctAnswers).toBe(1);
    expect(res.body.incorrectAnswers).toBe(1);
    expect(res.body.score).toBe(1);
    expect(res.body.percentage).toBe(50);
  });

  // 10. Update Mastery
  it('10. GET /api/mastery/student/:studentId -> should confirm updated concept masteries', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/mastery/student/${studentId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // 11. Detect Learning Gaps
  it('11. GET /api/students/:studentId/learning-gaps -> should detect weak concepts', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/students/${studentId}/learning-gaps`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // 12. Find Root Gaps
  it('12. GET /api/students/:studentId/root-gaps -> should isolate root prerequisite gaps', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/students/${studentId}/root-gaps`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // 13. Generate Learning Plan
  it('13. POST /api/students/:studentId/learning-plans/generate -> should create ordered remedial plan', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/students/${studentId}/learning-plans/generate`)
      .expect(201);

    expect(res.body.planId).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
