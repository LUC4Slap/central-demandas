"use client";

import { useEffect, useState } from "react";

interface ConfirmDeleteModalProps {
  open: boolean;
  numero: number;
  titulo: string;
  loading?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  open,
  numero,
  titulo,
  loading = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [typed, setTyped] = useState("");
  const expected = `DEM-${String(numero).padStart(4, "0")}`;
  const matches = typed.trim() === expected;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-[var(--danger)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 id="confirm-delete-title" className="text-base font-semibold text-foreground">
              Excluir demanda permanentemente?
            </h2>
            <p className="text-sm text-muted mt-1">
              Esta ação não pode ser desfeita. Todas as decisões, comentários, anexos e históricos vinculados serão removidos.
            </p>
          </div>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3 mb-4">
          <p className="text-xs text-muted uppercase tracking-wider">Demanda</p>
          <p className="text-sm font-semibold font-mono mt-0.5">DEM-{expected}</p>
          <p className="text-sm text-foreground mt-1 line-clamp-2">{titulo}</p>
        </div>

        <label className="block text-sm font-medium text-foreground mb-2">
          Para confirmar, digite{" "}
          <span className="font-mono font-semibold text-[var(--danger)]">DEM-{expected}</span>{" "}
          abaixo:
        </label>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`DEM-${expected}`}
          autoComplete="off"
          autoFocus
          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--danger)] focus:border-transparent"
        />

        {errorMessage && (
          <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-foreground bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--danger)] hover:opacity-90 rounded-lg transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Excluindo..." : "Excluir definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
}
