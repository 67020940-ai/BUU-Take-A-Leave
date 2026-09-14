import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getCurrentUser } from '@/lib/auth';
import { ATTACHMENT_MIME, saveAttachment } from '@/lib/uploads';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// ตรวจชนิดไฟล์จริงจาก magic bytes แทนการเชื่อ Content-Type ที่ฝั่ง client ปลอมได้
const SIGNATURES = [
  { ext: 'jpg', magic: Buffer.from([0xff, 0xd8, 0xff]) },
  { ext: 'png', magic: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  { ext: 'gif', magic: Buffer.from('GIF8') },
  { ext: 'webp', magic: Buffer.from('RIFF'), extraCheck: (buf) => buf.subarray(8, 12).toString('ascii') === 'WEBP' },
];

function detectImageExt(buffer) {
  for (const sig of SIGNATURES) {
    if (buffer.subarray(0, sig.magic.length).equals(sig.magic)) {
      if (sig.extraCheck && !sig.extraCheck(buffer)) continue;
      return sig.ext;
    }
  }
  return null;
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'กรุณาเลือกไฟล์' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 5MB)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExt(buffer);
  if (!ext) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, GIF, WEBP)' }, { status: 400 });
  }

  const filename = `${user.id}_${crypto.randomBytes(16).toString('hex')}.${ext}`;
  await saveAttachment(filename, buffer, ATTACHMENT_MIME[ext]);

  return NextResponse.json({ filename, url: `/api/leaves/attachment/${filename}` });
}
