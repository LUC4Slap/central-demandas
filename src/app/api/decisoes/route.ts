import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { decisaoCreateSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = decisaoCreateSchema.parse(body);

    const decisao = await prisma.decisao.create({
      data: {
        demandaId: validated.demandaId,
        dataDecisao: new Date(validated.dataDecisao),
        descricao: validated.descricao,
        participantes: validated.participantes,
        origem: validated.origem,
      },
    });

    await prisma.historico.create({
      data: {
        demandaId: validated.demandaId,
        acao: 'Decisão registrada',
        usuario: validated.usuario || 'system',
        dataHora: new Date(),
      },
    });

    return NextResponse.json(decisao, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating decisao:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
