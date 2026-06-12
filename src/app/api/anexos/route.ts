import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { anexoCreateSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = anexoCreateSchema.parse(body);

    const anexo = await prisma.anexo.create({
      data: {
        demandaId: validated.demandaId,
        nomeArquivo: validated.nomeArquivo,
        caminhoArquivo: validated.conteudoBase64 ? 'base64' : '',
        usuario: validated.usuario,
        tipoArquivo: validated.tipoArquivo,
        tamanhoArquivo: validated.tamanhoArquivo,
        conteudoBase64: validated.conteudoBase64,
      },
    });

    await prisma.historico.create({
      data: {
        demandaId: validated.demandaId,
        acao: 'Anexo adicionado',
        usuario: validated.usuario,
        dataHora: new Date(),
      },
    });

    return NextResponse.json(anexo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating anexo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
