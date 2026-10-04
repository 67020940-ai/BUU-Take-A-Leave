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
  { key: 'Monday', label: 'Monday', th: 'วันจันทร์' },
  { key: 'Tuesday', label: 'Tuesday', th: 'วันอังคาร' },
  { key: 'Wednesday', label: 'Wednesday', th: 'วันพุธ' },
  { key: 'Thursday', label: 'Thursday', th: 'วันพฤหัสบดี' },
  { key: 'Friday', label: 'Friday', th: 'วันศุกร์' },
];

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
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="w-3 h-3 rounded-md bg-[#DDD6FE] dark:bg-purple-900/80 border border-purple-300 dark:border-purple-700" />
          <span className="hidden sm:inline">คาบเรียนที่รับผิดชอบ</span>
        </div>
      </div>

      {/* Grid Container (Scrollable on small devices) */}
      <div className="overflow-x-auto p-4 sm:p-6">
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
                {/* Day Label Cell (e.g. Monday) */}
                <div className="p-3 border-r border-neutral-200/80 dark:border-slate-700 flex flex-col justify-center items-center bg-neutral-50/50 dark:bg-slate-900/40">
                  <span className="font-sans font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                    {day.label}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
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

                  {/* Render class blocks overlapping the grid */}
                  {dayClasses.map((item, cIdx) => {
                    const leftPct = (item.startSlot / 8) * 100;
                    const widthPct = (item.slotSpan / 8) * 100;

                    return (
                      <div
                        key={cIdx}
                        onClick={() => setSelectedItem(item)}
                        style={{
                          left: `${leftPct}%`,
                          width: `calc(${widthPct}% - 8px)`,
                        }}
                        className="absolute top-2 bottom-2 ml-1 p-2.5 rounded-xl bg-purple-200/85 hover:bg-purple-200 dark:bg-purple-900/70 dark:hover:bg-purple-900/90 border border-purple-300 dark:border-purple-600/80 text-purple-950 dark:text-purple-100 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-center"
                        title="คลิกเพื่อดูรายละเอียดวิชา"
                      >
                        <p className="font-bold text-xs tracking-tight truncate">
                          {item.code}
                        </p>
                        <p className="text-[11px] font-medium text-purple-900 dark:text-purple-200 mt-0.5 truncate">
                          ห้อง {item.room}
                        </p>
                        <p className="text-[10px] font-mono text-purple-700 dark:text-purple-300 mt-0.5">
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
                <span className="font-mono text-xs font-bold text-[#7749BC] dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
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
