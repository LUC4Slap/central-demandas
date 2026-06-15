"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Responsavel } from '@/types';

interface PendingFile {
  file: File;
  base64: string;
}

const FILE_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.zip'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function NovaDemandaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [formData, setFormData] = useState({
    sistema: '',
    titulo: '',
    descricao: '',
    solicitante: '',
    orgao: '',
    origem: '',
    status: 'Recebida',
    responsavel: '',
    prioridade: '',
    dataSolicitacao: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetch('/api/responsaveis')
      .then((res) => res.json())
      .then((data) => setResponsaveis(data))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!FILE_EXTENSIONS.includes(ext)) {
        setError(`Tipo não permitido: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`Arquivo muito grande: ${file.name} (máx. 10MB)`);
        continue;
      }
      if (pendingFiles.some(f => f.file.name === file.name)) {
        setError(`Arquivo já adicionado: ${file.name}`);
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setPendingFiles(prev => [...prev, { file, base64 }]);
        setError(null);
      } catch {
        setError(`Erro ao ler arquivo: ${file.name}`);
      }
    }

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/demandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ? JSON.stringify(errData.error) : 'Falha ao criar demanda');
      }
      const newDemanda = await res.json();

      if (pendingFiles.length > 0) {
        setUploadingFiles(true);
        for (const pf of pendingFiles) {
          try {
            await fetch('/api/anexos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                demandaId: newDemanda.id,
                nomeArquivo: pf.file.name,
                usuario: formData.solicitante,
                tipoArquivo: pf.file.type,
                tamanhoArquivo: pf.file.size,
                conteudoBase64: pf.base64,
              }),
            });
          } catch {
            setError(`Falha ao enviar anexo: ${pf.file.name}`);
          }
        }
      }

      router.push(`/demandas/${newDemanda.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar demanda');
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const isSubmitting = loading || uploadingFiles;

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demandas" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar à lista
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Nova Demanda</h1>
          <p className="text-sm text-muted mt-1">Preencha os dados para registrar uma nova demanda.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Informações básicas</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Sistema *</label>
                  <input
                    type="text"
                    name="sistema"
                    value={formData.sistema}
                    onChange={handleChange}
                    required
                    placeholder="Nome do sistema"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    required
                    placeholder="Resumo da demanda"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Descrição *</label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={4}
                  required
                  placeholder="Descreva a demanda em detalhes..."
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Origin and requester */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Solicitante e origem</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Solicitante *</label>
                  <input
                    type="text"
                    name="solicitante"
                    value={formData.solicitante}
                    onChange={handleChange}
                    required
                    placeholder="Nome do solicitante"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Órgão</label>
                  <input
                    type="text"
                    name="orgao"
                    value={formData.orgao}
                    onChange={handleChange}
                    placeholder="Órgão ou departamento"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Origem *</label>
                  <select
                    name="origem"
                    value={formData.origem}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Teams">Teams</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Ofício">Ofício</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Data da Solicitação *</label>
                  <input
                    type="date"
                    name="dataSolicitacao"
                    value={formData.dataSolicitacao}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Atribuição</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Responsável *</label>
                  <select
                    name="responsavel"
                    value={formData.responsavel}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    {responsaveis.filter(r => r.ativo).map((r) => (
                      <option key={r.id} value={r.nome}>{r.nome}</option>
                    ))}
                  </select>
                  {responsaveis.length === 0 && (
                    <p className="text-xs text-muted mt-1.5">
                      Nenhum responsável cadastrado.{' '}
                      <Link href="/responsaveis" className="text-[var(--primary)] hover:underline">
                        Cadastrar responsável
                      </Link>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Prioridade</label>
                  <select
                    name="prioridade"
                    value={formData.prioridade}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="Recebida">Recebida</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Refinamento">Refinamento</option>
                  <option value="Desenvolvimento">Desenvolvimento</option>
                  <option value="Homologação">Homologação</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Anexos</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Arquivos</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept={FILE_EXTENSIONS.join(',')}
                  multiple
                  className="w-full text-sm"
                />
                <p className="text-xs text-muted mt-1">
                  Tipos: {FILE_EXTENSIONS.join(', ')} | Máximo: 10MB por arquivo
                </p>
              </div>

              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  {pendingFiles.map((pf, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                      <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pf.file.name}</p>
                        <p className="text-xs text-muted">{(pf.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-muted hover:text-[var(--danger)] transition-colors"
                        aria-label="Remover arquivo"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/demandas"
              className="px-4 py-2.5 text-sm font-medium text-foreground bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
            >
              {uploadingFiles ? 'Enviando anexos...' : loading ? 'Salvando...' : 'Criar Demanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
