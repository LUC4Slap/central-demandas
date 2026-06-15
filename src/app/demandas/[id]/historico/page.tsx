"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Demanda, Historico } from "@/types";

const ACOES = [
  "Demanda criada",
  "Demanda atualizada",
  "Demanda excluída",
  "Decisão registrada",
  "Comentário adicionado",
  "Anexo adicionado",
] as const;

const ACAO_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  "Demanda criada": {
    color: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  "Demanda atualizada": {
    color: "bg-blue-100 text-blue-700 ring-blue-600/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  "Demanda excluída": {
    color: "bg-red-100 text-red-700 ring-red-600/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    ),
  },
  "Decisão registrada": {
    color: "bg-purple-100 text-purple-700 ring-purple-600/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  "Comentário adicionado": {
    color: "bg-amber-100 text-amber-700 ring-amber-600/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  "Anexo adicionado": {
    color: "bg-indigo-100 text-indigo-700 ring-indigo-600/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
    ),
  },
};

const DEFAULT_ACAO = {
  color: "bg-gray-100 text-gray-700 ring-gray-600/20",
  icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};

function renderDiff(anterior?: string | null, novo?: string | null) {
  if (!anterior && !novo) return null;

  const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

  if (anterior && novo) {
    const a = lines(anterior);
    const n = lines(novo);
    const map = new Map<string, string>();
    a.forEach((line) => {
      const idx = line.indexOf(":");
      if (idx > 0) map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
    });
    const items = n.map((line) => {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const campo = line.slice(0, idx).trim();
        const valor = line.slice(idx + 1).trim();
        return { campo, de: map.get(campo), para: valor };
      }
      return { campo: null, de: null, para: line };
    });
    return (
      <div className="mt-2 text-xs space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {it.campo ? (
              <>
                <span className="font-medium text-foreground">{it.campo}:</span>
                {it.de && it.de !== it.para && (
                  <span className="text-red-500 line-through">{it.de}</span>
                )}
                <span className="text-emerald-600">{it.para}</span>
              </>
            ) : (
              <span className="text-foreground">{it.para}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2 text-xs">
      {anterior && <p className="text-red-500 whitespace-pre-wrap break-words">{anterior}</p>}
      {novo && <p className="text-emerald-600 whitespace-pre-wrap break-words">{novo}</p>}
    </div>
  );
}

export default function HistoricoDemandaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [demandaId, setDemandaId] = useState<string | null>(null);
  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAcao, setFilterAcao] = useState<string>("todas");
  const [filterInicio, setFilterInicio] = useState<string>("");
  const [filterFim, setFilterFim] = useState<string>("");

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
        const [resDemanda, resHist] = await Promise.all([
          fetch(`/api/demandas/${demandaId}`),
          fetch(`/api/historico?demandaId=${demandaId}`),
        ]);
        if (!resDemanda.ok || !resHist.ok) {
          if (!cancelled) setError("Não foi possível carregar o histórico.");
          return;
        }
        const [d, h] = await Promise.all([resDemanda.json(), resHist.json()]);
        if (cancelled) return;
        setDemanda(d);
        setHistorico(h);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Não foi possível carregar o histórico.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [demandaId]);

  const filtered = useMemo(() => {
    return historico
      .filter((h) => {
        if (filterAcao !== "todas" && h.acao !== filterAcao) return false;
        if (filterInicio) {
          const start = new Date(`${filterInicio}T00:00:00`).getTime();
          if (new Date(h.dataHora).getTime() < start) return false;
        }
        if (filterFim) {
          const end = new Date(`${filterFim}T23:59:59`).getTime();
          if (new Date(h.dataHora).getTime() > end) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }, [historico, filterAcao, filterInicio, filterFim]);

  if (loading) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="flex items-center justify-center h-64 text-muted">Carregando histórico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        <Link href="/demandas" className="inline-block mt-4 text-sm text-[var(--primary)] hover:underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/demandas/${demandaId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar à demanda
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
          {demanda && (
            <p className="text-sm text-muted mt-1">
              <span className="font-mono text-xs font-semibold text-foreground">
                DEM-{String(demanda.numero).padStart(4, "0")}
              </span>{" "}
              — {demanda.titulo}
            </p>
          )}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Tipo de ação</label>
              <select
                value={filterAcao}
                onChange={(e) => setFilterAcao(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="todas">Todas</option>
                {ACOES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">De</label>
              <input
                type="date"
                value={filterInicio}
                onChange={(e) => setFilterInicio(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Até</label>
              <input
                type="date"
                value={filterFim}
                onChange={(e) => setFilterFim(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-xs text-muted mt-3">
            {filtered.length} de {historico.length} evento{historico.length === 1 ? "" : "s"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-sm font-medium">Nenhum evento encontrado</p>
            <p className="text-xs text-muted mt-1">Ajuste os filtros para ver outros registros.</p>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <ol className="relative space-y-6">
              {filtered.map((item, idx) => {
                const a = ACAO_ICONS[item.acao] ?? DEFAULT_ACAO;
                const isLast = idx === filtered.length - 1;
                return (
                  <li key={item.id} className="relative pl-12">
                    {!isLast && (
                      <span className="absolute left-4 top-8 bottom-0 -bottom-6 w-px bg-[var(--border)]" aria-hidden="true" />
                    )}
                    <span
                      className={`absolute left-0 top-0 w-8 h-8 rounded-full ring-1 ring-inset flex items-center justify-center ${a.color}`}
                    >
                      {a.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.acao}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {item.usuario} ·{" "}
                        {new Date(item.dataHora).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {renderDiff(item.valorAnterior, item.valorNovo)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
