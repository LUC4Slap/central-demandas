"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Demanda, Anexo } from '@/types';

const FILE_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.zip'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const STATUS_COLORS: Record<string, string> = {
  'Concluída': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Cancelada': 'bg-red-50 text-red-700 ring-red-600/20',
  'Em Análise': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Refinamento': 'bg-purple-50 text-purple-700 ring-purple-600/20',
  'Desenvolvimento': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  'Homologação': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  'Recebida': 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

const STATUS_OPTIONS = [
  'Recebida', 'Em Análise', 'Refinamento', 'Desenvolvimento',
  'Homologação', 'Concluída', 'Cancelada',
];

export default function DemandaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [demandaId, setDemandaId] = useState<string | null>(null);
  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [decisaoForm, setDecisaoForm] = useState({
    dataDecisao: new Date().toISOString().split('T')[0],
    descricao: '',
    participantes: '',
    origem: '',
  });
  const [comentarioForm, setComentarioForm] = useState({
    autor: '',
    comentario: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [anexoUsuario, setAnexoUsuario] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    params.then(({ id }) => {
      setDemandaId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!demandaId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/demandas/${demandaId}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (!cancelled) setError('Demanda não encontrada');
          } else {
            if (!cancelled) throw new Error('Falha ao carregar demanda');
          }
        } else {
          const data = await res.json();
          if (!cancelled) {
            setDemanda(data);
            setNewStatus(data.status);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Falha ao carregar demanda');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [demandaId]);

  const fetchDemanda = async () => {
    if (!demandaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/demandas/${demandaId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Demanda não encontrada');
        } else {
          throw new Error('Falha ao carregar demanda');
        }
      } else {
        const data = await res.json();
        setDemanda(data);
        setNewStatus(data.status);
      }
    } catch (err) {
      setError('Falha ao carregar demanda');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDecisaoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleComentarioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setComentarioForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDecisaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandaId) return;
    try {
      const res = await fetch('/api/decisoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...decisaoForm,
          demandaId: parseInt(demandaId),
          participantes: decisaoForm.participantes || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao registrar decisão');
      }
      setDecisaoForm({
        dataDecisao: new Date().toISOString().split('T')[0],
        descricao: '',
        participantes: '',
        origem: '',
      });
      setSuccess('Decisão registrada com sucesso!');
      fetchDemanda();
    } catch (err) {
      setError('Falha ao registrar decisão');
      console.error(err);
    }
  };

  const handleComentarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandaId) return;
    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...comentarioForm,
          demandaId: parseInt(demandaId),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao adicionar comentário');
      }
      setComentarioForm({ autor: '', comentario: '' });
      setSuccess('Comentário adicionado com sucesso!');
      fetchDemanda();
    } catch (err) {
      setError('Falha ao adicionar comentário');
      console.error(err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!FILE_EXTENSIONS.includes(ext)) {
      setError(`Tipo de arquivo não permitido. Tipos aceitos: ${FILE_EXTENSIONS.join(', ')}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandaId || !selectedFile || !anexoUsuario) return;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const res = await fetch('/api/anexos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandaId: parseInt(demandaId),
          nomeArquivo: selectedFile.name,
          usuario: anexoUsuario,
          tipoArquivo: selectedFile.type,
          tamanhoArquivo: selectedFile.size,
          conteudoBase64: base64,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao fazer upload');
      }
      setSelectedFile(null);
      setAnexoUsuario('');
      setSuccess('Anexo adicionado com sucesso!');
      fetchDemanda();
    } catch (err) {
      setError('Falha ao fazer upload');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (anexo: Anexo) => {
    if (!anexo.conteudoBase64) return;
    const link = document.createElement('a');
    link.href = anexo.conteudoBase64;
    link.download = anexo.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusUpdate = async () => {
    if (!demandaId || newStatus === demanda?.status) return;
    try {
      const res = await fetch(`/api/demandas/${demandaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, usuario: 'system' }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar status');
      setSuccess('Status atualizado com sucesso!');
      setEditingStatus(false);
      fetchDemanda();
    } catch (err) {
      setError('Falha ao atualizar status');
      console.error(err);
    }
  };

  if (loading && !demanda) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error && !demanda) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">Erro: {error}</div>
      </div>
    );
  }

  if (!demanda) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="text-muted">Demanda não encontrada</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demandas" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar à lista
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-muted tracking-wider">
                  DEM-{String(demanda.numero).padStart(4, '0')}
                </span>
                {editingStatus ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-2 py-1 border border-[var(--border)] rounded-md text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      className="px-3 py-1 text-xs font-medium text-white bg-[var(--success)] rounded-md hover:bg-emerald-600 transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => { setEditingStatus(false); setNewStatus(demanda.status); }}
                      className="px-3 py-1 text-xs text-muted hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingStatus(true)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[demanda.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                  >
                    {demanda.status}
                    <svg className="w-3 h-3 ml-1.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </div>
              <h1 className="text-xl font-bold tracking-tight mt-2">{demanda.titulo}</h1>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Informações básicas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="Sistema" value={demanda.sistema} />
                <InfoField label="Título" value={demanda.titulo} />
                <div className="sm:col-span-2">
                  <InfoField label="Descrição" value={demanda.descricao} multiline />
                </div>
                <InfoField label="Solicitante" value={demanda.solicitante} />
                <InfoField label="Órgão" value={demanda.orgao || '-'} />
                <InfoField label="Origem" value={demanda.origem} />
                <InfoField
                  label="Data da Solicitação"
                  value={new Date(demanda.dataSolicitacao).toLocaleDateString('pt-BR')}
                />
                <InfoField label="Responsável" value={demanda.responsavel} />
                <InfoField label="Prioridade" value={demanda.prioridade || '-'} />
              </div>
            </div>

            {/* Decisoes */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Decisões</h2>
              <form onSubmit={handleDecisaoSubmit} className="mb-6 p-4 bg-[var(--background)] rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Nova Decisão</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Data *</label>
                    <input
                      type="date"
                      name="dataDecisao"
                      value={decisaoForm.dataDecisao}
                      onChange={handleDecisaoChange}
                      required
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Origem *</label>
                    <select
                      name="origem"
                      value={decisaoForm.origem}
                      onChange={handleDecisaoChange}
                      required
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    >
                      <option value="">Selecione</option>
                      <option value="Reunião">Reunião</option>
                      <option value="Teams">Teams</option>
                      <option value="E-mail">E-mail</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Telefone">Telefone</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Descrição da Decisão *</label>
                  <textarea
                    name="descricao"
                    value={decisaoForm.descricao}
                    onChange={handleDecisaoChange}
                    rows={2}
                    required
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Participantes</label>
                  <input
                    type="text"
                    name="participantes"
                    value={decisaoForm.participantes}
                    onChange={handleDecisaoChange}
                    placeholder="Ex: Gabriella, Carlos e Lucas"
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors">
                  Registrar Decisão
                </button>
              </form>

              {demanda.decisoes.length === 0 ? (
                <p className="text-sm text-muted">Nenhuma decisão registrada.</p>
              ) : (
                <div className="space-y-3">
                  {demanda.decisoes.map((decisao) => (
                    <div key={decisao.id} className="border border-[var(--border)] rounded-lg p-4">
                      <p className="text-sm">{decisao.descricao}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                        <span>{new Date(decisao.dataDecisao).toLocaleDateString('pt-BR')}</span>
                        <span>Origem: {decisao.origem}</span>
                      </div>
                      {decisao.participantes && (
                        <p className="text-xs text-muted mt-1">
                          <span className="font-medium">Participantes:</span> {decisao.participantes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comentarios */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Comentários</h2>
              <form onSubmit={handleComentarioSubmit} className="mb-6 p-4 bg-[var(--background)] rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Novo Comentário</h3>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Autor *</label>
                  <input
                    type="text"
                    name="autor"
                    value={comentarioForm.autor}
                    onChange={handleComentarioChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Comentário *</label>
                  <textarea
                    name="comentario"
                    value={comentarioForm.comentario}
                    onChange={handleComentarioChange}
                    rows={2}
                    required
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                  />
                </div>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors">
                  Adicionar Comentário
                </button>
              </form>

              {demanda.comentarios.length === 0 ? (
                <p className="text-sm text-muted">Nenhum comentário registrado.</p>
              ) : (
                <div className="space-y-3">
                  {demanda.comentarios.map((comentario) => (
                    <div key={comentario.id} className="border border-[var(--border)] rounded-lg p-4">
                      <p className="text-sm">{comentario.comentario}</p>
                      <p className="text-xs text-muted mt-2">
                        Por <span className="font-medium text-foreground">{comentario.autor}</span> em {new Date(comentario.dataCriacao).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anexos */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Anexos</h2>
              <form onSubmit={handleUpload} className="mb-6 p-4 bg-[var(--background)] rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Novo Anexo</h3>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Usuário *</label>
                  <input
                    type="text"
                    value={anexoUsuario}
                    onChange={(e) => setAnexoUsuario(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Arquivo *</label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept={FILE_EXTENSIONS.join(',')}
                    className="w-full text-sm"
                  />
                  <p className="text-xs text-muted mt-1">
                    Tipos: {FILE_EXTENSIONS.join(', ')} | Máximo: 10MB
                  </p>
                </div>
                {selectedFile && (
                  <p className="text-sm text-emerald-600">
                    Selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!selectedFile || !anexoUsuario || uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Enviando...' : 'Enviar Anexo'}
                </button>
              </form>

              {demanda.anexos.length === 0 ? (
                <p className="text-sm text-muted">Nenhum anexo registrado.</p>
              ) : (
                <div className="space-y-3">
                  {demanda.anexos.map((anexo) => (
                    <div key={anexo.id} className="border border-[var(--border)] rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-[var(--surface-hover)] rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{anexo.nomeArquivo}</p>
                            <p className="text-xs text-muted mt-0.5">
                              Por {anexo.usuario} em {new Date(anexo.dataInclusao).toLocaleDateString('pt-BR')}
                              {anexo.tamanhoArquivo && ` · ${(anexo.tamanhoArquivo / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                        </div>
                        {anexo.conteudoBase64 && (
                          <button
                            onClick={() => handleDownload(anexo)}
                            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Historico */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sticky top-4">
              <h2 className="text-sm font-semibold text-foreground mb-4">Histórico</h2>
              {demanda.historico.length === 0 ? (
                <p className="text-sm text-muted">Nenhum histórico registrado.</p>
              ) : (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                  {[...demanda.historico]
                    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
                    .map((item) => (
                      <div key={item.id} className="border-l-2 border-[var(--border)] pl-3 pb-3 last:pb-0">
                        <p className="text-sm font-medium">{item.acao}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {item.usuario} · {new Date(item.dataHora).toLocaleString('pt-BR')}
                        </p>
                        {(item.valorAnterior || item.valorNovo) && (
                          <div className="mt-1.5 text-xs space-y-0.5">
                            {item.valorAnterior && (
                              <p className="text-red-500 line-through">De: {item.valorAnterior}</p>
                            )}
                            {item.valorNovo && (
                              <p className="text-emerald-600">Para: {item.valorNovo}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted mb-1">{label}</p>
      {multiline ? (
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-sm">{value}</p>
      )}
    </div>
  );
}
