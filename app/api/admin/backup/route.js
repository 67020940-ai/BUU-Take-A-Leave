import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'json'; // 'json' หรือ 'sqlite'

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // แบบที่ 1: ดาวน์โหลด Raw SQLite Database File (หากมีอยู่ในระบบ)
  if (type === 'sqlite') {
    try {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      const dbBuffer = await readFile(dbPath);

      return new NextResponse(dbBuffer, {
        headers: {
          'Content-Type': 'application/x-sqlite3',
          'Content-Disposition': `attachment; filename="buu-e-leave-backup-${timestamp}.sqlite"`,
        },
      });
    } catch (err) {
      console.warn('SQLite file not present on server, falling back to full JSON database snapshot:', err.message);
    }
  }

  // แบบที่ 2: ดาวน์โหลด Structured JSON Snapshot ของทุก Table ในระบบ
  try {
    const [users, courses, enrollments, leaves, notifications, tickets] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          studentId: true,
          faculty: true,
          major: true,
          createdAt: true,
        },
      }),
      prisma.course.findMany(),
      prisma.enrollment.findMany(),
      prisma.leaveRequest.findMany({
        include: {
          course: { select: { code: true, name: true, term: true } },
          student: { select: { name: true, studentId: true } },
        },
      }),
      prisma.notification.findMany(),
      prisma.ticket.findMany(),
    ]);

    const backupData = {
      system: 'BUU Take A Leave (ระบบบริหารจัดการการลาเรียนออนไลน์ มหาวิทยาลัยบูรพา)',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      stats: {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalEnrollments: enrollments.length,
        totalLeaves: leaves.length,
        totalNotifications: notifications.length,
        totalTickets: tickets.length,
      },
      tables: {
        users,
        courses,
        enrollments,
        leaves,
        notifications,
        tickets,
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="buu-e-leave-data-${timestamp}.json"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสำรอง: ' + err.message },
      { status: 500 }
    );
  }
}
