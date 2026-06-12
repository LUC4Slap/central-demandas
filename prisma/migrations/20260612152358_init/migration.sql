-- CreateTable
CREATE TABLE "Demanda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "sistema" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "orgao" TEXT,
    "origem" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "prioridade" TEXT,
    "dataSolicitacao" DATETIME NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Decisao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "dataDecisao" DATETIME NOT NULL,
    "descricao" TEXT NOT NULL,
    "participantes" TEXT,
    "origem" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decisao_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "autor" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comentario_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "dataInclusao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT NOT NULL,
    CONSTRAINT "Anexo_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Historico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "dataHora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    CONSTRAINT "Historico_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Demanda_numero_key" ON "Demanda"("numero");

-- CreateIndex
CREATE INDEX "Demanda_numero_idx" ON "Demanda"("numero");

-- CreateIndex
CREATE INDEX "Demanda_status_idx" ON "Demanda"("status");

-- CreateIndex
CREATE INDEX "Demanda_sistema_idx" ON "Demanda"("sistema");

-- CreateIndex
CREATE INDEX "Decisao_demandaId_idx" ON "Decisao"("demandaId");

-- CreateIndex
CREATE INDEX "Comentario_demandaId_idx" ON "Comentario"("demandaId");

-- CreateIndex
CREATE INDEX "Anexo_demandaId_idx" ON "Anexo"("demandaId");

-- CreateIndex
CREATE INDEX "Historico_demandaId_idx" ON "Historico"("demandaId");

-- CreateIndex
CREATE INDEX "Historico_dataHora_idx" ON "Historico"("dataHora");
