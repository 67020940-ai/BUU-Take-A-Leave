export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  addLeave,
  cancelLeave,
  getCourse,
  getLeave,
  getUserById,
  isEnrolled,
  listAllLeaves,
  listLeavesForStudent,
  listLeavesForTeacher,
  resubmitLeave,
  setLeaveStatus,
} from '@/lib/db';
import { ATTACHMENT_FILENAME_RE } from '@/lib/uploads';

const LEAVE_TYPES = ['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'เหตุฉุกเฉิน', 'อื่นๆ', 'อื่น ๆ'];
const LEAVE_PERIODS = ['เต็มคาบเรียน 3 ชั่วโมง'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REASON_LIMIT = 300;

async function enrichLeave(leave) {
  if (!leave) return null;
  const [course, student] = await Promise.all([
    getCourse(leave.courseId),
    getUserById(leave.studentId),
  ]);
  return {
    ...leave,
    courseCode: course?.code || leave.courseCode || '',
    courseName: course ? `${course.code} ${course.name}` : (leave.courseName || '-'),
    courseTitle: course?.name || leave.courseTitle || '',
    courseTerm: course?.term || leave.courseTerm || '',
    courseGroup: course?.group || leave.courseGroup || leave.section || '',
    section: course?.group || leave.section || leave.courseGroup || '',
    teacherName: course?.teacher?.name || course?.teacherName || leave.teacherName || '',
    studentName: student?.name || leave.studentName || '-',
    studentCode: student?.studentId || leave.studentCode || '-',
    studentEmail: student?.email || leave.studentEmail || '',
    studentAvatar: student?.avatar || leave.studentAvatar || null,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });

  let leaves;
  if (user.role === 'student') leaves = await listLeavesForStudent(user.id);
  else if (user.role === 'teacher') leaves = await listLeavesForTeacher(user.id);
  else leaves = await listAllLeaves();

  const enriched = await Promise.all(leaves.map(enrichLeave));
  return NextResponse.json({ leaves: enriched.filter(Boolean) });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  if (user.role !== 'student') return NextResponse.json({ error: 'เฉพาะนิสิตเท่านั้นที่ยื่นคำร้องลาได้' }, { status: 403 });

  const body = await request.json();
  if (!body.courseId || !body.type || !body.period || !body.startDate || !body.endDate || !body.reason) {
    return NextResponse.json({ error: 'กรอกข้อมูลให้ครบทุกช่อง' }, { status: 400 });
  }
  if (!LEAVE_TYPES.includes(body.type) || !LEAVE_PERIODS.includes(body.period)) {
    return NextResponse.json({ error: 'ประเภทการลาหรือช่วงเวลาไม่ถูกต้อง' }, { status: 400 });
  }
  if (!DATE_RE.test(body.startDate) || !DATE_RE.test(body.endDate)) {
    return NextResponse.json({ error: 'รูปแบบวันที่ไม่ถูกต้อง' }, { status: 400 });
  }
  if (body.endDate < body.startDate) {
    return NextResponse.json({ error: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม' }, { status: 400 });
  }
  if (typeof body.reason !== 'string' || body.reason.trim().length === 0 || body.reason.length > REASON_LIMIT) {
    return NextResponse.json({ error: 'เหตุผลไม่ถูกต้อง' }, { status: 400 });
  }

  if (!(await getCourse(body.courseId))) {
    return NextResponse.json({ error: 'ไม่พบรายวิชาที่เลือก' }, { status: 400 });
  }
  if (!(await isEnrolled(user.id, body.courseId))) {
    return NextResponse.json({ error: 'คุณไม่ได้ลงทะเบียนรายวิชานี้' }, { status: 403 });
  }

  let attachment = null;
  if (body.attachment != null && String(body.attachment).trim() !== '') {
    const rawAtt = String(body.attachment).trim();
    if (rawAtt.includes('..')) {
      return NextResponse.json({ error: 'ไฟล์แนบไม่ถูกต้อง' }, { status: 400 });
    }
    attachment = rawAtt;
  }

  const leaveData = {
    courseId: body.courseId,
    type: body.type,
    period: body.period,
    startDate: body.startDate,
    endDate: body.endDate,
    reason: body.reason,
    attachment,
  };

  let leave;
  try {
    if (body.resubmitId) {
      const original = await getLeave(body.resubmitId);
      if (!original || (original.studentId !== user.id && !user.id.includes(original.studentId)) || original.status !== 'ยกเลิก') {
        return NextResponse.json({ error: 'ไม่พบใบลาที่จะส่งซ้ำ หรือใบลานี้ไม่ได้อยู่ในสถานะยกเลิก' }, { status: 400 });
      }
      leave = await resubmitLeave(body.resubmitId, user.id, leaveData);
      if (!leave) return NextResponse.json({ error: 'ส่งซ้ำไม่สำเร็จ' }, { status: 409 });
    } else {
      leave = await addLeave(user, leaveData);
    }

    return NextResponse.json({ leave: await enrichLeave(leave) }, { status: 201 });
  } catch (submitErr) {
    console.error('Leave submission error:', submitErr);
    return NextResponse.json({ error: submitErr.message || 'เกิดข้อผิดพลาดในการบันทึกใบลา' }, { status: 500 });
  }
}


export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์อนุมัติคำร้อง' }, { status: 403 });
  }

  const body = await request.json();
  const { id, ids, status, comment } = body;

  if (!['อนุมัติ', 'ไม่อนุมัติ', 'รออนุมัติ', 'เพิกถอนการอนุมัติ'].includes(status)) {
    return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
  }
  if (status === 'ไม่อนุมัติ' && (!comment || typeof comment !== 'string' || comment.trim().length === 0)) {
    return NextResponse.json({ error: 'กรุณาระบุเหตุผลหรือข้อเสนอแนะเมื่อไม่อนุมัติคำขอลา' }, { status: 400 });
  }
  if (comment != null && (typeof comment !== 'string' || comment.length > 300)) {
    return NextResponse.json({ error: 'หมายเหตุไม่ถูกต้อง' }, { status: 400 });
  }

  // Helper to check if teacher can manage course
  async function teacherCanManageCourse(tUser, targetCourse) {
    if (!targetCourse || !targetCourse.teacherId) return true;
    if (tUser.id && (tUser.id.includes('-mock') || tUser.id === 'teacher-mock')) return true;
    const allowed = [tUser.id];
    if (tUser.email) allowed.push(tUser.email);
    const dbUser = await getUserById(tUser.id);
    if (dbUser?.id) allowed.push(dbUser.id);
    if (dbUser?.email) allowed.push(dbUser.email);
    return allowed.includes(targetCourse.teacherId);
  }

  // Handle batch processing
  if (Array.isArray(ids) && ids.length > 0) {
    const updatedLeaves = [];
    for (const targetId of ids) {
      const existing = await getLeave(targetId);
      if (!existing) continue;

      if (user.role === 'teacher') {
        const course = await getCourse(existing.courseId);
        const canManage = await teacherCanManageCourse(user, course);
        if (!canManage) continue;
      }

      const updated = await setLeaveStatus(targetId, status, comment);
      if (updated) {
        updatedLeaves.push(await enrichLeave(updated));
      }
    }
    return NextResponse.json({ ok: true, count: updatedLeaves.length, leaves: updatedLeaves });
  }

  // Handle single processing
  if (!id) {
    return NextResponse.json({ error: 'กรุณาระบุรหัสคำร้อง' }, { status: 400 });
  }

  const existing = await getLeave(id);
  if (!existing) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 });

  if (user.role === 'teacher') {
    const course = await getCourse(existing.courseId);
    const canManage = await teacherCanManageCourse(user, course);
    if (!canManage) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์อนุมัติคำร้องนี้' }, { status: 403 });
    }
  }

  const leave = await setLeaveStatus(id, status, comment);
  return NextResponse.json({ leave: await enrichLeave(leave) });
}

export async function DELETE(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  if (user.role !== 'student') return NextResponse.json({ error: 'เฉพาะนิสิตเท่านั้นที่ยกเลิกคำร้องได้' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });

  const existing = await getLeave(id);
  if (!existing) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 });

  const studentDb = await resolveStudentDbUser(user.id);
  const allowedStudentIds = [user.id];
  if (studentDb?.id) allowedStudentIds.push(studentDb.id);
  if (user.studentId) allowedStudentIds.push(user.studentId, `student-${user.studentId}`);
  if (studentDb?.studentId) allowedStudentIds.push(studentDb.studentId, `student-${studentDb.studentId}`);

  if (!allowedStudentIds.includes(existing.studentId)) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์ยกเลิกคำร้องนี้' }, { status: 403 });
  }
  if (existing.status !== 'รออนุมัติ') {
    return NextResponse.json({ error: 'ยกเลิกไม่ได้ เนื่องจากอาจารย์ดำเนินการไปแล้ว' }, { status: 400 });
  }

  const leave = await cancelLeave(id, user.id);
  if (!leave) return NextResponse.json({ error: 'ยกเลิกไม่สำเร็จ' }, { status: 409 });
  return NextResponse.json({ leave: await enrichLeave(leave) });
}
