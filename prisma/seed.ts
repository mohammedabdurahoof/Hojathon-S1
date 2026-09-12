import { PrismaClient, UserRole, QuestionType, AssessmentPurpose } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 2 database seeding...');

  // Clean existing data
  await prisma.assessmentResponse.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.learningPlanItem.deleteMany();
  await prisma.learningPlan.deleteMany();
  await prisma.mastery.deleteMany();
  await prisma.question.deleteMany();
  await prisma.conceptPrerequisite.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@remedial.edu',
      name: 'System Admin',
      passwordHash: '$2b$10$AdminPasswordHashPlaceholder',
      role: UserRole.ADMIN,
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@remedial.edu',
      name: 'Dr. Sarah Connor',
      passwordHash: '$2b$10$TeacherPasswordHashPlaceholder',
      role: UserRole.TEACHER,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'alex@remedial.edu',
      name: 'Alex Johnson',
      passwordHash: '$2b$10$StudentPasswordHashPlaceholder',
      role: UserRole.STUDENT,
    },
  });

  // 2. Create Teacher & Student profiles
  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      department: 'Mathematics & STEM Acceleration',
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      gradeLevel: 6,        // Assessed grade level
      targetGradeLevel: 8,  // Target class grade level
    },
  });

  // 3. Subject, Chapter, Topic
  const subject = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      code: 'MATH-101',
      description: 'Grade 8 Remedial Mathematics Pathway',
      teacherId: teacher.id,
    },
  });

  const chapter = await prisma.chapter.create({
    data: {
      name: 'Algebraic Foundations & Number Theory',
      order: 1,
      subjectId: subject.id,
    },
  });

  const topic = await prisma.topic.create({
    data: {
      name: 'Remedial Core Competencies',
      order: 1,
      chapterId: chapter.id,
    },
  });

  // 4. Create 7 Concepts according to Prerequisite Graph:
  // Addition → Multiplication → Division → Fractions → Decimals → Percentages → Algebra

  const conceptAddition = await prisma.concept.create({
    data: { name: 'Addition', code: 'MATH-ADD', description: 'Whole number addition and place value', topicId: topic.id },
  });

  const conceptMultiplication = await prisma.concept.create({
    data: { name: 'Multiplication', code: 'MATH-MUL', description: 'Repeated addition and multiplication tables', topicId: topic.id },
  });

  const conceptDivision = await prisma.concept.create({
    data: { name: 'Division', code: 'MATH-DIV', description: 'Equal sharing, long division, and remainders', topicId: topic.id },
  });

  const conceptFractions = await prisma.concept.create({
    data: { name: 'Fractions', code: 'MATH-FRAC', description: 'Numerators, denominators, and equivalent fractions', topicId: topic.id },
  });

  const conceptDecimals = await prisma.concept.create({
    data: { name: 'Decimals', code: 'MATH-DEC', description: 'Tenths, hundredths, and decimal operations', topicId: topic.id },
  });

  const conceptPercentages = await prisma.concept.create({
    data: { name: 'Percentages', code: 'MATH-PCT', description: 'Parts per hundred and ratio conversions', topicId: topic.id },
  });

  const conceptAlgebra = await prisma.concept.create({
    data: { name: 'Algebra', code: 'MATH-ALG', description: 'Variables, linear equations, and expressions', topicId: topic.id },
  });

  // 5. Connect Prerequisite Relationships
  // Addition → Multiplication
  await prisma.conceptPrerequisite.create({
    data: { conceptId: conceptMultiplication.id, prerequisiteId: conceptAddition.id },
  });

  // Multiplication → Division
  await prisma.conceptPrerequisite.create({
    data: { conceptId: conceptDivision.id, prerequisiteId: conceptMultiplication.id },
  });

  // Division → Fractions
  await prisma.conceptPrerequisite.create({
    data: { conceptId: conceptFractions.id, prerequisiteId: conceptDivision.id },
  });

  // Fractions → Decimals
  await prisma.conceptPrerequisite.create({
    data: { conceptId: conceptDecimals.id, prerequisiteId: conceptFractions.id },
  });

  // Decimals → Percentages
  await prisma.conceptPrerequisite.create({
    data: { conceptId: conceptPercentages.id, prerequisiteId: conceptDecimals.id },
  });

  // Percentages → Algebra
  await prisma.conceptPrerequisite.create({
    data: { conceptId: conceptAlgebra.id, prerequisiteId: conceptPercentages.id },
  });

  // 6. Create 5 Questions per Concept (35 Questions total)
  const allQuestions = [];

  const questionsData = [
    // Addition (5 questions)
    { conceptId: conceptAddition.id, text: 'What is 45 + 37?', options: ['72', '82', '85', '92'], answer: '82', difficulty: 1 },
    { conceptId: conceptAddition.id, text: 'What is 128 + 256?', options: ['374', '384', '394', '404'], answer: '384', difficulty: 2 },
    { conceptId: conceptAddition.id, text: 'Evaluate 999 + 1001.', options: ['1990', '2000', '2010', '2001'], answer: '2000', difficulty: 2 },
    { conceptId: conceptAddition.id, text: 'Find the perimeter of a rectangle with sides 14 cm and 9 cm.', options: ['23 cm', '46 cm', '126 cm', '52 cm'], answer: '46 cm', difficulty: 3 },
    { conceptId: conceptAddition.id, text: 'Sum the numbers 15, 27, 35, and 43.', options: ['110', '120', '130', '140'], answer: '120', difficulty: 3 },

    // Multiplication (5 questions)
    { conceptId: conceptMultiplication.id, text: 'What is 7 × 8?', options: ['54', '56', '63', '64'], answer: '56', difficulty: 1 },
    { conceptId: conceptMultiplication.id, text: 'What is 12 × 12?', options: ['124', '134', '144', '154'], answer: '144', difficulty: 2 },
    { conceptId: conceptMultiplication.id, text: 'Calculate 15 × 6.', options: ['80', '90', '95', '100'], answer: '90', difficulty: 2 },
    { conceptId: conceptMultiplication.id, text: 'A box contains 24 chocolates. How many in 5 boxes?', options: ['100', '110', '120', '130'], answer: '120', difficulty: 3 },
    { conceptId: conceptMultiplication.id, text: 'What is 35 × 11?', options: ['365', '375', '385', '395'], answer: '385', difficulty: 3 },

    // Division (5 questions)
    { conceptId: conceptDivision.id, text: 'What is 56 ÷ 7?', options: ['6', '7', '8', '9'], answer: '8', difficulty: 1 },
    { conceptId: conceptDivision.id, text: 'Divide 144 by 12.', options: ['10', '11', '12', '14'], answer: '12', difficulty: 2 },
    { conceptId: conceptDivision.id, text: 'What is the quotient of 225 ÷ 15?', options: ['13', '14', '15', '16'], answer: '15', difficulty: 3 },
    { conceptId: conceptDivision.id, text: 'If 84 candies are divided equally among 6 kids, how many does each get?', options: ['12', '13', '14', '16'], answer: '14', difficulty: 3 },
    { conceptId: conceptDivision.id, text: 'What is 360 ÷ 9?', options: ['30', '40', '50', '60'], answer: '40', difficulty: 2 },

    // Fractions (5 questions)
    { conceptId: conceptFractions.id, text: 'What is 1/4 + 2/4?', options: ['1/2', '3/4', '3/8', '1/4'], answer: '3/4', difficulty: 2 },
    { conceptId: conceptFractions.id, text: 'Simplify 6/12 to lowest terms.', options: ['1/3', '1/2', '2/3', '3/4'], answer: '1/2', difficulty: 2 },
    { conceptId: conceptFractions.id, text: 'What is 2/3 × 3/5?', options: ['6/15', '2/5', '5/8', '6/8'], answer: '2/5', difficulty: 3 },
    { conceptId: conceptFractions.id, text: 'Subtract 1/3 from 5/6.', options: ['1/2', '1/3', '2/3', '4/6'], answer: '1/2', difficulty: 3 },
    { conceptId: conceptFractions.id, text: 'Which fraction is equivalent to 3/5?', options: ['6/10', '9/20', '12/25', '15/30'], answer: '6/10', difficulty: 2 },

    // Decimals (5 questions)
    { conceptId: conceptDecimals.id, text: 'Convert 3/4 to a decimal.', options: ['0.25', '0.50', '0.75', '0.80'], answer: '0.75', difficulty: 2 },
    { conceptId: conceptDecimals.id, text: 'What is 0.4 + 0.35?', options: ['0.39', '0.75', '0.79', '0.80'], answer: '0.75', difficulty: 2 },
    { conceptId: conceptDecimals.id, text: 'Calculate 2.5 × 0.4.', options: ['0.10', '1.0', '1.25', '10.0'], answer: '1.0', difficulty: 3 },
    { conceptId: conceptDecimals.id, text: 'Subtract 1.85 from 5.00.', options: ['3.15', '3.25', '3.85', '4.15'], answer: '3.15', difficulty: 3 },
    { conceptId: conceptDecimals.id, text: 'Round 3.14159 to two decimal places.', options: ['3.14', '3.15', '3.10', '3.20'], answer: '3.14', difficulty: 2 },

    // Percentages (5 questions)
    { conceptId: conceptPercentages.id, text: 'What is 50% of 80?', options: ['30', '40', '50', '60'], answer: '40', difficulty: 1 },
    { conceptId: conceptPercentages.id, text: 'Express 0.25 as a percentage.', options: ['2.5%', '25%', '250%', '0.25%'], answer: '25%', difficulty: 2 },
    { conceptId: conceptPercentages.id, text: 'What is 20% of 150?', options: ['20', '25', '30', '35'], answer: '30', difficulty: 3 },
    { conceptId: conceptPercentages.id, text: 'A shirt costs $40 and is on 15% discount. What is the discount amount?', options: ['$4', '$6', '$8', '$10'], answer: '$6', difficulty: 3 },
    { conceptId: conceptPercentages.id, text: '15 out of 60 students got an A. What percentage is that?', options: ['20%', '25%', '30%', '40%'], answer: '25%', difficulty: 3 },

    // Algebra (5 questions)
    { conceptId: conceptAlgebra.id, text: 'Solve for x: x + 7 = 15.', options: ['6', '7', '8', '9'], answer: '8', difficulty: 2 },
    { conceptId: conceptAlgebra.id, text: 'Solve for y: 3y = 21.', options: ['5', '6', '7', '8'], answer: '7', difficulty: 2 },
    { conceptId: conceptAlgebra.id, text: 'Evaluate 2x + 5 when x = 4.', options: ['11', '13', '14', '15'], answer: '13', difficulty: 3 },
    { conceptId: conceptAlgebra.id, text: 'Solve for z: 4z - 6 = 18.', options: ['5', '6', '7', '8'], answer: '6', difficulty: 3 },
    { conceptId: conceptAlgebra.id, text: 'Simplify the expression: 3a + 2b + 5a - b.', options: ['8a + b', '8a + 3b', '15a - 2b', '7a + b'], answer: '8a + b', difficulty: 3 },
  ];

  for (const q of questionsData) {
    const createdQ = await prisma.question.create({
      data: {
        conceptId: q.conceptId,
        text: q.text,
        type: QuestionType.MULTIPLE_CHOICE,
        difficulty: q.difficulty,
        options: q.options,
        answer: q.answer,
        explanation: `Demonstration explanation for "${q.text}"`,
        isActive: true,
      },
    });
    allQuestions.push(createdQ);
  }

  // 7. Create 1 Comprehensive Diagnostic Assessment
  const assessment = await prisma.assessment.create({
    data: {
      title: 'Mathematics Grade 8 Diagnostic Baseline Assessment',
      description: 'Comprehensive diagnostic test evaluating prerequisite knowledge from Addition to Algebra.',
      subjectId: subject.id,
      targetGrade: 8,
      purpose: AssessmentPurpose.DIAGNOSTIC,
      duration: 45,
      isActive: true,
    },
  });

  // Attach 2 questions per concept (14 questions total for diagnostic)
  const diagnosticQuestions = allQuestions.filter((_, idx) => idx % 5 === 0 || idx % 5 === 1);
  await prisma.assessmentQuestion.createMany({
    data: diagnosticQuestions.map((q, idx) => ({
      assessmentId: assessment.id,
      questionId: q.id,
      order: idx + 1,
    })),
  });

  // 8. Seed Simulated Student Mastery Levels for Alex Johnson:
  // Strong in Addition & Multiplication, Weak in Division & Fractions, Critical in Decimals, Percentages, Algebra
  const studentMasteries = [
    { conceptId: conceptAddition.id, score: 0.95, attempts: 20, correct: 19 },
    { conceptId: conceptMultiplication.id, score: 0.90, attempts: 15, correct: 14 },
    { conceptId: conceptDivision.id, score: 0.40, attempts: 10, correct: 4 },      // Root Gap 1
    { conceptId: conceptFractions.id, score: 0.35, attempts: 8, correct: 3 },       // Root Gap 2
    { conceptId: conceptDecimals.id, score: 0.30, attempts: 5, correct: 1 },
    { conceptId: conceptPercentages.id, score: 0.25, attempts: 4, correct: 1 },
    { conceptId: conceptAlgebra.id, score: 0.20, attempts: 5, correct: 1 },
  ];

  for (const sm of studentMasteries) {
    await prisma.mastery.create({
      data: {
        studentId: student.id,
        conceptId: sm.conceptId,
        masteryScore: sm.score,
        attempts: sm.attempts,
        correctAttempts: sm.correct,
        confidence: Math.min(1.0, sm.attempts / 10.0),
        lastAssessedAt: new Date(),
      },
    });
  }

  // 9. Seed Active Learning Plan for Alex Johnson (Target: Algebra, Weak Prerequisite: Fractions at 0.36)
  const plan = await prisma.learningPlan.create({
    data: {
      studentId: student.id,
      targetConceptId: conceptAlgebra.id,
      title: 'Remedial Learning Plan - Alex Johnson',
      purpose: 'Targeted remediation for Algebra prerequisites',
      status: 'ACTIVE',
      estimatedDurationMinutes: 180,
      priority: 'HIGH',
    },
  });

  await prisma.learningPlanItem.create({
    data: {
      learningPlanId: plan.id,
      conceptId: conceptDivision.id,
      order: 1,
      reason: 'PRIMARY ROOT GAP: Foundational prerequisite knowledge deficit',
      targetMastery: 0.80,
      currentMastery: 0.40,
      status: 'MASTERED',
    },
  });

  await prisma.learningPlanItem.create({
    data: {
      learningPlanId: plan.id,
      conceptId: conceptFractions.id,
      order: 2,
      reason: 'Active Prerequisite Gap (Mastery: 36%)',
      targetMastery: 0.80,
      currentMastery: 0.36,
      status: 'IN_PROGRESS',
    },
  });

  console.log('✅ Phase 3 Seeding completed successfully!');
  console.log(`- Created Subject: ${subject.name} (${subject.code})`);
  console.log(`- Created 7 Concepts: Addition -> Multiplication -> Division -> Fractions -> Decimals -> Percentages -> Algebra`);
  console.log(`- Created ${allQuestions.length} Questions (5 per concept)`);
  console.log(`- Created Diagnostic Assessment "${assessment.title}" with 14 attached questions`);
  console.log(`- Seeded student "${studentUser.name}" with simulated Division (40%) and Fractions (36%) gaps`);
  console.log(`- Created Active Remedial Plan "${plan.title}" targeting Fractions (36%)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding Phase 2 data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
