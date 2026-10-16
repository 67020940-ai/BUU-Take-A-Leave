'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin, Users, BookOpen, Info, ExternalLink, X } from 'lucide-react';
import { formatThaiDay } from '@/lib/ui';
import { normalizeDayKey } from '@/lib/leave-stats';

function computeScheduleLanes(courses) {
  if (!courses || courses.length === 0) {
    return { laneCount: 1, placedCourses: [] };
  }

  // 1. Detect collisions
  const withCollision = courses.map((c) => {
    const cEnd = c.startSlot + c.slotSpan;
    const hasCollision = courses.some(
      (other) =>
        other.id !== c.id &&
        c.startSlot < (other.startSlot + other.slotSpan) &&
        other.startSlot < cEnd
    );
    return { ...c, hasCollision };
  });

  // 2. Sort by startSlot asc, slotSpan desc
  const sorted = [...withCollision].sort((a, b) => {
    if (a.startSlot !== b.startSlot) return a.startSlot - b.startSlot;
    return b.slotSpan - a.slotSpan;
  });

  // 3. Assign lanes
  const lanes = [];
  const placedCourses = [];

  for (const course of sorted) {
    const courseEnd = course.startSlot + course.slotSpan;
    let placedLaneIndex = -1;

    for (let lIdx = 0; lIdx < lanes.length; lIdx++) {
      const lane = lanes[lIdx];
      const overlapsInLane = lane.some(
        (existing) =>
          course.startSlot < (existing.startSlot + existing.slotSpan) &&
          existing.startSlot < courseEnd
      );
      if (!overlapsInLane) {
        lane.push(course);
        placedLaneIndex = lIdx;
        break;
      }
    }

    if (placedLaneIndex === -1) {
      lanes.push([course]);
      placedLaneIndex = lanes.length - 1;
    }

    placedCourses.push({
      ...course,
      laneIndex: placedLaneIndex,
    });
  }

  return {
    laneCount: Math.max(1, lanes.length),
    placedCourses,
  };
}

const TIME_SLOTS = [
  '8:00 - 9:00',
  '9:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
];

const DAYS = [
  { key: 'Monday', normKey: 'MO', label: 'Monday', th: 'วันจันทร์', bgHeader: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },
  { key: 'Tuesday', normKey: 'TU', label: 'Tuesday', th: 'วันอังคาร', bgHeader: 'bg-pink-500/15 text-pink-800 dark:text-pink-300' },
  { key: 'Wednesday', normKey: 'WE', label: 'Wednesday', th: 'วันพุธ', bgHeader: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' },
  { key: 'Thursday', normKey: 'TH', label: 'Thursday', th: 'วันพฤหัสบดี', bgHeader: 'bg-orange-500/15 text-orange-800 dark:text-orange-300' },
  { key: 'Friday', normKey: 'FR', label: 'Friday', th: 'วันศุกร์', bgHeader: 'bg-sky-500/15 text-sky-800 dark:text-sky-300' },
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
  return COURSE_THEMES.purple;
}

// Default classes matching wireframe S__3366938_0.jpg
const SCHEDULE_ITEMS = [
  {
    day: 'Monday',
    startSlot: 1, // 9:00
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
    startSlot: 5, // 13:00
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
    startSlot: 1, // 9:00
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
    startSlot: 5, // 13:00
    slotSpan: 3,  // 13:00 - 16:00
    code: '24527564-64, 2',
    name: 'การประยุกต์โปรแกรมโอเพนซอร์ส (OSS) กลุ่ม 02',
    room: 'QS2-407',
    time: '(13:00 - 15:50)',
    color: 'purple',
    studentCount: 33,
  },
];

export default function TeacherScheduleGrid({ courses = [], customItems = null, onSelectCourse, hideHeader = false, semester = '1/2569', searchQuery = '' }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'grid'
  const [mobileSelectedDay, setMobileSelectedDay] = useState(() => {
    const dayNum = new Date().getDay();
    const dayMap = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
    return dayMap[dayNum] || 'Monday';
  });

  const scheduleList = useMemo(() => {
    if (customItems) return customItems;
    if (courses && courses.length > 0) {
      const activeCourses = semester && semester !== 'all'
        ? courses.filter((c) => !c.term || c.term === semester)
        : courses;

      return activeCourses.map((c) => {
        let startH = 9;
        let endH = 12;
        if (c.time) {
          const match = c.time.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
          if (match) {
            startH = parseInt(match[1], 10);
            const startM = parseInt(match[2], 10);
            endH = parseInt(match[3], 10);
            const endM = parseInt(match[4], 10);
            if (endM > 30) endH += 1;
            else if (endM > 0 && endH <= startH) endH += 1;
          }
        }
        const BASE_HOUR = 8;
        const startSlot = Math.max(0, Math.min(TIME_SLOTS.length - 1, startH - BASE_HOUR));
        const endSlot = Math.max(startSlot + 1, Math.min(TIME_SLOTS.length, endH - BASE_HOUR));
        const slotSpan = Math.max(1, endSlot - startSlot);

        return {
          id: c.id || `${c.code}-${c.group}`,
          day: c.day || 'Monday',
          startSlot: c.startSlot !== undefined ? c.startSlot : startSlot,
          slotSpan: c.slotSpan !== undefined ? c.slotSpan : slotSpan,
          code: c.code,
          name: c.name,
          room: c.room || 'ไม่ระบุห้อง',
          time: c.time ? (c.time.startsWith('(') ? c.time : `(${c.time})`) : '(09:00 - 12:00)',
          color: c.color || 'purple',
          group: c.group,
          studentCount: c.studentCount || c.totalStudents || 35,
        };
      });
    }
    return SCHEDULE_ITEMS;
  }, [customItems, courses]);

  const normalizedItems = useMemo(() => {
    return scheduleList.map((item, idx) => {
      const normKey = normalizeDayKey(item.day);
      const matchedDay = DAYS.find((d) => d.normKey === normKey || d.key === item.day) || DAYS[0];
      return {
        ...item,
        id: item.id || `teacher-class-${idx}`,
        dayKey: matchedDay.key,
        normKey: matchedDay.normKey,
      };
    });
  }, [scheduleList]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Schedule Header Title */}
      {!hideHeader && (
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
                ตารางเรียนและห้องสอนประจำสัปดาห์ {semester && semester !== 'all' ? `ภาคเรียนที่ ${semester}` : 'ทุกภาคเรียน'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Mobile Day-by-Day Cards View (< md) */}
      <div className="block md:hidden p-3.5 sm:p-5 space-y-4">
          {/* Day Selector Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-neutral-100 dark:bg-slate-800/80 rounded-2xl w-full">
            {DAYS.map((day) => {
              const isActive = mobileSelectedDay === day.key;
              const count = normalizedItems.filter((item) => item.normKey === day.normKey).length;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setMobileSelectedDay(day.key)}
                  className={`flex-1 min-w-[62px] min-h-[44px] py-2 px-1 rounded-xl text-center text-xs font-bold transition-all cursor-pointer select-none flex flex-col items-center justify-center ${
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
            const activeDayObj = DAYS.find((d) => d.key === mobileSelectedDay) || DAYS[0];
            const mobileDayClasses = normalizedItems.filter((item) => item.normKey === activeDayObj.normKey);
            const { placedCourses: mobileLanedClasses } = computeScheduleLanes(mobileDayClasses);

            if (mobileLanedClasses.length === 0) {
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
              <div className="grid grid-cols-1 gap-3.5">
                {mobileLanedClasses.map((item, idx) => {
                  const theme = getCourseTheme(item);
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setSelectedItem(item);
                        if (onSelectCourse) onSelectCourse(item);
                      }}
                      title={item.hasCollision ? 'เวลาเรียนชนกับวิชาอื่น' : undefined}
                      className={`min-h-[44px] p-4 rounded-2xl border-2 space-y-3 cursor-pointer active:scale-98 transition-all ${
                        item.hasCollision
                          ? 'border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-purple-200 dark:border-purple-800/80 bg-purple-50/30 dark:bg-slate-900'
                      } shadow-2xs`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-sm text-[#7749BC] dark:text-purple-300">
                              {item.code}
                            </span>
                            {item.hasCollision && (
                              <span
                                title="เวลาเรียนชนกับวิชาอื่น"
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              >
                                เวลาเรียนชนกับวิชาอื่น
                              </span>
                            )}
                          </div>
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
                          <span className="tabular-nums">{item.time}</span>
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
          <div className="min-w-[1040px] border border-neutral-200/90 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
            {/* Header Row: Date / Time + Time Slots */}
            <div
              style={{
                gridTemplateColumns: `minmax(95px, 115px) repeat(${TIME_SLOTS.length}, minmax(75px, 1fr))`,
              }}
              className="grid bg-neutral-100/80 dark:bg-slate-800/80 border-b border-neutral-200/90 dark:border-slate-700/80 text-center font-bold text-xs text-neutral-700 dark:text-neutral-200"
            >
              <div className="p-3 border-r border-neutral-200/80 dark:border-slate-700 font-sans tracking-wide sticky left-0 z-20 bg-neutral-100 dark:bg-slate-800 shadow-xs">
                Date / Time
              </div>
              {TIME_SLOTS.map((slot, idx) => (
                <div
                  key={slot}
                  className={`p-2.5 text-[11px] font-mono tracking-tight font-medium ${
                    idx < TIME_SLOTS.length - 1 ? 'border-r border-neutral-200/80 dark:border-slate-700' : ''
                  }`}
                >
                  {slot}
                </div>
              ))}
            </div>

            {/* Day Rows: Monday to Friday */}
            {DAYS.map((day, dayIdx) => {
              // Find all classes on this day using standardized normKey
              const dayClasses = normalizedItems.filter((item) => item.normKey === day.normKey);
              const { laneCount, placedCourses } = computeScheduleLanes(dayClasses);
              const rowMinHeight = Math.max(115, laneCount * 96 + 18);

              return (
                <div
                  key={day.key}
                  style={{
                    minHeight: `${rowMinHeight}px`,
                    gridTemplateColumns: `minmax(95px, 115px) repeat(${TIME_SLOTS.length}, minmax(75px, 1fr))`,
                  }}
                  className={`grid ${
                    dayIdx < DAYS.length - 1 ? 'border-b border-neutral-200/70 dark:border-slate-800' : ''
                  }`}
                >
                  {/* Day Label Cell (Sticky left on mobile scroll) */}
                  <div
                    style={{ minHeight: `${rowMinHeight}px` }}
                    className={`p-3 border-r border-neutral-200/80 dark:border-slate-700 flex flex-col justify-center items-center font-bold transition-colors sticky left-0 z-20 shadow-xs ${
                      day.bgHeader || 'bg-neutral-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <span className="font-sans font-bold text-xs sm:text-sm">
                      {day.th}
                    </span>
                    <span className="text-[10px] opacity-75 mt-0.5 font-normal">
                      {day.label}
                    </span>
                  </div>

                  {/* Hour Columns for this day */}
                  <div
                    style={{
                      minHeight: `${rowMinHeight}px`,
                      gridColumn: `span ${TIME_SLOTS.length} / span ${TIME_SLOTS.length}`,
                      gridTemplateColumns: `repeat(${TIME_SLOTS.length}, minmax(0, 1fr))`,
                    }}
                    className="grid relative"
                  >
                    {/* Background grid lines */}
                    {TIME_SLOTS.map((_, slotIdx) => (
                      <div
                        key={slotIdx}
                        className={`h-full border-r border-neutral-100 dark:border-slate-800/60 ${
                          slotIdx === TIME_SLOTS.length - 1 ? 'border-r-0' : ''
                        }`}
                      />
                    ))}

                    {/* Render class blocks in multi-lane layout with collision detection */}
                    {placedCourses.map((item, cIdx) => {
                      const leftPct = (item.startSlot / TIME_SLOTS.length) * 100;
                      const widthPct = (item.slotSpan / TIME_SLOTS.length) * 100;
                      const theme = getCourseTheme(item);
                      const laneTop = laneCount > 1 ? item.laneIndex * 96 + 4 : 6;
                      const laneHeight = laneCount > 1 ? '90px' : 'calc(100% - 12px)';

                      const q = searchQuery.toLowerCase().trim();
                      const isMatch =
                        !q ||
                        item.code.toLowerCase().includes(q) ||
                        item.name.toLowerCase().includes(q) ||
                        (item.room && item.room.toLowerCase().includes(q));

                      return (
                        <div
                          key={item.id || cIdx}
                          onClick={() => {
                            setSelectedItem(item);
                            if (onSelectCourse) onSelectCourse(item);
                          }}
                          style={{
                            left: `${leftPct}%`,
                            width: `calc(${widthPct}% - 8px)`,
                            top: `${laneTop}px`,
                            height: laneHeight,
                          }}
                          className={`absolute ml-1 p-2.5 rounded-2xl border shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-between overflow-hidden z-10 ${
                            item.hasCollision
                              ? 'border-2 border-rose-500 dark:border-rose-500 shadow-rose-200/50'
                              : isMatch && q
                              ? 'ring-2 ring-[#7749BC] dark:ring-purple-400 shadow-purple-200/50 dark:shadow-purple-900/40'
                              : !isMatch
                              ? 'opacity-35'
                              : theme.card
                          } ${theme.card}`}
                          title={
                            item.hasCollision
                              ? 'เวลาเรียนชนกับวิชาอื่น'
                              : `${item.code} ${item.name} (${item.room})`
                          }
                        >
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`font-extrabold text-xs font-mono truncate ${theme.title}`}>
                                {item.code}
                              </span>
                              <div className="flex items-center gap-1">
                                {item.hasCollision && (
                                  <span
                                    title="เวลาเรียนชนกับวิชาอื่น"
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 shrink-0"
                                  >
                                    เวลาชน
                                  </span>
                                )}
                                {item.group && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 font-bold text-neutral-700 dark:text-neutral-300 shrink-0 border border-neutral-200/50 dark:border-slate-700 shadow-2xs">
                                    กลุ่ม {item.group}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs font-bold leading-snug line-clamp-2 text-neutral-900 dark:text-neutral-100">
                              {item.name}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1.5 mt-auto border-t border-neutral-200/50 dark:border-slate-700/50 text-[10px]">
                            <span className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300 truncate">
                              <MapPin className="w-3 h-3 shrink-0 text-[#7749BC] dark:text-purple-400" />
                              <span className="truncate">ห้อง {item.room}</span>
                            </span>
                            <span className="flex items-center gap-1 font-mono text-neutral-600 dark:text-neutral-400 shrink-0 tabular-nums">
                              <Clock className="w-2.5 h-2.5 shrink-0 text-[#7749BC] dark:text-purple-400" />
                              <span>{item.time}</span>
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

      {/* Class Detail Modal when clicked */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border ${getCourseTheme(selectedItem).badge}`}>
                  {selectedItem.code}
                </span>
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                  {selectedItem.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <Clock className="w-4 h-4 text-[#7749BC]" />
                <span className="font-semibold">{formatThaiDay(selectedItem.day)} :</span>
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

            <div className="space-y-2 pt-1">
              <Link
                href={`/teacher/requests?courseId=${selectedItem.id || selectedItem.code}`}
                className="w-full py-2.5 px-3 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>ดูคำขอลาเรียนของวิชานี้</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
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
