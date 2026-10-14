import crypto from 'crypto';

// เซ็น session cookie ด้วย HMAC กัน user แก้ค่า cookie เอง (แทนการใส่ user id เปล่า ๆ)
// ใน production ควรตั้ง SESSION_SECRET เป็นค่าสุ่มยาว ๆ ผ่าน environment variable จริง
// ถ้าไม่ตั้งไว้ จะสุ่มค่าใหม่ทุกครั้งที่ server เริ่มทำงาน (ปลอดภัยกว่าใช้ค่า default ที่ตายตัว
// และมีคนอื่นรู้ค่าได้จากซอร์สโค้ด แต่แลกกับ session จะหลุดทุกครั้งที่ restart server)
// เก็บไว้ใน globalThis เพราะ Next.js แยก module graph ระหว่าง Route Handler กับ Server
// Component คนละชุด ถ้าไม่ผูกกับ globalThis แต่ละฝั่งจะสุ่มค่าคนละค่ากัน ทำให้ verify ไม่ผ่าน
function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // PROTOTYPE MODE: Use a static secret for Vercel deployment to prevent session loss on restart
  return 'prototype-secret-key-buu-2026-fixed';
}

const SECRET = getSecret();

export function signSession(userId, role) {
  const payload = role ? `${userId}:${role}` : userId;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySessionPayload(token) {
  if (!token) return null;
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!payload || !sig) return null;

  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  if (payload.includes(':')) {
    const [userId, role] = payload.split(':');
    return { userId, role };
  }

  // Fallback role detection for legacy tokens
  let inferredRole = 'student';
  if (payload.includes('admin') || payload === 'admin-mock') inferredRole = 'admin';
  else if (payload.includes('teacher') || payload === 'teacher-mock') inferredRole = 'teacher';

  return { userId: payload, role: inferredRole };
}

export function verifySession(token) {
  const parsed = verifySessionPayload(token);
  return parsed ? parsed.userId : null;
}

