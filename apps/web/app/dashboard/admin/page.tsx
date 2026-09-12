'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AdminDashboardPage() {
  const systemMetrics = [
    { label: 'Total Registered Users', value: '1,248', change: '+84 this week', icon: '👥' },
    { label: 'Active Queue Jobs', value: '14 Jobs', change: 'BullMQ Worker Active', icon: '⚡' },
    { label: 'API Uptime & Health', value: '99.98%', change: 'PostgreSQL + Redis Healthy', icon: '❤️' },
    { label: 'RAG Vector Index', value: '4,892 Chunks', change: 'pgvector active', icon: '🧠' },
  ];

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚙️</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Admin System Console</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Platform control panel, microservice health checks, BullMQ queue telemetry, and security audit logs.
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Admin Restricted Access
            </span>
          </div>

          {/* System Metrics */}
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

          {/* Admin Controls & Security Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center justify-between">
                <span>Recent System Audit Logs</span>
                <span className="text-xs font-normal text-slate-400">AuditLog Table (PostgreSQL)</span>
              </h3>
              <div className="space-y-2.5">
                {[
                  { action: 'ROLE_CHANGE', actor: 'admin@remedial.edu', target: 'teacher@remedial.edu', time: '5 mins ago', status: 'SUCCESS' },
                  { action: 'DOCUMENT_UPLOAD', actor: 'teacher@remedial.edu', target: 'Math_Grade6_Ch4.pdf', time: '22 mins ago', status: 'PROCESSED' },
                  { action: 'ADMIN_CONFIG_CHANGE', actor: 'admin@remedial.edu', target: 'RATE_LIMIT_ENABLED=true', time: '1 hour ago', status: 'SUCCESS' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-lg border border-slate-800 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono font-semibold text-indigo-300">{log.action}</div>
                      <div className="text-slate-400">By: {log.actor} • Target: {log.target}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-semibold">{log.status}</span>
                      <div className="text-[10px] text-slate-500 mt-1">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Feature Flag Controls</h3>
              <div className="space-y-3 text-xs">
                {[
                  { name: 'AI Tutor Service', enabled: true },
                  { name: 'RAG Retrieval Engine', enabled: true },
                  { name: 'Adaptive Assessment', enabled: true },
                  { name: 'Teacher Intelligence Alerting', enabled: true },
                  { name: 'Maintenance Mode', enabled: false },
                ].map((flag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                    <span className="font-medium text-slate-200">{flag.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${flag.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                      {flag.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
