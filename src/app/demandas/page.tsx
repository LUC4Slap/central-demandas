"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Demanda } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  'Concluída': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Cancelada': 'bg-red-50 text-red-700 ring-red-600/20',
  'Em Análise': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Refinamento': 'bg-purple-50 text-purple-700 ring-purple-600/20',
  'Desenvolvimento': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  'Homologação': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  'Recebida': 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

const STATUS_BAR_COLORS: Record<string, string> = {
  'Concluída': 'bg-emerald-500',
  'Cancelada': 'bg-red-500',
  'Em Análise': 'bg-blue-500',
  'Refinamento': 'bg-purple-500',
  'Desenvolvimento': 'bg-orange-500',
  'Homologação': 'bg-indigo-500',
  'Recebida': 'bg-amber-500',
};

export default function DemandasPage() {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchDemandas = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const url = query ? `/api/search?q=${encodeURIComponent(query)}` : '/api/demandas';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch demandas');
      const data = await res.json();
      setDemandas(data);
    } catch (err) {
      setError('Falha ao carregar demandas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/demandas');
        if (!res.ok) throw new Error('Failed to fetch demandas');
        const data = await res.json();
        if (!cancelled) setDemandas(data);
      } catch (err) {
        if (!cancelled) {
          setError('Falha ao carregar demandas');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchDemandas(value);
    }, 300);
    setSearchTimeout(timeout);
  };

  if (loading && demandas.length === 0) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Demandas</h1>
            <p className="text-sm text-muted mt-1">
              {demandas.length} {demandas.length === 1 ? 'demanda registrada' : 'demandas registradas'}
            </p>
          </div>
          <Link
            href="/demandas/nova"
            className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Demanda
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Pesquisar por número, título, sistema, solicitante..."
              className="w-full pl-10 pr-10 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); fetchDemandas(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                aria-label="Limpar pesquisa"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {search && (
            <p className="text-xs text-muted mt-2">
              {demandas.length} resultado(s) para &quot;{search}&quot;
            </p>
          )}
        </div>

        {/* List */}
        {demandas.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Nenhuma demanda encontrada</p>
            <p className="text-xs text-muted mt-1">
              {search ? 'Tente ajustar sua pesquisa.' : 'Crie a primeira demanda para começar.'}
            </p>
            {!search && (
              <Link
                href="/demandas/nova"
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Criar demanda
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {demandas.map((demanda) => (
                <Link
                  key={demanda.id}
                  href={`/demandas/${demanda.id}`}
                  className="group block hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Status bar */}
                    <div className={`w-1 h-10 rounded-full flex-shrink-0 ${STATUS_BAR_COLORS[demanda.status] || 'bg-gray-400'}`} />

                    {/* Number */}
                    <div className="flex-shrink-0 w-16">
                      <span className="font-mono text-xs font-semibold text-muted tracking-wider">
                        {String(demanda.numero).padStart(4, '0')}
                      </span>
                    </div>

                    {/* Title + system */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-[var(--primary)] transition-colors">
                        {demanda.titulo}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{demanda.sistema}</p>
                    </div>

                    {/* Requester */}
                    <div className="hidden md:block flex-shrink-0 w-32">
                      <p className="text-xs text-muted truncate">{demanda.solicitante}</p>
                    </div>

                    {/* Responsible */}
                    <div className="hidden lg:block flex-shrink-0 w-28">
                      <p className="text-xs text-muted truncate">{demanda.responsavel}</p>
                    </div>

                    {/* Anexos */}
                    {demanda.anexos.length > 0 && (
                      <div
                        className="hidden md:flex flex-shrink-0 items-center gap-1 text-[var(--primary)]"
                        title={`${demanda.anexos.length} anexo${demanda.anexos.length === 1 ? '' : 's'}`}
                        aria-label={`${demanda.anexos.length} anexo${demanda.anexos.length === 1 ? '' : 's'}`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <span className="text-xs font-medium">{demanda.anexos.length}</span>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[demanda.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                        {demanda.status}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:block flex-shrink-0 w-24 text-right">
                      <p className="text-xs text-muted">
                        {new Date(demanda.dataSolicitacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
