import { test, expect } from '@playwright/test';

test.describe('BUU Take A Leave - Admin Access Flow', () => {
  test('ควรสามารถเข้าสู่ระบบผู้ดูแลระบบ (Admin) และโหลดหน้า Dashboard ได้ถูกต้องโดยไม่เกิด error', async ({ page }) => {
    // 1. ไปยังหน้าเข้าสู่ระบบ
    await page.goto('/login');

    // ตรวจสอบว่ามีปุ่ม Quick Login แอดมิน
    const adminQuickBtn = page.getByRole('button', { name: /แอดมิน/i });
    await expect(adminQuickBtn).toBeVisible();

    // 2. คลิกปุ่ม Quick Login แอดมิน หรือกรอกข้อมูล admin@buu.ac.th
    await adminQuickBtn.click();
    await expect(page.locator('#email')).toHaveValue('admin@buu.ac.th');
    await expect(page.locator('#password')).toHaveValue('1234');

    // 3. กดปุ่มเข้าสู่ระบบ
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

    // 4. ตรวจสอบว่าเปลี่ยนเส้นทางไปยังหน้า /admin สำเร็จ
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);

    // 5. ตรวจสอบว่าไม่แสดงข้อความ error ของ Next.js error boundary
    await expect(page.getByText('เกิดข้อผิดพลาดในการโหลดข้อมูล')).not.toBeVisible();

    // 6. ตรวจสอบว่าแสดงองค์ประกอบหลักของ Admin Dashboard ครบถ้วน
    await expect(page.getByText('คำร้องลาทั้งหมด')).toBeVisible();
    await expect(page.getByText('ภาพรวมระบบ')).toBeVisible();
    await expect(page.getByText('แจ้งปัญหาระบบ').first()).toBeVisible();

    // 7. ตรวจสอบการสลับแท็บไปยังแจ้งปัญหาระบบ
    await page.getByRole('button', { name: /แจ้งปัญหาระบบ/i }).first().click();
    await expect(page).toHaveURL(/tab=tickets/);

    // 8. ตรวจสอบการสลับแท็บไปยังสำรองข้อมูล
    await page.getByRole('button', { name: /สำรองข้อมูล/i }).first().click();
    await expect(page).toHaveURL(/tab=backup/);
  });
});
