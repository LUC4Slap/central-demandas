import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { demandaUpdateSchema } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const demanda = await prisma.demanda.findUnique({
      where: { id: parseInt(id) },
      include: {
        decisoes: true,
        comentarios: true,
        anexos: true,
        historico: true,
      },
    });

    if (!demanda) {
      return NextResponse.json({ error: 'Demanda not found' }, { status: 404 });
    }

    return NextResponse.json(demanda);
  } catch (error) {
    console.error('Error fetching demanda:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const demandaId = parseInt(id);
    const body = await request.json();
    const validated = demandaUpdateSchema.parse(body);

    const existingDemanda = await prisma.demanda.findUnique({
      where: { id: demandaId },
    });

    if (!existingDemanda) {
      return NextResponse.json({ error: 'Demanda not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (validated.sistema !== undefined) updateData.sistema = validated.sistema;
    if (validated.titulo !== undefined) updateData.titulo = validated.titulo;
    if (validated.descricao !== undefined) updateData.descricao = validated.descricao;
    if (validated.solicitante !== undefined) updateData.solicitante = validated.solicitante;
    if (validated.orgao !== undefined) updateData.orgao = validated.orgao;
    if (validated.origem !== undefined) updateData.origem = validated.origem;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.responsavel !== undefined) updateData.responsavel = validated.responsavel;
    if (validated.prioridade !== undefined) updateData.prioridade = validated.prioridade;
    if (validated.dataSolicitacao !== undefined) updateData.dataSolicitacao = new Date(validated.dataSolicitacao);

    const updatedDemanda = await prisma.demanda.update({
      where: { id: demandaId },
      data: updateData,
    });

    await prisma.historico.create({
      data: {
        demandaId,
        acao: 'Demanda atualizada',
        usuario: validated.usuario || 'system',
        dataHora: new Date(),
        valorAnterior: JSON.stringify(existingDemanda),
        valorNovo: JSON.stringify(updatedDemanda),
      },
    });

    return NextResponse.json(updatedDemanda);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating demanda:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const demandaId = parseInt(id);

    const existingDemanda = await prisma.demanda.findUnique({
      where: { id: demandaId },
    });

    if (!existingDemanda) {
      return NextResponse.json({ error: 'Demanda not found' }, { status: 404 });
    }

    await prisma.historico.create({
      data: {
        demandaId,
        acao: 'Demanda excluída',
        usuario: 'system',
        dataHora: new Date(),
        valorAnterior: JSON.stringify(existingDemanda),
        valorNovo: null,
      },
    });

    await prisma.demanda.delete({
      where: { id: demandaId },
    });

    return NextResponse.json({ message: 'Demanda deleted successfully' });
  } catch (error) {
    console.error('Error deleting demanda:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
