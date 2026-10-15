import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// ห้ามฝังรหัสผ่านฐานข้อมูลไว้ในซอร์สโค้ด — ต้องตั้ง DATABASE_URL ใน .env หรือ Environment Variables ของ Vercel
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Add it to .env (local) or the hosting environment variables.');
}

export const prisma =
  globalForPrisma.__prisma__ ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma__ = prisma;
}
