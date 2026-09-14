import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  addLeave,
  cancelLeave,
  getCourse,
  getLeave,
  isEnrolled,
  listAllLeaves,
  listLeavesForStudent,
  listLeavesForTeacher,
  resubmitLeave,
  setLeaveStatus,
} from '@/lib/db';
import { ATTACHMENT_FILENAME_RE } from '@/lib/uploads';

const LEAVE_TYPES = ['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'เหตุฉุกเฉิน', 'อื่นๆ'];
const LEAVE_PERIODS = ['เต็มคาบเรียน 3 ชั่วโมง', 'ครึ่งคาบแรก 1.5 ชั่วโมง', 'ครึ่งคาบหลัง 1.5 ชั่วโมง'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REASON_LIMIT = 300;

async function withCourse(leave) {
  const course = await getCourse(leave.courseId);
  return { ...leave, courseName: course ? `${course.code} ${course.name}` : '-' };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });

  let leaves;
  if (user.role === 'student') leaves = await listLeavesForStudent(user.id);
  else if (user.role === 'teacher') leaves = await listLeavesForTeacher(user.id);
  else leaves = await listAllLeaves();

  return NextResponse.json({ leaves: await Promise.all(leaves.map(withCourse)) });
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
  if (body.attachment != null) {
    if (
      typeof body.attachment !== 'string' ||
      !ATTACHMENT_FILENAME_RE.test(body.attachment) ||
      !body.attachment.startsWith(`${user.id}_`)
    ) {
      return NextResponse.json({ error: 'ไฟล์แนบไม่ถูกต้อง' }, { status: 400 });
    }
    attachment = body.attachment;
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
  if (body.resubmitId) {
    const original = await getLeave(body.resubmitId);
    if (!original || original.studentId !== user.id || original.status !== 'ยกเลิก') {
      return NextResponse.json({ error: 'ไม่พบใบลาที่จะส่งซ้ำ หรือใบลานี้ไม่ได้อยู่ในสถานะยกเลิก' }, { status: 400 });
    }
    leave = await resubmitLeave(body.resubmitId, user.id, leaveData);
    if (!leave) return NextResponse.json({ error: 'ส่งซ้ำไม่สำเร็จ' }, { status: 409 });
  } else {
    leave = await addLeave(user.id, leaveData);
  }
  return NextResponse.json({ leave: await withCourse(leave) }, { status: 201 });
}

export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  if (user.role !== 'teacher') return NextResponse.json({ error: 'ไม่มีสิทธิ์อนุมัติคำร้อง' }, { status: 403 });

  const { id, status, comment } = await request.json();
  if (!id || !['อนุมัติ', 'ไม่อนุมัติ', 'รออนุมัติ'].includes(status)) {
    return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
  }
  if (comment != null && (typeof comment !== 'string' || comment.length > 300)) {
    return NextResponse.json({ error: 'หมายเหตุไม่ถูกต้อง' }, { status: 400 });
  }

  const existing = await getLeave(id);
  if (!existing) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 });

  const course = await getCourse(existing.courseId);
  if (!course || course.teacherId !== user.id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์อนุมัติคำร้องนี้' }, { status: 403 });
  }

  // อนุมัติ/ไม่อนุมัติ ทำได้เฉพาะตอนยังรออนุมัติอยู่ ส่วนการ "ยกเลิกการอนุมัติ" (กลับเป็นรออนุมัติ)
  // ทำได้เฉพาะตอนที่เคยตัดสินใจไปแล้ว (อาจารย์คนเดิมที่เป็นเจ้าของวิชาเท่านั้น เช็คสิทธิ์ไปแล้วด้านบน)
  if (status === 'รออนุมัติ') {
    if (existing.status === 'รออนุมัติ') {
      return NextResponse.json({ error: 'คำร้องนี้ยังไม่ได้พิจารณา ไม่มีการอนุมัติให้ยกเลิก' }, { status: 400 });
    }
  } else if (existing.status !== 'รออนุมัติ') {
    return NextResponse.json({ error: 'คำร้องนี้ถูกดำเนินการไปแล้ว' }, { status: 400 });
  }

  const leave = await setLeaveStatus(id, status, comment);
  return NextResponse.json({ leave: await withCourse(leave) });
}

export async function DELETE(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  if (user.role !== 'student') return NextResponse.json({ error: 'เฉพาะนิสิตเท่านั้นที่ยกเลิกคำร้องได้' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });

  const existing = await getLeave(id);
  if (!existing) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 });
  if (existing.studentId !== user.id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์ยกเลิกคำร้องนี้' }, { status: 403 });
  }
  if (existing.status !== 'รออนุมัติ') {
    return NextResponse.json({ error: 'ยกเลิกไม่ได้ เนื่องจากอาจารย์ดำเนินการไปแล้ว' }, { status: 400 });
  }

  const leave = await cancelLeave(id, user.id);
  if (!leave) return NextResponse.json({ error: 'ยกเลิกไม่สำเร็จ' }, { status: 409 });
  return NextResponse.json({ leave: await withCourse(leave) });
}
