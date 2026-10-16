import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const WORKING_DATABASE_URL =
  'postgresql://neondb_owner:npg_cDBWIhPA7r5p@ep-billowing-hat-b43c14mf-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30';

for (const envKey of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) {
  if (!process.env[envKey] || process.env[envKey].includes('ep-lucky-hat')) {
    process.env[envKey] = WORKING_DATABASE_URL;
  }
}

export const prisma =
  globalForPrisma.__prisma__ ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || WORKING_DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma__ = prisma;
}
