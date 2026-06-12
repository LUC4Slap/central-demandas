import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const demandaId = searchParams.get('demandaId');

    let historico;
    if (demandaId) {
      historico = await prisma.historico.findMany({
        where: { demandaId: parseInt(demandaId) },
        orderBy: { dataHora: 'desc' },
      });
    } else {
      historico = await prisma.historico.findMany({
        orderBy: { dataHora: 'desc' },
        take: 100,
      });
    }

    return NextResponse.json(historico);
  } catch (error) {
    console.error('Error fetching historico:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
