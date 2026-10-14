import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const envUrl = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@')
    : 'NOT_SET';
  const directUrl = process.env.DATABASE_URL_UNPOOLED
    ? process.env.DATABASE_URL_UNPOOLED.replace(/:[^:]*@/, ':***@')
    : 'NOT_SET';

  let dbError = null;
  let userCount = -1;
  try {
    userCount = await prisma.user.count();
  } catch (err) {
    dbError = {
      message: err.message,
      name: err.name,
      code: err.code,
    };
  }

  return NextResponse.json({
    envUrl,
    directUrl,
    userCount,
    dbError,
    nodeEnv: process.env.NODE_ENV,
  });
}
