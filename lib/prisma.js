import { PrismaClient } from '@prisma/client';

// ใช้ globalThis กัน dev server (hot reload) สร้าง PrismaClient ซ้ำหลายตัวจนต่อ DB connection ล้น
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma__ || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma__ = prisma;
}
