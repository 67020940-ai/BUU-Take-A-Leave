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
  const typeParam = searchParams.get('type'); // 'leaves' หรือค่าว่าง (attendance)

  // กรณี Export ประวัติคำร้องลาทั้งระบบสำหรับผู้ดูแลระบบ (Admin)
  if (typeParam === 'leaves' && user.role === 'admin') {
    const { listAllLeaves, getCourse, getUserById } = await import('@/lib/db');
    const rawLeaves = await listAllLeaves();
    const leaves = await Promise.all(
      rawLeaves.map(async (l) => {
        const course = await getCourse(l.courseId);
        const student = await getUserById(l.studentId);
        return {
          id: l.id,
          studentCode: student?.studentId || l.studentCode || '-',
          studentName: student?.name || l.studentName || '-',
          courseCode: course?.code || l.courseCode || '-',
          courseName: course?.name || l.courseName || '-',
          term: course?.term || l.courseTerm || '-',
          type: l.type || '-',
          startDate: l.startDate || '-',
          endDate: l.endDate || l.startDate || '-',
          status: l.status || '-',
          reason: l.reason || '-',
          teacherComment: l.teacherComment || '-',
          createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString('th-TH') : '-',
        };
      })
    );

    const filtered = termParam && termParam !== 'all'
      ? leaves.filter((l) => l.term === termParam)
      : leaves;

    if (format === 'csv') {
      const rows = [
        ['รหัสคำร้อง', 'รหัสนิสิต', 'ชื่อ-นามสกุล', 'รหัสวิชา', 'ชื่อรายวิชา', 'ภาคเรียน', 'ประเภทการลา', 'วันที่เริ่มลา', 'วันที่สิ้นสุด', 'สถานะ', 'เหตุผลการลา', 'ข้อเสนอแนะอาจารย์', 'วันที่ยื่น']
      ];
      for (const l of filtered) {
        rows.push([
          l.id,
          l.studentCode,
          l.studentName,
          l.courseCode,
          l.courseName,
          l.term,
          l.type,
          l.startDate,
          l.endDate,
          l.status,
          l.reason,
          l.teacherComment,
          l.createdAt,
        ]);
      }
      const csv = '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="buu-leaves-report.csv"',
        },
      });
    }

    // Excel for leaves
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BUU Take A Leave Admin';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('ทะเบียนคำร้องลาทั้งระบบ', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = [
      { header: 'รหัสคำร้อง', key: 'id', width: 14 },
      { header: 'รหัสนิสิต', key: 'studentCode', width: 14 },
      { header: 'ชื่อ-นามสกุล นิสิต', key: 'studentName', width: 26 },
      { header: 'รหัสวิชา', key: 'courseCode', width: 14 },
      { header: 'ชื่อรายวิชา', key: 'courseName', width: 34 },
      { header: 'ภาคเรียน', key: 'term', width: 12 },
      { header: 'ประเภทการลา', key: 'type', width: 16 },
      { header: 'วันที่เริ่มลา', key: 'startDate', width: 14 },
      { header: 'วันที่สิ้นสุด', key: 'endDate', width: 14 },
      { header: 'สถานะ', key: 'status', width: 14 },
      { header: 'เหตุผลการลา', key: 'reason', width: 32 },
      { header: 'ข้อเสนอแนะอาจารย์', key: 'teacherComment', width: 28 },
      { header: 'วันที่ยื่น', key: 'createdAt', width: 14 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7749BC' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 24;

    for (const l of filtered) {
      const row = worksheet.addRow(l);
      if (l.status === 'อนุมัติ') {
        row.getCell('status').font = { color: { argb: 'FF059669' }, bold: true };
      } else if (l.status === 'ไม่อนุมัติ') {
        row.getCell('status').font = { color: { argb: 'FFDC2626' }, bold: true };
      } else if (l.status === 'รออนุมัติ') {
        row.getCell('status').font = { color: { argb: 'FFD97706' }, bold: true };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="buu-leaves-report.xlsx"',
      },
    });
  }

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
