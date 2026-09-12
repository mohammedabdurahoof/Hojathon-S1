import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Phase 6 Teacher Intelligence, Student Risk & Intervention System (E2E Integration Tests)', () => {
  let app: INestApplication;

  let teacherId: string;
  let studentId: string;
  let classId: string;
  let conceptId: string;
  let interventionId: string;
  let alertId: string;

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

  it('1. Setup: Fetch active teacher, student, concept, and class IDs from DB', async () => {
    const teachersRes = await request(app.getHttpServer()).get('/api/teachers').expect(200);
    expect(teachersRes.body.length).toBeGreaterThan(0);
    teacherId = teachersRes.body[0].id;

    const studentsRes = await request(app.getHttpServer()).get('/api/students').expect(200);
    expect(studentsRes.body.length).toBeGreaterThan(0);
    studentId = studentsRes.body[0].id;

    const conceptsRes = await request(app.getHttpServer()).get('/api/concepts').expect(200);
    expect(conceptsRes.body.length).toBeGreaterThan(0);
    conceptId = conceptsRes.body[0].id;

    const dashboardRes = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/dashboard?teacherId=${teacherId}`)
      .expect(200);

    expect(dashboardRes.body.classes.length).toBeGreaterThan(0);
    classId = dashboardRes.body.classes[0].classId;
  });

  it('2. GET /api/teacher-intelligence/dashboard -> should return teacher dashboard metrics', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/dashboard?teacherId=${teacherId}`)
      .expect(200);

    expect(res.body.teacherId).toBe(teacherId);
    expect(res.body.totalClasses).toBeGreaterThanOrEqual(1);
    expect(res.body.riskDistribution).toBeDefined();
    expect(res.body.urgentStudents).toBeDefined();
  });

  it('3. GET /api/teacher-intelligence/classes/:classId/overview -> should return class overview', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/classes/${classId}/overview?teacherId=${teacherId}`)
      .expect(200);

    expect(res.body.classId).toBe(classId);
    expect(res.body.totalStudents).toBeGreaterThanOrEqual(1);
    expect(res.body.riskDistribution).toBeDefined();
  });

  it('4. GET /api/teacher-intelligence/classes/:classId/bottlenecks -> should return class bottlenecks', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/classes/${classId}/bottlenecks`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('5. GET /api/teacher-intelligence/classes/:classId/misconceptions -> should return misconception clusters', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/classes/${classId}/misconceptions`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('6. GET /api/teacher-intelligence/classes/:classId/groups -> should return dynamic student groups', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/classes/${classId}/groups?strategy=RISK`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('7. GET /api/teacher-intelligence/classes/:classId/recommendations -> should return actionable recommendations', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/classes/${classId}/recommendations?teacherId=${teacherId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('8. GET /api/teacher-intelligence/students/:studentId/risk -> should return student risk profile', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/students/${studentId}/risk`)
      .expect(200);

    expect(res.body.studentId).toBe(studentId);
    expect(res.body.riskScore).toBeGreaterThanOrEqual(0);
    expect(res.body.riskLevel).toBeDefined();
    expect(res.body.evidence).toBeDefined();
  });

  it('9. GET /api/teacher-intelligence/students/:studentId/progress -> should return progress history', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/students/${studentId}/progress`)
      .expect(200);

    expect(res.body.studentId).toBe(studentId);
    expect(res.body.gapClosureRate).toBeDefined();
  });

  it('10. GET /api/teacher-intelligence/concepts/:conceptId -> should return concept analytics', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/concepts/${conceptId}?classId=${classId}`)
      .expect(200);

    expect(res.body.conceptId).toBe(conceptId);
    expect(res.body.averageMastery).toBeDefined();
  });

  it('11. POST /api/teacher-intelligence/interventions -> should create intervention', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/teacher-intelligence/interventions?teacherId=${teacherId}`)
      .send({
        classId,
        studentId,
        conceptId,
        type: 'INDIVIDUAL_REMEDIATION',
        reason: 'Integration test remediation assignment',
        recommendation: 'Complete 5 practice questions',
        priority: 'HIGH',
        targetMastery: 0.8,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('ASSIGNED');
    interventionId = res.body.id;
  });

  it('12. GET /api/teacher-intelligence/interventions -> should list teacher interventions', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/interventions?teacherId=${teacherId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('13. PATCH /api/teacher-intelligence/interventions/:id -> should update status and evaluate outcome', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/teacher-intelligence/interventions/${interventionId}?teacherId=${teacherId}`)
      .send({
        status: 'COMPLETED',
        afterMastery: 0.85,
        teacherNotes: 'Student completed practice successfully',
      })
      .expect(200);

    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.outcome).toBe('SUCCESSFUL');
  });

  it('14. POST /api/teacher-intelligence/alerts/scan -> should scan for alerts', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/teacher-intelligence/alerts/scan?teacherId=${teacherId}`)
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('15. GET /api/teacher-intelligence/alerts -> should list alerts', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/teacher-intelligence/alerts?teacherId=${teacherId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    alertId = res.body[0].id;
  });

  it('16. PATCH /api/teacher-intelligence/alerts/:id -> should update alert status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/teacher-intelligence/alerts/${alertId}?teacherId=${teacherId}`)
      .send({
        status: 'READ',
      })
      .expect(200);

    expect(res.body.status).toBe('READ');
  });

  it('17. POST /api/teacher-intelligence/ai/ask -> should answer grounded AI query', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/teacher-intelligence/ai/ask?teacherId=${teacherId}`)
      .send({
        query: 'Why is Alex Johnson struggling in math?',
        studentId,
        classId,
      })
      .expect(201);

    expect(res.body.query).toBeDefined();
    expect(res.body.answer).toBeDefined();
  });
});
