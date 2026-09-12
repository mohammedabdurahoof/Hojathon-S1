'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  gap: string;
  mastery: number;
  status: 'CRITICAL' | 'AT_RISK' | 'ON_TRACK' | 'MASTERED';
  lastActive: string;
}

const STUDENTS: Student[] = [];

function statusBadge(status: Student['status']) {
  switch (status) {
    case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    case 'AT_RISK': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'ON_TRACK': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    case 'MASTERED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
}

export default function TeacherStudentsPage() {
  const [studentsList, setStudentsList] = useState<Student[]>(STUDENTS);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | Student['status']>('ALL');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchActionDone, setBatchActionDone] = useState(false);

  // Register New Student State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    grade: 'Grade 6',
    gap: 'Division & Remainders',
    status: 'AT_RISK' as Student['status'],
  });

  const filtered = studentsList.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || s.status === riskFilter;
    return matchSearch && matchRisk;
  });

  const toggleSelectStudent = (id: string) => {
    setSelectedStudents((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleBatchAction = () => {
    setBatchActionDone(true);
    setTimeout(() => {
      setShowBatchModal(false);
      setSelectedStudents([]);
      setBatchActionDone(false);
    }, 2000);
  };

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.email) return;

    const createdStudent: Student = {
      id: `std-${Date.now()}`,
      name: newStudentForm.name.trim(),
      email: newStudentForm.email.trim(),
      grade: newStudentForm.grade,
      gap: newStudentForm.gap,
      mastery: newStudentForm.status === 'CRITICAL' ? 35 : newStudentForm.status === 'AT_RISK' ? 55 : 85,
      status: newStudentForm.status,
      lastActive: 'Just now',
    };

    setStudentsList((prev) => [createdStudent, ...prev]);
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setShowRegisterModal(false);
      setNewStudentForm({ name: '', email: '', grade: 'Grade 6', gap: 'Division & Remainders', status: 'AT_RISK' });
    }, 1500);
  };

  return (
    <AuthGuard allowedRoles={['TEACHER']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">👥</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Class Student Roster</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Monitor risk levels, prerequisite gaps, and trigger remediation actions for your class.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedStudents.length > 0 && (
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-2 shadow-lg"
                >
                  <span>⚡</span>
                  <span>Batch Action ({selectedStudents.length} selected)</span>
                </button>
              )}
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20"
              >
                <span>➕</span>
                <span>Register New Student</span>
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
            <div className="flex items-center space-x-1.5">
              {(['ALL', 'CRITICAL', 'AT_RISK', 'ON_TRACK', 'MASTERED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRiskFilter(f)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                    riskFilter === f
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                      : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-800 bg-slate-900/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4 w-8">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStudents(filtered.map((s) => s.id));
                        else setSelectedStudents([]);
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Grade</th>
                  <th className="p-4">Primary Gap</th>
                  <th className="p-4">Mastery</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleSelectStudent(student.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{student.name}</div>
                      <div className="text-slate-500 mt-0.5">{student.email}</div>
                    </td>
                    <td className="p-4">{student.grade}</td>
                    <td className={`p-4 font-semibold ${student.gap === 'None' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {student.gap}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${student.mastery >= 80 ? 'bg-emerald-500' : student.mastery >= 60 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                            style={{ width: `${student.mastery}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-white">{student.mastery}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusBadge(student.status)}`}>
                        {student.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{student.lastActive}</td>
                    <td className="p-4">
                      <Link
                        href={`/teacher/students/${student.id}`}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 space-y-2">
                      <div className="text-3xl">👥</div>
                      <div className="font-semibold text-slate-300">No students in class roster yet</div>
                      <p className="text-xs text-slate-500">Click &quot;➕ Register New Student&quot; above to add your first student.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Batch Action Modal */}
          {showBatchModal && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
                <h3 className="text-lg font-bold text-white">Batch Remediation Action</h3>
                <p className="text-sm text-slate-300">
                  Assign targeted remedial lessons to <span className="text-indigo-400 font-bold">{selectedStudents.length} selected students</span>?
                </p>
                <div className="space-y-2 text-xs">
                  {['Assign AI-Generated Remedial Lesson', 'Schedule Teacher Review Session', 'Send Parent Notification Alert'].map((action, i) => (
                    <div key={i} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-slate-200 font-medium">
                      {action}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-3 pt-2">
                  <button onClick={() => setShowBatchModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchAction}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition"
                  >
                    {batchActionDone ? '✅ Assigned!' : 'Confirm & Assign'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Register New Student Modal */}
          {showRegisterModal && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Register New Student</h3>
                  <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
                </div>
                {registerSuccess ? (
                  <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-center text-sm font-semibold animate-fadeIn space-y-1">
                    <div className="text-2xl">✅</div>
                    <div>Student Registered Successfully!</div>
                    <p className="text-xs text-slate-400 font-normal">Student account created and added to class roster.</p>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterStudent} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1">Student Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newStudentForm.name}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                        placeholder="e.g. Lucas Vance"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1">Student Email Address *</label>
                      <input
                        type="email"
                        required
                        value={newStudentForm.email}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                        placeholder="lucas@remedial.edu"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-300 font-medium mb-1">Grade Level</label>
                        <select
                          value={newStudentForm.grade}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, grade: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Grade 5">Grade 5</option>
                          <option value="Grade 6">Grade 6</option>
                          <option value="Grade 7">Grade 7</option>
                          <option value="Grade 8">Grade 8</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 font-medium mb-1">Initial Status</label>
                        <select
                          value={newStudentForm.status}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, status: e.target.value as Student['status'] })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="CRITICAL">🔴 Critical Risk</option>
                          <option value="AT_RISK">🟡 At Risk</option>
                          <option value="ON_TRACK">🔵 On Track</option>
                          <option value="MASTERED">🟢 Mastered</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1">Identified Prerequisite Gap</label>
                      <input
                        type="text"
                        value={newStudentForm.gap}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, gap: e.target.value })}
                        placeholder="e.g. Division & Remainders"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button type="button" onClick={() => setShowRegisterModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-indigo-600/30">
                        Create Account
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
