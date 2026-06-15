"use client";

import { useCallback, useRef, useState } from "react";

export interface DropzoneFile {
  file: File;
  base64: string;
}

interface FileDropzoneProps {
  onFilesChange: (files: DropzoneFile[]) => void;
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
  helperText?: string;
}

const DEFAULT_ACCEPT = [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".zip"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? "." + name.slice(i + 1).toLowerCase() : "";
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
}

export default function FileDropzone({
  onFilesChange,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = true,
  helperText,
}: FileDropzoneProps) {
  const [files, setFiles] = useState<DropzoneFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const emit = useCallback(
    (next: DropzoneFile[]) => {
      setFiles(next);
      onFilesChange(next);
    },
    [onFilesChange],
  );

  const addFiles = useCallback(
    async (incoming: File[]) => {
      const next: DropzoneFile[] = [...files];
      let lastError: string | null = null;

      const validate = (file: File): string | null => {
        if (!accept.includes(getExt(file.name))) {
          return `Tipo não permitido: ${file.name}`;
        }
        if (file.size > maxSize) {
          return `Arquivo muito grande: ${file.name} (máx. ${formatSize(maxSize)})`;
        }
        if (next.some((f) => f.file.name === file.name && f.file.size === file.size)) {
          return `Arquivo já adicionado: ${file.name}`;
        }
        return null;
      };

      for (const file of incoming) {
        const err = validate(file);
        if (err) {
          lastError = err;
          continue;
        }
        try {
          const base64 = await readAsBase64(file);
          next.push({ file, base64 });
          setRejected(null);
        } catch {
          lastError = `Erro ao ler arquivo: ${file.name}`;
        }
      }

      emit(next);
      if (lastError) setRejected(lastError);
    },
    [files, emit, accept, maxSize],
  );

  const removeFile = (index: number) => {
    emit(files.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) {
      addFiles(multiple ? dropped : [dropped[0]]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    addFiles(Array.from(list));
    e.target.value = "";
  };

  const acceptAttr = accept.join(",");

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`
          relative flex flex-col items-center justify-center
          px-6 py-10 border-2 border-dashed rounded-xl
          cursor-pointer transition-colors
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
          ${dragActive
            ? "border-[var(--primary)] bg-[var(--primary)]/5"
            : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-hover)]"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptAttr}
          multiple={multiple}
          onChange={handleChange}
        />
        <div className="w-12 h-12 mb-3 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[var(--primary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">
          {dragActive ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para selecionar"}
        </p>
        <p className="text-xs text-muted mt-1.5 text-center">
          {helperText ?? `Tipos: ${accept.join(", ")} · Máximo: ${formatSize(maxSize)} por arquivo`}
        </p>
      </div>

      {rejected && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{rejected}</div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((pf, i) => (
            <li
              key={`${pf.file.name}-${i}`}
              className="flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg"
            >
              <div className="w-9 h-9 bg-[var(--primary)]/10 rounded-md flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-[var(--primary)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pf.file.name}</p>
                <p className="text-xs text-muted">
                  {formatSize(pf.file.size)} · {pf.file.type || "arquivo"}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="p-1.5 text-muted hover:text-[var(--danger)] transition-colors rounded-md hover:bg-red-50"
                aria-label="Remover arquivo"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
