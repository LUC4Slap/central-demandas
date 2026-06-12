import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const setorUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const setor = await prisma.setor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!setor) {
      return NextResponse.json(
        { error: 'Setor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(setor);
  } catch (error) {
    console.error('Failed to fetch setor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setor' },
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
    const validated = setorUpdateSchema.parse(body);

    const setor = await prisma.setor.update({
      where: { id: parseInt(id) },
      data: validated,
    });

    return NextResponse.json(setor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to update setor:', error);
    return NextResponse.json(
      { error: 'Failed to update setor' },
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
    await prisma.setor.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete setor:', error);
    return NextResponse.json(
      { error: 'Failed to delete setor' },
      { status: 500 }
    );
  }
}
