import { put, list } from '@vercel/blob';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// รูปแบบชื่อไฟล์แนบใบลา: <userId ของคนอัปโหลด>_<สุ่ม 32 hex>.<นามสกุล>
export const ATTACHMENT_FILENAME_RE = /^[a-z0-9_\-]{1,60}_[a-f0-9]{16,32}\.(jpe?g|png|gif|webp|pdf)$/i;

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
      return blobResult;
    } catch (blobErr) {
      console.warn('Vercel Blob put error, falling back to disk:', blobErr.message);
    }
  }
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/api/leaves/attachment/${filename}` };
}

export async function readAttachment(filename) {
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
  try {
    const dir = getUploadDir();
    return await readFile(path.join(dir, filename));
  } catch {
    return null;
  }
}
