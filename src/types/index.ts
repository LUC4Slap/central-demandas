export interface Demanda {
  id: number;
  numero: number;
  sistema: string;
  titulo: string;
  descricao: string;
  solicitante: string;
  orgao: string | null;
  origem: string;
  status: string;
  responsavel: string;
  prioridade: string | null;
  dataSolicitacao: string;
  dataCriacao: string;
  dataAtualizacao: string;
  decisoes: Decisao[];
  comentarios: Comentario[];
  anexos: Anexo[];
  historico: Historico[];
}

export interface Decisao {
  id: number;
  demandaId: number;
  dataDecisao: string;
  descricao: string;
  participantes: string | null;
  origem: string;
  dataCriacao: string;
}

export interface Comentario {
  id: number;
  demandaId: number;
  autor: string;
  comentario: string;
  dataCriacao: string;
}

export interface Anexo {
  id: number;
  demandaId: number;
  nomeArquivo: string;
  caminhoArquivo: string;
  dataInclusao: string;
  usuario: string;
  tipoArquivo: string | null;
  tamanhoArquivo: number | null;
  conteudoBase64: string | null;
}

export interface Historico {
  id: number;
  demandaId: number;
  acao: string;
  usuario: string;
  dataHora: string;
  valorAnterior: string | null;
  valorNovo: string | null;
}

export type DemandaCreateInput = {
  sistema: string;
  titulo: string;
  descricao: string;
  solicitante: string;
  orgao?: string;
  origem: string;
  status?: string;
  responsavel: string;
  prioridade?: string;
  dataSolicitacao: string;
};

export type DecisaoCreateInput = {
  demandaId: number;
  dataDecisao: string;
  descricao: string;
  participantes?: string;
  origem: string;
  usuario?: string;
};

export type ComentarioCreateInput = {
  demandaId: number;
  autor: string;
  comentario: string;
};

export type AnexoCreateInput = {
  demandaId: number;
  nomeArquivo: string;
  usuario: string;
  tipoArquivo?: string;
  tamanhoArquivo?: number;
  conteudoBase64?: string;
};

export interface Setor {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Responsavel {
  id: number;
  nome: string;
  email: string | null;
  setorId: number | null;
  setor: Setor | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}
