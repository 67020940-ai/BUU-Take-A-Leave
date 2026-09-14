import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listNotifications, markNotificationRead } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  return NextResponse.json({ notifications: await listNotifications(user.id) });
}

export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  const note = await markNotificationRead(id, user.id);
  if (!note) return NextResponse.json({ error: 'ไม่พบการแจ้งเตือน' }, { status: 404 });
  return NextResponse.json({ notification: note });
}
