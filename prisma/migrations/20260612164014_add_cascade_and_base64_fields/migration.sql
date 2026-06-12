-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Anexo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "dataInclusao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT NOT NULL,
    "tipoArquivo" TEXT,
    "tamanhoArquivo" INTEGER,
    "conteudoBase64" TEXT,
    CONSTRAINT "Anexo_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Anexo" ("caminhoArquivo", "dataInclusao", "demandaId", "id", "nomeArquivo", "usuario") SELECT "caminhoArquivo", "dataInclusao", "demandaId", "id", "nomeArquivo", "usuario" FROM "Anexo";
DROP TABLE "Anexo";
ALTER TABLE "new_Anexo" RENAME TO "Anexo";
CREATE INDEX "Anexo_demandaId_idx" ON "Anexo"("demandaId");
CREATE TABLE "new_Comentario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "autor" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comentario_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comentario" ("autor", "comentario", "dataCriacao", "demandaId", "id") SELECT "autor", "comentario", "dataCriacao", "demandaId", "id" FROM "Comentario";
DROP TABLE "Comentario";
ALTER TABLE "new_Comentario" RENAME TO "Comentario";
CREATE INDEX "Comentario_demandaId_idx" ON "Comentario"("demandaId");
CREATE TABLE "new_Decisao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "dataDecisao" DATETIME NOT NULL,
    "descricao" TEXT NOT NULL,
    "participantes" TEXT,
    "origem" TEXT NOT NULL,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decisao_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Decisao" ("dataCriacao", "dataDecisao", "demandaId", "descricao", "id", "origem", "participantes") SELECT "dataCriacao", "dataDecisao", "demandaId", "descricao", "id", "origem", "participantes" FROM "Decisao";
DROP TABLE "Decisao";
ALTER TABLE "new_Decisao" RENAME TO "Decisao";
CREATE INDEX "Decisao_demandaId_idx" ON "Decisao"("demandaId");
CREATE TABLE "new_Historico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "dataHora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    CONSTRAINT "Historico_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Historico" ("acao", "dataHora", "demandaId", "id", "usuario", "valorAnterior", "valorNovo") SELECT "acao", "dataHora", "demandaId", "id", "usuario", "valorAnterior", "valorNovo" FROM "Historico";
DROP TABLE "Historico";
ALTER TABLE "new_Historico" RENAME TO "Historico";
CREATE INDEX "Historico_demandaId_idx" ON "Historico"("demandaId");
CREATE INDEX "Historico_dataHora_idx" ON "Historico"("dataHora");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
