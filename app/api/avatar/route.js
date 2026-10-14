import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

// Helper to clean up previous avatar file from disk
function deleteOldAvatarFile(oldAvatarUrl) {
  if (!oldAvatarUrl || typeof oldAvatarUrl !== 'string') return;
  if (!oldAvatarUrl.startsWith('/uploads/avatars/')) return;

  try {
    const filename = path.basename(oldAvatarUrl);
    // Sanity check filename to prevent path traversal
    if (!/^[a-zA-Z0-9_\-.]+\.(jpg|jpeg|png|webp)$/i.test(filename)) return;

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'avatars', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('Failed to delete old avatar file:', err.message);
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, avatar: true },
    });
    return NextResponse.json({
      ok: true,
      avatar: dbUser?.avatar || user.avatar || null,
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

    // 6. Read and delete existing old avatar file if present
    let currentAvatar = user.avatar || null;
    try {
      const existingDbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { avatar: true },
      });
      if (existingDbUser?.avatar) {
        currentAvatar = existingDbUser.avatar;
      }
    } catch (dbReadErr) {
      console.warn('DB check existing avatar error:', dbReadErr.message);
    }

    if (currentAvatar) {
      deleteOldAvatarFile(currentAvatar);
    }

    // 7. Save new file to public/uploads/avatars/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const destinationPath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(destinationPath, buffer);

    const newAvatarUrl = `/uploads/avatars/${uniqueFilename}`;

    // 8. Bind URL directly to user_id in the database
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: newAvatarUrl },
      });
    } catch (updateErr) {
      // If user session is based on mock ID, upsert user record by email
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { avatar: newAvatarUrl },
          create: {
            id: user.id,
            email: user.email,
            name: user.name || 'ผู้ใช้งาน',
            password: '',
            role: user.role || 'student',
            avatar: newAvatarUrl,
          },
        });
      } catch (upsertErr) {
        console.warn('Could not update avatar in DB:', upsertErr.message);
      }
    }

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
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { avatar: true },
      });
      if (dbUser?.avatar) currentAvatar = dbUser.avatar;
    } catch {}

    if (currentAvatar) {
      deleteOldAvatarFile(currentAvatar);
    }

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: null },
      });
    } catch (err) {
      console.warn('DB delete avatar error:', err.message);
    }

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
