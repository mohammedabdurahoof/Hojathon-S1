'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface ConceptMastery {
  code: string;
  name: string;
  level: number;
  status: 'MASTERED' | 'IN_PROGRESS' | 'GAP_DETECTED' | 'LOCKED';
  attempts: number;
  lastAttempt: string;
  prerequisite: string | null;
}

const CONCEPTS: ConceptMastery[] = [
  { code: 'MATH-ADD-01', name: 'Addition & Subtraction', level: 95, status: 'MASTERED', attempts: 3, lastAttempt: '4 days ago', prerequisite: null },
  { code: 'MATH-MULT-01', name: 'Multiplication Tables', level: 88, status: 'MASTERED', attempts: 4, lastAttempt: '3 days ago', prerequisite: 'MATH-ADD-01' },
  { code: 'MATH-DIV-01', name: 'Long Division', level: 45, status: 'GAP_DETECTED', attempts: 2, lastAttempt: 'Yesterday', prerequisite: 'MATH-MULT-01' },
  { code: 'MATH-FRAC-01', name: 'Fractions & Denominators', level: 0, status: 'LOCKED', attempts: 0, lastAttempt: 'Not started', prerequisite: 'MATH-DIV-01' },
  { code: 'MATH-DEC-01', name: 'Decimals & Place Value', level: 0, status: 'LOCKED', attempts: 0, lastAttempt: 'Not started', prerequisite: 'MATH-FRAC-01' },
];

const ATTEMPT_HISTORY = [
  { date: 'Sep 12, 2026', concept: 'Long Division', score: 45, type: 'Diagnostic', result: 'Gap Identified' },
  { date: 'Sep 11, 2026', concept: 'Long Division', score: 38, type: 'Diagnostic', result: 'Needs Remediation' },
  { date: 'Sep 10, 2026', concept: 'Multiplication Tables', score: 88, type: 'Mastery Check', result: 'Mastered' },
  { date: 'Sep 9, 2026', concept: 'Addition & Subtraction', score: 95, type: 'Mastery Check', result: 'Mastered' },
];

function statusColor(status: ConceptMastery['status']) {
  switch (status) {
    case 'MASTERED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'IN_PROGRESS': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    case 'GAP_DETECTED': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'LOCKED': return 'text-slate-500 bg-slate-800/50 border-slate-700';
  }
}

function barColor(status: ConceptMastery['status']) {
  switch (status) {
    case 'MASTERED': return 'bg-emerald-500';
    case 'IN_PROGRESS': return 'bg-indigo-500';
    case 'GAP_DETECTED': return 'bg-amber-500';
    case 'LOCKED': return 'bg-slate-700';
  }
}

export default function StudentProgressPage() {
  const [activeTab, setActiveTab] = useState<'MASTERY' | 'TREE' | 'HISTORY'>('MASTERY');
  const [selectedConcept, setSelectedConcept] = useState<ConceptMastery | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'MASTERED' | 'GAP_DETECTED' | 'LOCKED'>('ALL');

  const filtered = filter === 'ALL' ? CONCEPTS : CONCEPTS.filter((c) => c.status === filter);

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">📈</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Mastery Progress & Analytics</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Real-time concept mastery scores, prerequisite dependency tree, and diagnostic attempt history.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Overall Mastery</div>
              <div className="text-2xl font-extrabold text-indigo-400">68%</div>
              <div className="text-[11px] text-emerald-400">+14% remediation gain</div>
            </div>
          </div>

          {/* Grade Comparison Strip */}
          <div className="p-5 border border-slate-800 bg-slate-900/60 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Assessed Level</div>
              <div className="text-2xl font-extrabold text-amber-400">Grade 6</div>
            </div>
            <div className="text-center flex items-center justify-center">
              <span className="text-slate-600 text-xl font-bold">→</span>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Target Class Level</div>
              <div className="text-2xl font-extrabold text-emerald-400">Grade 8</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Concepts Mastered</div>
              <div className="flex space-x-1">
                {CONCEPTS.map((c, i) => (
                  <span key={i} className={`w-2.5 h-2.5 rounded-full ${c.status === 'MASTERED' ? 'bg-emerald-400' : c.status === 'GAP_DETECTED' ? 'bg-amber-400' : 'bg-slate-700'}`}></span>
                ))}
              </div>
              <div className="text-[11px] text-slate-300 mt-1">2 of 5 Mastered</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-slate-800">
            {(['MASTERY', 'TREE', 'HISTORY'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'MASTERY' ? '📊 Mastery Scores' : tab === 'TREE' ? '🌳 Prerequisite Tree' : '📋 Attempt History'}
              </button>
            ))}
          </div>

          {/* Tab: Mastery Scores */}
          {activeTab === 'MASTERY' && (
            <div className="space-y-4">
              {/* Filter Chips */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Filter:</span>
                {(['ALL', 'MASTERED', 'GAP_DETECTED', 'LOCKED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full border font-semibold transition ${
                      filter === f
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((concept) => (
                  <button
                    key={concept.code}
                    onClick={() => setSelectedConcept(selectedConcept?.code === concept.code ? null : concept)}
                    className={`p-5 border rounded-xl text-left space-y-3 transition w-full ${
                      selectedConcept?.code === concept.code
                        ? 'border-indigo-500 bg-indigo-950/20'
                        : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[10px] text-slate-500">{concept.code}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{concept.name}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(concept.status)}`}>
                        {concept.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">{concept.level}% Mastery</span>
                        <span className="text-slate-500">{concept.lastAttempt}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor(concept.status)}`}
                          style={{ width: `${concept.level}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Detail Drawer */}
              {selectedConcept && (
                <div className="p-5 border border-indigo-500/30 bg-indigo-950/10 rounded-2xl space-y-3 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{selectedConcept.name} — Detail View</h4>
                    <button onClick={() => setSelectedConcept(null)} className="text-slate-500 hover:text-white">✕</button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-slate-400">Diagnostic Attempts</div>
                      <div className="font-bold text-white text-base mt-0.5">{selectedConcept.attempts}</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-slate-400">Mastery Score</div>
                      <div className={`font-bold text-base mt-0.5 ${selectedConcept.level >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedConcept.level}%
                      </div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-slate-400">Prerequisite</div>
                      <div className="font-bold text-white text-base mt-0.5">{selectedConcept.prerequisite ?? 'Root Node'}</div>
                    </div>
                  </div>
                  {selectedConcept.status === 'GAP_DETECTED' && (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-amber-200">
                      ⚠️ Gap detected. AI Remediation Lesson for <strong>{selectedConcept.name}</strong> is active. Complete Step 2 in the Learning Path to progress.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Prerequisite Tree */}
          {activeTab === 'TREE' && (
            <div className="p-6 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-white mb-4">Prerequisite Dependency Tree — Grade 6 Mathematics</h3>
              <div className="space-y-2">
                {CONCEPTS.map((c, i) => (
                  <div key={c.code} className="flex items-center space-x-3">
                    <div style={{ marginLeft: `${i * 24}px` }} className={`flex items-center space-x-3 p-3 rounded-xl border transition w-full ${
                      c.status === 'MASTERED' ? 'border-emerald-500/30 bg-emerald-950/10' :
                      c.status === 'GAP_DETECTED' ? 'border-amber-500/30 bg-amber-950/10' :
                      'border-slate-800 bg-slate-900/40 opacity-60'
                    }`}>
                      <span>{c.status === 'MASTERED' ? '✅' : c.status === 'GAP_DETECTED' ? '⚠️' : '🔒'}</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.code}</div>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(c.status)}`}>
                        {c.level}%
                      </div>
                    </div>
                    {i < CONCEPTS.length - 1 && (
                      <div style={{ marginLeft: `${(i + 1) * 24}px` }} className="text-slate-600 text-xs pl-3">↓ Prerequisite for next</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Attempt History */}
          {activeTab === 'HISTORY' && (
            <div className="border border-slate-800 bg-slate-900/60 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Concept</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {ATTEMPT_HISTORY.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 text-slate-400">{item.date}</td>
                      <td className="p-4 font-medium text-white">{item.concept}</td>
                      <td className="p-4">{item.type}</td>
                      <td className={`p-4 font-bold ${item.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{item.score}%</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                          item.result === 'Mastered' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {item.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
