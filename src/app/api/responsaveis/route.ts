import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const responsavelCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  setorId: z.number().int().positive().optional().nullable(),
});

export async function GET() {
  try {
    const responsaveis = await prisma.responsavel.findMany({
      orderBy: { nome: 'asc' },
      include: { setor: true },
    });
    return NextResponse.json(responsaveis);
  } catch (error) {
    console.error('Failed to fetch responsaveis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responsaveis' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = responsavelCreateSchema.parse(body);

    const responsavel = await prisma.responsavel.create({
      data: {
        nome: validated.nome,
        email: validated.email || null,
        setorId: validated.setorId || null,
      },
    });

    return NextResponse.json(responsavel, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Failed to create responsavel:', error);
    return NextResponse.json(
      { error: 'Failed to create responsavel' },
      { status: 500 }
    );
  }
}
