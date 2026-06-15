import { PrismaClient } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildAdapter() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return new PrismaMariaDb(url);
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: buildAdapter() });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
