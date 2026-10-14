import { test, expect } from '@playwright/test';

test.describe('BUU Take A Leave - RBAC & Teacher Workflow', () => {
  test('นักเรียน (Student) ไม่สามารถเข้าถึงหน้า /teacher หรือ /admin ได้ (ถูก Redirect กลับ /student)', async ({ page }) => {
    // 1. เข้าสู่ระบบด้วยบัญชีนิสิต
    await page.goto('/login');
    await page.fill('#email', '66000001@go.buu.ac.th');
    await page.fill('#password', '1234');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();
    await expect(page).toHaveURL(/\/student/);

    // 2. พยายามเข้าหน้า /teacher ตรงๆ
    await page.goto('/teacher');
    await expect(page).toHaveURL(/\/student/);

    // 3. พยายามเข้าหน้า /admin ตรงๆ
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/student/);
  });

  test('อาจารย์ (Teacher) เข้าสู่ระบบและสามารถตรวจสอบคำขอลาและแผนการสอน 15 สัปดาห์ได้', async ({ page }) => {
    // 1. เข้าสู่ระบบด้วยบัญชีอาจารย์
    await page.goto('/login');
    const teacherQuickBtn = page.getByRole('button', { name: /ธีรเดช/i });
    if (await teacherQuickBtn.isVisible()) {
      await teacherQuickBtn.click();
    } else {
      await page.fill('#email', 'teacher-teeradech@buu.ac.th');
      await page.fill('#password', '1234');
    }
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

    // 2. ตรวจสอบว่า redirect มาที่หน้าอาจารย์
    await expect(page).toHaveURL(/\/teacher/);

    // 3. อาจารย์เข้าหน้าคำขอลา
    await page.goto('/teacher/requests');
    await expect(page).toHaveURL(/\/teacher\/requests/);

    // 4. อาจารย์เข้าหน้าตารางสอนและแผนการสอน
    await page.goto('/teacher/schedule');
    await expect(page).toHaveURL(/\/teacher\/schedule/);
    await expect(page.getByText(/แผนการสอนรายสัปดาห์/i).first()).toBeVisible();
  });
});
