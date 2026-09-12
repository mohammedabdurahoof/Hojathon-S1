'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

type ActivityItem = {
  title: string;
  date: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'MASTERED';
  detail: string;
};

type WeeklyReport = {
  summary: string;
  highlights: string[];
  recommendation: string;
};

const CHILDREN_DATA: Record<string, {
  name: string; grade: string; mastery: number; lessonsCompleted: number; alerts: number;
  activities: ActivityItem[];
  teacherNote: string;
  weeklyReport: WeeklyReport;
}> = {};

const STATUS_COLOR: Record<ActivityItem['status'], string> = {
  IN_PROGRESS: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  COMPLETED: 'bg-slate-700 text-slate-300 border-slate-600',
  MASTERED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function ParentDashboardPage() {
  const [selectedChild, setSelectedChild] = useState<string>('Alex Johnson');
  const [showReport, setShowReport] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const child = CHILDREN_DATA[selectedChild];

  if (!child) {
    return (
      <AuthGuard allowedRoles={['PARENT']}>
        <DashboardLayout>
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Parent Overview Portal</h1>
                <p className="text-sm text-slate-400 mt-1">Track your child&apos;s remedial learning progress.</p>
              </div>
            </div>
            <div className="p-12 border border-slate-800 bg-slate-900/60 rounded-2xl text-center space-y-4 my-8">
              <div className="text-4xl">👪</div>
              <h2 className="text-xl font-bold text-white">No Linked Student Accounts</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No student accounts are currently linked to this parent profile. Connect with your child&apos;s teacher to link a student account.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const parentMetrics = [
    { label: 'Linked Student', value: child.name, change: child.grade, icon: '👦' },
    { label: 'Overall Mastery', value: `${child.mastery}%`, change: '+14% progress gain', icon: '🎯' },
    { label: 'Completed Practice', value: `${child.lessonsCompleted} Lessons`, change: '4 diagnostic sessions', icon: '✅' },
    { label: 'Active Alerts', value: `${child.alerts} Notice`, change: 'Fractions remediation active', icon: '🔔' },
  ];

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowMessageModal(false);
      setMessageText('');
    }, 2000);
  };

  return (
    <AuthGuard allowedRoles={['PARENT']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">👪</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Parent Overview Portal</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Track your child's remedial learning progress, prerequisite mastery gaps, and teacher recommendations.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Parent Restricted Access
            </span>
          </div>

          {/* Child Selector */}
          <div className="p-4 border border-slate-800 bg-slate-900/60 rounded-xl flex items-center space-x-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Viewing Student:</span>
            {Object.keys(CHILDREN_DATA).map((name) => (
              <button
                key={name}
                onClick={() => setSelectedChild(name)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  selectedChild === name
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {name}
              </button>
            ))}
            <div className="ml-auto flex items-center space-x-2">
              <button
                onClick={() => setShowReport(!showReport)}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold transition"
              >
                {showReport ? '✕ Close AI Report' : '📊 AI Weekly Report'}
              </button>
              <button
                onClick={() => setShowMessageModal(true)}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold transition"
              >
                💬 Message Teacher
              </button>
            </div>
          </div>

          {/* AI Weekly Report Drawer */}
          {showReport && (
            <div className="p-5 border border-indigo-500/30 bg-indigo-950/15 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-bold text-white">AI-Generated Weekly Progress Report — {child.name}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{child.weeklyReport.summary}</p>
              <div className="space-y-1">
                {child.weeklyReport.highlights.map((h, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-emerald-300">
                    <span>✓</span><span>{h}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg text-xs text-amber-200">
                <strong>AI Recommendation:</strong> {child.weeklyReport.recommendation}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {parentMetrics.map((metric, idx) => (
              <div key={idx} className="p-5 border border-slate-800 bg-slate-900/60 rounded-xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">{metric.label}</span>
                  <span className="text-lg">{metric.icon}</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2">{metric.value}</div>
                <div className="text-xs text-emerald-400 mt-1">{metric.change}</div>
              </div>
            ))}
          </div>

          {/* Progress + Teacher Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-white">{child.name}'s Remediation & Practice Progress</h3>
              <div className="space-y-3">
                {child.activities.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white">{item.title}</div>
                      <div className="text-xs text-slate-400">{item.detail}</div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_COLOR[item.status]}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mastery Progress Bars */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Concept Mastery Overview</h4>
                {[
                  { name: 'Addition', pct: 95, color: 'bg-emerald-500' },
                  { name: 'Division', pct: 45, color: 'bg-amber-500' },
                  { name: 'Fractions', pct: 0, color: 'bg-slate-700' },
                ].map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>{c.name}</span>
                      <span className={c.pct >= 80 ? 'text-emerald-400' : c.pct > 0 ? 'text-amber-400' : 'text-slate-500'}>
                        {c.pct}% {c.pct >= 80 ? '(Mastered)' : c.pct > 0 ? '(In Progress)' : '(Not Started)'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${c.color}`} style={{ width: `${c.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Notes + Alerts */}
            <div className="space-y-4">
              <div className="p-5 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-white">Teacher & Platform Notes</h3>
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
                    <span>💬 Note from Prof. Vance</span>
                  </div>
                  <p className="leading-relaxed">{child.teacherNote}</p>
                  <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    Updated 2 hours ago by Math Department
                  </div>
                </div>
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold transition"
                >
                  💬 Reply to Teacher
                </button>
              </div>

              {/* Active Alert */}
              <div className="p-5 border border-amber-500/30 bg-amber-950/15 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
                  <span>🔔</span><span>Active Remediation Alert</span>
                </div>
                <p className="text-xs text-amber-200 leading-relaxed">
                  {child.name} has an identified prerequisite gap in <strong>Division with Remainders</strong>. An AI remedial lesson has been activated. Mastery is currently at 42%.
                </p>
                <div className="text-[10px] text-amber-400/60">Assigned by Prof. Marcus Vance • 1 day ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Teacher Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>💬</span><span>Message Prof. Marcus Vance</span>
              </h3>
              <div className="p-3 bg-slate-800/60 rounded-lg text-xs text-slate-300">
                Re: {child.name} — {child.grade}
              </div>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message to the teacher..."
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 placeholder:text-slate-600 resize-none"
              />
              <div className="flex space-x-3">
                <button onClick={() => setShowMessageModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition"
                >
                  {messageSent ? '✅ Message Sent!' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
