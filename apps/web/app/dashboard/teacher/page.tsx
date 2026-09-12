'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

type ToastType = { message: string; type: 'success' | 'error' } | null;

function Toast({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl border text-sm font-semibold flex items-center space-x-2 animate-fadeIn ${
      toast.type === 'success' ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300' : 'bg-rose-950 border-rose-500/50 text-rose-300'
    }`}>
      <span>{toast.type === 'success' ? '✅' : '❌'}</span>
      <span>{toast.message}</span>
      <button onClick={onClose} className="ml-2 text-xs opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const teacherStats = [
    { label: 'Assigned Students', value: '42', change: 'Grade 6 Math', icon: '👥' },
    { label: 'Struggling / At Risk', value: '5', change: 'Prerequisite Gaps', icon: '⚠️' },
    { label: 'Pending Interventions', value: '3', change: 'Requires Teacher Review', icon: '📋' },
    { label: 'Class Average Mastery', value: '72%', change: '+4% this week', icon: '📈' },
  ];

  const [strugglingStudents, setStrugglingStudents] = useState([
    { name: 'Alex Johnson', risk: 'CRITICAL' as const, gap: 'Fractions Denominator Confusion', score: 42, id: 'std-1' },
    { name: 'Sam Smith', risk: 'AT_RISK' as const, gap: 'Long Division Steps', score: 54, id: 'std-2' },
    { name: 'Maria Garcia', risk: 'WATCH' as const, gap: 'Decimal Place Value', score: 68, id: 'std-3' },
  ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [uploadFile, setUploadFile] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [assessmentGrade, setAssessmentGrade] = useState('Grade 6');
  const [assessmentTopic, setAssessmentTopic] = useState('Division');
  const [assessmentGenerating, setAssessmentGenerating] = useState(false);
  const [toast, setToast] = useState<ToastType>(null);
  const [actionedStudents, setActionedStudents] = useState<string[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStudentAction = (name: string, id: string) => {
    setActionedStudents((prev) => [...prev, id]);
    showToast(`Remediation lesson assigned to ${name}`, 'success');
  };

  const handleUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setShowUploadModal(false);
          setUploadFile('');
          setUploadProgress(0);
          showToast('Curriculum document ingested into RAG engine!');
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  const handleGenerateAssessment = () => {
    setAssessmentGenerating(true);
    setTimeout(() => {
      setAssessmentGenerating(false);
      setShowAssessmentModal(false);
      showToast(`Adaptive Diagnostic created for ${assessmentGrade} — ${assessmentTopic}`);
    }, 2000);
  };

  return (
    <AuthGuard allowedRoles={['TEACHER']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">👩‍🏫</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Teacher Intelligence Portal</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Monitor student risk levels, prerequisite gap trees, active interventions, and class mastery metrics.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Teacher Restricted Access
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teacherStats.map((stat, idx) => (
              <div key={idx} className="p-5 border border-slate-800 bg-slate-900/60 rounded-xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2">{stat.value}</div>
                <div className="text-xs text-purple-400 mt-1">{stat.change}</div>
              </div>
            ))}
          </div>

          {/* At-Risk + Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* At-Risk Students */}
            <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center justify-between">
                <span>Student Risk Breakdown & Needed Interventions</span>
                <Link href="/teacher/students" className="text-xs text-indigo-400 hover:text-indigo-300">View Full Roster →</Link>
              </h3>
              <div className="space-y-3">
                {strugglingStudents.map((st, idx) => (
                  <div key={idx} className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{st.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          st.risk === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          st.risk === 'AT_RISK' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {st.risk}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">Root Gap: <span className="text-slate-200">{st.gap}</span></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{st.score}%</div>
                        <div className="text-[10px] text-slate-500">Mastery</div>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/teacher/students/${st.id}`} className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition">
                          View →
                        </Link>
                        <button
                          onClick={() => handleStudentAction(st.name, st.id)}
                          disabled={actionedStudents.includes(st.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            actionedStudents.includes(st.id)
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {actionedStudents.includes(st.id) ? '✅ Assigned' : 'Assign Lesson'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Center */}
            <div className="p-6 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-white">Teacher Action Center</h3>
              <div className="space-y-3 text-xs">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full p-4 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-xl text-left transition text-indigo-200 group"
                >
                  <div className="font-semibold flex items-center space-x-2 group-hover:text-white transition">
                    <span>📚</span><span>Upload Curriculum Document</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Ingest PDF/text into RAG knowledge engine</div>
                </button>

                <button
                  onClick={() => setShowAssessmentModal(true)}
                  className="w-full p-4 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl text-left transition text-purple-200 group"
                >
                  <div className="font-semibold flex items-center space-x-2 group-hover:text-white transition">
                    <span>⚡</span><span>Create Diagnostic Assessment</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">AI-generate adaptive assessment for any grade & topic</div>
                </button>

                <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl space-y-2">
                  <div className="font-semibold text-slate-300 flex items-center space-x-2">
                    <span>📊</span><span>Class Mastery Snapshot</span>
                  </div>
                  {[{ concept: 'Addition', pct: 92 }, { concept: 'Division', pct: 54 }, { concept: 'Fractions', pct: 18 }].map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-slate-400 text-[11px] mb-0.5">
                        <span>{c.concept}</span><span>{c.pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.pct >= 80 ? 'bg-emerald-500' : c.pct >= 60 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${c.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>📚</span><span>Upload Curriculum Document</span>
              </h3>
              <p className="text-xs text-slate-400">Ingest a curriculum PDF or textbook chapter into the RAG knowledge base for AI-generated assessment and hint generation.</p>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Document Name / URL</label>
                <input
                  type="text"
                  value={uploadFile}
                  onChange={(e) => setUploadFile(e.target.value)}
                  placeholder="e.g., Math_Grade6_Ch4_Division.pdf"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {isUploading && (
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Uploading & Chunking into RAG...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
              <div className="flex space-x-3">
                <button onClick={() => setShowUploadModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">Cancel</button>
                <button onClick={handleUpload} disabled={!uploadFile.trim() || isUploading} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition">
                  {isUploading ? 'Uploading...' : 'Upload & Ingest'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Generator Modal */}
        {showAssessmentModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>⚡</span><span>Create Diagnostic Assessment</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Target Grade Level</label>
                  <select
                    value={assessmentGrade}
                    onChange={(e) => setAssessmentGrade(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500"
                  >
                    {['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Concept / Topic</label>
                  <select
                    value={assessmentTopic}
                    onChange={(e) => setAssessmentTopic(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500"
                  >
                    {['Addition', 'Multiplication', 'Division', 'Fractions', 'Decimals'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg text-[11px] text-slate-400">
                  AI will generate 5 adaptive questions targeting prerequisite gap detection for <span className="text-white font-medium">{assessmentGrade} — {assessmentTopic}</span>.
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setShowAssessmentModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">Cancel</button>
                <button onClick={handleGenerateAssessment} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1">
                  {assessmentGenerating ? (
                    <><span className="animate-spin">⟳</span><span>Generating...</span></>
                  ) : (
                    <span>Generate Assessment</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />
      </DashboardLayout>
    </AuthGuard>
  );
}
