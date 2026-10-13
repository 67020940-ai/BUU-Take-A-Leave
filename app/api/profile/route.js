import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If user is from DB, fetch fresh avatar and phone
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, phone: true },
    });
    if (dbUser) {
      return NextResponse.json({ user: dbUser });
    }
  } catch (err) {
    console.warn('DB profile fetch error:', err.message);
  }

  return NextResponse.json({ user });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { avatar, phone } = body;

    let savedAvatarUrl = avatar;

    // If avatar is base64 data URL, save it as a file on disk in public/uploads/avatars/
    if (avatar && avatar.startsWith('data:image/')) {
      const matches = avatar.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const dataBuffer = Buffer.from(matches[2], 'base64');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `avatar_${user.id}_${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, dataBuffer);
        savedAvatarUrl = `/uploads/avatars/${filename}`;
      }
    }

    // Update in SQLite database
    let updatedUser = null;
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(savedAvatarUrl !== undefined ? { avatar: savedAvatarUrl } : {}),
          ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
        },
      });
    } catch (dbErr) {
      // If user is a mock ID not in DB, create or upsert
      try {
        updatedUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            avatar: savedAvatarUrl || undefined,
            phone: phone || undefined,
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name || 'ผู้ใช้งาน',
            password: '',
            role: user.role || 'student',
            avatar: savedAvatarUrl || null,
            phone: phone || null,
          },
        });
      } catch (upsertErr) {
        console.warn('DB upsert avatar error:', upsertErr.message);
      }
    }

    return NextResponse.json({
      ok: true,
      avatar: savedAvatarUrl || user.avatar,
      phone: phone !== undefined ? phone : user.phone,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
