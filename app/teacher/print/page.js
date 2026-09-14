import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherCoursesAndRoster } from '@/lib/teacherData';
import PrintButton from './print-button';

export default async function TeacherPrintPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');

  const { usingMock, courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4 no-print">
        <h1 className="text-lg font-bold text-neutral-900">รายงานสรุปเวลาเรียน (สำหรับพิมพ์ / บันทึกเป็น PDF)</h1>
        <PrintButton />
      </div>

      {usingMock && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 no-print">
          กำลังแสดงข้อมูลตัวอย่าง (Mock) เนื่องจากยังไม่มีรายวิชาที่ผูกกับบัญชีอาจารย์นี้จริงในระบบ
        </p>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#7749BC] text-white flex items-center justify-center font-extrabold text-xs">BUU</div>
          <span className="font-bold text-neutral-900">e-Leave · รายงานสรุปเวลาเรียน</span>
        </div>
        <p className="text-sm text-neutral-600">อาจารย์ผู้สอน: {user.name}</p>
        <p className="text-sm text-neutral-600 mb-6">วันที่ออกรายงาน: {new Date().toLocaleDateString('th-TH')}</p>

        {courses.map((course) => {
          const rows = rosterByCourse[course.id] || [];
          return (
            <div key={course.id} className="mb-8">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                {course.code} {course.name} ({course.term}
                {course.group ? ` / กลุ่ม ${course.group}` : ''})
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200">
                    <th className="py-2 pr-3">รหัสนิสิต</th>
                    <th className="py-2 pr-3">ชื่อ-สกุล</th>
                    <th className="py-2 pr-3">เข้าเรียน</th>
                    <th className="py-2 pr-3">%</th>
                    <th className="py-2 pr-3">ลาอนุมัติ / โควต้า</th>
                    <th className="py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((s) => (
                    <tr key={s.studentId}>
                      <td className="py-2 pr-3 font-mono text-xs">{s.studentCode}</td>
                      <td className="py-2 pr-3">{s.studentName}</td>
                      <td className="py-2 pr-3">
                        {s.attended}/{s.totalSessions}
                      </td>
                      <td className="py-2 pr-3">{s.percentage}%</td>
                      <td className="py-2 pr-3">
                        {s.approvedLeaves}/{s.quotaLimit}
                      </td>
                      <td className="py-2">{s.overQuota ? 'เกินโควต้า' : 'ปกติ'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
