import { NextResponse } from 'next/server';
import { findUser, isUniversityEmail } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';
import { signSession } from '@/lib/session';

export async function POST(request) {
  const { email, password } = await request.json();

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'กรอกอีเมลและรหัสผ่าน' }, { status: 400 });
  }

  if (!isUniversityEmail(email)) {
    return NextResponse.json({ error: 'กรุณาใช้อีเมลมหาวิทยาลัยบูรพา (@buu.ac.th หรือ @go.buu.ac.th)' }, { status: 400 });
  }

  const user = await findUser(email, password);
  if (!user) {
    return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, signSession(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
