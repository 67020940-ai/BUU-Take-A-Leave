'use client';

import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Users, BookOpen, Info, ExternalLink } from 'lucide-react';

const TIME_SLOTS = [
  '9:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
];

const DAYS = [
  { key: 'Monday', label: 'Monday', th: 'วันจันทร์', bgHeader: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },
  { key: 'Tuesday', label: 'Tuesday', th: 'วันอังคาร', bgHeader: 'bg-pink-500/15 text-pink-800 dark:text-pink-300' },
  { key: 'Wednesday', label: 'Wednesday', th: 'วันพุธ', bgHeader: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' },
  { key: 'Thursday', label: 'Thursday', th: 'วันพฤหัสบดี', bgHeader: 'bg-orange-500/15 text-orange-800 dark:text-orange-300' },
  { key: 'Friday', label: 'Friday', th: 'วันศุกร์', bgHeader: 'bg-sky-500/15 text-sky-800 dark:text-sky-300' },
];

const COURSE_THEMES = {
  purple: {
    card: 'bg-purple-100/90 hover:bg-purple-200/90 dark:bg-purple-950/70 dark:hover:bg-purple-900/80 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100',
    title: 'text-purple-950 dark:text-purple-100',
    room: 'text-purple-900 dark:text-purple-200',
    time: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-50 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dot: 'bg-[#7749BC]',
  },
  emerald: {
    card: 'bg-emerald-100/90 hover:bg-emerald-200/90 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100',
    title: 'text-emerald-950 dark:text-emerald-100',
    room: 'text-emerald-900 dark:text-emerald-200',
    time: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-600',
  },
  sky: {
    card: 'bg-sky-100/90 hover:bg-sky-200/90 dark:bg-sky-950/70 dark:hover:bg-sky-900/80 border-sky-300 dark:border-sky-700 text-sky-950 dark:text-sky-100',
    title: 'text-sky-950 dark:text-sky-100',
    room: 'text-sky-900 dark:text-sky-200',
    time: 'text-sky-700 dark:text-sky-300',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-600',
  },
  amber: {
    card: 'bg-amber-100/90 hover:bg-amber-200/90 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100',
    title: 'text-amber-950 dark:text-amber-100',
    room: 'text-amber-900 dark:text-amber-200',
    time: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-600',
  },
  rose: {
    card: 'bg-rose-100/90 hover:bg-rose-200/90 dark:bg-rose-950/70 dark:hover:bg-rose-900/80 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100',
    title: 'text-rose-950 dark:text-rose-100',
    room: 'text-rose-900 dark:text-rose-200',
    time: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-600',
  },
};

function getCourseTheme(item) {
  if (!item) return COURSE_THEMES.purple;
  const str = `${item.code || ''} ${item.name || ''}`.toLowerCase();
  if (str.includes('24527664') || str.includes('วิเคราะห์') || str.includes('sa')) {
    return COURSE_THEMES.purple;
  }
  if (str.includes('24527564') || str.includes('โอเพนซอร์ส') || str.includes('oss')) {
    return COURSE_THEMES.emerald;
  }
  if (str.includes('24510164') || str.includes('สารสนเทศเบื้องต้น') || str.includes('oa')) {
    return COURSE_THEMES.sky;
  }
  if (str.includes('24538164') || str.includes('ฐานข้อมูล') || str.includes('db')) {
    return COURSE_THEMES.amber;
  }
  const keys = ['purple', 'emerald', 'sky', 'amber', 'rose'];
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum = (sum + str.charCodeAt(i)) % keys.length;
  return COURSE_THEMES[keys[sum]];
}

// Default classes matching wireframe S__3366938_0.jpg
const SCHEDULE_ITEMS = [
  {
    day: 'Monday',
    startSlot: 0, // 9:00
    slotSpan: 3,  // 9:00 - 12:00 (9:00-11:50)
    code: '24527664-64, 2',
    name: 'การวิเคราะห์และออกแบบระบบสารสนเทศ (SA) กลุ่ม 02',
    room: 'QS2-701',
    time: '(09:00 - 11:50)',
    color: 'purple',
    studentCount: 36,
  },
  {
    day: 'Tuesday',
    startSlot: 4, // 13:00
    slotSpan: 4,  // 13:00 - 17:00 (13:00-16:50)
    code: '24527564-64, 1',
    name: 'การประยุกต์โปรแกรมโอเพนซอร์ส (OSS) กลุ่ม 01',
    room: 'QS2-407',
    time: '(13:00 - 16:50)',
    color: 'purple',
    studentCount: 41,
  },
  {
    day: 'Thursday',
    startSlot: 0, // 9:00
    slotSpan: 3,  // 9:00 - 12:00
    code: '24527664-64, 1',
    name: 'การวิเคราะห์และออกแบบระบบสารสนเทศ (SA) กลุ่ม 01',
    room: 'QS2-701',
    time: '(09:00 - 11:50)',
    color: 'purple',
    studentCount: 39,
  },
  {
    day: 'Friday',
    startSlot: 4, // 13:00
    slotSpan: 3,  // 13:00 - 16:00
    code: '24527564-64, 2',
    name: 'การประยุกต์โปรแกรมโอเพนซอร์ส (OSS) กลุ่ม 02',
    room: 'QS2-407',
    time: '(13:00 - 15:50)',
    color: 'purple',
    studentCount: 33,
  },
];

export default function TeacherScheduleGrid({ courses = [], customItems = null, onSelectCourse }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [mobileSelectedDay, setMobileSelectedDay] = useState(() => {
    const dayNum = new Date().getDay();
    const dayMap = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
    return dayMap[dayNum] || 'Monday';
  });
  const scheduleList = customItems || SCHEDULE_ITEMS;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Schedule Header Title */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-neutral-50/60 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
              ตารางสอน (Teaching Schedule)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ตารางเรียนและห้องสอนประจำสัปดาห์ ภาคเรียนที่ 1/2569
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-purple-200 dark:bg-purple-900/80 border border-purple-300 dark:border-purple-700" />
            <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">24527664 (SA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-200 dark:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700" />
            <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">24527564 (OSS)</span>
          </div>
        </div>
      </div>

      {/* 1. Mobile Day-by-Day View (< md) */}
      <div className="block md:hidden p-4 space-y-4">
        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
          {DAYS.map((day) => {
            const isActive = mobileSelectedDay === day.key;
            const count = scheduleList.filter((item) => item.day === day.key).length;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setMobileSelectedDay(day.key)}
                className={`flex-1 min-w-[62px] py-2 px-1 rounded-xl text-center text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#7749BC] text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <p className="text-[11px] leading-tight font-bold">{day.th.replace('วัน', '')}</p>
                <span
                  className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-neutral-200/80 dark:bg-slate-700 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {count} คาบ
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Class Cards */}
        {(() => {
          const mobileDayClasses = scheduleList.filter((item) => item.day === mobileSelectedDay);
          if (mobileDayClasses.length === 0) {
            return (
              <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-900/50 space-y-1">
                <CalendarDays className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  ไม่มีตารางสอนในวันนี้
                </p>
                <p className="text-[11px] text-neutral-400">
                  คุณสามารถเลือกดูวันอื่นได้จากแถบเมนูด้านบน
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {mobileDayClasses.map((item, idx) => {
                const theme = getCourseTheme(item);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedItem(item)}
                    className="p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-800/80 bg-purple-50/30 dark:bg-slate-900 shadow-2xs space-y-3 cursor-pointer active:scale-98 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-black text-sm text-[#7749BC] dark:text-purple-300">
                          {item.code}
                        </span>
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white mt-1">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 shrink-0">
                        {item.studentCount} คน
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#7749BC] shrink-0" />
                        <span>{item.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#7749BC] shrink-0" />
                        <span>ห้อง {item.room}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-100 dark:border-slate-800 flex justify-end">
                      <span className="text-[11px] font-bold text-[#7749BC] dark:text-purple-300">
                        แตะเพื่อดูรายละเอียดแผนการสอน &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* 2. Desktop & Tablet Full Time Grid (>= md) */}
      <div className="hidden md:block overflow-x-auto p-4 sm:p-6">
        <div className="min-w-[840px] border border-neutral-200/90 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
          {/* Header Row: Date / Time + 8 Time Slots */}
          <div className="grid grid-cols-9 bg-neutral-100/80 dark:bg-slate-800/80 border-b border-neutral-200/90 dark:border-slate-700/80 text-center font-bold text-xs text-neutral-700 dark:text-neutral-200">
            <div className="p-3 border-r border-neutral-200/80 dark:border-slate-700 font-sans tracking-wide">
              Date / Time
            </div>
            {TIME_SLOTS.map((slot, idx) => (
              <div
                key={slot}
                className={`p-3 text-[11px] font-mono tracking-tight font-medium ${
                  idx < TIME_SLOTS.length - 1 ? 'border-r border-neutral-200/80 dark:border-slate-700' : ''
                }`}
              >
                {slot}
              </div>
            ))}
          </div>

          {/* Day Rows: Monday to Friday */}
          {DAYS.map((day, dayIdx) => {
            // Find all classes on this day
            const dayClasses = scheduleList.filter((item) => item.day === day.key);

            return (
              <div
                key={day.key}
                className={`grid grid-cols-9 min-h-[96px] ${
                  dayIdx < DAYS.length - 1 ? 'border-b border-neutral-200/70 dark:border-slate-800' : ''
                }`}
              >
                {/* Day Label Cell (e.g. Monday) with day color header matching student schedule */}
                <div
                  className={`p-3 border-r border-neutral-200/80 dark:border-slate-700 flex flex-col justify-center items-center font-bold transition-colors ${
                    day.bgHeader || 'bg-neutral-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <span className="font-sans font-bold text-xs sm:text-sm">
                    {day.label}
                  </span>
                  <span className="text-[10px] opacity-85 mt-0.5 font-normal">
                    {day.th}
                  </span>
                </div>

                {/* 8 Hour Columns for this day */}
                <div className="col-span-8 grid grid-cols-8 relative">
                  {/* Background grid lines */}
                  {TIME_SLOTS.map((_, slotIdx) => (
                    <div
                      key={slotIdx}
                      className={`h-full border-r border-neutral-100 dark:border-slate-800/60 ${
                        slotIdx === TIME_SLOTS.length - 1 ? 'border-r-0' : ''
                      }`}
                    />
                  ))}

                  {/* Render class blocks overlapping the grid with per-course pastel styling */}
                  {dayClasses.map((item, cIdx) => {
                    const leftPct = (item.startSlot / 8) * 100;
                    const widthPct = (item.slotSpan / 8) * 100;
                    const theme = getCourseTheme(item);

                    return (
                      <div
                        key={cIdx}
                        onClick={() => setSelectedItem(item)}
                        style={{
                          left: `${leftPct}%`,
                          width: `calc(${widthPct}% - 8px)`,
                        }}
                        className={`absolute top-2 bottom-2 ml-1 p-2.5 rounded-xl border shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-center ${theme.card}`}
                        title="คลิกเพื่อดูรายละเอียดวิชา"
                      >
                        <p className={`font-bold text-xs tracking-tight truncate ${theme.title}`}>
                          {item.code}
                        </p>
                        <p className={`text-[11px] font-medium mt-0.5 truncate ${theme.room}`}>
                          ห้อง {item.room}
                        </p>
                        <p className={`text-[10px] font-mono mt-0.5 ${theme.time}`}>
                          {item.time}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Detail Modal when clicked */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border ${getCourseTheme(selectedItem).badge}`}>
                  {selectedItem.code}
                </span>
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                  {selectedItem.name}
                </h4>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <Clock className="w-4 h-4 text-[#7749BC]" />
                <span className="font-semibold">วัน{selectedItem.day} :</span>
                <span>{selectedItem.time}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold">ห้องเรียน :</span>
                <span>{selectedItem.room}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <Users className="w-4 h-4 text-sky-500" />
                <span className="font-semibold">จำนวนนิสิต :</span>
                <span>{selectedItem.studentCount} คน</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
