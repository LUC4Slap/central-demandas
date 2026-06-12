import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const responsavelUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  setorId: z.number().int().positive().nullable().optional(),
  ativo: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const responsavel = await prisma.responsavel.findUnique({
      where: { id: parseInt(id) },
    });

    if (!responsavel) {
      return NextResponse.json(
        { error: 'Responsável não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(responsavel);
  } catch (error) {
    console.error('Failed to fetch responsavel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responsavel' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = responsavelUpdateSchema.parse(body);

    const responsavel = await prisma.responsavel.update({
      where: { id: parseInt(id) },
      data: validated,
    });

    return NextResponse.json(responsavel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to update responsavel:', error);
    return NextResponse.json(
      { error: 'Failed to update responsavel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.responsavel.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete responsavel:', error);
    return NextResponse.json(
      { error: 'Failed to delete responsavel' },
      { status: 500 }
    );
  }
}
