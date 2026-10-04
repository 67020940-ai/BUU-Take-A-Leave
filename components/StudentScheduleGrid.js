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
  FileText,
  HelpCircle,
  GraduationCap,
  Download,
  AlertCircle,
  Check,
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

// Rich lesson plan and exam preparation metadata for students
const COURSE_PREP_DATA = {
  '24527664': {
    week: 6,
    topic: 'การวิเคราะห์และออกแบบโมเดลกระบวนการ (Data Flow Diagram - DFD)',
    description: 'เรียนรู้หลักการเขียน DFD Level 0 และ Level 1 กฎความสมดุลข้อมูล (Balancing) และข้อผิดพลาดที่พบบ่อย',
    preClassTasks: [
      'ทบทวนสัญลักษณ์ DFD (Process, Data Store, Data Flow, External Entity)',
      'ติดตั้งซอฟต์แวร์ Draw.io หรือ Visual Paradigm บนคอมพิวเตอร์พกพา',
      'อ่านเอกสารประกอบการสอนบทที่ 5 เรื่อง Process Modeling',
    ],
    examHighlights: [
      'การระบุข้อผิดพลาดใน DFD: Black Hole, Miracle, Grey Hole',
      'ความแตกต่างระหว่าง Context Diagram และ DFD Level 0',
      'การทำ Data Dictionary และโครงสร้าง Data Flow',
    ],
    materials: [
      { name: 'สไลด์บทที่ 5: Data Flow Diagram (PDF)', size: '4.2 MB' },
      { name: 'แบบฝึกหัด DFD Workshop Case Study (DOCX)', size: '820 KB' },
    ],
    syllabus: [
      { week: 1, topic: 'Introduction to Systems Analysis and Design', status: 'done' },
      { week: 2, topic: 'Project Identification and Selection', status: 'done' },
      { week: 3, topic: 'Requirements Determination & Fact-Finding', status: 'done' },
      { week: 4, topic: 'Use Case Modeling and Scenarios', status: 'done' },
      { week: 5, topic: 'Context Diagram & Functional Decomposition', status: 'done' },
      { week: 6, topic: 'Process Modeling: DFD Level 0 & Level 1', status: 'current' },
      { week: 7, topic: 'Data Modeling: Entity-Relationship Diagram (ERD)', status: 'upcoming' },
      { week: 8, topic: 'สอบกลางภาค (Midterm Examination)', status: 'exam' },
      { week: 9, topic: 'Database Design and Normalization (1NF-3NF)', status: 'upcoming' },
      { week: 10, topic: 'User Interface & Input/Output Design', status: 'upcoming' },
    ],
  },
  '24537364': {
    week: 6,
    topic: 'การลงรายการบรรณานุกรมด้วยมาตรฐาน MARC 21 และ RDA',
    description: 'ฝึกปฏิบัติการลงรายการระเบียนข้อมูลบรรณานุกรมหนังสือและสื่อดิจิทัลในระบบห้องสมุดอัตโนมัติ KOHA',
    preClassTasks: [
      'ศึกษาความหมายของ Tag สำคัญใน MARC 21: Tag 100, 245, 260/264, 650',
      'เตรียมตัวอย่างหนังสือภาษาไทย 1 เล่ม เพื่อใช้ฝึกปฏิบัติลงรายการ',
    ],
    examHighlights: [
      'โครงสร้างของระเบียน MARC 21 (Leader, Directory, Variable Control/Data Fields)',
      'ความแตกต่างระหว่างมาตรฐาน MARC 21 กับ Dublin Core',
    ],
    materials: [
      { name: 'คู่มือการลงรายการ MARC 21 ฉบับย่อ (PDF)', size: '2.8 MB' },
      { name: 'ใบงานระบบ KOHA Cataloging (PDF)', size: '1.1 MB' },
    ],
    syllabus: [
      { week: 1, topic: 'ภาพรวมระบบห้องสมุดอัตโนมัติและโมดูลการทำงาน', status: 'done' },
      { week: 2, topic: 'มาตรฐานข้อมูลทางบรรณานุกรม', status: 'done' },
      { week: 3, topic: 'สถาปัตยกรรมระบบ Open Source Library Systems', status: 'done' },
      { week: 4, topic: 'การติดตั้งและการตั้งค่าระบบ KOHA', status: 'done' },
      { week: 5, topic: 'โมดูลการจัดหาทรัพยากร (Acquisitions Module)', status: 'done' },
      { week: 6, topic: 'การลงรายการ MARC 21 & RDA (Cataloging)', status: 'current' },
      { week: 7, topic: 'ระบบยืม-คืนและการจัดการสมาชิก (Circulation)', status: 'upcoming' },
      { week: 8, topic: 'สอบกลางภาค (Midterm Examination)', status: 'exam' },
    ],
  },
  '24527364': {
    week: 6,
    topic: 'การจัดสรรหมายเลขไอพีและการแบ่งเครือข่ายย่อย (IPv4 Subnetting & CIDR)',
    description: 'คำนวณหมายเลขเครือข่าย Subnet Mask, Network ID, Broadcast ID และ Usable Hosts สำหรับแต่ละแผนก',
    preClassTasks: [
      'ทบทวนเลขฐานสองและการแปลงระหว่างฐาน 10 กับฐาน 2 (Binary Conversion)',
      'ติดตั้งโปรแกรม Cisco Packet Tracer บนแล็ปท็อปเพื่อทำแล็บ',
    ],
    examHighlights: [
      'การคำนวณ Subnet Mask จาก Prefix notation (/24, /26, /28)',
      'การหา Broadcast Address และ First/Last Host IP',
      'แนวคิด Variable Length Subnet Mask (VLSM)',
    ],
    materials: [
      { name: 'สไลด์บทที่ 6: IP Addressing & Subnetting (PDF)', size: '3.6 MB' },
      { name: 'Lab Sheet: Packet Tracer Subnetting Config (PKT)', size: '450 KB' },
    ],
    syllabus: [
      { week: 1, topic: 'Introduction to Computer Networks & Topologies', status: 'done' },
      { week: 2, topic: 'OSI 7 Layers Model vs TCP/IP Protocol Suite', status: 'done' },
      { week: 3, topic: 'Physical Layer & Data Link Layer Fundamentals', status: 'done' },
      { week: 4, topic: 'Ethernet & Address Resolution Protocol (ARP)', status: 'done' },
      { week: 5, topic: 'Network Layer & IPv4 Addressing Basics', status: 'done' },
      { week: 6, topic: 'IPv4 Subnetting & CIDR Calculation', status: 'current' },
      { week: 7, topic: 'Routing Protocols: Static Routing & RIP', status: 'upcoming' },
      { week: 8, topic: 'สอบกลางภาค (Midterm Examination)', status: 'exam' },
    ],
  },
  '24535164': {
    week: 6,
    topic: 'นโยบายการจัดหาและการบริหารสัญญาทรัพยากรสารสนเทศดิจิทัล',
    description: 'ศึกษาข้อตกลงการใช้งานฐานข้อมูลออนไลน์ กฎหมายลิขสิทธิ์ และรูปแบบ Open Access Publishing',
    preClassTasks: [
      'อ่านเอกสารกรณีศึกษานโยบายการบอกรับฐานข้อมูลอิเล็กทรอนิกส์ของสำนักหอสมุด',
      'สรุปประเด็นลิขสิทธิ์ Creative Commons (CC License) แต่ละประเภท',
    ],
    examHighlights: [
      'วงจรการบริหารทรัพยากรสารสนเทศ (Collection Management Lifecycle)',
      'รูปแบบลิขสิทธิ์ CC-BY, CC-NC, CC-ND, CC-SA',
    ],
    materials: [
      { name: 'เอกสารคำสอน: นโยบายและสัญญาอนุญาตสารสนเทศ (PDF)', size: '2.1 MB' },
    ],
    syllabus: [
      { week: 1, topic: 'แนวคิดและขอบเขตการจัดการทรัพยากรสารสนเทศ', status: 'done' },
      { week: 2, topic: 'การประเมินความต้องการสารสนเทศของผู้ใช้', status: 'done' },
      { week: 3, topic: 'การคัดเลือกและจัดหาทรัพยากรตีพิมพ์', status: 'done' },
      { week: 4, topic: 'การจัดหาทรัพยากรอิเล็กทรอนิกส์และดิจิทัล', status: 'done' },
      { week: 5, topic: 'การบริหารงบประมาณและการจัดซื้อ', status: 'done' },
      { week: 6, topic: 'นโยบายและการบริหารสัญญาทรัพยากรดิจิทัล', status: 'current' },
      { week: 7, topic: 'การอนุรักษ์และการจำหน่ายทรัพยากรสารสนเทศ', status: 'upcoming' },
    ],
  },
  '24531264': {
    week: 6,
    topic: 'แบบจำลองพฤติกรรมการแสวงหาสารสนเทศ (Wilson & Kuhlthau Models)',
    description: 'วิเคราะห์กระบวนการค้นหาและเข้าถึงสารสนเทศของผู้ใช้ตาม Information Search Process (ISP)',
    preClassTasks: [
      'เตรียมประเด็นการสัมภาษณ์กลุ่มตัวอย่างเกี่ยวกับพฤติกรรมการสืบค้นข้อมูลงานวิจัย',
      'อ่านบทความวิจัยกรณีศึกษาพฤติกรรมผู้ใช้ของ Kuhlthau (1991)',
    ],
    examHighlights: [
      '6 ขั้นตอนของกระบวนการสืบค้นสารสนเทศตามโมเดล ISP ของ Kuhlthau',
      'ปัจจัยทางจิตวิทยาและสิ่งแวดล้อมที่ส่งผลต่อการแสวงหาสารสนเทศ',
    ],
    materials: [
      { name: 'สไลด์บทที่ 6: Information Seeking Behavior Models (PDF)', size: '3.1 MB' },
    ],
    syllabus: [
      { week: 1, topic: 'บทนำสู่พฤติกรรมสารสนเทศและผู้ใช้สารสนเทศ', status: 'done' },
      { week: 2, topic: 'ความต้องการสารสนเทศและบริบทของผู้ใช้', status: 'done' },
      { week: 3, topic: 'แบบจำลองพฤติกรรมสารสนเทศยุคแรก', status: 'done' },
      { week: 4, topic: 'แบบจำลองของ Ellis และ Dervin (Sense-Making)', status: 'done' },
      { week: 5, topic: 'แบบจำลองของ Wilson (1981, 1996, 1999)', status: 'done' },
      { week: 6, topic: 'แบบจำลอง ISP ของ Kuhlthau', status: 'current' },
      { week: 7, topic: 'พฤติกรรมสารสนเทศในยุคปัญญาประดิษฐ์และโซเชียลมีเดีย', status: 'upcoming' },
    ],
  },
  '89539764': {
    week: 6,
    topic: 'การออกแบบโมเดลธุรกิจด้วย Business Model Canvas (BMC) 9 ช่อง',
    description: 'ทดสอบคุณค่าของสินค้าและบริการ (Value Proposition) และวิเคราะห์กลุ่มลูกค้าเป้าหมาย (Customer Segments)',
    preClassTasks: [
      'ร่างไอเดียนวัตกรรมหรือผลิตภัณฑ์ของกลุ่ม 1 ไอเดียลงบน BMC Template',
      'เตรียมสไลด์นำเสนอ Elevator Pitch ความยาว 2 นาทีต่อกลุ่ม',
    ],
    examHighlights: [
      'ความสัมพันธ์ระหว่าง Customer Segments และ Value Propositions',
      'โครงสร้างต้นทุน (Cost Structure) และกระแสรายได้ (Revenue Streams)',
    ],
    materials: [
      { name: 'เทมเพลต Business Model Canvas (PDF)', size: '1.4 MB' },
      { name: 'สไลด์การบรรยาย: Startup & Innovation Strategy (PDF)', size: '4.8 MB' },
    ],
    syllabus: [
      { week: 1, topic: 'แนวคิดการเป็นผู้ประกอบการในศตวรรษที่ 21', status: 'done' },
      { week: 2, topic: 'การค้นหาโอกาสและไอเดียธุรกิจนวัตกรรม', status: 'done' },
      { week: 3, topic: 'Design Thinking: Empathize & Define', status: 'done' },
      { week: 4, topic: 'Design Thinking: Ideate & Prototype', status: 'done' },
      { week: 5, topic: 'การวิเคราะห์ตลาดและพฤติกรรมผู้บริโภค', status: 'done' },
      { week: 6, topic: 'Business Model Canvas (BMC) 9 ช่อง', status: 'current' },
      { week: 7, topic: 'การเงินเบื้องต้นสำหรับผู้ประกอบการ', status: 'upcoming' },
    ],
  },
};

export default function StudentScheduleGrid({
  summaries = [],
  semester = '1/2569',
  searchQuery = '',
  onSelectCourseForLeave,
}) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalTab, setModalTab] = useState('prep'); // 'prep' | 'exam' | 'syllabus' | 'info'

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
        const slotSpan = Math.max(1, endSlot - startSlot);

        const isMatch =
          !searchQuery ||
          [c.code, c.name, c.room, c.teacherName || c.teacher?.name].some(
            (field) => field && String(field).toLowerCase().includes(searchQuery.toLowerCase())
          );

        const prep = COURSE_PREP_DATA[c.code] || {
          week: 6,
          topic: `เนื้อหาการเรียนสัปดาห์ที่ 6: ${c.name}`,
          description: 'ศึกษาและเตรียมตัวล่วงหน้าก่อนเข้าห้องเรียนตามข้อกำหนดรายวิชา',
          preClassTasks: ['ทบทวนเนื้อหาบทเรียนของสัปดาห์ก่อนหน้า', 'จัดเตรียมแล็ปท็อปและเอกสารประกอบการเรียน'],
          examHighlights: ['คอนเซ็ปต์หลักและศัพท์สำคัญประจำบทเรียน', 'การประยุกต์ใช้งานในสถานการณ์จริง'],
          materials: [{ name: `เอกสารประกอบการสอนวิชา ${c.code} (PDF)`, size: '2.5 MB' }],
          syllabus: [
            { week: 1, topic: 'แนะนำรายวิชาและเกณฑ์การให้คะแนน', status: 'done' },
            { week: 6, topic: `บทเรียนสัปดาห์ที่ 6`, status: 'current' },
            { week: 8, topic: 'สอบกลางภาค (Midterm)', status: 'exam' },
          ],
        };

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
          prep,
        };
      })
      .filter(Boolean);
  }, [summaries, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Schedule Header Title */}
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

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="w-3 h-3 rounded-md bg-[#DDD6FE] dark:bg-purple-900/90 border border-purple-300 dark:border-purple-600" />
          <span className="hidden sm:inline font-medium">วิชาที่ลงทะเบียนเรียน</span>
        </div>
      </div>

      {/* Grid Container (Scrollable on small devices) */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px] p-4">
          {/* Header Row: Days label + Time Slots */}
          <div className="grid grid-cols-12 gap-1.5 mb-2 text-center text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <div className="col-span-1 py-2 bg-neutral-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-center font-bold">
              วัน
            </div>
            {TIME_SLOTS.map((t, idx) => (
              <div
                key={idx}
                className="col-span-1 py-2 bg-neutral-100 dark:bg-slate-800/80 rounded-xl text-[11px] truncate px-0.5"
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
                  className="grid grid-cols-12 gap-1.5 min-h-[114px] items-stretch p-1.5 rounded-2xl bg-neutral-50/50 dark:bg-slate-900/50 border border-neutral-150 dark:border-slate-800/70"
                >
                  {/* Day Label Column */}
                  <div
                    className={`col-span-1 flex flex-col items-center justify-center rounded-xl p-2 font-bold text-xs ${day.bgHeader}`}
                  >
                    <span className="tracking-tight text-sm">{day.dayEn.slice(0, 3)}</span>
                    <span className="text-[11px] opacity-80 font-normal">{day.dayTh.replace('วัน', '')}</span>
                  </div>

                  {/* 11 Time Slots */}
                  <div className="col-span-11 relative grid grid-cols-11 gap-1.5 min-h-[104px]">
                    {/* Background Grid Cells */}
                    {TIME_SLOTS.map((_, sIdx) => (
                      <div
                        key={sIdx}
                        className="border border-dashed border-neutral-200/60 dark:border-slate-800/80 rounded-xl h-full min-h-[104px]"
                      />
                    ))}

                    {/* Render Courses positioned absolute/grid */}
                    {dayCourses.map((c) => {
                      const leftPercent = (c.startSlot / 11) * 100;
                      const widthPercent = (c.slotSpan / 11) * 100;

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCourse(c);
                            setModalTab('prep');
                          }}
                          style={{
                            left: `${leftPercent}%`,
                            width: `calc(${widthPercent}% - 6px)`,
                          }}
                          className={`absolute top-1 bottom-1 p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md hover:scale-[1.01] ${
                            c.isMatch
                              ? 'bg-[#DDD6FE] dark:bg-purple-900/90 border border-purple-300 dark:border-purple-600 text-neutral-900 dark:text-white ring-2 ring-[#7749BC]/30'
                              : 'bg-neutral-200/60 dark:bg-slate-800/60 border border-neutral-300 dark:border-slate-700 opacity-40 text-neutral-600'
                          }`}
                          title={`${c.code} ${c.name} (${c.room})`}
                        >
                          {/* Card Top: Code + Group */}
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-extrabold text-xs font-mono truncate text-purple-950 dark:text-purple-100">
                                {c.code}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 dark:bg-purple-950/90 font-bold text-[#7749BC] dark:text-purple-300 shrink-0 border border-purple-200/50 dark:border-purple-700/50 shadow-2xs">
                                กลุ่ม {c.group}
                              </span>
                            </div>

                            {/* Card Middle: Full Course Name */}
                            <p className="text-xs font-bold leading-snug line-clamp-2 text-neutral-900 dark:text-white">
                              {c.name}
                            </p>
                          </div>

                          {/* Card Bottom: Room & Time (Strictly on its own row, never overlapping) */}
                          <div className="flex items-center justify-between gap-2 pt-1.5 mt-auto border-t border-purple-300/70 dark:border-purple-700/70 text-[11px]">
                            <span className="flex items-center gap-1 font-semibold text-neutral-800 dark:text-purple-200 truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#7749BC] dark:text-purple-300" />
                              <span className="truncate font-mono">{c.room}</span>
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[10px] text-neutral-700 dark:text-purple-300 font-semibold shrink-0">
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
          onClick={() => setSelectedCourse(null)}
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
                onClick={() => setSelectedCourse(null)}
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
                  <Clock className="w-3 h-3 text-[#7749BC]" /> เวลาเรียนสะสม
                </span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 text-xs font-mono">
                  {selectedCourse.attendance}% ({selectedCourse.attended}/{selectedCourse.total} คาบ)
                </p>
              </div>
            </div>

            {/* Modal Tabs Navigation: เตรียมตัวก่อนเรียน | แนวข้อสอบ | แผน 15 สัปดาห์ */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab('prep')}
                className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'syllabus'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>แผน 15 สัปดาห์</span>
              </button>
            </div>

            {/* TAB 1: เตรียมตัวก่อนเรียน (Pre-class Prep) */}
            {modalTab === 'prep' && (
              <div className="space-y-3 animate-in fade-in duration-100">
                {/* Current Week Banner */}
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/70 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#7749BC] text-white">
                      สัปดาห์ที่ {selectedCourse.prep.week}
                    </span>
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
                        className="p-2.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between text-xs"
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
                      className="p-3 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-start gap-2.5 text-xs text-neutral-800 dark:text-neutral-200"
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
                        ? 'bg-neutral-50/60 dark:bg-slate-850/40 border-neutral-200/60 dark:border-slate-800 text-neutral-500'
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
            <div className="pt-2 flex items-center gap-2 border-t border-neutral-100 dark:border-slate-800">
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
                className="flex-1 py-2.5 px-4 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <FileEdit className="w-4 h-4" />
                <span>ยื่นใบลาสำหรับวิชานี้</span>
              </button>
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
