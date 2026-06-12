"use client";

import { useState, useEffect } from 'react';

interface Setor {
  id: number;
  nome: string;
}

interface Responsavel {
  id: number;
  nome: string;
  email: string | null;
  setorId: number | null;
  setor: Setor | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ResponsaveisPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    setorId: null as number | null,
    ativo: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [resResp, resSetores] = await Promise.all([
          fetch('/api/responsaveis'),
          fetch('/api/setores'),
        ]);
        if (!resResp.ok) throw new Error('Falha ao carregar responsáveis');
        if (!resSetores.ok) throw new Error('Falha ao carregar setores');
        const [dataResp, dataSetores] = await Promise.all([
          resResp.json(),
          resSetores.json(),
        ]);
        if (!cancelled) {
          setResponsaveis(dataResp);
          setSetores(dataSetores);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Falha ao carregar dados');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const fetchResponsaveis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/responsaveis');
      if (!res.ok) throw new Error('Falha ao carregar responsáveis');
      const data = await res.json();
      setResponsaveis(data);
    } catch (err) {
      setError('Falha ao carregar responsáveis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'setorId') {
      setFormData(prev => ({ ...prev, setorId: value ? parseInt(value) : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', email: '', setorId: null, ativo: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const url = editingId ? `/api/responsaveis/${editingId}` : '/api/responsaveis';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao salvar responsável');
      }
      await fetchResponsaveis();
      resetForm();
      setSuccess(editingId ? 'Responsável atualizado com sucesso!' : 'Responsável criado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar responsável');
    }
  };

  const handleEdit = (r: Responsavel) => {
    setFormData({
      nome: r.nome,
      email: r.email || '',
      setorId: r.setorId,
      ativo: r.ativo,
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Remover "${nome}"?`)) return;
    try {
      const res = await fetch(`/api/responsaveis/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover responsável');
      await fetchResponsaveis();
      setSuccess('Responsável removido com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao remover responsável');
    }
  };

  const handleToggleActive = async (r: Responsavel) => {
    try {
      const res = await fetch(`/api/responsaveis/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !r.ativo }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar responsável');
      await fetchResponsaveis();
      setSuccess(r.ativo ? 'Responsável desativado.' : 'Responsável ativado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar responsável');
    }
  };

  if (loading && responsaveis.length === 0) {
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
            <h1 className="text-2xl font-bold tracking-tight">Responsáveis</h1>
            <p className="text-sm text-muted mt-1">
              {responsaveis.length} {responsaveis.length === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'}
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
            Novo Responsável
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
              {editingId ? 'Editar Responsável' : 'Novo Responsável'}
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
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Setor</label>
                  <select
                    name="setorId"
                    value={formData.setorId ?? ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Sem setor</option>
                    {setores.filter(s => s.ativo).map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                  {setores.length === 0 && (
                    <p className="text-xs text-muted mt-1.5">
                      Nenhum setor cadastrado.{' '}
                      <a href="/setores" className="text-[var(--primary)] hover:underline">
                        Cadastrar setor
                      </a>
                    </p>
                  )}
                </div>
                <div className="flex items-end">
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
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
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
                  {editingId ? 'Salvar Alterações' : 'Criar Responsável'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {responsaveis.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum responsável cadastrado</p>
            <p className="text-xs text-muted mt-1">Adicione pessoas para atribuir demandas.</p>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {responsaveis.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${!r.ativo ? 'opacity-50' : ''}`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-[var(--primary)]">
                      {r.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.setor && (
                        <span className="text-xs text-muted">{r.setor.nome}</span>
                      )}
                      {r.email && (
                        <>
                          {r.setor && <span className="text-muted">·</span>}
                          <span className="text-xs text-muted">{r.email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.ativo ? 'Ativo' : 'Inativo'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(r)}
                      className="p-1.5 text-muted hover:text-foreground rounded-md hover:bg-[var(--surface-hover)] transition-colors"
                      aria-label="Editar"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(r)}
                      className="p-1.5 text-muted hover:text-foreground rounded-md hover:bg-[var(--surface-hover)] transition-colors"
                      aria-label={r.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {r.ativo ? (
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
                      onClick={() => handleDelete(r.id, r.nome)}
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
