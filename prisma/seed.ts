import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.conceptPrerequisite.deleteMany();
  await prisma.question.deleteMany();
  await prisma.learningPlanItem.deleteMany();
  await prisma.learningPlan.deleteMany();
  await prisma.mastery.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@remedial.edu',
      name: 'System Admin',
      passwordHash: '$2b$10$YourHashedPasswordHereAdmin',
      role: UserRole.ADMIN,
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@remedial.edu',
      name: 'Sarah Connor (Teacher)',
      passwordHash: '$2b$10$YourHashedPasswordHereTeacher',
      role: UserRole.TEACHER,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@remedial.edu',
      name: 'Alex Johnson (Student)',
      passwordHash: '$2b$10$YourHashedPasswordHereStudent',
      role: UserRole.STUDENT,
    },
  });

  // 2. Create Teacher & Student profiles
  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      department: 'Mathematics & STEM',
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      gradeLevel: 6,
      targetGradeLevel: 8,
    },
  });

  // 3. Create Curriculum hierarchy
  const subject = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      code: 'MATH-101',
      description: 'Foundational mathematics and remedial learning path',
      teacherId: teacher.id,
    },
  });

  const chapter = await prisma.chapter.create({
    data: {
      name: 'Foundations',
      order: 1,
      subjectId: subject.id,
    },
  });

  const arithmeticTopic = await prisma.topic.create({
    data: {
      name: 'Arithmetic',
      order: 1,
      chapterId: chapter.id,
    },
  });

  const fractionsTopic = await prisma.topic.create({
    data: {
      name: 'Fractions',
      order: 2,
      chapterId: chapter.id,
    },
  });

  // 4. Create Concepts
  const additionConcept = await prisma.concept.create({
    data: {
      name: 'Addition',
      code: 'MATH-ADD-01',
      description: 'Basic numerical addition and place value operations',
      topicId: arithmeticTopic.id,
    },
  });

  const divisionConcept = await prisma.concept.create({
    data: {
      name: 'Division',
      code: 'MATH-DIV-01',
      description: 'Repeated subtraction and equal grouping division operations',
      topicId: arithmeticTopic.id,
    },
  });

  const fractionsConcept = await prisma.concept.create({
    data: {
      name: 'Fractions',
      code: 'MATH-FRAC-01',
      description: 'Understanding parts of a whole, numerators, and denominators',
      topicId: fractionsTopic.id,
    },
  });

  // 5. Create Prerequisite relationships: Addition → Division → Fractions
  await prisma.conceptPrerequisite.create({
    data: {
      conceptId: divisionConcept.id,
      prerequisiteId: additionConcept.id,
    },
  });

  await prisma.conceptPrerequisite.create({
    data: {
      conceptId: fractionsConcept.id,
      prerequisiteId: divisionConcept.id,
    },
  });

  // 6. Create sample Mastery record
  await prisma.mastery.create({
    data: {
      studentId: student.id,
      conceptId: additionConcept.id,
      score: 95.0,
      level: 3,
    },
  });

  await prisma.mastery.create({
    data: {
      studentId: student.id,
      conceptId: divisionConcept.id,
      score: 45.0,
      level: 1,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log(`Created:`);
  console.log(`- Admin: ${adminUser.email}`);
  console.log(`- Teacher: ${teacherUser.email}`);
  console.log(`- Student: ${studentUser.email}`);
  console.log(`- Subject: ${subject.name} (${chapter.name})`);
  console.log(`- Concepts: ${additionConcept.name} -> ${divisionConcept.name} -> ${fractionsConcept.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
