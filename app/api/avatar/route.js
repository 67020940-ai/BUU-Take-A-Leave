import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserAvatar } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

// Helper to clean up previous avatar file (from disk or Vercel Blob)
async function deleteOldAvatar(oldAvatarUrl) {
  if (!oldAvatarUrl || typeof oldAvatarUrl !== 'string') return;

  // 1. If it's a Vercel Blob URL and token is configured
  if (oldAvatarUrl.includes('blob.vercel-storage.com') && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import('@vercel/blob');
      await del(oldAvatarUrl);
    } catch (err) {
      console.warn('Failed to delete old Vercel blob:', err.message);
    }
    return;
  }

  // 2. If it's a local file in /uploads/avatars/
  if (oldAvatarUrl.startsWith('/uploads/avatars/')) {
    try {
      const filename = path.basename(oldAvatarUrl);
      if (!/^[a-zA-Z0-9_\-.]+\.(jpg|jpeg|png|webp)$/i.test(filename)) return;

      const filePath = path.join(process.cwd(), 'public', 'uploads', 'avatars', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Failed to delete old avatar file:', err.message);
    }
    return;
  }

  // 3. Base64 data URLs require no disk/blob deletion
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }, { status: 401 });
  }

  try {
    let avatar = user.avatar || null;
    if (user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { avatar: true },
      });
      if (dbUser?.avatar) avatar = dbUser.avatar;
    } else if (user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { avatar: true },
      });
      if (dbUser?.avatar) avatar = dbUser.avatar;
    }

    return NextResponse.json({
      ok: true,
      avatar,
    });
  } catch (err) {
    return NextResponse.json({
      ok: true,
      avatar: user.avatar || null,
    });
  }
}

export async function POST(request) {
  // 1. Authentication check
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ (Unauthorized)' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    // 2. Validate file presence
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'ไม่พบไฟล์รูปภาพที่ต้องการอัปโหลด กรุณาเลือกไฟล์' },
        { status: 400 }
      );
    }

    // 3. Validate file size (<= 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ขนาดไฟล์เกินกำหนด (อนุญาตสูงสุดไม่เกิน 5MB)' },
        { status: 400 }
      );
    }

    // 4. Validate file type (jpg, jpeg, png, webp)
    const rawExt = path.extname(file.name || '').toLowerCase().replace('.', '');
    const mimeType = (file.type || '').toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json(
        { error: 'อนุญาตเฉพาะไฟล์รูปภาพนามสกุล .jpg, .jpeg, .png, .webp เท่านั้น' },
        { status: 400 }
      );
    }

    // 5. Generate collision-resistant unique filename using UUID + Timestamp
    const normalizedExt = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const uniqueFilename = `avatar_${crypto.randomUUID()}_${Date.now()}.${normalizedExt}`;

    // 6. Read and delete existing old avatar if present
    let currentAvatar = user.avatar || null;
    try {
      if (user.email) {
        const existingDbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { avatar: true },
        });
        if (existingDbUser?.avatar) {
          currentAvatar = existingDbUser.avatar;
        }
      }
    } catch (dbReadErr) {
      console.warn('DB check existing avatar error:', dbReadErr.message);
    }

    if (currentAvatar) {
      await deleteOldAvatar(currentAvatar);
    }

    // 7. Store new file:
    // Strategy:
    // A) If Vercel Blob Token exists: use @vercel/blob for persistent CDN storage
    // B) If local disk is writable (e.g. dev/self-hosted): save to public/uploads/avatars/
    // C) Fallback (e.g. Vercel serverless read-only fs without Blob token): use Data URL directly
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let newAvatarUrl = null;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`avatars/${uniqueFilename}`, buffer, {
          access: 'public',
          contentType: mimeType,
        });
        if (blob?.url) {
          newAvatarUrl = blob.url;
        }
      } catch (blobErr) {
        console.warn('Vercel Blob upload failed, falling back:', blobErr.message);
      }
    }

    if (!newAvatarUrl) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const destinationPath = path.join(uploadDir, uniqueFilename);
        fs.writeFileSync(destinationPath, buffer);
        newAvatarUrl = `/uploads/avatars/${uniqueFilename}`;
      } catch (fsErr) {
        console.warn('Filesystem write failed (serverless read-only environment):', fsErr.message);
      }
    }

    if (!newAvatarUrl) {
      const base64Data = buffer.toString('base64');
      newAvatarUrl = `data:${mimeType};base64,${base64Data}`;
    }

    // 8. Bind URL directly to user in the database
    await updateUserAvatar(user, newAvatarUrl);

    return NextResponse.json({
      ok: true,
      avatar: newAvatarUrl,
      message: 'อัปโหลดและผูกรูปโปรไฟล์เข้ากับบัญชีสำเร็จ',
    });
  } catch (err) {
    console.error('Avatar upload server error:', err);
    return NextResponse.json(
      { error: 'เซิร์ฟเวอร์เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ (Unauthorized)' },
      { status: 401 }
    );
  }

  try {
    let currentAvatar = user.avatar || null;
    try {
      if (user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { avatar: true },
        });
        if (dbUser?.avatar) currentAvatar = dbUser.avatar;
      }
    } catch {}

    if (currentAvatar) {
      await deleteOldAvatar(currentAvatar);
    }

    await updateUserAvatar(user, null);

    return NextResponse.json({
      ok: true,
      avatar: null,
      message: 'ลบรูปโปรไฟล์สำเร็จ',
    });
  } catch (err) {
    console.error('Delete avatar error:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบรูปภาพ' },
      { status: 500 }
    );
  }
}
