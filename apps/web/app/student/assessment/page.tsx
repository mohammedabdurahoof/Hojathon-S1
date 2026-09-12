'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

interface Question {
  id: number;
  conceptCode: string;
  conceptName: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  hint: string;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    conceptCode: 'MATH-ADD-01',
    conceptName: 'Addition & Carry Over',
    questionText: 'What is the sum of 487 + 659?',
    options: ['1,136', '1,146', '1,046', '1,246'],
    correctAnswer: 1,
    hint: 'Break it down into place values: (400+600) + (80+50) + (7+9).',
    explanation: '487 + 659 = 1,146. Group numbers by ones, tens, and hundreds.',
  },
  {
    id: 2,
    conceptCode: 'MATH-DIV-01',
    conceptName: 'Division with Remainders',
    questionText: 'When 147 is divided by 6, what is the quotient and remainder?',
    options: [
      'Quotient: 24, Remainder: 3',
      'Quotient: 24, Remainder: 5',
      'Quotient: 23, Remainder: 3',
      'Quotient: 25, Remainder: 2',
    ],
    correctAnswer: 0,
    hint: '6 × 20 = 120, 6 × 4 = 24. Total 144.',
    explanation: '147 ÷ 6 = 24 with a remainder of 3 because 6 × 24 = 144, and 147 - 144 = 3.',
  },
  {
    id: 3,
    conceptCode: 'MATH-FRAC-01',
    conceptName: 'Equivalent Fractions',
    questionText: 'Which fraction is equivalent to 3/4?',
    options: ['6/10', '9/12', '12/20', '8/12'],
    correctAnswer: 1,
    hint: 'Multiply both numerator and denominator by 3.',
    explanation: '(3 × 3) / (4 × 3) = 9/12.',
  },
  {
    id: 4,
    conceptCode: 'MATH-DIV-01',
    conceptName: 'Long Division Step',
    questionText: 'In long division 532 ÷ 4, what is the first digit of the quotient?',
    options: ['0', '1', '2', '5'],
    correctAnswer: 1,
    hint: 'Divide the highest place value (5) by 4.',
    explanation: '4 goes into 5 one time (1), leaving 1 as remainder before bringing down 3.',
  },
  {
    id: 5,
    conceptCode: 'MATH-FRAC-02',
    conceptName: 'Adding Common Denominators',
    questionText: 'Calculate: 2/7 + 3/7 = ?',
    options: ['5/14', '5/7', '6/7', '1/7'],
    correctAnswer: 1,
    hint: 'Since denominators are equal (7), add the numerators directly.',
    explanation: '(2 + 3) / 7 = 5/7.',
  },
];

export default function StudentAssessmentPage() {
  const [assessmentState, setAssessmentState] = useState<'IDLE' | 'IN_PROGRESS' | 'COMPLETED'>('IDLE');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [gapDetected, setGapDetected] = useState<string>('');

  const currentQ = QUESTIONS[currentIdx];

  const handleStart = () => {
    setAssessmentState('IN_PROGRESS');
    setCurrentIdx(0);
    setUserAnswers({});
    setShowHint(false);
  };

  const handleSelectOption = (optionIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const handleNext = () => {
    setShowHint(false);
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      calculateResult();
    }
  };

  const handlePrev = () => {
    setShowHint(false);
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const calculateResult = () => {
    let correctCount = 0;
    const missedConcepts: string[] = [];

    QUESTIONS.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount++;
      } else {
        missedConcepts.push(q.conceptName);
      }
    });

    const finalScore = Math.round((correctCount / QUESTIONS.length) * 100);
    setScore(finalScore);

    if (missedConcepts.includes('Division with Remainders') || missedConcepts.includes('Long Division Step')) {
      setGapDetected('Division with Remainders & Place Values');
    } else if (missedConcepts.length > 0) {
      setGapDetected(missedConcepts[0]);
    } else {
      setGapDetected('None (Full Prerequisite Mastery)');
    }

    setAssessmentState('COMPLETED');
  };

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">📝</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Adaptive Diagnostic Assessment</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Real-time prerequisite knowledge gap analysis powered by the AI Engine.
              </p>
            </div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
              Grade 6 Mathematics
            </span>
          </div>

          {/* State 1: Start IDLE */}
          {assessmentState === 'IDLE' && (
            <div className="p-8 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-6">
              <div className="flex items-center space-x-3 text-indigo-400">
                <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-lg">⚡</span>
                <h3 className="text-lg font-bold text-white">Mathematics Foundations Diagnostic #1</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                This diagnostic test contains 5 adaptive questions evaluating your understanding of basic arithmetic,
                long division, and fractions. The AI Remediation Engine will analyze your answers to detect root concept gaps.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Questions</div>
                  <div className="text-lg font-bold text-white mt-0.5">5 Adaptive Items</div>
                </div>
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Time Limit</div>
                  <div className="text-lg font-bold text-white mt-0.5">Untimed</div>
                </div>
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">AI Assistance</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">Hints Enabled</div>
                </div>
              </div>
              <div className="pt-4 flex items-center space-x-4">
                <button
                  onClick={handleStart}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
                >
                  <span>Start Diagnostic Test</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {/* State 2: IN_PROGRESS Test Player */}
          {assessmentState === 'IN_PROGRESS' && (
            <div className="space-y-6">
              {/* Stepper Progress */}
              <div className="p-4 border border-slate-800 bg-slate-900/60 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-indigo-400">Question {currentIdx + 1} of {QUESTIONS.length}</span>
                  <span className="text-slate-400">Target Concept: <span className="text-white font-medium">{currentQ.conceptName}</span></span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question Box */}
              <div className="p-6 border border-slate-800 bg-slate-900/80 rounded-2xl space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 bg-slate-800 text-indigo-300 font-mono text-[11px] rounded border border-slate-700">
                      {currentQ.conceptCode}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{currentQ.questionText}</h3>
                  </div>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                  >
                    <span>💡</span>
                    <span>{showHint ? 'Hide AI Hint' : 'Get AI Hint'}</span>
                  </button>
                </div>

                {/* AI Hint Drawer */}
                {showHint && (
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200 animate-fadeIn space-y-1">
                    <div className="font-bold flex items-center space-x-1">
                      <span>🤖 AI Tutor Recommendation:</span>
                    </div>
                    <p className="text-amber-100/90">{currentQ.hint}</p>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-3">
                  {currentQ.options.map((option, optIdx) => {
                    const isSelected = userAnswers[currentIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full text-left p-4 rounded-xl border text-sm transition font-medium flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                            : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-slate-700 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{option}</span>
                        </div>
                        {isSelected && <span className="text-indigo-400 font-bold text-xs">Selected</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Stepper Controls */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-semibold transition"
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={userAnswers[currentIdx] === undefined}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>{currentIdx === QUESTIONS.length - 1 ? 'Submit Diagnostic' : 'Next Question'}</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* State 3: COMPLETED Results */}
          {assessmentState === 'COMPLETED' && (
            <div className="p-8 border border-slate-800 bg-slate-900/80 rounded-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-3xl">
                  🎉
                </div>
                <h2 className="text-2xl font-extrabold text-white">Diagnostic Assessment Complete!</h2>
                <p className="text-xs text-slate-400">
                  The AI Engine has computed your prerequisite profile and identified active knowledge gaps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border border-slate-800 bg-slate-800/40 rounded-xl space-y-2 text-center">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overall Score</div>
                  <div className={`text-4xl font-extrabold ${score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {score}%
                  </div>
                  <div className="text-xs text-slate-400">
                    {score >= 80 ? 'Excellent prerequisite foundation' : 'Targeted remediation recommended'}
                  </div>
                </div>

                <div className="p-6 border border-slate-800 bg-slate-800/40 rounded-xl space-y-2">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Root Knowledge Gap Identified</div>
                  <div className="text-lg font-bold text-rose-400 flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>{gapDetected}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Prerequisite gap prevents mastery in <strong>Grade 6 Fractions</strong>. Remedial lesson has been generated.
                  </div>
                </div>
              </div>

              <div className="p-5 border border-indigo-500/30 bg-indigo-950/20 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Recommended Remedial Action</div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Start Interactive Step-by-Step Remedial Module on Division with Remainders.
                  </div>
                </div>
                <Link
                  href="/student/learning"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-md"
                >
                  Start Remediation Lesson ➔
                </Link>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleStart}
                  className="text-xs text-slate-400 hover:text-white underline transition"
                >
                  Retake Diagnostic Assessment
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
