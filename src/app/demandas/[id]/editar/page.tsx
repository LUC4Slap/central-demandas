"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Demanda, Responsavel } from "@/types";

interface EditarDemandaPageProps {
  params: Promise<{ id: string }>;
}

const ORIGEM_OPTIONS = [
  "E-mail", "Reunião", "Teams", "WhatsApp", "Telefone", "Ofício", "Outro",
];

const STATUS_OPTIONS = [
  "Recebida", "Em Análise", "Refinamento", "Desenvolvimento",
  "Homologação", "Concluída", "Cancelada",
];

const PRIORIDADE_OPTIONS = ["Alta", "Média", "Baixa"];

type FormState = {
  sistema: string;
  titulo: string;
  descricao: string;
  solicitante: string;
  orgao: string;
  origem: string;
  status: string;
  responsavel: string;
  prioridade: string;
  dataSolicitacao: string;
};

const EMPTY_FORM: FormState = {
  sistema: "",
  titulo: "",
  descricao: "",
  solicitante: "",
  orgao: "",
  origem: "",
  status: "Recebida",
  responsavel: "",
  prioridade: "",
  dataSolicitacao: "",
};

function toDateInput(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export default function EditarDemandaPage({ params }: EditarDemandaPageProps) {
  const router = useRouter();
  const [demandaId, setDemandaId] = useState<string | null>(null);
  const [original, setOriginal] = useState<Demanda | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setDemandaId(id));
  }, [params]);

  useEffect(() => {
    if (!demandaId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/demandas/${demandaId}`);
        if (!res.ok) {
          if (!cancelled) setError("Demanda não encontrada");
          return;
        }
        const data: Demanda = await res.json();
        if (cancelled) return;
        setOriginal(data);
        setFormData({
          sistema: data.sistema ?? "",
          titulo: data.titulo ?? "",
          descricao: data.descricao ?? "",
          solicitante: data.solicitante ?? "",
          orgao: data.orgao ?? "",
          origem: data.origem ?? "",
          status: data.status ?? "Recebida",
          responsavel: data.responsavel ?? "",
          prioridade: data.prioridade ?? "",
          dataSolicitacao: toDateInput(data.dataSolicitacao),
        });
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Falha ao carregar demanda");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [demandaId]);

  useEffect(() => {
    fetch("/api/responsaveis")
      .then((res) => res.json())
      .then((data) => setResponsaveis(data))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandaId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/demandas/${demandaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          orgao: formData.orgao || null,
          prioridade: formData.prioridade || null,
          dataSolicitacao: formData.dataSolicitacao
            ? new Date(`${formData.dataSolicitacao}T12:00:00`).toISOString()
            : formData.dataSolicitacao,
          usuario: formData.solicitante || "system",
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ? JSON.stringify(errData.error) : "Falha ao atualizar demanda");
      }
      setSuccess("Demanda atualizada com sucesso!");
      setTimeout(() => router.push(`/demandas/${demandaId}`), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar demanda");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="flex items-center justify-center h-64 text-muted">Carregando...</div>
      </div>
    );
  }

  if (error && !original) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        <Link href="/demandas" className="inline-block mt-4 text-sm text-[var(--primary)] hover:underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (!original) return null;

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/demandas/${demandaId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar à demanda
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Editar Demanda</h1>
          <p className="text-sm text-muted mt-1">
            <span className="font-mono text-xs font-semibold">
              DEM-{String(original.numero).padStart(4, "0")}
            </span>{" "}
            — {original.titulo}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
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
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Descrição *</label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                />
                <p className="text-xs text-muted mt-1.5">
                  {formData.descricao.length} caracteres
                </p>
              </div>
            </div>
          </div>

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
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Órgão</label>
                  <input
                    type="text"
                    name="orgao"
                    value={formData.orgao}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
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
                    {ORIGEM_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
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
                    {responsaveis.filter((r) => r.ativo).map((r) => (
                      <option key={r.id} value={r.nome}>{r.nome}</option>
                    ))}
                  </select>
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
                    {PRIORIDADE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
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
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/demandas/${demandaId}`}
              className="px-4 py-2.5 text-sm font-medium text-foreground bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
