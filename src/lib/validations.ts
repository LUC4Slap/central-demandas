import { z } from 'zod';

export const demandaCreateSchema = z.object({
  sistema: z.string().min(1, 'Sistema é obrigatório'),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  solicitante: z.string().min(1, 'Solicitante é obrigatório'),
  orgao: z.string().optional().nullable(),
  origem: z.string().min(1, 'Origem é obrigatória'),
  status: z.string().default('Recebida'),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
  prioridade: z.string().optional().nullable(),
  dataSolicitacao: z.string().min(1, 'Data da solicitação é obrigatória'),
});

export const demandaUpdateSchema = z.object({
  sistema: z.string().min(1).optional(),
  titulo: z.string().min(1).optional(),
  descricao: z.string().min(1).optional(),
  solicitante: z.string().min(1).optional(),
  orgao: z.string().nullable().optional(),
  origem: z.string().min(1).optional(),
  status: z.string().optional(),
  responsavel: z.string().min(1).optional(),
  prioridade: z.string().nullable().optional(),
  dataSolicitacao: z.string().optional(),
  usuario: z.string().optional(),
});

export const decisaoCreateSchema = z.object({
  demandaId: z.coerce.number().min(1, 'ID da demanda é obrigatório'),
  dataDecisao: z.string().min(1, 'Data da decisão é obrigatória'),
  descricao: z.string().min(1, 'Descrição da decisão é obrigatória'),
  participantes: z.string().optional().nullable(),
  origem: z.string().min(1, 'Origem é obrigatória'),
  usuario: z.string().optional(),
});

export const comentarioCreateSchema = z.object({
  demandaId: z.coerce.number().min(1, 'ID da demanda é obrigatório'),
  autor: z.string().min(1, 'Autor é obrigatório'),
  comentario: z.string().min(1, 'Comentário é obrigatório'),
});

export const anexoCreateSchema = z.object({
  demandaId: z.coerce.number().min(1, 'ID da demanda é obrigatório'),
  nomeArquivo: z.string().min(1, 'Nome do arquivo é obrigatório'),
  usuario: z.string().min(1, 'Usuário é obrigatório'),
  tipoArquivo: z.string().optional(),
  tamanhoArquivo: z.number().optional(),
  conteudoBase64: z.string().optional(),
});
