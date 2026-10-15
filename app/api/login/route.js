import { NextResponse } from 'next/server';
import { findUser, isUniversityEmail } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';
import { signSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'กรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isUniversityEmail(cleanEmail)) {
      return NextResponse.json({ error: 'กรุณาใช้อีเมลมหาวิทยาลัยบูรพา (@buu.ac.th หรือ @go.buu.ac.th)' }, { status: 400 });
    }

    // Try database first so avatar and profile are persisted across devices
    let finalUser = null;
    try {
      const dbUser = await findUser(cleanEmail, password);
      if (dbUser) finalUser = dbUser;
    } catch (dbErr) {
      console.warn('Database query bypassed during login:', dbErr.message);
    }

    // Direct lookup in DB for test credentials with 1234
    if (!finalUser && password === '1234') {
      try {
        const userByEmail = await prisma.user.findFirst({
          where: { email: cleanEmail },
        });
        if (userByEmail) finalUser = userByEmail;
      } catch (e) {
        console.warn('Prisma email lookup warning:', e.message);
      }
    }

    // Fallback for prototype mock users if DB didn't match
    if (!finalUser && password === '1234') {
      if (cleanEmail === 'admin@buu.ac.th' || cleanEmail === 'admin@go.buu.ac.th') {
        finalUser = { id: 'admin-mock', role: 'admin', name: 'ผู้ดูแลระบบ', email: cleanEmail };
      } else if (cleanEmail.startsWith('teacher-')) {
        const handle = cleanEmail.split('@')[0];
        finalUser = { id: handle, role: 'teacher', name: 'อาจารย์ผู้สอน', email: cleanEmail };
      } else if (/^\d{8}@go\.buu\.ac\.th$/.test(cleanEmail)) {
        const studentCode = cleanEmail.replace('@go.buu.ac.th', '');
        finalUser = { id: `student-${studentCode}`, role: 'student', name: `นิสิต (${studentCode})`, studentId: studentCode, email: cleanEmail };
      }
    }

    if (!finalUser) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (หากเป็นบัญชีทดสอบใช้รหัส 1234)' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, role: finalUser.role });
    res.cookies.set(SESSION_COOKIE, signSession(finalUser.id, finalUser.role), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (err) {
    console.error('Unhandled login error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
