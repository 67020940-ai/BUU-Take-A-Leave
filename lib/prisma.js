import { PrismaClient } from '@prisma/client';
import path from 'path';

// ใช้ globalThis กัน dev server (hot reload) สร้าง PrismaClient ซ้ำหลายตัวจนต่อ DB connection ล้น
const globalForPrisma = globalThis;

function getPrismaClient() {
  const defaultUrl = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
  const url = process.env.DATABASE_URL || defaultUrl;
  return new PrismaClient({
    datasources: {
      db: { url },
    },
  });
}

export const prisma = globalForPrisma.__prisma__ || getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma__ = prisma;
}
