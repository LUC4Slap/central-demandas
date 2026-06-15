"use client";

import { useState, useEffect } from 'react';

interface Setor {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/setores');
        if (!res.ok) throw new Error('Falha ao carregar setores');
        const data = await res.json();
        if (!cancelled) setSetores(data);
      } catch (err) {
        if (!cancelled) {
          setError('Falha ao carregar setores');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const fetchSetores = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/setores');
      if (!res.ok) throw new Error('Falha ao carregar setores');
      const data = await res.json();
      setSetores(data);
    } catch (err) {
      setError('Falha ao carregar setores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = e.target instanceof HTMLInputElement ? e.target.checked : undefined;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', ativo: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const url = editingId ? `/api/setores/${editingId}` : '/api/setores';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao salvar setor');
      }
      await fetchSetores();
      resetForm();
      setSuccess(editingId ? 'Setor atualizado com sucesso!' : 'Setor criado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar setor');
    }
  };

  const handleEdit = (s: Setor) => {
    setFormData({
      nome: s.nome,
      descricao: s.descricao || '',
      ativo: s.ativo,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Remover "${nome}"?`)) return;
    try {
      const res = await fetch(`/api/setores/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover setor');
      await fetchSetores();
      setSuccess('Setor removido com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao remover setor');
    }
  };

  const handleToggleActive = async (s: Setor) => {
    try {
      const res = await fetch(`/api/setores/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !s.ativo }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar setor');
      await fetchSetores();
      setSuccess(s.ativo ? 'Setor desativado.' : 'Setor ativado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar setor');
    }
  };

  if (loading && setores.length === 0) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Setores</h1>
            <p className="text-sm text-muted mt-1">
              {setores.length} {setores.length === 1 ? 'setor cadastrado' : 'setores cadastrados'}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Setor
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              {editingId ? 'Editar Setor' : 'Novo Setor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Nome *</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    placeholder="Nome do setor"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Descrição</label>
                  <input
                    type="text"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    placeholder="Breve descrição"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  Ativo
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-foreground bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
                  >
                    {editingId ? 'Salvar Alterações' : 'Criar Setor'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {setores.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum setor cadastrado</p>
            <p className="text-xs text-muted mt-1">Crie setores para organizar os responsáveis.</p>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {setores.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${!s.ativo ? 'opacity-50' : ''}`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.nome}</p>
                    {s.descricao && (
                      <p className="text-xs text-muted mt-0.5">{s.descricao}</p>
                    )}
                  </div>

                  {/* Status */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.ativo ? 'Ativo' : 'Inativo'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-1.5 text-muted hover:text-foreground rounded-md hover:bg-[var(--surface-hover)] transition-colors"
                      aria-label="Editar"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(s)}
                      className="p-1.5 text-muted hover:text-foreground rounded-md hover:bg-[var(--surface-hover)] transition-colors"
                      aria-label={s.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {s.ativo ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                          <line x1="12" y1="2" x2="12" y2="12" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="15 3 21 3 21 9" />
                          <path d="M21 3l-7 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.nome)}
                      className="p-1.5 text-muted hover:text-[var(--danger)] rounded-md hover:bg-red-50 transition-colors"
                      aria-label="Remover"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
