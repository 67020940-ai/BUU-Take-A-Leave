'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileEdit,
  CalendarDays,
  History,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  X,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function StudentHomepageView({ user, summaries = [], leaves = [] }) {
  const [semesterIndex, setSemesterIndex] = useState(0);
  const semesters = ['1/2569', '2/2568', '1/2568'];
  const currentSemester = semesters[semesterIndex];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Statistics calculation for the 4 overview boxes
  const stats = useMemo(() => {
    const total = leaves.length;
    const approved = leaves.filter((l) => l.status === 'อนุมัติ').length;
    const pending = leaves.filter((l) => l.status === 'รออนุมัติ').length;
    const rejected = leaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
    return { total, approved, pending, rejected };
  }, [leaves]);

  // Weekly Timetable Data matching user's schedule with IDs
  const timetableSchedule = [
    {
      dayEn: 'Monday',
      dayTh: 'จันทร์',
      dayColor: 'border-l-4 border-l-amber-400',
      slots: [
        {
          id: 'mock-sc1',
          start: '09:00',
          end: '11:50',
          colSpan: 3, // 9:00-10:00, 10:00-11:00, 11:00-12:00
          code: '24527664-64, 2',
          fullCode: '24527664',
          name: 'การวิเคราะห์และออกแบบระบบสารสนเทศ',
          group: '2',
          room: 'QS2-701',
          timeStr: '(09:00-11:50)',
          teacher: 'ผศ.ดร.อัครา',
        },
        { isBreak: true, colSpan: 1 }, // 12:00-13:00
        {
          id: 'mock-sc2',
          start: '13:00',
          end: '16:50',
          colSpan: 4, // 13:00-14:00, 14:00-15:00, 15:00-16:00, 16:00-17:00
          code: '24537364-64, 2',
          fullCode: '24537364',
          name: 'ระบบห้องสมุดอัตโนมัติ',
          group: '2',
          room: 'QS2-407',
          timeStr: '(13:00-16:50)',
          teacher: 'ผศ.ดร.ปรียานุช',
        },
        { isEmpty: true, colSpan: 3 }, // 17:00-18:00, 18:00-19:00, 19:00-20:00
      ],
    },
    {
      dayEn: 'Tuesday',
      dayTh: 'อังคาร',
      dayColor: 'border-l-4 border-l-pink-400',
      slots: [
        { isEmpty: true, colSpan: 8 }, // 9:00-17:00
        {
          id: 'mock-sc3',
          start: '17:00',
          end: '19:50',
          colSpan: 3, // 17:00-18:00, 18:00-19:00, 19:00-20:00
          code: '24527364-64, 2',
          fullCode: '24527364',
          name: 'การสื่อสารข้อมูลและเครือข่ายคอมพิวเตอร์',
          group: '2',
          room: 'QS2-415',
          timeStr: '(17:00-19:50)',
          teacher: 'ผศ.ดร.ฉัชพน',
        },
      ],
    },
    {
      dayEn: 'Wednesday',
      dayTh: 'พุธ',
      dayColor: 'border-l-4 border-l-emerald-400',
      slots: [
        { isEmpty: true, colSpan: 11, label: 'ไม่มีการเรียนการสอนในวันนี้' },
      ],
    },
    {
      dayEn: 'Thursday',
      dayTh: 'พฤหัสบดี',
      dayColor: 'border-l-4 border-l-orange-400',
      slots: [
        { isEmpty: true, colSpan: 7 }, // 9:00-16:00
        {
          id: 'mock-sc4',
          start: '16:00',
          end: '18:50',
          colSpan: 3, // 16:00-17:00, 17:00-18:00, 18:00-19:00
          code: '24535164-64, 2',
          fullCode: '24535164',
          name: 'การจัดการทรัพยากรสารสนเทศ',
          group: '2',
          room: 'QS2-415',
          timeStr: '(16:00-18:50)',
          teacher: 'อ.สมฤทัย',
        },
        { isEmpty: true, colSpan: 1 }, // 19:00-20:00
      ],
    },
    {
      dayEn: 'Friday',
      dayTh: 'ศุกร์',
      dayColor: 'border-l-4 border-l-sky-400',
      slots: [
        {
          id: 'mock-sc5',
          start: '09:00',
          end: '11:50',
          colSpan: 3, // 9:00-10:00, 10:00-11:00, 11:00-12:00
          code: '24531264-64, 1',
          fullCode: '24531264',
          name: 'พฤติกรรมสารสนเทศและผู้ใช้สารสนเทศ',
          group: '1',
          room: 'QS2-415',
          timeStr: '(09:00-11:50)',
          teacher: 'อ.สมฤทัย',
        },
        { isBreak: true, colSpan: 1 }, // 12:00-13:00
        {
          id: 'mock-sc6',
          start: '13:00',
          end: '15:50',
          colSpan: 3, // 13:00-14:00, 14:00-15:00, 15:00-16:00
          code: '89539764-64, 8',
          fullCode: '89539764',
          name: 'การเป็นผู้ประกอบการในศตวรรษที่ 21',
          group: '8',
          room: 'BBS-204',
          timeStr: '(13:00-15:50)',
          teacher: 'ผศ.ดร.วรรณประภา',
        },
        { isEmpty: true, colSpan: 4 }, // 16:00-20:00
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-slate-950 font-sans text-neutral-800 dark:text-neutral-100">
      {/* ================= TOP NAVBAR ================= */}
      <Header
        user={{
          name: user?.name,
          role: user?.role || 'student',
          email: user?.email,
          faculty: user?.faculty || 'วิทยาการสารสนเทศ',
          major: user?.major || 'เทคโนโลยีสารสนเทศ',
        }}
        semester={currentSemester}
      />

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ================= TOP CONTROLS: SEMESTER & SEARCH BAR ================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Semester Selector */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-200">
              ภาคเรียนที่
            </span>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
              <button
                onClick={() => setSemesterIndex((prev) => (prev > 0 ? prev - 1 : semesters.length - 1))}
                className="p-1 text-neutral-400 hover:text-[#7749BC] transition-colors cursor-pointer"
                title="ภาคเรียนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-[#7749BC] dark:text-purple-300 px-2 font-mono">
                {currentSemester}
              </span>
              <button
                onClick={() => setSemesterIndex((prev) => (prev < semesters.length - 1 ? prev + 1 : 0))}
                className="p-1 text-neutral-400 hover:text-[#7749BC] transition-colors cursor-pointer"
                title="ภาคเรียนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Purple Pill Search Bar */}
          <div className="w-full md:max-w-lg relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารายวิชา, รหัสวิชา, ห้องเรียน, หรือผู้สอน..."
              className="w-full py-2.5 pl-5 pr-11 rounded-full bg-[#D4C2EC]/70 dark:bg-purple-950/40 border border-[#B79EE2] dark:border-purple-800/80 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-600/80 dark:placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/30 shadow-inner"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-600 dark:text-purple-300">
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* ================= 4 STATUS SUMMARY CARDS IN 1 ROW (MINIMAL & CLEAN) ================= */}
        <section className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl sm:rounded-[28px] border border-neutral-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200/80 dark:divide-slate-800">
            {/* Box 1: Total Leaves */}
            <div className="p-5 sm:p-6 flex flex-col justify-center space-y-1.5 transition-colors hover:bg-neutral-50/50 dark:hover:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7749BC]" />
                <h3 className="font-sans text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 select-none">
                  คำร้องขอลาทั้งหมด :
                </h3>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#7749BC] dark:text-purple-400 font-sans tracking-tight">
                  {stats.total}
                </span>
                <span className="text-xs text-neutral-400 font-medium">ครั้ง</span>
              </div>
            </div>

            {/* Box 2: Approved */}
            <div className="p-5 sm:p-6 flex flex-col justify-center space-y-1.5 transition-colors hover:bg-neutral-50/50 dark:hover:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-sans text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 select-none">
                  อนุมัติ :
                </h3>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sans tracking-tight">
                  {stats.approved}
                </span>
                <span className="text-xs text-neutral-400 font-medium">ครั้ง</span>
              </div>
            </div>

            {/* Box 3: Pending */}
            <div className="p-5 sm:p-6 flex flex-col justify-center space-y-1.5 transition-colors hover:bg-neutral-50/50 dark:hover:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-sans text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400 select-none">
                  รออนุมัติ :
                </h3>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-sans tracking-tight">
                  {stats.pending}
                </span>
                <span className="text-xs text-neutral-400 font-medium">ครั้ง</span>
              </div>
            </div>

            {/* Box 4: Rejected */}
            <div className="p-5 sm:p-6 flex flex-col justify-center space-y-1.5 transition-colors hover:bg-neutral-50/50 dark:hover:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="font-sans text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400 select-none">
                  ไม่อนุมัติ :
                </h3>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-rose-600 dark:text-rose-400 font-sans tracking-tight">
                  {stats.rejected}
                </span>
                <span className="text-xs text-neutral-400 font-medium">ครั้ง</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MAIN WEEKLY TIMETABLE GRID (CLEAN MINIMAL TYPOGRAPHY) ================= */}
        <section className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl sm:rounded-[28px] border border-neutral-200/90 dark:border-slate-800 shadow-sm overflow-hidden space-y-2">
          {/* Timetable Header / Title Bar */}
          <div className="px-6 py-4 border-b border-neutral-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-[#7749BC]" />
              <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 font-sans">
                ตารางเรียนประจำสัปดาห์ (Weekly Timetable)
              </h2>
            </div>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
              คลิกที่รายวิชาเพื่อยื่นคำขอลาเรียนวิชานั้นโดยตรง
            </span>
          </div>

          {/* Grid Table Container */}
          <div className="overflow-x-auto p-3 sm:p-5">
            <table className="w-full border-collapse min-w-[1050px] text-xs text-center select-none font-sans">
              {/* Table Column Headers */}
              <thead>
                <tr className="bg-slate-700 dark:bg-slate-800 text-white font-semibold border-b border-neutral-300 dark:border-slate-700">
                  <th className="py-3 px-3 w-28 text-center border-r border-slate-600 dark:border-slate-700 text-xs font-semibold tracking-wide">
                    Date / Time
                  </th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">9:00-10:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">10:00-11:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">11:00-12:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium bg-slate-800/80">12:00-13:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">13:00-14:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">14:00-15:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">15:00-16:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">16:00-17:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">17:00-18:00</th>
                  <th className="py-3 px-2 border-r border-slate-600 dark:border-slate-700 text-[11px] font-medium">18:00-19:00</th>
                  <th className="py-3 px-2 text-[11px] font-medium">19:00-20:00</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {timetableSchedule.map((row) => (
                  <tr key={row.dayEn} className="h-24 hover:bg-neutral-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Day Column Header (Clean modern sans-serif typography) */}
                    <td className={`bg-slate-100/80 dark:bg-slate-800/60 font-sans border-r border-neutral-200 dark:border-slate-800 p-2.5 ${row.dayColor || ''}`}>
                      <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {row.dayEn}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                        วัน{row.dayTh}
                      </div>
                    </td>

                    {/* Slots in Day */}
                    {row.slots.map((slot, sIdx) => {
                      if (slot.isEmpty) {
                        return (
                          <td
                            key={sIdx}
                            colSpan={slot.colSpan}
                            className="border-r border-neutral-200 dark:border-slate-800/60 bg-neutral-50/20 dark:bg-slate-900/10 text-neutral-300 dark:text-slate-700 text-[10px]"
                          >
                            {slot.label || ''}
                          </td>
                        );
                      }

                      if (slot.isBreak) {
                        return (
                          <td
                            key={sIdx}
                            colSpan={slot.colSpan}
                            className="border-r border-neutral-200 dark:border-slate-800/60 bg-neutral-100/60 dark:bg-slate-800/40 text-neutral-400 text-[11px] font-medium"
                          >
                            พักกลางวัน
                          </td>
                        );
                      }

                      // Active Course Slot Box with soft purple highlight
                      return (
                        <td
                          key={sIdx}
                          colSpan={slot.colSpan}
                          className="p-1.5 border-r border-neutral-200 dark:border-slate-800 align-middle"
                        >
                          <div
                            onClick={() => setSelectedCourse(slot)}
                            className="w-full h-full min-h-[76px] rounded-2xl bg-[#C8B8E8]/70 dark:bg-purple-950/70 hover:bg-[#BCA9E4] dark:hover:bg-purple-900/80 border border-[#A790D6]/60 dark:border-purple-700 p-2.5 flex flex-col items-center justify-center cursor-pointer shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group relative"
                            title="คลิกเพื่อดูรายละเอียดและยื่นใบลาวิชานี้"
                          >
                            <span className="font-bold text-xs text-[#1E40AF] dark:text-sky-300 group-hover:underline underline-offset-2">
                              {slot.code}
                            </span>
                            <span className="font-bold text-[11px] text-neutral-900 dark:text-neutral-100 mt-0.5">
                              {slot.room}
                            </span>
                            <span className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono">
                              {slot.timeStr}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timetable Footer Note */}
          <div className="px-6 py-3 bg-neutral-50/80 dark:bg-slate-800/50 border-t border-neutral-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#C8B8E8] border border-[#A790D6]" />
              <span>รายวิชาที่ลงทะเบียนในภาคเรียนที่ {currentSemester} (รวม 6 รายวิชา)</span>
            </div>
            <Link
              href="/student/leave"
              className="text-[#7749BC] dark:text-purple-300 font-bold hover:underline flex items-center gap-1"
            >
              <span>ไปที่หน้ายื่นใบลา</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ================= MODAL: COURSE DETAIL & DEDICATED LEAVE ACTION ================= */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300">
                  {selectedCourse.fullCode} (กลุ่ม {selectedCourse.group})
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                  {selectedCourse.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <Clock className="w-4 h-4 text-[#7749BC]" />
                <span className="font-semibold">เวลาเรียน:</span>
                <span>{selectedCourse.timeStr}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold">ห้องเรียน:</span>
                <span>{selectedCourse.room}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <User className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold">อาจารย์ผู้สอน:</span>
                <span>{selectedCourse.teacher}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                ปิด
              </button>
              <Link
                href={`/student/leave?courseId=${selectedCourse.id || ''}&courseCode=${selectedCourse.fullCode}`}
                className="px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>ยื่นใบลาวิชานี้ (ตามตารางเรียน)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer role={user?.role || 'student'} />
    </div>
  );
}
