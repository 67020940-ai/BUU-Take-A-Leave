import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addTicket, listAllTickets, listTicketsForUser, replyTicket } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  const tickets = user.role === 'admin' ? await listAllTickets() : await listTicketsForUser(user.id);
  return NextResponse.json({ tickets });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'ข้อมูลที่ส่งมาไม่ถูกต้อง' }, { status: 400 });
  }
  const { subject, message } = payload;
  if (
    typeof subject !== 'string' ||
    typeof message !== 'string' ||
    !subject.trim() ||
    !message.trim() ||
    subject.length > 150 ||
    message.length > 500
  ) {
    return NextResponse.json({ error: 'กรอกหัวข้อและรายละเอียดให้ถูกต้อง' }, { status: 400 });
  }
  const ticket = await addTicket(user.id, subject, message);
  if (!ticket) {
    return NextResponse.json({ error: 'บันทึกเรื่องแจ้งปัญหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
  return NextResponse.json({ ticket }, { status: 201 });
}

export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบ' }, { status: 403 });
  const { id, reply } = await request.json();
  if (!id || typeof reply !== 'string' || !reply.trim() || reply.length > 1000) {
    return NextResponse.json({ error: 'กรอกข้อความตอบกลับให้ถูกต้อง' }, { status: 400 });
  }
  const ticket = await replyTicket(id, reply);
  if (!ticket) return NextResponse.json({ error: 'ไม่พบคำร้อง' }, { status: 404 });
  return NextResponse.json({ ticket });
}
