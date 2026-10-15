// Full real-browser flow: student submits leave (with attachment) -> history -> attachment preview
// -> profile edit persisted -> teacher approves -> teacher uploads/deletes teaching material.
// Runs against the real Neon DB; all rows it creates are removed in afterAll.
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const env = fs.readFileSync('.env', 'utf8');
const prisma = new PrismaClient({ datasources: { db: { url: env.match(/^DATABASE_URL="?([^"\n]+)"?/m)[1] } } });

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const RUN = Date.now();
const REASON = `E2E-FLOW ${RUN} ปวดศีรษะไมเกรน`;
const PHONE = '0899998888';
const MAJOR = `E2E สาขา ${RUN}`;

test.describe.configure({ mode: 'serial' });

let original;
let teacherEmail;

async function login(page, email) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', '1234');
  await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();
  await page.waitForURL(/\/(student|teacher|admin)/);
}

// เปิดโมดัลโปรไฟล์ (ลองซ้ำจนกว่า React จะ hydrate และผูก event listener เสร็จ)
async function openProfile(page) {
  await expect(async () => {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('buu_open_avatar_upload')));
    await expect(page.locator('input[name="phone"]')).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 20000 });
  await page.waitForTimeout(500);
}

test.beforeAll(async () => {
  const stu = await prisma.user.findUnique({ where: { email: '66000001@go.buu.ac.th' } });
  original = { phone: stu.phone, major: stu.major, department: stu.department, name: stu.name, firstName: stu.firstName, lastName: stu.lastName };
  // the page's default (first) course for this student -> its teacher
  const enrollments = await prisma.enrollment.findMany({ where: { studentId: stu.id }, include: { course: { include: { teacher: true } } }, orderBy: { id: 'asc' } });
  teacherEmail = enrollments.find((e) => e.course.teacher)?.course.teacher.email;
});

test.afterAll(async () => {
  await prisma.leaveRequest.deleteMany({ where: { reason: { startsWith: 'E2E-FLOW' } } });
  await prisma.teachingMaterial.deleteMany({ where: { title: { startsWith: 'E2E-FLOW' } } });
  await prisma.user.update({ where: { email: '66000001@go.buu.ac.th' }, data: original });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => { throw new Error(`pageerror: ${err.message}`); });
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/favicon|Failed to load resource.*(401|404)/.test(msg.text())) {
      console.log('[browser console.error]', msg.text());
    }
  });
});

test('1. student submits leave with attachment and sees it in history', async ({ page }) => {
  await login(page, '66000001@go.buu.ac.th');
  await page.goto('/student/leave');
  await expect(page).toHaveURL(/tab=leave/);

  await page.getByRole('button', { name: 'ลาป่วย' }).click();
  await page.getByPlaceholder(/ระบุเหตุผลการลา/).fill(REASON);
  const today = new Date().toISOString().slice(0, 10);
  await page.locator('input[type="date"]').first().fill(today);
  await page.locator('input[type="date"]').last().fill(today);
  await page.locator('input[type="file"]').setInputFiles({ name: 'cert.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('ดูเอกสารแนบ')).toBeVisible(); // upload finished

  const post = page.waitForResponse((r) => r.url().endsWith('/api/leaves') && r.request().method() === 'POST');
  await page.getByRole('button', { name: /ส่งใบลา/ }).click();
  const res = await post;
  expect(res.status(), await res.text()).toBe(201);

  await expect(page.getByText(/ส่งใบลาเรียบร้อยแล้ว/)).toBeVisible();
  await page.waitForURL(/tab=history/, { timeout: 15000 });
  await expect(page.getByText(REASON).first()).toBeVisible();

  const row = await prisma.leaveRequest.findFirst({ where: { reason: REASON } });
  expect(row?.status).toBe('รออนุมัติ');
  expect(row?.attachment).toBeTruthy();
});

test('2. attachment: preview opens, new-tab link and download work', async ({ page, context }) => {
  await login(page, '66000001@go.buu.ac.th');
  await page.goto('/student?tab=history');
  const card = page.locator('div.rounded-3xl').filter({ hasText: REASON }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  const previewBtn = card.getByRole('button', { name: /ดูหลักฐานแนบ|ดูไฟล์แนบ/i });
  await previewBtn.click();
  await expect(page.getByText('รูปภาพหลักฐานประกอบการลา')).toBeVisible();

  const link = page.getByTitle(/เปิดในแท็บใหม่/);
  const href = await link.getAttribute('href');
  const popupPromise = context.waitForEvent('page');
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(popup.url()).toContain(href.split('/').pop());
  const imgResp = await page.request.get(href);
  expect(imgResp.status()).toBe(200);
  await popup.close();

  const dl = page.waitForEvent('download');
  await page.getByTitle(/ดาวน์โหลดไฟล์/).click();
  expect((await dl).suggestedFilename()).toMatch(/\.png$/i);
});

test('3. profile edit persists after reload', async ({ page }) => {
  await login(page, '66000001@go.buu.ac.th');
  await page.goto('/student');
  await openProfile(page);
  await page.locator('input[name="phone"]').fill(PHONE);
  await page.locator('input[name="department"]').fill(MAJOR);
  const save = page.waitForResponse((r) => r.url().includes('/api/profile') && ['PUT', 'PATCH'].includes(r.request().method()));
  await page.getByRole('button', { name: /บันทึกข้อมูลทั้งหมด/ }).click();
  const res = await save;
  expect(res.status(), await res.text()).toBe(200);

  await page.reload();
  await openProfile(page);
  await expect(page.locator('input[name="phone"]')).toHaveValue(PHONE);
  await expect(page.locator('input[name="department"]')).toHaveValue(MAJOR);
  const dbUser = await prisma.user.findUnique({ where: { email: '66000001@go.buu.ac.th' } });
  expect(dbUser.phone).toBe(PHONE);
});

test('4. teacher approves the leave and uploads/deletes teaching material', async ({ page }) => {
  expect(teacherEmail).toBeTruthy();
  await login(page, teacherEmail);
  await page.goto('/teacher/requests');
  const card = page.locator('div.rounded-3xl').filter({ hasText: REASON }).first();
  const patch = page.waitForResponse((r) => r.url().endsWith('/api/leaves') && r.request().method() === 'PATCH');
  await card.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  const res = await patch;
  expect(res.status(), await res.text()).toBe(200);
  await expect.poll(async () => (await prisma.leaveRequest.findFirst({ where: { reason: REASON } }))?.status).toBe('อนุมัติ');

  // teaching material
  await page.goto('/teacher/schedule');
  await page.getByRole('button', { name: /อัปโหลดเอกสารใหม่/ }).first().click();
  await page.locator('input[type="file"]').last().setInputFiles({ name: 'e2e-flow.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 e2e') });
  await page.getByPlaceholder(/เช่น สไลด์บรรยาย/).fill(`E2E-FLOW ${RUN} slide`);
  const up = page.waitForResponse((r) => r.url().includes('/api/teaching-materials') && r.request().method() === 'POST');
  await page.getByRole('button', { name: /ยืนยันการอัปโหลด/ }).click();
  const upRes = await up;
  expect(upRes.status(), await upRes.text()).toBe(200);
  await expect(page.getByText(`E2E-FLOW ${RUN} slide`).first()).toBeVisible();
  expect(await prisma.teachingMaterial.count({ where: { title: `E2E-FLOW ${RUN} slide` } })).toBe(1);

  page.once('dialog', (d) => d.accept());
  await page.getByTitle('ลบเอกสาร').first().click();
  await expect.poll(() => prisma.teachingMaterial.count({ where: { title: `E2E-FLOW ${RUN} slide` } })).toBe(0);
});

test('5. student sees approved status in history', async ({ page }) => {
  await login(page, '66000001@go.buu.ac.th');
  await page.goto('/student?tab=history');
  const reasonElem = page.getByText(REASON).first();
  await expect(reasonElem).toBeVisible({ timeout: 15000 });
  const card = page.locator('div').filter({ has: reasonElem }).filter({ hasText: /อนุมัติ/ }).first();
  await expect(card).toBeVisible();
});
