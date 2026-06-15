-- AlterTable
ALTER TABLE `Demanda` MODIFY `descricao` TEXT NOT NULL;

ALTER TABLE `Decisao` MODIFY `descricao` TEXT NOT NULL;

ALTER TABLE `Comentario` MODIFY `comentario` TEXT NOT NULL;

ALTER TABLE `Historico` MODIFY `valorAnterior` TEXT NULL,
                        MODIFY `valorNovo` TEXT NULL;
