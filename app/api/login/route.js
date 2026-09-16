import { NextResponse } from 'next/server';
import { findUser, isUniversityEmail } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';
import { signSession } from '@/lib/session';

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

    // PROTOTYPE MODE: Mock users for Vercel deployment (instant, no DB dependency)
    const mockUsers = {
      'admin@buu.ac.th': { id: 'admin-mock', role: 'admin', name: 'ผู้ดูแลระบบ' },
      'teacher-teeradech@buu.ac.th': { id: 'teacher-mock', role: 'teacher', name: 'ดร.ธีรเดช' },
      '66000001@go.buu.ac.th': { id: 'student-mock', role: 'student', name: 'จุฑามาศ แสงทอง' },
    };

    let finalUser = null;
    if (password === '1234') {
      if (mockUsers[cleanEmail]) {
        finalUser = mockUsers[cleanEmail];
      } else if (cleanEmail.startsWith('teacher-')) {
        finalUser = { id: 'teacher-mock', role: 'teacher', name: 'อาจารย์ผู้สอน' };
      } else if (/^\d{8}@go\.buu\.ac\.th$/.test(cleanEmail)) {
        finalUser = { id: 'student-mock', role: 'student', name: 'นิสิตมหาวิทยาลัยบูรพา' };
      }
    }

    // If not matched via mock, try database safely
    if (!finalUser) {
      try {
        const dbUser = await findUser(cleanEmail, password);
        if (dbUser) finalUser = dbUser;
      } catch (dbErr) {
        console.warn('Database query bypassed during login:', dbErr.message);
      }
    }

    if (!finalUser) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (หากเป็นบัญชีทดสอบใช้รหัส 1234)' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, role: finalUser.role });
    res.cookies.set(SESSION_COOKIE, signSession(finalUser.id), {
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
