import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { demandaCreateSchema } from '@/lib/validations';

export async function GET() {
  try {
    const demandas = await prisma.demanda.findMany({
      orderBy: {
        dataCriacao: 'desc',
      },
      include: {
        decisoes: true,
        comentarios: true,
        anexos: true,
        historico: true,
      },
    });
    return NextResponse.json(demandas);
  } catch (error) {
    console.error('Error fetching demandas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = demandaCreateSchema.parse(body);

    const lastDemanda = await prisma.demanda.findFirst({
      orderBy: { numero: 'desc' },
    });
    const numero = lastDemanda ? lastDemanda.numero + 1 : 1;

    const demanda = await prisma.demanda.create({
      data: {
        numero,
        sistema: validated.sistema,
        titulo: validated.titulo,
        descricao: validated.descricao,
        solicitante: validated.solicitante,
        orgao: validated.orgao,
        origem: validated.origem,
        status: validated.status,
        responsavel: validated.responsavel,
        prioridade: validated.prioridade,
        dataSolicitacao: new Date(validated.dataSolicitacao),
      },
    });

    await prisma.historico.create({
      data: {
        demandaId: demanda.id,
        acao: 'Demanda criada',
        usuario: validated.solicitante,
        dataHora: new Date(),
      },
    });

    return NextResponse.json(demanda, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating demanda:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
