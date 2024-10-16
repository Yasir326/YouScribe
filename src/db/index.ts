import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as typeof globalThis & { cachedPrisma?: PrismaClient }

let prisma: PrismaClient;

try {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    if (!globalForPrisma.cachedPrisma) {
      globalForPrisma.cachedPrisma = new PrismaClient();
    }
    prisma = globalForPrisma.cachedPrisma;
  }
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  throw new Error('Prisma client initialization failed. Please ensure you have run "prisma generate" and that your database is properly configured.');
}

export const db = prisma;
