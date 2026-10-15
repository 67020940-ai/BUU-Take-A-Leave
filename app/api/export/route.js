import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherCoursesAndRoster } from '@/lib/teacherData';
import ExcelJS from 'exceljs';

function csvEscape(value) {
  let s = String(value ?? '');
  // กัน CSV/Formula injection เวลาเปิดไฟล์ด้วย Excel (ค่าที่ขึ้นต้นด้วย = + - @ อาจถูกตีความเป็นสูตร)
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return NextResponse.json({ error: 'เฉพาะอาจารย์หรือผู้ดูแลระบบเท่านั้น' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get('format') || 'xlsx').toLowerCase();
  const termParam = searchParams.get('term');

  let { courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);

  if (termParam && termParam !== 'all') {
    courses = courses.filter((c) => c.term === termParam);
  }

  // If CSV requested
  if (format === 'csv') {
    const rows = [
      ['รหัสวิชา', 'รายวิชา', 'กลุ่มเรียน', 'รหัสนิสิต', 'ชื่อนิสิต', 'จำนวนครั้งเรียนทั้งหมด', 'จำนวนครั้งที่ลา(อนุมัติ)', 'เข้าเรียน', 'คิดเป็น %', 'เกินโควต้า']
    ];

    for (const course of courses) {
      for (const s of rosterByCourse[course.id] || []) {
        rows.push([
          course.code,
          course.name,
          course.group || '01',
          s.studentCode,
          s.studentName,
          s.totalSessions,
          s.approvedLeaves,
          s.attended,
          s.percentage,
          s.overQuota ? 'ใช่' : 'ไม่',
        ]);
      }
    }

    const csv = '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="attendance-report.csv"',
      },
    });
  }

  // Default: ExcelJS (.xlsx)
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BUU Take A Leave';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('รายงานเวลาเรียนและการลา', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: 'รหัสวิชา', key: 'code', width: 14 },
    { header: 'ชื่อรายวิชา', key: 'courseName', width: 36 },
    { header: 'กลุ่ม', key: 'group', width: 8 },
    { header: 'ภาคเรียน', key: 'term', width: 10 },
    { header: 'รหัสนิสิต', key: 'studentCode', width: 14 },
    { header: 'ชื่อ-นามสกุล นิสิต', key: 'studentName', width: 28 },
    { header: 'คาบเรียนทั้งหมด', key: 'total', width: 16 },
    { header: 'ลา (อนุมัติ)', key: 'leaves', width: 14 },
    { header: 'เข้าเรียน', key: 'attended', width: 12 },
    { header: 'เวลาเรียน (%)', key: 'percentage', width: 14 },
    { header: 'สถานะโควต้า', key: 'quotaStatus', width: 18 },
  ];

  // Header style with BUU Purple (#7749BC)
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7749BC' } };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 24;

  for (const course of courses) {
    for (const s of rosterByCourse[course.id] || []) {
      const row = worksheet.addRow({
        code: course.code,
        courseName: course.name,
        group: course.group || '01',
        term: course.term || '1/2569',
        studentCode: s.studentCode || '-',
        studentName: s.studentName || '-',
        total: s.totalSessions || 15,
        leaves: s.approvedLeaves || 0,
        attended: s.attended || 15,
        percentage: `${s.percentage || 100}%`,
        quotaStatus: s.overQuota ? 'หมดสิทธิ์สอบ (เกิน 20%)' : 'ปกติ (มีสิทธิ์สอบ)',
      });

      // Highlight over-quota in soft red
      if (s.overQuota) {
        row.getCell('quotaStatus').font = { bold: true, color: { argb: 'FFDC2626' } };
      } else {
        row.getCell('quotaStatus').font = { color: { argb: 'FF059669' } };
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="buu-attendance-report.xlsx"',
    },
  });
}
