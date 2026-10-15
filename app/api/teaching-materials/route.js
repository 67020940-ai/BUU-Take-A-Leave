import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put, del } from '@vercel/blob';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Supported document & media extensions
const ALLOWED_EXTS = new Set([
  'pdf',
  'pptx',
  'ppt',
  'docx',
  'doc',
  'xlsx',
  'xls',
  'zip',
  'rar',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'txt',
]);

function getMaterialsUploadDir() {
  return process.env.VERCEL
    ? path.join('/tmp', 'uploads', 'materials')
    : path.join(process.cwd(), 'public', 'uploads', 'materials');
}

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const weekParam = searchParams.get('week');

  try {
    const where = {};
    if (courseId) {
      // Find matching courses by id or code
      const matchedCourses = await prisma.course.findMany({
        where: {
          OR: [{ id: courseId }, { code: courseId }],
        },
        select: { id: true },
      });
      const ids = matchedCourses.map((c) => c.id);
      if (ids.length > 0) {
        where.courseId = { in: ids };
      } else {
        where.courseId = courseId;
      }
    }

    if (weekParam) {
      where.week = Number(weekParam);
    }

    const materials = await prisma.teachingMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        course: {
          select: { id: true, code: true, name: true, group: true },
        },
      },
    });

    return NextResponse.json({ ok: true, materials });
  } catch (err) {
    console.error('Fetch teaching materials error:', err);
    return NextResponse.json({ ok: true, materials: [] });
  }
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนอัปโหลด' }, { status: 401 });
  }
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return NextResponse.json({ error: 'เฉพาะอาจารย์หรือผู้ดูแลระบบเท่านั้นที่อัปโหลดเอกสารการสอนได้' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const courseParam = formData.get('courseId');
    const titleParam = formData.get('title');
    const weekParam = formData.get('week');
    const descriptionParam = formData.get('description');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' }, { status: 400 });
    }
    if (!courseParam) {
      return NextResponse.json({ error: 'กรุณาระบุรายวิชาที่ต้องการอัปโหลดเอกสาร' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ขนาดไฟล์เกิน 50MB กรุณาเลือกไฟล์ที่มีขนาดเล็กลง' }, { status: 400 });
    }

    const originalName = file.name || 'document';
    const ext = originalName.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        { error: 'รูปแบบไฟล์ไม่รองรับ รองรับ PDF, PPTX, DOCX, XLSX, ZIP, RAR และรูปภาพ' },
        { status: 400 }
      );
    }

    // Resolve course record in Prisma
    let course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseParam }, { code: courseParam }],
      },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          id: courseParam,
          code: courseParam,
          name: `รายวิชา ${courseParam}`,
          term: '1/2569',
          totalSessions: 15,
          teacherId: user.id || null,
          teacherName: user.name || null,
        },
      });
    }

    // Upload to Vercel Blob or local disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const safeBaseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFilename = `${safeBaseName}_${uniqueSuffix}.${ext}`;

    let fileUrl = null;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`materials/${cleanFilename}`, buffer, {
          access: 'public',
          contentType: file.type || 'application/octet-stream',
        });
        if (blob?.url) {
          fileUrl = blob.url;
        }
      } catch (blobErr) {
        console.warn('Vercel Blob material upload error, falling back:', blobErr.message);
      }
    }

    if (!fileUrl) {
      try {
        const uploadDir = getMaterialsUploadDir();
        await mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, cleanFilename);
        await writeFile(filePath, buffer);
        fileUrl = `/uploads/materials/${cleanFilename}`;
      } catch (fsErr) {
        console.warn('Disk write failed, using data url:', fsErr.message);
        fileUrl = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
      }
    }

    // Ensure user ID exists in DB
    let uId = user.id;
    if (user.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
      if (dbUser) uId = dbUser.id;
    }

    // Create TeachingMaterial record in database
    const material = await prisma.teachingMaterial.create({
      data: {
        courseId: course.id,
        week: weekParam ? Number(weekParam) : null,
        title: titleParam?.trim?.() || originalName,
        description: descriptionParam?.trim?.() || null,
        fileUrl: fileUrl,
        fileName: originalName,
        fileType: ext,
        fileSize: file.size,
        uploadedById: uId,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, role: true } },
        course: { select: { id: true, code: true, name: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      material,
      message: 'อัปโหลดสื่อและเอกสารประกอบการสอนสำเร็จเรียบร้อย',
    });
  } catch (err) {
    console.error('Teaching material upload error:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบเอกสาร' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ไม่พบ ID ของเอกสาร' }, { status: 400 });
  }

  try {
    const material = await prisma.teachingMaterial.findUnique({ where: { id } });
    if (!material) {
      return NextResponse.json({ error: 'ไม่พบเอกสารนี้ในระบบ' }, { status: 404 });
    }

    // Attempt delete from Vercel Blob
    if (material.fileUrl && material.fileUrl.includes('blob.vercel-storage.com') && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(material.fileUrl);
      } catch (blobDelErr) {
        console.warn('Failed to delete blob:', blobDelErr.message);
      }
    }

    await prisma.teachingMaterial.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: 'ลบเอกสารประกอบการสอนสำเร็จ',
    });
  } catch (err) {
    console.error('Delete teaching material error:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบเอกสาร: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
