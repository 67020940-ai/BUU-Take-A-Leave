import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserProfile, getUserById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }, { status: 401 });
  }

  try {
    let dbUser = null;
    if (sessionUser.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: sessionUser.email.toLowerCase() },
      });
    } else if (sessionUser.id) {
      dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
      });
    }

    const mergedUser = {
      ...sessionUser,
      ...(dbUser || {}),
    };

    return NextResponse.json({
      ok: true,
      user: mergedUser,
    });
  } catch (err) {
    console.warn('Profile GET error, fallback to session user:', err.message);
    return NextResponse.json({
      ok: true,
      user: sessionUser,
    });
  }
}

export async function PUT(request) {
  return handleProfileUpdate(request);
}

export async function PATCH(request) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ (Unauthorized)' }, { status: 401 });
  }

  try {
    const body = await request.json();

    let derivedAcademicYear = body.academicYear?.trim?.() ?? body.academicYear;
    if (sessionUser.role === 'student') {
      const sId = body.studentId || sessionUser.studentId || sessionUser.email || '';
      const match = String(sId).trim().match(/^(\d{2})/);
      if (match) {
        const entryYear = parseInt(match[1], 10);
        const diff = 69 - entryYear + 1; // 2569
        if (diff <= 1) derivedAcademicYear = 'ชั้นปีที่ 1';
        else if (diff === 2) derivedAcademicYear = 'ชั้นปีที่ 2';
        else if (diff === 3) derivedAcademicYear = 'ชั้นปีที่ 3';
        else if (diff === 4) derivedAcademicYear = 'ชั้นปีที่ 4';
        else derivedAcademicYear = 'ชั้นปีที่ 5+';
      }
    }

    const allowedFields = {
      firstName: body.firstName?.trim?.() ?? body.firstName,
      lastName: body.lastName?.trim?.() ?? body.lastName,
      phone: body.phone?.trim?.() ?? body.phone,
      studentId: body.studentId?.trim?.() ?? body.studentId,
      personnelId: body.personnelId?.trim?.() ?? body.personnelId,
      faculty: body.faculty?.trim?.() ?? body.faculty,
      department: body.department?.trim?.() ?? body.department,
      major: body.major?.trim?.() ?? body.major,
      academicYear: derivedAcademicYear,
      advisorName: body.advisorName?.trim?.() ?? body.advisorName,
      bio: body.bio?.trim?.() ?? body.bio,
      avatar: body.avatar,
    };

    const updated = await updateUserProfile(sessionUser, allowedFields);

    return NextResponse.json({
      ok: true,
      user: updated,
      message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว',
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลส่วนตัว: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
