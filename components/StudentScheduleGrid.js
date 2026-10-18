'use client';

import { useState, useMemo, useEffect } from 'react';
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
  FileText,
  HelpCircle,
  GraduationCap,
  Download,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Check,
} from 'lucide-react';

const TIME_SLOTS = [
  { label: '8:00 - 9:00', startH: 8, endH: 9 },
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

import { getCoursePrep } from '@/lib/coursePrepData';
import { formatTeacherFullName } from '@/lib/ui';
import { normalizeDayKey, GE_SCHEDULE_MAP } from '@/lib/leave-stats';

function computeScheduleLanes(courses) {
  if (!courses || courses.length === 0) {
    return { laneCount: 1, placedCourses: [] };
  }

  // 1. Detect collisions with other courses
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

  // 3. Assign Google Calendar style lanes
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

export default function StudentScheduleGrid({
  summaries = [],
  semester = '1/2569',
  searchQuery = '',
  onSelectCourseForLeave,
  hideHeader = false,
  selectedCourseId = null,
  onClearSelectedCourseId = null,
}) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalTab, setModalTab] = useState('quota'); // 'quota' | 'prep' | 'exam' | 'syllabus'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'grid'
  const [mobileSelectedDay, setMobileSelectedDay] = useState(() => {
    const dayNum = new Date().getDay();
    const dayMap = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR' };
    return dayMap[dayNum] || 'MO';
  });

  // Normalize courses from summaries
  const parsedCourses = useMemo(() => {
    return summaries
      .map((s) => {
        const c = s.course || s;
        if (!c) return null;

        const geSched = (c.code && GE_SCHEDULE_MAP[c.code]) || {};
        const rawDay = c.day || geSched.day;
        const rawTime = c.time || geSched.time;
        const rawRoom = c.room || geSched.room;

        // Parse standardized day key using centralized helper
        const dayKey = normalizeDayKey(rawDay) || 'MO';

        // Parse time: e.g. "09:00-11:50" or "13:00 - 16:50"
        let startH = 9;
        let endH = 12;
        if (rawTime && rawTime.includes('-')) {
          const [startStr, endStr] = rawTime.split('-');
          const sh = parseInt(startStr.trim().split(':')[0], 10);
          const eh = parseInt(endStr.trim().split(':')[0], 10);
          const em = parseInt(endStr.trim().split(':')[1] || '0', 10);
          if (!isNaN(sh)) startH = sh;
          if (!isNaN(eh)) endH = em > 0 ? eh + 1 : eh;
        }

        const BASE_HOUR = 8;
        const startSlot = Math.max(0, Math.min(TIME_SLOTS.length - 1, startH - BASE_HOUR));
        const endSlot = Math.max(startSlot + 1, Math.min(TIME_SLOTS.length, endH - BASE_HOUR));
        const slotSpan = Math.max(1, endSlot - startSlot);

        const isMatch =
          !searchQuery ||
          [c.code, c.name, rawRoom, c.teacherName || c.teacher?.name].some(
            (field) => field && String(field).toLowerCase().includes(searchQuery.toLowerCase())
          );

        const prep = getCoursePrep(c.code);

        const percent = s.percentage !== undefined ? s.percentage : (s.percent !== undefined ? s.percent : 100);
        const total = s.totalSessions !== undefined ? s.totalSessions : (s.total || 15);
        const leavesCount = s.approvedLeaves !== undefined ? s.approvedLeaves : (s.leaves || 0);
        const pendingLeaves = s.pendingLeaves || 0;
        const attended = s.attended !== undefined ? s.attended : Math.max(total - leavesCount, 0);
        const quotaLimit = s.quotaLimit || Math.max(1, Math.floor(total * 0.2)) || 3;
        const remainingLeaves = Math.max(0, quotaLimit - leavesCount);

        return {
          id: c.id || `${c.code}-${c.group}`,
          code: c.code,
          name: c.name,
          group: c.group || '1',
          room: rawRoom || 'ไม่ระบุห้อง',
          time: rawTime || '09:00 - 12:00',
          teacherName: formatTeacherFullName(c.teacherName || c.teacher?.name),
          dayKey,
          startSlot,
          slotSpan,
          isMatch,
          attendance: percent,
          attended,
          total,
          leaves: leavesCount,
          pendingLeaves,
          quotaLimit,
          remainingLeaves,
          prep,
        };
      })
      .filter(Boolean);
  }, [summaries, searchQuery]);

  // Support external course selection (e.g. from attendance health cards)
  useEffect(() => {
    if (selectedCourseId) {
      const match = parsedCourses.find(
        (c) => c.id === selectedCourseId || c.code === selectedCourseId
      );
      if (match) {
        setSelectedCourse(match);
        setModalTab('quota');
      }
    }
  }, [selectedCourseId, parsedCourses]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Schedule Header Title */}
      {!hideHeader && (
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                ตารางเรียน (Class Schedule)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                ตารางเรียนและห้องเรียนประจำสัปดาห์ ภาคเรียนที่ {semester} • คลิกที่วิชาเพื่อดูแนวข้อสอบ & ข้อมูลเตรียมตัวก่อนเรียน
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
              const count = parsedCourses.filter((c) => c.dayKey === day.key).length;
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
                  <p className="text-[11px] leading-tight font-bold">{day.dayTh.replace('วัน', '')}</p>
                  <span
                    className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white font-bold'
                        : 'bg-neutral-200/80 dark:bg-slate-700 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {count} วิชา
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Day Course Cards */}
          {(() => {
            const mobileDayCourses = parsedCourses.filter((c) => c.dayKey === mobileSelectedDay);
            if (mobileDayCourses.length === 0) {
              return (
                <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-900/50 space-y-1">
                  <CalendarDays className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                    ไม่มีตารางเรียนในวันนี้
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    คุณสามารถเลือกดูวันอื่นได้จากแถบเมนูด้านบน
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 gap-3.5">
                {mobileDayCourses.map((c) => {
                  const hasCollision = mobileDayCourses.some(
                    (other) =>
                      other.id !== c.id &&
                      c.startSlot < (other.startSlot + other.slotSpan) &&
                      other.startSlot < (c.startSlot + c.slotSpan)
                  );

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between transition-all ${
                        hasCollision
                          ? 'border-2 border-rose-500 ring-2 ring-rose-500/40 bg-rose-50/40 dark:bg-rose-950/20'
                          : c.isMatch && searchQuery
                          ? 'border-2 border-[#7749BC] ring-2 ring-[#7749BC]/30 bg-purple-50/50 dark:bg-slate-900'
                          : !c.isMatch
                          ? 'border-2 border-neutral-200 dark:border-slate-800 opacity-40 bg-neutral-50/30 dark:bg-slate-900/40'
                          : 'border-2 border-purple-200 dark:border-purple-800/80 bg-purple-50/30 dark:bg-slate-900'
                      }`}
                      title={hasCollision ? 'เวลาเรียนชนกับวิชาอื่น' : undefined}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-sm text-[#7749BC] dark:text-purple-300">
                                {c.code}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300">
                                กลุ่ม {c.group}
                              </span>
                              {hasCollision && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  เวลาเรียนชนกับวิชาอื่น
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-xs text-neutral-900 dark:text-white mt-1">
                              {c.name}
                            </h4>
                          </div>
                        </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#7749BC] shrink-0" />
                          <span>{c.time || '13:00 - 15:50 น.'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#7749BC] shrink-0" />
                          <span className="truncate">ห้อง {c.room || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <User className="w-3.5 h-3.5 text-[#7749BC] shrink-0" />
                          <span className="truncate">{c.teacherName || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-purple-100 dark:border-slate-800 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse(c);
                          setModalTab('quota');
                        }}
                        className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center justify-center gap-1.5 active:bg-neutral-100 cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#7749BC]" />
                        <span>โควตา & สถิติวิชา</span>
                      </button>
                      {onSelectCourseForLeave && (
                        <button
                          type="button"
                          onClick={() => onSelectCourseForLeave(c.id, c.code)}
                          className="min-h-[44px] py-2 px-3.5 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>ยื่นใบลา</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}
      </div>

      {/* 2. Desktop & iPad Full Grid Container (>= md) */}
      <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[980px] p-4">
            {/* Header Row: Days label + Time Slots */}
            <div
              style={{
                gridTemplateColumns: `minmax(65px, 80px) repeat(${TIME_SLOTS.length}, minmax(65px, 1fr))`,
              }}
              className="grid gap-1.5 mb-2 text-center text-xs font-bold text-neutral-500 dark:text-neutral-400"
            >
              <div className="py-2 bg-neutral-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold sticky left-0 z-20 shadow-xs border border-neutral-200/50 dark:border-slate-700/50">
                วัน
              </div>
              {TIME_SLOTS.map((t, idx) => (
                <div
                  key={idx}
                  className="py-2 bg-neutral-100 dark:bg-slate-800/80 rounded-xl text-[11px] truncate px-0.5"
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
                const { laneCount, placedCourses } = computeScheduleLanes(dayCourses);
                const rowMinHeight = Math.max(114, laneCount * 96 + 18);

                return (
                  <div
                    key={day.key}
                    style={{
                      minHeight: `${rowMinHeight}px`,
                      gridTemplateColumns: `minmax(65px, 80px) repeat(${TIME_SLOTS.length}, minmax(65px, 1fr))`,
                    }}
                    className="grid gap-1.5 items-stretch p-1.5 rounded-2xl bg-neutral-50/50 dark:bg-slate-900/50 border border-neutral-150 dark:border-slate-800/70"
                  >
                    {/* Day Label Column (Sticky left on mobile scroll) */}
                    <div
                      style={{ minHeight: `${rowMinHeight - 12}px` }}
                      className={`flex flex-col items-center justify-center rounded-xl p-2 font-bold text-xs sticky left-0 z-20 shadow-xs border border-neutral-200/50 dark:border-slate-700/50 ${day.bgHeader}`}
                    >
                      <span className="font-bold text-sm tracking-tight">{day.dayTh.replace('วัน', '')}</span>
                      <span className="text-[11px] opacity-75 font-mono font-medium">{day.dayEn.slice(0, 3)}</span>
                    </div>

                    {/* Time Slots Container */}
                    <div
                      className="relative grid gap-1.5"
                      style={{
                        minHeight: `${rowMinHeight - 12}px`,
                        gridColumn: `span ${TIME_SLOTS.length} / span ${TIME_SLOTS.length}`,
                        gridTemplateColumns: `repeat(${TIME_SLOTS.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {/* Background Grid Cells */}
                      {TIME_SLOTS.map((_, sIdx) => (
                        <div
                          key={sIdx}
                          className="border border-dashed border-neutral-200/60 dark:border-slate-800/80 rounded-xl h-full"
                          style={{ minHeight: `${rowMinHeight - 12}px` }}
                        />
                      ))}

                      {/* Render Courses in multi-lane Google Calendar layout */}
                      {placedCourses.map((c) => {
                        const leftPercent = (c.startSlot / TIME_SLOTS.length) * 100;
                        const widthPercent = (c.slotSpan / TIME_SLOTS.length) * 100;
                        const laneTop = laneCount > 1 ? c.laneIndex * 96 + 4 : 4;
                        const laneHeight = laneCount > 1 ? '90px' : 'calc(100% - 8px)';

                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCourse(c);
                              setModalTab('quota');
                            }}
                            style={{
                              left: `${leftPercent}%`,
                              width: `calc(${widthPercent}% - 6px)`,
                              top: `${laneTop}px`,
                              height: laneHeight,
                            }}
                            className={`absolute p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md hover:scale-[1.01] ${
                              c.hasCollision
                                ? 'bg-rose-50/95 dark:bg-rose-950/85 border-2 border-rose-500 ring-2 ring-rose-500/40 text-neutral-900 dark:text-white'
                                : c.isMatch
                                ? 'bg-[#DDD6FE] dark:bg-purple-900/90 border border-purple-300 dark:border-purple-600 text-neutral-900 dark:text-white ring-2 ring-[#7749BC]/30'
                                : 'bg-neutral-200/60 dark:bg-slate-800/60 border border-neutral-300 dark:border-slate-700 opacity-40 text-neutral-600'
                            }`}
                            title={c.hasCollision ? 'เวลาเรียนชนกับวิชาอื่น' : `${c.code} ${c.name} (${c.room})`}
                          >
                            {/* Card Top: Code + Group + Collision badge */}
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`font-extrabold text-xs font-mono truncate ${c.hasCollision ? 'text-rose-950 dark:text-rose-200' : 'text-purple-950 dark:text-purple-100'}`}>
                                  {c.code}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {c.hasCollision && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold shrink-0 shadow-2xs">
                                      ชนเวลา
                                    </span>
                                  )}
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800/90 font-bold text-neutral-800 dark:text-neutral-200 shrink-0 border border-neutral-200/50 dark:border-slate-700 shadow-2xs">
                                    กลุ่ม {c.group}
                                  </span>
                                </div>
                              </div>

                              {/* Card Middle: Full Course Name */}
                              <p className="text-xs font-bold leading-snug line-clamp-1 text-neutral-900 dark:text-white">
                                {c.name}
                              </p>
                            </div>

                            {/* Card Bottom: Room & Time */}
                            <div className="flex items-center justify-between gap-2 pt-1 mt-auto border-t border-neutral-200/60 dark:border-slate-700/60 text-[10px]">
                              <span className="flex items-center gap-1 font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                <MapPin className="w-3 h-3 shrink-0 text-[#7749BC] dark:text-purple-300" />
                                <span className="truncate font-mono">{c.room}</span>
                              </span>
                              <span className="flex items-center gap-1 font-mono text-[10px] text-neutral-700 dark:text-neutral-300 font-semibold shrink-0">
                                <Clock className="w-3 h-3 shrink-0 text-[#7749BC] dark:text-purple-300" />
                                <span>{c.time}</span>
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

      {/* Course Detail, Pre-class Prep & Exam Outline Modal */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            setSelectedCourse(null);
            if (onClearSelectedCourseId) onClearSelectedCourseId();
          }}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold font-mono shrink-0 shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#7749BC] dark:text-purple-400">
                      {selectedCourse.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300">
                      กลุ่ม {selectedCourse.group}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-neutral-900 dark:text-white mt-0.5 truncate">
                    {selectedCourse.name}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourse(null);
                  if (onClearSelectedCourseId) onClearSelectedCourseId();
                }}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Meta Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-neutral-400 text-[10px] flex items-center gap-1">
                  <User className="w-3 h-3 text-[#7749BC]" /> อาจารย์ผู้สอน
                </span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 truncate">
                  {selectedCourse.teacherName}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-neutral-400 text-[10px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#7749BC]" /> ห้องเรียน
                </span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 truncate font-mono">
                  {selectedCourse.room}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-center">
                <span className="text-neutral-400 text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#7749BC]" /> วัน & เวลาเรียน
                </span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 text-xs font-mono truncate">
                  {selectedCourse.dayName || selectedCourse.day || ''} {selectedCourse.time ? `${selectedCourse.time} น.` : '-'}
                </p>
              </div>
            </div>

            {/* Modal Tabs Navigation: โควตา & สิทธิ์สอบ | เตรียมตัวก่อนเรียน | แนวข้อสอบ | แผน 15 สัปดาห์ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab('quota')}
                className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                  modalTab === 'quota'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>โควตา & สิทธิ์สอบ</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('prep')}
                className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                  modalTab === 'prep'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>เตรียมตัวก่อนเรียน</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('exam')}
                className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                  modalTab === 'exam'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>แนวข้อสอบ & สรุป</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('syllabus')}
                className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                  modalTab === 'syllabus'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>แผน 15 สัปดาห์</span>
              </button>
            </div>

            {/* TAB 0: โควตาเวลาเรียน & สิทธิ์สอบ (Per-Course Quota Breakdown) */}
            {modalTab === 'quota' && (
              <div className="space-y-3.5 animate-in fade-in duration-100">
                {/* Status Banner */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3 ${
                    selectedCourse.leaves > selectedCourse.quotaLimit || selectedCourse.attendance < 80
                      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-200'
                      : selectedCourse.remainingLeaves === 0
                      ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/80 text-orange-900 dark:text-orange-200'
                      : selectedCourse.remainingLeaves === 1
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/80 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/80 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedCourse.leaves > selectedCourse.quotaLimit || selectedCourse.attendance < 80
                        ? 'bg-rose-500 text-white'
                        : selectedCourse.remainingLeaves === 0
                        ? 'bg-orange-500 text-white'
                        : selectedCourse.remainingLeaves === 1
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedCourse.leaves > selectedCourse.quotaLimit || selectedCourse.attendance < 80 ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : selectedCourse.remainingLeaves <= 1 ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h5 className="font-bold text-xs sm:text-sm">
                        {selectedCourse.leaves > selectedCourse.quotaLimit || selectedCourse.attendance < 80
                          ? 'สถานะ: ขาดเรียนเกินเกณฑ์ 20% (เสี่ยงหมดสิทธิ์สอบ)'
                          : selectedCourse.remainingLeaves === 0
                          ? 'สถานะ: ใช้โควตาการลาครบเต็มจำนวนแล้ว (ห้ามขาดเพิ่ม)'
                          : selectedCourse.remainingLeaves === 1
                          ? 'สถานะ: เฝ้าระวัง (สามารถลาได้อีกเพียง 1 ครั้ง)'
                          : 'สถานะ: ปลอดภัยตามเกณฑ์เวลาเรียนมหาวิทยาลัย (สิทธิ์สอบปกติ)'}
                      </h5>
                    </div>
                    <p className="text-xs mt-1 opacity-90 leading-relaxed">
                      {selectedCourse.leaves > selectedCourse.quotaLimit || selectedCourse.attendance < 80
                        ? `คุณมีสถิติการลาหรือขาดเรียนรวม ${selectedCourse.leaves} ครั้ง ทำให้เวลาเรียนเหลือเพียง ${selectedCourse.attendance}% ซึ่งต่ำกว่าเกณฑ์ 80% กรุณาติดต่ออาจารย์ผู้สอนหรือฝ่ายวิชาการโดยด่วน`
                        : selectedCourse.remainingLeaves === 0
                        ? `คุณใช้สิทธิ์การลาครบทั้ง ${selectedCourse.quotaLimit} ครั้งแล้ว หากขาดเรียนหรือลาเพิ่มอีก 1 ครั้ง เวลาเรียนจะต่ำกว่า 80% และส่งผลกระทบต่อสิทธิ์สอบปลายภาคทันที`
                        : selectedCourse.remainingLeaves === 1
                        ? `คุณได้ยื่นลาไปแล้ว ${selectedCourse.leaves} ครั้ง และมีสิทธิ์ลาได้อีกเพียง 1 ครั้งเท่านั้น แนะนำให้สำรองไว้ใช้ยามจำเป็นฉุกเฉิน`
                        : `คุณมีเวลาเรียนสะสม ${selectedCourse.attendance}% (${selectedCourse.attended}/${selectedCourse.total} คาบ) อยู่ในเกณฑ์ดีมาก และยังสามารถใช้สิทธิ์ลาได้อีก ${selectedCourse.remainingLeaves} ครั้ง`}
                    </p>
                  </div>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* 1. เวลาเรียนสะสม */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#7749BC]" /> เวลาเรียนสะสม
                      </span>
                      <span
                        className={`font-mono font-black text-sm ${
                          selectedCourse.attendance < 80
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {selectedCourse.attendance}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          selectedCourse.attendance < 80 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, selectedCourse.attendance)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>เข้าเรียนแล้ว</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {selectedCourse.attended} / {selectedCourse.total} คาบ
                      </span>
                    </div>
                  </div>

                  {/* 2. สถิติการลา */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#7749BC]" /> ลาไปแล้ว
                      </span>
                      <span className="font-mono font-black text-sm text-neutral-900 dark:text-white">
                        {selectedCourse.leaves} ครั้ง
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          selectedCourse.leaves > selectedCourse.quotaLimit
                            ? 'bg-rose-500'
                            : selectedCourse.leaves === selectedCourse.quotaLimit
                            ? 'bg-orange-500'
                            : selectedCourse.leaves === selectedCourse.quotaLimit - 1
                            ? 'bg-amber-500'
                            : 'bg-purple-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (selectedCourse.leaves / selectedCourse.quotaLimit) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>สัดส่วนการลา</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {Math.round((selectedCourse.leaves / selectedCourse.total) * 100)}% ของเวลาทั้งหมด
                      </span>
                    </div>
                  </div>

                  {/* 3. โควตาคงเหลือ */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#7749BC]" /> สิทธิ์ที่ลาได้อีก
                      </span>
                      <span
                        className={`font-mono font-black text-sm ${
                          selectedCourse.remainingLeaves === 0
                            ? 'text-orange-600 dark:text-orange-400'
                            : selectedCourse.remainingLeaves === 1
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {selectedCourse.remainingLeaves} ครั้ง
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      {Array.from({ length: selectedCourse.quotaLimit }).map((_, i) => {
                        const isUsed = i < selectedCourse.leaves;
                        return (
                          <div
                            key={i}
                            className={`flex-1 h-3 rounded-md transition-all flex items-center justify-center text-[9px] font-bold ${
                              isUsed
                                ? 'bg-purple-600 text-white'
                                : 'bg-neutral-200 dark:bg-slate-700 text-neutral-400'
                            }`}
                            title={`สิทธิ์ครั้งที่ ${i + 1}: ${isUsed ? 'ใช้แล้ว' : 'ยังว่างอยู่'}`}
                          >
                            {i + 1}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>เกณฑ์ขาดได้สูงสุด</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        20% (3 ครั้ง)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Quota Slot Gauge Breakdown */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
                  <h6 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#7749BC]" />
                    <span>รายละเอียดสิทธิ์การลา (สูงสุด {selectedCourse.quotaLimit} ครั้ง)</span>
                  </h6>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {Array.from({ length: selectedCourse.quotaLimit }).map((_, slotIdx) => {
                      const slotNum = slotIdx + 1;
                      const isUsed = slotNum <= selectedCourse.leaves;
                      const isCurrentRisk = slotNum === selectedCourse.quotaLimit;

                      return (
                        <div
                          key={slotIdx}
                          className={`p-3 rounded-xl border flex flex-col justify-between space-y-1.5 ${
                            isUsed
                              ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                              สิทธิ์ครั้งที่ {slotNum}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isUsed
                                  ? 'bg-[#7749BC] text-white'
                                  : 'bg-neutral-100 dark:bg-slate-700 text-neutral-500 dark:text-neutral-300'
                              }`}
                            >
                              {isUsed ? 'ใช้สิทธิ์แล้ว' : 'ว่าง (ยังไม่ได้ใช้)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {isUsed
                              ? 'บันทึกในระบบเรียบร้อย'
                              : isCurrentRisk
                              ? '⚠️ สิทธิ์ครั้งสุดท้ายก่อนหมดสิทธิ์สอบ'
                              : 'ใช้สิทธิ์ได้ตามเกณฑ์'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BUU University Policy Callout */}
                <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/50 space-y-1.5 text-xs">
                  <h6 className="font-bold text-neutral-900 dark:text-purple-200 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#7749BC]" />
                    <span>ข้อบังคับมหาวิทยาลัยบูรพา ว่าด้วยการจัดการศึกษาระดับปริญญาตรี</span>
                  </h6>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                    นิสิตต้องมีเวลาเรียนไม่น้อยกว่าร้อยละ 80 ของเวลาเรียนทั้งหมดในรายวิชานั้น (ขาดเรียนได้ไม่เกิน 3 ครั้ง สำหรับวิชา 15 คาบ) จึงจะมีสิทธิ์เข้าสอบไล่ปลายภาค หากมีเหตุจำเป็นฉุกเฉินหรือป่วยเกิน 3 วัน กรุณาแนบใบรับรองแพทย์และติดต่ออาจารย์ผู้สอนโดยตรง
                  </p>
                </div>
              </div>
            )}

            {/* TAB 1: เตรียมตัวก่อนเรียน (Pre-class Prep) */}
            {modalTab === 'prep' && (
              <div className="space-y-3 animate-in fade-in duration-100">
                {/* Current Week Banner */}
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/70 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="flex flex-col items-center justify-center text-center px-2.5 py-1 rounded-xl bg-[#7749BC] text-white shadow-2xs shrink-0 min-w-[54px]">
                      <span className="text-[10px] font-bold leading-none tracking-tight">สัปดาห์</span>
                      <span className="text-[11px] font-extrabold leading-none mt-1">ที่ {selectedCourse.prep.week}</span>
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-purple-100">
                      {selectedCourse.prep.topic}
                    </h5>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed pt-1">
                    {selectedCourse.prep.description}
                  </p>
                </div>

                {/* Pre-class Checklist */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <h6 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>สิ่งที่ต้องเตรียมตัวก่อนเข้าห้องเรียน</span>
                  </h6>
                  <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                    {selectedCourse.prep.preClassTasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Materials / Slides Download */}
                <div className="space-y-1.5">
                  <h6 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#7749BC]" />
                    <span>เอกสารและสไลด์ประกอบการสอนประจำสัปดาห์</span>
                  </h6>
                  <div className="space-y-1">
                    {selectedCourse.prep.materials.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-[#7749BC] shrink-0" />
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">({m.size})</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 hover:bg-purple-100 cursor-pointer flex items-center gap-1 shrink-0">
                          <Download className="w-3 h-3" />
                          <span>ดาวน์โหลด</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: แนวข้อสอบ & สรุปประเด็นสำคัญ (Exam Outline) */}
            {modalTab === 'exam' && (
              <div className="space-y-3 animate-in fade-in duration-100">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/70 space-y-1.5">
                  <h6 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>ประเด็นสำคัญที่มักออกสอบ (Exam Key Concepts)</span>
                  </h6>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                    หัวข้อและคอนเซ็ปต์หลักที่อาจารย์เน้นย้ำสำหรับเตรียมตัวสอบกลางภาคและปลายภาค
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedCourse.prep.examHighlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-start gap-2.5 text-xs text-neutral-800 dark:text-neutral-200"
                    >
                      <span className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                        0{idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: แผนการสอน 15 สัปดาห์ (Syllabus) */}
            {modalTab === 'syllabus' && (
              <div className="space-y-2 animate-in fade-in duration-100 max-h-60 overflow-y-auto pr-1">
                {selectedCourse.prep.syllabus.map((item) => (
                  <div
                    key={item.week}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      item.status === 'current'
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 font-bold text-neutral-900 dark:text-white'
                        : item.status === 'done'
                        ? 'bg-neutral-50/60 dark:bg-slate-800/40 border-neutral-200/60 dark:border-slate-800 text-neutral-500'
                        : item.status === 'exam'
                        ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold'
                        : 'bg-white dark:bg-slate-800/60 border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[11px] opacity-75 shrink-0">
                        สัปดาห์ {item.week}
                      </span>
                      <span className="truncate">{item.topic}</span>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.status === 'current'
                          ? 'bg-[#7749BC] text-white'
                          : item.status === 'done'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : item.status === 'exam'
                          ? 'bg-rose-500 text-white'
                          : 'bg-neutral-200 dark:bg-slate-700 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {item.status === 'current'
                        ? 'สัปดาห์นี้'
                        : item.status === 'done'
                        ? 'เรียนแล้ว'
                        : item.status === 'exam'
                        ? 'สอบ'
                        : 'เร็วๆ นี้'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons: ยื่นใบลาสำหรับวิชานี้ */}
            <div className="pt-2 flex items-center border-t border-neutral-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const targetCourseId = selectedCourse.id;
                  const targetCourseCode = selectedCourse.code;
                  setSelectedCourse(null);
                  if (onSelectCourseForLeave) {
                    onSelectCourseForLeave(targetCourseId, targetCourseCode);
                  } else {
                    window.location.href = `/student?tab=leave&courseId=${targetCourseId}&code=${targetCourseCode}`;
                  }
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <FileEdit className="w-4 h-4" />
                <span>ยื่นใบลาสำหรับวิชานี้</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
