import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCourse, getLeaveByAttachment, listCoursesForTeacher } from '@/lib/db';
import { ATTACHMENT_FILENAME_RE, ATTACHMENT_MIME, readAttachment } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { filename } = await params;

  // regex บังคับให้เป็น [a-zA-Z0-9_\-\.]+.นามสกุลรูปภาพ/เอกสาร เท่านั้น กัน path traversal
  if (filename.includes('..') || !ATTACHMENT_FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });

  const leave = await getLeaveByAttachment(filename);
  let authorized = false;
  if (leave) {
    if (user.role === 'admin' || user.role === 'teacher') {
      authorized = true;
    } else {
      const studentCode = user.studentId || (typeof user.id === 'string' && user.id.replace('student-', ''));
      authorized =
        user.id === leave.studentId ||
        (studentCode && leave.studentId && leave.studentId.includes(studentCode));
    }
  } else {
    // ยังไม่ได้ผูกกับใบลา หรือเป็นตัวอย่างไฟล์/พรีวิว: อนุญาตทั้งอาจารย์ แอดมิน และนิสิต
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงไฟล์นี้' }, { status: 403 });
  }


  const ext = filename.split('.').pop()?.toLowerCase();
  const buffer = await readAttachment(filename);
  if (!buffer) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const isDownload = searchParams.get('download') === '1' || searchParams.get('download') === 'true';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': ATTACHMENT_MIME[ext] || 'application/octet-stream',
      'Content-Disposition': isDownload ? `attachment; filename="${filename}"` : 'inline',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
