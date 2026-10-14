import { put, list } from '@vercel/blob';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// รูปแบบชื่อไฟล์แนบใบลา: <userId ของคนอัปโหลด>_<สุ่ม 32 hex>.<นามสกุล>
// เก็บ userId ไว้ในชื่อไฟล์เพื่อให้ preview ก่อนกดส่งฟอร์ม (ตอนที่ยังไม่มีใบลาผูกอยู่) ทำได้
// โดยอนุญาตเฉพาะเจ้าของไฟล์เท่านั้น (ดู app/api/leaves/attachment/[filename]/route.js)
export const ATTACHMENT_FILENAME_RE = /^[a-z0-9]{1,40}_[a-f0-9]{32}\.(jpe?g|png|gif|webp|pdf)$/;

export const ATTACHMENT_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

function getUploadDir() {
  return process.env.VERCEL
    ? path.join('/tmp', 'uploads', 'leave-attachments')
    : path.join(process.cwd(), 'uploads', 'leave-attachments');
}

// เซิร์ฟเวอร์แบบ serverless (เช่น Vercel) ไม่มีดิสก์ถาวร จึงใช้ Vercel Blob แทนเมื่อตั้งค่าไว้
// (BLOB_READ_WRITE_TOKEN ถูกฉีดให้อัตโนมัติเมื่อเชื่อม Blob store กับโปรเจกต์บน Vercel)
// หากไม่มี Blob token จะใช้ /tmp บน serverless หรือ UPLOAD_DIR ในเครื่อง
export function isBlobEnabled() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function saveAttachment(filename, buffer, contentType) {
  if (isBlobEnabled()) {
    try {
      await put(filename, buffer, { access: 'public', addRandomSuffix: false, contentType });
      return;
    } catch (blobErr) {
      console.warn('Vercel Blob put error, falling back to disk:', blobErr.message);
    }
  }
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
}

// คืนค่า Buffer ของไฟล์ หรือ null ถ้าไม่พบ — endpoint ที่เรียกใช้ยังคงเป็นจุดเดียวที่ตรวจสิทธิ์ก่อนเสมอ
export async function readAttachment(filename) {
  if (isBlobEnabled()) {
    try {
      const { blobs } = await list({ prefix: filename, limit: 1 });
      const blob = blobs.find((b) => b.pathname === filename);
      if (blob) {
        const res = await fetch(blob.url);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
      }
    } catch (blobErr) {
      console.warn('Vercel Blob read error, falling back to disk:', blobErr.message);
    }
  }
  try {
    const dir = getUploadDir();
    return await readFile(path.join(dir, filename));
  } catch {
    return null;
  }
}
