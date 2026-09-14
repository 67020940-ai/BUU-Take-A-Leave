import crypto from 'crypto';

// เซ็น session cookie ด้วย HMAC กัน user แก้ค่า cookie เอง (แทนการใส่ user id เปล่า ๆ)
// ใน production ควรตั้ง SESSION_SECRET เป็นค่าสุ่มยาว ๆ ผ่าน environment variable จริง
// ถ้าไม่ตั้งไว้ จะสุ่มค่าใหม่ทุกครั้งที่ server เริ่มทำงาน (ปลอดภัยกว่าใช้ค่า default ที่ตายตัว
// และมีคนอื่นรู้ค่าได้จากซอร์สโค้ด แต่แลกกับ session จะหลุดทุกครั้งที่ restart server)
// เก็บไว้ใน globalThis เพราะ Next.js แยก module graph ระหว่าง Route Handler กับ Server
// Component คนละชุด ถ้าไม่ผูกกับ globalThis แต่ละฝั่งจะสุ่มค่าคนละค่ากัน ทำให้ verify ไม่ผ่าน
function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const g = globalThis;
  if (!g.__buuELeaveSessionSecret__) {
    g.__buuELeaveSessionSecret__ = crypto.randomBytes(32).toString('hex');
  }
  return g.__buuELeaveSessionSecret__;
}

const SECRET = getSecret();

export function signSession(userId) {
  const sig = crypto.createHmac('sha256', SECRET).update(userId).digest('hex');
  return `${userId}.${sig}`;
}

export function verifySession(token) {
  if (!token) return null;
  const [userId, sig] = token.split('.');
  if (!userId || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(userId).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}
