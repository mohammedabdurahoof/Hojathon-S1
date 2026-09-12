'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface AuditLog {
  action: string;
  actor: string;
  target: string;
  time: string;
  status: 'SUCCESS' | 'PROCESSED' | 'WARNING' | 'FAILED';
}

const INITIAL_FLAGS: FeatureFlag[] = [
  { key: 'ai_tutor', name: 'AI Tutor Service', description: 'Real-time student AI assistant for remedial lessons', enabled: true },
  { key: 'rag_retrieval', name: 'RAG Retrieval Engine', description: 'pgvector-based document chunk retrieval for assessments', enabled: true },
  { key: 'adaptive_assessment', name: 'Adaptive Assessment', description: 'Dynamic assessment difficulty based on student mastery level', enabled: true },
  { key: 'teacher_alerts', name: 'Teacher Intelligence Alerting', description: 'AI-driven at-risk student alerting and remediation triggers', enabled: true },
  { key: 'parent_reports', name: 'Automated Parent Reports', description: 'Weekly AI-generated progress summaries sent to parents', enabled: false },
  { key: 'maintenance_mode', name: 'Maintenance Mode', description: 'Puts the platform in read-only mode for all student/teacher users', enabled: false },
];

const INITIAL_LOGS: AuditLog[] = [
  { action: 'ROLE_CHANGE', actor: 'admin@remedial.edu', target: 'teacher@remedial.edu', time: '5 mins ago', status: 'SUCCESS' },
  { action: 'DOCUMENT_UPLOAD', actor: 'teacher@remedial.edu', target: 'Math_Grade6_Ch4.pdf', time: '22 mins ago', status: 'PROCESSED' },
  { action: 'ADMIN_CONFIG_CHANGE', actor: 'admin@remedial.edu', target: 'RATE_LIMIT_ENABLED=true', time: '1 hour ago', status: 'SUCCESS' },
  { action: 'FEATURE_FLAG_TOGGLE', actor: 'admin@remedial.edu', target: 'ai_tutor=enabled', time: '2 hours ago', status: 'SUCCESS' },
  { action: 'QUEUE_WORKER_RESTART', actor: 'system', target: 'BullMQ:ai-remediation-worker', time: '3 hours ago', status: 'SUCCESS' },
  { action: 'AUTH_FAIL_SPIKE', actor: 'unknown', target: '15 failed attempts', time: '4 hours ago', status: 'WARNING' },
];

function statusBadge(status: AuditLog['status']) {
  switch (status) {
    case 'SUCCESS': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    case 'PROCESSED': return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
    case 'WARNING': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    case 'FAILED': return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
  }
}

export default function AdminDashboardPage() {
  const systemMetrics = [
    { label: 'Total Registered Users', value: '1,248', change: '+84 this week', icon: '👥' },
    { label: 'Active Queue Jobs', value: '14 Jobs', change: 'BullMQ Worker Active', icon: '⚡' },
    { label: 'API Uptime & Health', value: '99.98%', change: 'PostgreSQL + Redis Healthy', icon: '❤️' },
    { label: 'RAG Vector Index', value: '4,892 Chunks', change: 'pgvector active', icon: '🧠' },
  ];

  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS);
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
  const [logSearch, setLogSearch] = useState('');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [queueRestarting, setQueueRestarting] = useState(false);
  const [queueDone, setQueueDone] = useState(false);

  const handleToggleFlag = (key: string) => {
    setTogglingKey(key);
    setTimeout(() => {
      setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled: !f.enabled } : f));
      const flag = flags.find((f) => f.key === key);
      if (flag) {
        const newLog: AuditLog = {
          action: 'FEATURE_FLAG_TOGGLE',
          actor: 'admin@remedial.edu',
          target: `${key}=${!flag.enabled ? 'enabled' : 'disabled'}`,
          time: 'Just now',
          status: 'SUCCESS',
        };
        setLogs((prev) => [newLog, ...prev]);
      }
      setTogglingKey(null);
    }, 600);
  };

  const handleRestartQueue = () => {
    setQueueRestarting(true);
    setTimeout(() => {
      setQueueRestarting(false);
      setQueueDone(true);
      const newLog: AuditLog = {
        action: 'QUEUE_WORKER_RESTART',
        actor: 'admin@remedial.edu',
        target: 'BullMQ:all-workers',
        time: 'Just now',
        status: 'SUCCESS',
      };
      setLogs((prev) => [newLog, ...prev]);
      setTimeout(() => setQueueDone(false), 2500);
    }, 2000);
  };

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.actor.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.target.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚙️</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Admin System Console</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Platform control panel, microservice health, BullMQ queue telemetry, and security audit logs.
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Admin Restricted Access
            </span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemMetrics.map((metric, idx) => (
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

          {/* Audit Logs + Feature Flags */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Audit Logs */}
            <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Security & System Audit Logs</h3>
                <span className="text-[10px] text-slate-400">Live AuditLog Table (PostgreSQL)</span>
              </div>
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search logs by action, actor, or target..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-rose-500 placeholder:text-slate-600"
              />
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-xl border border-slate-800/60 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono font-semibold text-indigo-300">{log.action}</div>
                      <div className="text-slate-400">By: <span className="text-slate-300">{log.actor}</span> • Target: <span className="text-slate-300">{log.target}</span></div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge(log.status)}`}>{log.status}</span>
                      <div className="text-[10px] text-slate-500 mt-1">{log.time}</div>
                    </div>
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-xs">No logs matching &quot;{logSearch}&quot;</div>
                )}
              </div>
            </div>

            {/* Right Panel: Feature Flags + Queue Control */}
            <div className="space-y-4">
              <div className="p-5 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-white">Feature Flag Controls</h3>
                <div className="space-y-2 text-xs">
                  {flags.map((flag) => (
                    <div key={flag.key} className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 flex items-center justify-between group">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-medium text-slate-200 truncate">{flag.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{flag.description}</div>
                      </div>
                      <button
                        onClick={() => handleToggleFlag(flag.key)}
                        disabled={togglingKey === flag.key}
                        className={`relative shrink-0 w-10 h-5 rounded-full transition-all duration-300 ${
                          flag.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                        } ${togglingKey === flag.key ? 'opacity-50' : ''}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${flag.enabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Queue Worker Control */}
              <div className="p-5 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-white">BullMQ Queue Control</h3>
                <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">ai-remediation-worker</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">RUNNING</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">rag-indexer-worker</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">RUNNING</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">notification-worker</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/20">IDLE</span>
                  </div>
                </div>
                <button
                  onClick={handleRestartQueue}
                  disabled={queueRestarting}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1 ${
                    queueDone
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {queueRestarting ? (
                    <><span className="animate-spin text-sm">⟳</span><span>Restarting Workers...</span></>
                  ) : queueDone ? (
                    <span>✅ All Workers Restarted!</span>
                  ) : (
                    <span>⚡ Restart All Workers</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
