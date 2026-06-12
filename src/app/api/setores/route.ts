import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const setorCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
});

export async function GET() {
  try {
    const setores = await prisma.setor.findMany({
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(setores);
  } catch (error) {
    console.error('Failed to fetch setores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = setorCreateSchema.parse(body);

    const setor = await prisma.setor.create({
      data: {
        nome: validated.nome,
        descricao: validated.descricao || null,
      },
    });

    return NextResponse.json(setor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create setor:', error);
    return NextResponse.json(
      { error: 'Failed to create setor' },
      { status: 500 }
    );
  }
}
