'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  BookOpen,
  FileEdit,
  X,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const TIME_SLOTS = [
  { label: '9:00 - 10:00', startH: 9, endH: 10 },
  { label: '10:00 - 11:00', startH: 10, endH: 11 },
  { label: '11:00 - 12:00', startH: 11, endH: 12 },
  { label: '12:00 - 13:00', startH: 12, endH: 13 },
  { label: '13:00 - 14:00', startH: 13, endH: 14 },
  { label: '14:00 - 15:00', startH: 14, endH: 15 },
  { label: '15:00 - 16:00', startH: 15, endH: 16 },
  { label: '16:00 - 17:00', startH: 16, endH: 17 },
  { label: '17:00 - 18:00', startH: 17, endH: 18 },
  { label: '18:00 - 19:00', startH: 18, endH: 19 },
  { label: '19:00 - 20:00', startH: 19, endH: 20 },
];

const DAYS = [
  { key: 'MO', dayEn: 'Monday', dayTh: 'วันจันทร์', bgHeader: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { key: 'TU', dayEn: 'Tuesday', dayTh: 'วันอังคาร', bgHeader: 'bg-pink-500/10 text-pink-700 dark:text-pink-300' },
  { key: 'WE', dayEn: 'Wednesday', dayTh: 'วันพุธ', bgHeader: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { key: 'TH', dayEn: 'Thursday', dayTh: 'วันพฤหัสบดี', bgHeader: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
  { key: 'FR', dayEn: 'Friday', dayTh: 'วันศุกร์', bgHeader: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
];

export default function StudentScheduleGrid({
  summaries = [],
  semester = '1/2569',
  searchQuery = '',
}) {
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Normalize courses from summaries
  const parsedCourses = useMemo(() => {
    return summaries
      .map((s) => {
        const c = s.course || s;
        if (!c) return null;

        // Parse day code (e.g. MO, TU, Monday, วันจันทร์)
        let dayKey = 'MO';
        const rawDay = String(c.day || '').trim().toUpperCase();
        if (rawDay.includes('MO') || rawDay.includes('MON') || rawDay.includes('จันทร์')) dayKey = 'MO';
        else if (rawDay.includes('TU') || rawDay.includes('TUE') || rawDay.includes('อังคาร')) dayKey = 'TU';
        else if (rawDay.includes('WE') || rawDay.includes('WED') || rawDay.includes('พุธ')) dayKey = 'WE';
        else if (rawDay.includes('TH') || rawDay.includes('THU') || rawDay.includes('พฤหัส')) dayKey = 'TH';
        else if (rawDay.includes('FR') || rawDay.includes('FRI') || rawDay.includes('ศุกร์')) dayKey = 'FR';

        // Parse time: e.g. "09:00-11:50" or "13:00 - 16:50"
        let startH = 9;
        let endH = 12;
        if (c.time && c.time.includes('-')) {
          const [startStr, endStr] = c.time.split('-');
          const sh = parseInt(startStr.trim().split(':')[0], 10);
          const eh = parseInt(endStr.trim().split(':')[0], 10);
          const em = parseInt(endStr.trim().split(':')[1] || '0', 10);
          if (!isNaN(sh)) startH = sh;
          if (!isNaN(eh)) endH = em > 0 ? eh + 1 : eh;
        }

        const startSlot = Math.max(0, Math.min(TIME_SLOTS.length - 1, startH - 9));
        const endSlot = Math.max(startSlot + 1, Math.min(TIME_SLOTS.length, endH - 9));
        const slotSpan = endSlot - startSlot;

        const isMatch =
          !searchQuery ||
          [c.code, c.name, c.room, c.teacherName || c.teacher?.name].some(
            (field) => field && String(field).toLowerCase().includes(searchQuery.toLowerCase())
          );

        return {
          id: c.id || `${c.code}-${c.group}`,
          code: c.code,
          name: c.name,
          group: c.group || '1',
          room: c.room || 'ไม่ระบุห้อง',
          time: c.time || '09:00 - 12:00',
          teacherName: c.teacherName || c.teacher?.name || 'อาจารย์ผู้สอน',
          dayKey,
          startSlot,
          slotSpan,
          isMatch,
          attendance: s.percent !== undefined ? s.percent : 100,
          attended: s.attended !== undefined ? s.attended : 15,
          total: s.total || 15,
          leaves: s.leaves || 0,
        };
      })
      .filter(Boolean);
  }, [summaries, searchQuery]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Schedule Header Title */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/60 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
              ตารางเรียน (Class Schedule)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ตารางเรียนและห้องเรียนประจำสัปดาห์ ภาคเรียนที่ {semester}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="w-3 h-3 rounded-md bg-[#DDD6FE] dark:bg-purple-900/80 border border-purple-300 dark:border-purple-700" />
          <span className="hidden sm:inline">วิชาที่ลงทะเบียนเรียน</span>
        </div>
      </div>

      {/* Grid Container (Scrollable on small devices) */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px] p-4">
          {/* Header Row: Days label + Time Slots */}
          <div className="grid grid-cols-12 gap-1.5 mb-2 text-center text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <div className="col-span-1 py-1.5 bg-neutral-100/70 dark:bg-slate-800/50 rounded-xl flex items-center justify-center font-bold">
              วัน
            </div>
            {TIME_SLOTS.map((t, idx) => (
              <div
                key={idx}
                className="col-span-1 py-1.5 bg-neutral-100/70 dark:bg-slate-800/50 rounded-xl text-[11px] truncate px-0.5"
                title={t.label}
              >
                {t.label.split(' - ')[0]}
              </div>
            ))}
          </div>

          {/* Schedule Body: Monday through Friday */}
          <div className="space-y-2">
            {DAYS.map((day) => {
              const dayCourses = parsedCourses.filter((c) => c.dayKey === day.key);

              return (
                <div
                  key={day.key}
                  className="grid grid-cols-12 gap-1.5 min-h-[72px] items-stretch p-1 rounded-2xl bg-neutral-50/40 dark:bg-slate-900/40 border border-neutral-100 dark:border-slate-800/60"
                >
                  {/* Day Label Column */}
                  <div
                    className={`col-span-1 flex flex-col items-center justify-center rounded-xl p-2 font-bold text-xs ${day.bgHeader}`}
                  >
                    <span className="tracking-tight">{day.dayEn.slice(0, 3)}</span>
                    <span className="text-[10px] opacity-75 font-normal">{day.dayTh.replace('วัน', '')}</span>
                  </div>

                  {/* 11 Time Slots */}
                  <div className="col-span-11 relative grid grid-cols-11 gap-1.5 min-h-[64px]">
                    {/* Background Grid Cells */}
                    {TIME_SLOTS.map((_, sIdx) => (
                      <div
                        key={sIdx}
                        className="border border-dashed border-neutral-200/50 dark:border-slate-800/60 rounded-xl h-full min-h-[64px]"
                      />
                    ))}

                    {/* Render Courses positioned absolute/grid */}
                    {dayCourses.map((c) => {
                      // Calculate percentage placement
                      const leftPercent = (c.startSlot / 11) * 100;
                      const widthPercent = (c.slotSpan / 11) * 100;

                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCourse(c)}
                          style={{
                            left: `${leftPercent}%`,
                            width: `calc(${widthPercent}% - 4px)`,
                          }}
                          className={`absolute top-1 bottom-1 p-2 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md hover:scale-[1.01] ${
                            c.isMatch
                              ? 'bg-[#DDD6FE] dark:bg-purple-900/90 border border-purple-300 dark:border-purple-600 text-neutral-900 dark:text-neutral-100 ring-2 ring-[#7749BC]/30'
                              : 'bg-neutral-200/60 dark:bg-slate-800/60 border border-neutral-300 dark:border-slate-700 opacity-40 text-neutral-600'
                          }`}
                          title={`${c.code} ${c.name} (${c.room})`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-[11px] leading-tight font-mono truncate">
                                {c.code}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/70 font-bold shrink-0">
                                กลุ่ม {c.group}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold truncate mt-0.5 leading-snug">
                              {c.name}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-neutral-700 dark:text-neutral-300 pt-0.5 border-t border-purple-300/60 dark:border-purple-700/60">
                            <span className="flex items-center gap-1 font-semibold truncate">
                              <MapPin className="w-3 h-3 shrink-0 text-[#7749BC] dark:text-purple-300" />
                              <span className="truncate">{c.room}</span>
                            </span>
                            <span className="font-mono text-[9px] shrink-0 opacity-80">
                              {c.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Class Detail Modal Popover */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-sm font-mono shrink-0 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#7749BC] dark:text-purple-400">
                      {selectedCourse.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300">
                      กลุ่ม {selectedCourse.group}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {selectedCourse.name}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Course Information Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/50 border border-neutral-100 dark:border-slate-800">
                <span className="text-neutral-400 flex items-center gap-1.5 text-[11px]">
                  <User className="w-3.5 h-3.5 text-[#7749BC]" /> อาจารย์ผู้สอน
                </span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                  {selectedCourse.teacherName}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/50 border border-neutral-100 dark:border-slate-800">
                <span className="text-neutral-400 flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[#7749BC]" /> ห้องเรียน
                </span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate font-mono">
                  {selectedCourse.room}
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/50 border border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-neutral-400 flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#7749BC]" /> เวลาเรียน
                  </span>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-1 font-mono">
                    {selectedCourse.time}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 text-[11px]">เวลาเรียนสะสม</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {selectedCourse.attendance}% ({selectedCourse.attended}/{selectedCourse.total} คาบ)
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <Link
                href={`/student/leave?courseId=${selectedCourse.id}&code=${selectedCourse.code}`}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                onClick={() => setSelectedCourse(null)}
              >
                <FileEdit className="w-4 h-4" />
                <span>ยื่นใบลาสำหรับวิชานี้</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="py-2.5 px-4 rounded-2xl border border-neutral-200 dark:border-slate-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
