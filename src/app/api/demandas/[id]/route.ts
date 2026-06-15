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

const TRACKED_FIELDS = [
  'sistema', 'titulo', 'descricao', 'solicitante', 'orgao',
  'origem', 'status', 'responsavel', 'prioridade', 'dataSolicitacao',
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

function formatValue(field: TrackedField, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (field === 'dataSolicitacao' && value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (field === 'dataSolicitacao' && typeof value === 'string') {
    return value.split('T')[0];
  }
  return String(value);
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

    const changes: Array<{ campo: string; de: string; para: string }> = [];
    for (const field of TRACKED_FIELDS) {
      if (!(field in updateData)) continue;
      const before = (existingDemanda as Record<string, unknown>)[field];
      const after = (updatedDemanda as Record<string, unknown>)[field];
      const beforeStr = formatValue(field, before);
      const afterStr = formatValue(field, after);
      if (beforeStr !== afterStr) {
        changes.push({ campo: field, de: beforeStr, para: afterStr });
      }
    }

    if (changes.length > 0) {
      await prisma.historico.create({
        data: {
          demandaId,
          acao: 'Demanda atualizada',
          usuario: validated.usuario || 'system',
          dataHora: new Date(),
          valorAnterior: changes.map((c) => `${c.campo}: ${c.de}`).join('\n'),
          valorNovo: changes.map((c) => `${c.campo}: ${c.para}`).join('\n'),
        },
      });
    }

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
        valorAnterior: `Demanda ${String(existingDemanda.numero).padStart(4, '0')} - ${existingDemanda.titulo}`,
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
