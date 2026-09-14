import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherCoursesAndRoster } from '@/lib/teacherData';

function csvEscape(value) {
  let s = String(value ?? '');
  // กัน CSV/Formula injection เวลาเปิดไฟล์ด้วย Excel (ค่าที่ขึ้นต้นด้วย = + - @ อาจถูกตีความเป็นสูตร)
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  if (user.role !== 'teacher') return NextResponse.json({ error: 'เฉพาะอาจารย์เท่านั้น' }, { status: 403 });

  const { courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);

  const rows = [['รหัสวิชา', 'รายวิชา', 'รหัสนิสิต', 'ชื่อนิสิต', 'จำนวนครั้งเรียนทั้งหมด', 'จำนวนครั้งที่ลา(อนุมัติ)', 'เข้าเรียน', 'คิดเป็น %', 'เกินโควต้า']];

  for (const course of courses) {
    for (const s of rosterByCourse[course.id] || []) {
      rows.push([
        course.code,
        course.name,
        s.studentCode,
        s.studentName,
        s.totalSessions,
        s.approvedLeaves,
        s.attended,
        s.percentage,
        s.overQuota ? 'ใช่' : 'ไม่',
      ]);
    }
  }

  const csv = '﻿' + rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="attendance-report.csv"',
    },
  });
}
