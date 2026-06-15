"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Responsavel } from '@/types';
import FileDropzone, { type DropzoneFile } from '@/components/FileDropzone';

const FILE_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.zip'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function NovaDemandaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [pendingFiles, setPendingFiles] = useState<DropzoneFile[]>([]);
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
        const uploadErrors: string[] = [];
        let uploaded = 0;

        for (const pf of pendingFiles) {
          try {
            const uploadRes = await fetch('/api/anexos', {
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
            if (!uploadRes.ok) {
              const errData = await uploadRes.json().catch(() => ({}));
              const detail = errData.error
                ? (typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error))
                : `HTTP ${uploadRes.status}`;
              uploadErrors.push(`${pf.file.name}: ${detail}`);
            } else {
              uploaded += 1;
            }
          } catch (uploadErr) {
            uploadErrors.push(
              `${pf.file.name}: ${uploadErr instanceof Error ? uploadErr.message : 'erro de rede'}`,
            );
          }
        }

        if (uploadErrors.length > 0) {
          const summary = uploaded > 0
            ? `Demanda criada, mas apenas ${uploaded} de ${pendingFiles.length} anexo(s) foram enviados. Erros: ${uploadErrors.join(' | ')}`
            : `Demanda criada, mas nenhum anexo foi enviado. Erros: ${uploadErrors.join(' | ')}`;
          setError(summary);
          setLoading(false);
          setUploadingFiles(false);
          return;
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
            <FileDropzone
              onFilesChange={setPendingFiles}
              accept={FILE_EXTENSIONS}
              maxSize={MAX_FILE_SIZE}
              multiple
            />
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
              {uploadingFiles
                ? `Enviando anexos (${pendingFiles.length})...`
                : loading
                  ? 'Salvando...'
                  : 'Criar Demanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
