import { put, list } from '@vercel/blob';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// รูปแบบชื่อไฟล์แนบใบลา: <userId ของคนอัปโหลด>_<สุ่ม 32 hex>.<นามสกุล>
// เก็บ userId ไว้ในชื่อไฟล์เพื่อให้ preview ก่อนกดส่งฟอร์ม (ตอนที่ยังไม่มีใบลาผูกอยู่) ทำได้
// โดยอนุญาตเฉพาะเจ้าของไฟล์เท่านั้น (ดู app/api/leaves/attachment/[filename]/route.js)
export const ATTACHMENT_FILENAME_RE = /^[a-z0-9]{1,40}_[a-f0-9]{32}\.(jpe?g|png|gif|webp)$/;

export const ATTACHMENT_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'leave-attachments');

// เซิร์ฟเวอร์แบบ serverless (เช่น Vercel) ไม่มีดิสก์ถาวร จึงใช้ Vercel Blob แทนเมื่อตั้งค่าไว้
// (BLOB_READ_WRITE_TOKEN ถูกฉีดให้อัตโนมัติเมื่อเชื่อม Blob store กับโปรเจกต์บน Vercel)
// ตอนพัฒนาในเครื่องถ้าไม่ได้ตั้งค่านี้ไว้ จะเขียนลงดิสก์ในเครื่องเหมือนเดิม
export function isBlobEnabled() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function saveAttachment(filename, buffer, contentType) {
  if (isBlobEnabled()) {
    await put(filename, buffer, { access: 'public', addRandomSuffix: false, contentType });
    return;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
}

// คืนค่า Buffer ของไฟล์ หรือ null ถ้าไม่พบ — endpoint ที่เรียกใช้ยังคงเป็นจุดเดียวที่ตรวจสิทธิ์ก่อนเสมอ
// (Blob เก็บแบบ public URL แต่ URL นั้นไม่เคยถูกส่งให้ client โดยตรง client เห็นแค่ endpoint นี้)
export async function readAttachment(filename) {
  if (isBlobEnabled()) {
    const { blobs } = await list({ prefix: filename, limit: 1 });
    const blob = blobs.find((b) => b.pathname === filename);
    if (!blob) return null;
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
  try {
    return await readFile(path.join(UPLOAD_DIR, filename));
  } catch {
    return null;
  }
}
