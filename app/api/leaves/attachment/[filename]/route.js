import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCourse, getLeaveByAttachment } from '@/lib/db';
import { ATTACHMENT_FILENAME_RE, ATTACHMENT_MIME, readAttachment } from '@/lib/uploads';

export async function GET(request, { params }) {
  const { filename } = await params;

  // regex บังคับให้เป็น [a-z0-9_]+.นามสกุลรูปภาพ เท่านั้น กัน path traversal ไปในตัว
  if (!ATTACHMENT_FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });

  const leave = await getLeaveByAttachment(filename);
  let authorized = false;
  if (leave) {
    if (user.role === 'admin' || user.id === leave.studentId) {
      authorized = true;
    } else if (user.role === 'teacher') {
      const course = await getCourse(leave.courseId);
      authorized = course?.teacherId === user.id;
    }
  } else {
    // ยังไม่ได้ผูกกับใบลาไหน (พรีวิวก่อนกดส่งฟอร์ม) อนุญาตเฉพาะคนที่อัปโหลดไฟล์นี้เอง
    authorized = filename.startsWith(`${user.id}_`);
  }

  if (!authorized) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงไฟล์นี้' }, { status: 403 });
  }

  const ext = filename.split('.').pop();
  const buffer = await readAttachment(filename);
  if (!buffer) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': ATTACHMENT_MIME[ext] || 'application/octet-stream',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
