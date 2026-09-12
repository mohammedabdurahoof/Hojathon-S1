'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface Concept {
  code: string;
  name: string;
  topic: string;
  prerequisite: string | null;
  grade: string;
}

const INITIAL_CONCEPTS: Concept[] = [];

const TOPICS = ['Arithmetic', 'Fractions', 'Algebra', 'Geometry'];
const GRADES = ['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

export default function AdminCurriculumPage() {
  const [concepts, setConcepts] = useState<Concept[]>(INITIAL_CONCEPTS);
  const [activeTab, setActiveTab] = useState<'TABLE' | 'GRAPH'>('TABLE');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ code: '', name: '', topic: 'Arithmetic', prerequisite: '', grade: 'Grade 6' });
  const [formError, setFormError] = useState('');
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const openAddModal = () => {
    setForm({ code: '', name: '', topic: 'Arithmetic', prerequisite: '', grade: 'Grade 6' });
    setEditingConcept(null);
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (concept: Concept) => {
    setForm({ code: concept.code, name: concept.name, topic: concept.topic, prerequisite: concept.prerequisite ?? '', grade: concept.grade });
    setEditingConcept(concept);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) {
      setFormError('Concept Code and Name are required.');
      return;
    }
    if (!editingConcept && concepts.find((c) => c.code === form.code.trim())) {
      setFormError('Concept Code already exists.');
      return;
    }

    const newConcept: Concept = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      topic: form.topic,
      prerequisite: form.prerequisite.trim() || null,
      grade: form.grade,
    };

    if (editingConcept) {
      setConcepts((prev) => prev.map((c) => c.code === editingConcept.code ? newConcept : c));
    } else {
      setConcepts((prev) => [...prev, newConcept]);
    }

    setShowAddModal(false);
    setSavedFlash(editingConcept ? `"${newConcept.name}" updated!` : `"${newConcept.name}" added to curriculum!`);
    setTimeout(() => setSavedFlash(null), 3000);
  };

  const handleDelete = (code: string) => {
    setConcepts((prev) =>
      prev
        .filter((c) => c.code !== code)
        .map((c) => (c.prerequisite === code ? { ...c, prerequisite: null } : c))
    );
    setShowDeleteConfirm(null);
    setSavedFlash('Concept removed from curriculum.');
    setTimeout(() => setSavedFlash(null), 3000);
  };

  // Build adjacency helper for graph view
  const getChildren = (code: string) => concepts.filter((x) => x.prerequisite === code);
  const rootNodes = concepts.filter((c) => !c.prerequisite);

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">🗂️</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Curriculum & Concept Graph Manager</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Create, edit, and manage concept nodes and prerequisite dependencies powering the AI gap detection engine.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
            >
              <span>＋</span><span>Add Concept</span>
            </button>
          </div>

          {/* Flash success */}
          {savedFlash && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
              <span>✅</span><span>{savedFlash}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-slate-800">
            {(['TABLE', 'GRAPH'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 -mb-px ${
                  activeTab === tab ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'TABLE' ? '📋 Concept Table' : '🌳 Prerequisite Graph'}
              </button>
            ))}
          </div>

          {/* Table View */}
          {activeTab === 'TABLE' && (
            <div className="border border-slate-800 bg-slate-900/60 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Concept Code</th>
                    <th className="p-4">Concept Name</th>
                    <th className="p-4">Topic</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Prerequisite</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {concepts.map((concept) => (
                    <tr key={concept.code} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-mono text-indigo-400 font-semibold">{concept.code}</td>
                      <td className="p-4 font-medium text-white">{concept.name}</td>
                      <td className="p-4">{concept.topic}</td>
                      <td className="p-4 text-slate-400">{concept.grade}</td>
                      <td className="p-4 text-emerald-400 font-medium">{concept.prerequisite ?? '— Root Node'}</td>
                      <td className="p-4">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(concept)}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(concept.code)}
                            className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-lg font-semibold transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {concepts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 space-y-2">
                        <div className="text-3xl">🗂️</div>
                        <div className="font-semibold text-slate-300">No concepts defined in curriculum</div>
                        <p className="text-xs text-slate-500">Click &quot;＋ Add Concept&quot; above to define your first concept node.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Graph View */}
          {activeTab === 'GRAPH' && (
            <div className="p-6 border border-slate-800 bg-slate-900/60 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-5">Prerequisite Dependency Graph — Visual View</h3>
              {concepts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <div className="text-3xl">🌳</div>
                  <div className="font-semibold text-slate-300">Prerequisite Graph is Empty</div>
                  <p className="text-xs text-slate-500">Add concept nodes to generate the visual dependency tree.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rootNodes.map((rootNode) => {
                    const renderNode = (node: Concept, depth: number): React.ReactNode => {
                      const children = getChildren(node.code);
                      return (
                        <div key={node.code} className="space-y-2">
                          <div
                            style={{ marginLeft: depth * 32 }}
                            className="p-4 border border-slate-800 bg-slate-800/40 rounded-xl flex items-center justify-between hover:bg-slate-800/70 transition"
                          >
                            <div className="flex items-center space-x-3">
                              {depth > 0 && <span className="text-slate-600 text-xs">└─</span>}
                              <div>
                                <div className="font-mono text-[10px] text-indigo-400">{node.code}</div>
                                <div className="text-sm font-bold text-white">{node.name}</div>
                                <div className="text-[10px] text-slate-400">{node.topic} • {node.grade}</div>
                              </div>
                            </div>
                            {children.length > 0 && (
                              <span className="text-[10px] text-slate-500">{children.length} dependent concept{children.length > 1 ? 's' : ''}</span>
                            )}
                          </div>
                          {children.map((child) => renderNode(child, depth + 1))}
                        </div>
                      );
                    };
                    return renderNode(rootNode, 0);
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
              <h3 className="text-lg font-bold text-white">
                {editingConcept ? `Edit Concept — ${editingConcept.code}` : 'Add New Concept Node'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Concept Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    disabled={!!editingConcept}
                    placeholder="e.g., MATH-ALG-01"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Concept Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Linear Equations"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Topic</label>
                    <select
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                    >
                      {TOPICS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Grade Level</label>
                    <select
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                    >
                      {GRADES.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Prerequisite Code (leave empty for root node)</label>
                  <select
                    value={form.prerequisite}
                    onChange={(e) => setForm({ ...form, prerequisite: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None (Root Node)</option>
                    {concepts.filter((c) => c.code !== form.code).map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                {formError && <p className="text-xs text-rose-400">{formError}</p>}
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition">
                  {editingConcept ? 'Save Changes' : 'Add Concept'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-5">
              <h3 className="text-lg font-bold text-white">Delete Concept?</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to remove <span className="font-mono font-bold text-rose-400">{showDeleteConfirm}</span> from the curriculum graph?
                This will break any prerequisites depending on it.
              </p>
              <div className="flex space-x-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">Cancel</button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition">Delete</button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
