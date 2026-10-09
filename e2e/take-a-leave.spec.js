import { test, expect } from '@playwright/test';

test.describe('BUU Take A Leave - Student Leave Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. เข้าสู่ระบบด้วยบัญชีนิสิต
    await page.goto('/login');
    await page.fill('#email', '66000001@go.buu.ac.th');
    await page.fill('#password', '1234');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

    // ตรวจสอบว่าเข้าสู่ระบบสำเร็จและมาที่หน้า /student
    await expect(page).toHaveURL(/\/student/);
  });

  test('ควรสามารถยื่นคำขอลาเรียน (Take a leave) ได้สำเร็จ', async ({ page }) => {
    // 2. ไปยังหน้ายื่นคำขอลาเรียน
    await page.goto('/student/leave');
    await expect(page).toHaveURL(/tab=leave/);

    // ตรวจสอบหัวข้อแบบฟอร์มยื่นคำขอลาเรียน
    await expect(page.getByText('ยื่นคำขอลาเรียน (Leave Application)')).toBeVisible();

    // 3. เลือกประเภทการลา (ลาป่วย)
    const sickLeaveBtn = page.getByRole('button', { name: 'ลาป่วย' });
    await sickLeaveBtn.click();

    // 4. กรอกเหตุผลการลา
    const reasonInput = page.getByPlaceholder(/ระบุเหตุผลการลา/i);
    await reasonInput.fill('มีอาการไข้หวัด เจ็บคอ และมีไข้สูง ขอลาพักรักษาตัวตามแพทย์สั่ง');

    // 5. กำหนดวันที่เริ่มลาและสิ้นสุด
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    await startDateInput.fill(dateStr);
    await endDateInput.fill(dateStr);

    // 6. กดปุ่มส่งใบลา
    const submitBtn = page.getByRole('button', { name: /ส่งใบลา/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 7. ตรวจสอบข้อความแจ้งเตือนความสำเร็จ และการเปลี่ยนหน้าไปยังประวัติการลา
    await expect(page.getByText(/ส่งใบลาเรียบร้อยแล้ว/i)).toBeVisible();
    await page.waitForURL(/tab=history/, { timeout: 10000 });
    await expect(page.getByText(/ประวัติการลา/i).first()).toBeVisible();
  });

  test('ควรแสดงข้อความเตือนเมื่อไม่ได้กรอกข้อมูลที่จำเป็น', async ({ page }) => {
    await page.goto('/student/leave');
    await expect(page).toHaveURL(/tab=leave/);

    // กดปุ่มส่งใบลาทันทีโดยไม่กรอกข้อมูล
    const submitBtn = page.getByRole('button', { name: /ส่งใบลา/i });
    await submitBtn.click();

    // ตรวจสอบข้อความแจ้งเตือนข้อผิดพลาด
    await expect(
      page.getByText(/กรุณากรอกข้อมูลในช่องที่มีเครื่องหมายดอกจัน/i)
    ).toBeVisible();
  });
});
