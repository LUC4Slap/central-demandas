import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length === 0) {
    const demandas = await prisma.demanda.findMany({
      orderBy: { dataCriacao: 'desc' },
      include: {
        decisoes: true,
        comentarios: true,
        anexos: true,
        historico: true,
      },
    });
    return NextResponse.json(demandas);
  }

  const search = q.trim();
  const numeroSearch = parseInt(search);

  const demandas = await prisma.demanda.findMany({
    where: {
      OR: [
        { titulo: { contains: search } },
        { descricao: { contains: search } },
        { solicitante: { contains: search } },
        { sistema: { contains: search } },
        { orgao: { contains: search } },
        { responsavel: { contains: search } },
        ...(numeroSearch ? [{ numero: { equals: numeroSearch } }] : []),
        { decisoes: { some: { descricao: { contains: search } } } },
        { comentarios: { some: { comentario: { contains: search } } } },
      ],
    },
    include: {
      decisoes: true,
      comentarios: true,
      anexos: true,
      historico: true,
    },
    orderBy: { dataCriacao: 'desc' },
  });

  return NextResponse.json(demandas);
}
