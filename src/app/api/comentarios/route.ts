import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comentarioCreateSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = comentarioCreateSchema.parse(body);

    const comentario = await prisma.comentario.create({
      data: {
        demandaId: validated.demandaId,
        autor: validated.autor,
        comentario: validated.comentario,
      },
    });

    await prisma.historico.create({
      data: {
        demandaId: validated.demandaId,
        acao: 'Comentário adicionado',
        usuario: validated.autor,
        dataHora: new Date(),
      },
    });

    return NextResponse.json(comentario, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating comentario:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
