import { put, list } from '@vercel/blob';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// รูปแบบชื่อไฟล์แนบใบลา: รองรับทั้งแบบ hash ปกติและชื่อไฟล์ทั่วไป ป้องกัน path traversal
export const ATTACHMENT_FILENAME_RE = /^[a-zA-Z0-9_\-\.]{3,120}\.(jpe?g|png|gif|webp|pdf)$/i;

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
    : path.join(process.cwd(), 'public', 'uploads', 'leave-attachments');
}

export function isBlobEnabled() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function saveAttachment(filename, buffer, contentType) {
  let blobResult = null;
  if (isBlobEnabled()) {
    try {
      blobResult = await put(`leave-attachments/${filename}`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType,
      });
      if (blobResult?.url) {
        return { filename, url: blobResult.url };
      }
    } catch (blobErr) {
      console.warn('Vercel Blob put error, falling back to disk/base64:', blobErr.message);
    }
  }

  // Smart Fallback 1: Local / Public disk storage
  try {
    const dir = getUploadDir();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return { filename, url: `/api/leaves/attachment/${filename}` };
  } catch (fsErr) {
    console.warn('Disk write failed, falling back to Base64 data URL:', fsErr.message);
    // Smart Fallback 2: Base64 Data URL (ห้ามล้มเหลวจนขวางการยื่นใบลา)
    const base64 = buffer.toString('base64');
    const mime = contentType || 'application/octet-stream';
    const dataUrl = `data:${mime};base64,${base64}`;
    return { filename, url: dataUrl };
  }
}

export async function readAttachment(filename) {
  if (!filename || filename.includes('..')) return null;

  if (isBlobEnabled()) {
    try {
      const { blobs } = await list({ prefix: `leave-attachments/${filename}`, limit: 5 });
      let blob = blobs.find((b) => b.pathname === `leave-attachments/${filename}` || b.pathname.endsWith(filename));
      if (!blob) {
        const fallback = await list({ prefix: filename, limit: 5 });
        blob = fallback.blobs.find((b) => b.pathname === filename || b.pathname.endsWith(filename));
      }
      if (blob) {
        const res = await fetch(blob.url);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
      }
    } catch (blobErr) {
      console.warn('Vercel Blob read error, falling back to disk:', blobErr.message);
    }
  }

  // 1. Primary path: public/uploads/leave-attachments
  try {
    const primaryDir = getUploadDir();
    return await readFile(path.join(primaryDir, filename));
  } catch {}

  // 2. Legacy / root uploads/leave-attachments
  try {
    return await readFile(path.join(process.cwd(), 'uploads', 'leave-attachments', filename));
  } catch {}

  // 3. public/uploads/
  try {
    return await readFile(path.join(process.cwd(), 'public', 'uploads', filename));
  } catch {}

  // 4. public/ root (e.g. sample-medical-cert.png)
  try {
    return await readFile(path.join(process.cwd(), 'public', filename));
  } catch {}

  return null;
}

