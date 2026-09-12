'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

const STUDENT_DATA: Record<string, {
  name: string; email: string; grade: string; targetGrade: string; mastery: number;
  status: string; lastActive: string;
  gaps: { code: string; name: string; level: number; state: 'MASTERED' | 'GAP' | 'LOCKED' }[];
}> = {
  'std-1': {
    name: 'Alex Johnson', email: 'alex@remedial.edu', grade: 'Grade 6', targetGrade: 'Grade 8',
    mastery: 42, status: 'CRITICAL', lastActive: '2 hours ago',
    gaps: [
      { code: 'MATH-ADD-01', name: 'Addition', level: 95, state: 'MASTERED' },
      { code: 'MATH-MULT-01', name: 'Multiplication', level: 88, state: 'MASTERED' },
      { code: 'MATH-DIV-01', name: 'Division', level: 42, state: 'GAP' },
      { code: 'MATH-FRAC-01', name: 'Fractions', level: 0, state: 'LOCKED' },
    ],
  },
  'std-2': {
    name: 'Sam Smith', email: 'sam@remedial.edu', grade: 'Grade 6', targetGrade: 'Grade 8',
    mastery: 54, status: 'AT_RISK', lastActive: 'Today',
    gaps: [
      { code: 'MATH-ADD-01', name: 'Addition', level: 92, state: 'MASTERED' },
      { code: 'MATH-DIV-01', name: 'Division', level: 54, state: 'GAP' },
      { code: 'MATH-FRAC-01', name: 'Fractions', level: 0, state: 'LOCKED' },
    ],
  },
};

const REMEDIAL_LESSONS = ['Division with Remainders — Interactive Lesson', 'Long Division Step Drill', 'Place Value Foundations'];

export default function TeacherStudentDetailPage({ params }: { params: { id: string } }) {
  const student = STUDENT_DATA[params.id];

  const [teacherNote, setTeacherNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignDone, setAssignDone] = useState(false);
  const [expandedGap, setExpandedGap] = useState<string | null>(null);

  if (!student) {
    return (
      <AuthGuard allowedRoles={['TEACHER']}>
        <DashboardLayout>
          <div className="p-8 border border-slate-800 bg-slate-900/60 rounded-2xl max-w-lg mx-auto text-center space-y-4 my-12">
            <div className="text-4xl">🔍</div>
            <h2 className="text-xl font-bold text-white">Student Profile Not Found</h2>
            <p className="text-xs text-slate-400">No student profile was found with ID <span className="font-mono text-indigo-400">{params.id}</span>.</p>
            <Link href="/teacher/students" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition">
              ← Return to Student Roster
            </Link>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const handleSaveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  const handleAssignLesson = () => {
    setAssignDone(true);
    setTimeout(() => {
      setShowAssignModal(false);
      setAssignDone(false);
      setSelectedLesson(null);
    }, 2000);
  };

  return (
    <AuthGuard allowedRoles={['TEACHER']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl">
          {/* Back + Header */}
          <div className="flex items-center space-x-4">
            <Link href="/teacher/students" className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center space-x-1">
              <span>←</span><span>Back to Roster</span>
            </Link>
            <span className="text-slate-700">|</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              student.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
              student.status === 'AT_RISK' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {student.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
              {student.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{student.name}</h1>
              <p className="text-sm text-slate-400">{student.email} • {student.grade} → Target: {student.targetGrade}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-slate-400">Overall Mastery</div>
              <div className={`text-3xl font-extrabold ${student.mastery >= 80 ? 'text-emerald-400' : student.mastery >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                {student.mastery}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Gap Drill-Down + Notes */}
            <div className="lg:col-span-2 space-y-5">
              {/* Prerequisite Tree Drill-Down */}
              <div className="p-6 border border-slate-800 bg-slate-900/70 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">Prerequisite Gap Analysis — Drill Down</h3>
                <div className="space-y-2">
                  {student.gaps.map((gap) => (
                    <div key={gap.code}>
                      <button
                        onClick={() => setExpandedGap(expandedGap === gap.code ? null : gap.code)}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition text-left ${
                          gap.state === 'MASTERED' ? 'border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-950/20' :
                          gap.state === 'GAP' ? 'border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/20' :
                          'border-slate-800 bg-slate-900/40 opacity-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>{gap.state === 'MASTERED' ? '✅' : gap.state === 'GAP' ? '⚠️' : '🔒'}</span>
                          <div>
                            <div className="text-xs font-mono text-slate-500">{gap.code}</div>
                            <div className="text-sm font-bold text-white">{gap.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${gap.state === 'MASTERED' ? 'bg-emerald-500' : gap.state === 'GAP' ? 'bg-amber-500' : 'bg-slate-700'}`}
                                style={{ width: `${gap.level}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-white">{gap.level}%</span>
                          </div>
                          <span className="text-slate-500 text-xs">{expandedGap === gap.code ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {expandedGap === gap.code && (
                        <div className="mt-1 ml-4 p-4 bg-slate-800/30 border border-slate-700 rounded-xl text-xs space-y-3 animate-fadeIn">
                          {gap.state === 'GAP' && (
                            <>
                              <p className="text-amber-200">
                                ⚠️ <strong>Root Gap Identified:</strong> {student.name} has a critical prerequisite gap in <strong>{gap.name}</strong> that is blocking progression to the next concept.
                              </p>
                              <button
                                onClick={() => { setSelectedLesson(REMEDIAL_LESSONS[0]); setShowAssignModal(true); }}
                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition"
                              >
                                ⚡ Assign Remedial Lesson Now
                              </button>
                            </>
                          )}
                          {gap.state === 'MASTERED' && (
                            <p className="text-emerald-200">✅ Concept mastered at {gap.level}% — no intervention required.</p>
                          )}
                          {gap.state === 'LOCKED' && (
                            <p className="text-slate-400">🔒 Concept is locked. Prerequisite gap must be resolved first.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Note */}
              <div className="p-6 border border-slate-800 bg-slate-900/70 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white">Teacher Intervention Note</h3>
                <textarea
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  placeholder="Add a private note about this student's progress, intervention plan, or parent communication..."
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">{teacherNote.length} characters</span>
                  <button
                    onClick={handleSaveNote}
                    disabled={!teacherNote.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition"
                  >
                    {noteSaved ? '✅ Note Saved!' : 'Save Teacher Note'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Actions Panel */}
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="p-5 border border-slate-800 bg-slate-900/70 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white">Student Quick Stats</h3>
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Last Active', value: student.lastActive },
                    { label: 'Diagnostic Attempts', value: '2 sessions' },
                    { label: 'Remedial Lessons', value: '1 in progress' },
                    { label: 'AI Tutor Sessions', value: '4 sessions' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-slate-800/40 rounded-lg">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign Lesson Panel */}
              <div className="p-5 border border-slate-800 bg-slate-900/70 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white">Assign Remedial Lesson</h3>
                <div className="space-y-2 text-xs">
                  {REMEDIAL_LESSONS.map((lesson, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedLesson(lesson)}
                      className={`w-full text-left p-3 rounded-lg border font-medium transition ${
                        selectedLesson === lesson
                          ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {lesson}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => selectedLesson && setShowAssignModal(true)}
                  disabled={!selectedLesson}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
                >
                  Assign Selected Lesson
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
              <h3 className="text-lg font-bold text-white">Confirm Assignment</h3>
              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
                <div className="text-xs text-slate-400">Assigning to</div>
                <div className="font-bold text-white">{student.name}</div>
                <div className="text-xs text-slate-400 mt-2">Lesson</div>
                <div className="font-semibold text-indigo-300">{selectedLesson}</div>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">
                  Cancel
                </button>
                <button onClick={handleAssignLesson} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition">
                  {assignDone ? '✅ Assigned!' : 'Confirm Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
