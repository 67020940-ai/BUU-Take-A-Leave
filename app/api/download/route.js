import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readAttachment } from '@/lib/uploads';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดาวน์โหลด' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const customName = searchParams.get('name') || searchParams.get('filename');

  if (!targetUrl) {
    return NextResponse.json({ error: 'ไม่พบ URL ของไฟล์' }, { status: 400 });
  }

  try {
    let buffer = null;
    let contentType = 'application/octet-stream';
    let downloadName = customName || 'download';

    // 1. If it's a relative path to leave attachments
    if (targetUrl.includes('/api/leaves/attachment/')) {
      const filename = targetUrl.split('/api/leaves/attachment/')[1]?.split('?')[0];
      if (filename) {
        buffer = await readAttachment(filename);
        if (!customName) downloadName = filename;
      }
    } else if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      // 2. External URL (e.g. Vercel Blob)
      const res = await fetch(targetUrl);
      if (!res.ok) {
        return NextResponse.json({ error: 'ไม่สามารถดึงไฟล์จากคลาวด์ได้' }, { status: 404 });
      }
      contentType = res.headers.get('content-type') || contentType;
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      if (!customName) {
        const urlObj = new URL(targetUrl);
        downloadName = path.basename(urlObj.pathname) || 'attachment';
      }
    }

    if (!buffer) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลไฟล์' }, { status: 404 });
    }

    // Sanitize filename for Content-Disposition header
    const safeFilename = encodeURIComponent(downloadName).replace(/['()]/g, escape);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Download route error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดาวน์โหลด' }, { status: 500 });
  }
}
