'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  BookOpen,
  FileText,
  Download,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BarChart3,
  X,
  Save,
  Check,
} from 'lucide-react';
import TeacherSidebar from '@/components/TeacherSidebar';
import TeacherTopBar from '@/components/TeacherTopBar';
import TeacherScheduleGrid from '@/components/TeacherScheduleGrid';
import MobileBottomNav from '@/components/MobileBottomNav';

const SAMPLE_LESSON_PLANS = {
  '24527664': [
    {
      week: 1,
      topic: 'บทนำสู่การวิเคราะห์และออกแบบระบบสารสนเทศ (Introduction to SA&D)',
      status: 'completed',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'เข้าใจวงจรการพัฒนาระบบ (SDLC), บทบาทของนักวิเคราะห์ระบบ และข้อตกลงการประเมินผลรายวิชา',
      materials: [
        { name: 'Ch01-Introduction-to-SAD.pdf', size: '2.4 MB', type: 'slide' },
        { name: 'Syllabus-24527664-2569.pdf', size: '650 KB', type: 'doc' },
      ],
      notes: 'นิสิตดาวน์โหลดเอกสารครบถ้วน มอบหมายหัวข้อโปรเจกต์ประจำกลุ่ม',
    },
    {
      week: 2,
      topic: 'การเก็บรวบรวมและการวิเคราะห์ความต้องการ (Requirements Determination)',
      status: 'completed',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'เรียนรู้เทคนิคการสัมภาษณ์ผู้ใช้, แบบสอบถาม, และการสังเกตการณ์เพื่อสกัด Functional & Non-functional Requirements',
      materials: [
        { name: 'Ch02-Requirements-Gathering.pdf', size: '3.1 MB', type: 'slide' },
        { name: 'Lab01-Requirements-Spec.docx', size: '420 KB', type: 'lab' },
      ],
      notes: 'ตรวจแบบฝึกหัดการแยกแยะ Functional vs Non-functional ของระบบลาเรียน',
    },
    {
      week: 3,
      topic: 'การจำลองกระบวนการธุรกิจด้วย Use Case Diagram (Business Modeling)',
      status: 'completed',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'สามารถวาด Actor, Use Case, Include, Extend และเขียน Use Case Description ได้อย่างถูกต้อง',
      materials: [
        { name: 'Ch03-Use-Case-Modeling.pdf', size: '4.2 MB', type: 'slide' },
        { name: 'CaseStudy-TakeALeave-UseCases.pdf', size: '1.2 MB', type: 'doc' },
      ],
      notes: 'เน้นย้ำเรื่องความแตกต่างระหว่าง Include กับ Extend ในขั้นตอนการอนุมัติคำขอ',
    },
    {
      week: 4,
      topic: 'การจำลองกระบวนการทำงานด้วย Activity Diagram',
      status: 'completed',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'วาด Swimlane, Action node, Decision node และ Fork/Join สำหรับ Flow การทำงานคู่ขนาน',
      materials: [
        { name: 'Ch04-Activity-Diagram.pdf', size: '2.8 MB', type: 'slide' },
        { name: 'Lab02-Activity-Diagram-Drawio.zip', size: '1.5 MB', type: 'lab' },
      ],
      notes: 'นิสิตสามารถทำแบบฝึกหัด Flow การแนบใบรับรองแพทย์ได้ดี',
    },
    {
      week: 5,
      topic: 'การจำลองโครงสร้างข้อมูลเชิงมโนทัศน์ (Domain Model & Class Diagram)',
      status: 'completed',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'ระบุ Entity, Attributes, Multiplicity และความสัมพันธ์ Association, Generalization, Composition',
      materials: [
        { name: 'Ch05-Conceptual-Class-Diagram.pdf', size: '3.5 MB', type: 'slide' },
        { name: 'Data-Dictionary-Template.xlsx', size: '310 KB', type: 'doc' },
      ],
      notes: 'ชี้แนะการเชื่อมตาราง Leave, Student, Course, Roster',
    },
    {
      week: 6,
      topic: 'การทดสอบความต้องการและการสอบย่อยครั้งที่ 1 (Quiz 1)',
      status: 'completed',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'ประเมินความรู้ความเข้าใจบทที่ 1 ถึง 5 และตรวจสอบความคืบหน้าโปรเจกต์รอบแรก',
      materials: [{ name: 'Quiz1-Review-Questions.pdf', size: '920 KB', type: 'doc' }],
      notes: 'คะแนนเฉลี่ย 82% นิสิตกลุ่ม 02 มีข้อสงสัยเรื่อง Multiplicity',
    },
    {
      week: 7,
      topic: 'สถาปัตยกรรมระบบสารสนเทศ (System Architecture & Tier Design)',
      status: 'completed',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'เข้าใจ Client-Server, 3-Tier Architecture, Microservices และการออกแบบ Web API',
      materials: [
        { name: 'Ch07-Architecture-Design.pdf', size: '3.8 MB', type: 'slide' },
        { name: 'REST-API-Specification-Doc.pdf', size: '1.1 MB', type: 'doc' },
      ],
      notes: 'อธิบายเคสตัวอย่างของเว็บ Take A Leave และการทำงาน Next.js Server Components',
    },
    {
      week: 8,
      topic: 'การจำลองพฤติกรรมของระบบด้วย Sequence Diagram และ State Machine',
      status: 'current', // กำลังสอน / คาบถัดไป
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'นิสิตสามารถแปลง Scenario การยื่นและอนุมัติคำขอลาเรียนเป็น Sequence Diagram และสร้าง State Transition ของสถานะคำขอลาได้',
      materials: [
        { name: 'Ch08-Sequence-and-State-Diagrams.pdf', size: '4.5 MB', type: 'slide' },
        { name: 'Lab03-Sequence-TakeALeave.docx', size: '540 KB', type: 'lab' },
        { name: 'sample-sequence-code.zip', size: '2.1 MB', type: 'code' },
      ],
      notes: 'เตรียมตัวอย่าง Workflow ของอาจารย์ในการกดปุ่ม "พิจารณาใหม่" และการส่ง Notification',
    },
    {
      week: 9,
      topic: 'การออกแบบส่วนประสานผู้ใช้และการทดสอบความสะดวกใช้ (UI/UX Design & Usability)',
      status: 'upcoming',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'หลักการ Human-Computer Interaction, Design System และการทำ Usability Testing',
      materials: [{ name: 'Ch09-UIUX-Design-Principles.pdf', size: '5.2 MB', type: 'slide' }],
      notes: 'เตือนนิสิตเตรียม Wireframe สำหรับตรวจรอบที่สอง',
    },
    {
      week: 10,
      topic: 'การออกแบบฐานข้อมูลเชิงสัมพันธ์ (Database Design & Normalization)',
      status: 'upcoming',
      date: 'วันจันทร์ 09:00 - 11:50',
      room: 'QS2-701',
      objectives: 'การแปลง Class Diagram สู่ Relational Schema และการทำ 1NF, 2NF, 3NF',
      materials: [{ name: 'Ch10-Relational-Database-Design.pdf', size: '3.2 MB', type: 'slide' }],
      notes: 'เตรียมแบบฝึกหัด ER to Relational',
    },
  ],
  '24527564': [
    {
      week: 1,
      topic: 'บทนำสู่ระบบนิเวศซอฟต์แวร์โอเพนซอร์ส (Introduction to Open Source)',
      status: 'completed',
      date: 'วันอังคาร 13:00 - 16:50',
      room: 'QS2-407',
      objectives: 'เข้าใจใบอนุญาตโอเพนซอร์ส (MIT, Apache, GPL) และการมีส่วนร่วมในโครงการชุมชน',
      materials: [{ name: 'Ch01-OpenSource-EcoSystem.pdf', size: '2.1 MB', type: 'slide' }],
      notes: 'สอนการตั้งค่า Git & GitHub Account และ SSH Key',
    },
    {
      week: 8,
      topic: 'การพัฒนาเว็บแอปพลิเคชันด้วย Next.js และ React Open Source Ecosystem',
      status: 'current',
      date: 'วันอังคาร 13:00 - 16:50',
      room: 'QS2-407',
      objectives: 'สร้าง CRUD Application, State Management และการเชื่อมต่อ REST API',
      materials: [
        { name: 'Ch08-Nextjs-Fullstack-Dev.pdf', size: '4.8 MB', type: 'slide' },
        { name: 'lab04-starter-nextjs.zip', size: '8.4 MB', type: 'code' },
      ],
      notes: 'ตรวจงานแล็บการทำหน้า Dashboard และการจัดการฟอร์ม',
    },
  ],
};

export default function TeacherScheduleView({
  user,
  courses = [],
  leaves = [],
  rosterByCourse = {},
  usingMock = false,
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedCourseCode, setSelectedCourseCode] = useState('24527664');
  const [lessonPlans, setLessonPlans] = useState(SAMPLE_LESSON_PLANS);
  const [editingWeek, setEditingWeek] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [toast, setToast] = useState(null);

  // Group courses by unique subject
  const availableCourses = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      if (!map.has(c.code)) {
        map.set(c.code, {
          code: c.code,
          name: c.name,
          acronym: c.acronym || 'SA',
          groups: [c.group || '01'],
        });
      } else {
        map.get(c.code).groups.push(c.group || '02');
      }
    });
    if (map.size === 0) {
      map.set('24527664', {
        code: '24527664',
        name: 'การวิเคราะห์และออกแบบระบบสารสนเทศ',
        acronym: 'SA',
        groups: ['01', '02'],
      });
      map.set('24527564', {
        code: '24527564',
        name: 'การประยุกต์โปรแกรมโอเพนซอร์ส',
        acronym: 'OSS',
        groups: ['01', '02'],
      });
    }
    return Array.from(map.values());
  }, [courses]);

  const activeCourse = useMemo(() => {
    return availableCourses.find((c) => c.code === selectedCourseCode) || availableCourses[0];
  }, [availableCourses, selectedCourseCode]);

  const activeLessons = useMemo(() => {
    return lessonPlans[selectedCourseCode] || lessonPlans['24527664'] || [];
  }, [lessonPlans, selectedCourseCode]);

  const currentLesson = useMemo(() => {
    return activeLessons.find((l) => l.status === 'current') || activeLessons[0];
  }, [activeLessons]);

  function handleSaveNote() {
    if (!editingWeek) return;
    setLessonPlans((prev) => {
      const courseLessons = prev[selectedCourseCode] || [];
      const updated = courseLessons.map((l) =>
        l.week === editingWeek.week ? { ...l, notes: editNotes } : l
      );
      return { ...prev, [selectedCourseCode]: updated };
    });
    setEditingWeek(null);
    setToast('บันทึกเนื้อหาเตรียมการสอนเรียบร้อยแล้ว');
    setTimeout(() => setToast(null), 3000);
  }

  const totalPendingCount = useMemo(() => leaves.filter((l) => l.status === 'รออนุมัติ').length, [leaves]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row">
      <TeacherSidebar
        user={user}
        mode="menu"
        activeTab="schedule"
        pendingCount={totalPendingCount}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-64 sm:lg:pl-68 flex flex-col min-w-0">
        <TeacherTopBar
          user={user}
          semester="1/2569"
          searchPlaceholder="ค้นหาหัวข้อการสอน, วิชา, หรือห้องเรียน..."
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header Banner */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shadow-xs">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                  ตารางสอนและการเตรียมการสอน (Schedule & Lesson Prep)
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  ตารางเรียนประจำสัปดาห์ แผนการสอนรายสัปดาห์ และเนื้อหาเตรียมการสอนนิสิต
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Weekly Timetable Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7749BC]" />
                <span>ตารางเรียนและห้องสอนประจำสัปดาห์</span>
              </h2>
            </div>
            <TeacherScheduleGrid courses={courses} />
          </section>

          {/* Section 2: Lesson Preparation & Syllabus System */}
          <section className="space-y-5 pt-4 border-t border-neutral-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#7749BC]" />
                  <span>ระบบการเตรียมการเนื้อหาและข้อมูลสำหรับสอนนิสิต (Lesson Preparation)</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  เตรียมสื่อการสอน วัตถุประสงค์การเรียนรู้ และบันทึกการสอนในแต่ละคาบเรียน
                </p>
              </div>

              {/* Course Selector Tabs */}
              <div className="flex items-center gap-2">
                {availableCourses.map((c) => {
                  const isSelected = selectedCourseCode === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCourseCode(c.code)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                          : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-200/80 dark:border-slate-700'
                      }`}
                    >
                      <span>{c.acronym}</span> • <span className="font-mono">{c.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Week Highlight Card */}
            {currentLesson && (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent border-2 border-purple-300/80 dark:border-purple-800/80 backdrop-blur-xl shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-[#7749BC] text-white text-xs font-black shadow-xs">
                      สัปดาห์ที่ {currentLesson.week} (คาบเรียนปัจจุบัน)
                    </span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#7749BC]" />
                      {currentLesson.date}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      ห้อง {currentLesson.room}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingWeek(currentLesson);
                      setEditNotes(currentLesson.notes || '');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 text-[#7749BC] dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขบันทึกเตรียมสอน</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {currentLesson.topic}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                    <strong>วัตถุประสงค์:</strong> {currentLesson.objectives}
                  </p>
                </div>

                {/* Materials & Prep Notes Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-purple-100 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#7749BC]" />
                      <span>สื่อและเอกสารประกอบการสอน ({currentLesson.materials.length} ไฟล์)</span>
                    </p>
                    <div className="space-y-1.5">
                      {currentLesson.materials.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 text-xs"
                        >
                          <span className="font-mono text-neutral-800 dark:text-neutral-200 truncate max-w-[220px]">
                            {m.name}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono shrink-0">
                            {m.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-purple-100 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>บันทึกเตรียมการสอนของอาจารย์</span>
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
                      "{currentLesson.notes || 'ยังไม่มีบันทึกเพิ่มเติม'}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Complete 10-15 Weeks Syllabus List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                แผนการสอนรายสัปดาห์ตลอดภาคการศึกษา
              </h3>

              <div className="space-y-2.5">
                {activeLessons.map((lesson) => {
                  const isDone = lesson.status === 'completed';
                  const isCurrent = lesson.status === 'current';

                  return (
                    <div
                      key={lesson.week}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 ring-1 ring-purple-300/30'
                          : isDone
                          ? 'bg-white/80 dark:bg-slate-900/80 border-neutral-200/80 dark:border-slate-800 opacity-90'
                          : 'bg-white/60 dark:bg-slate-900/60 border-neutral-200/60 dark:border-slate-800/60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                              isCurrent
                                ? 'bg-[#7749BC] text-white shadow-xs'
                                : isDone
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-neutral-100 dark:bg-slate-800 text-neutral-500'
                            }`}
                          >
                            {lesson.week}
                          </span>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                {lesson.topic}
                              </h4>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                                  สัปดาห์ปัจจุบัน
                                </span>
                              )}
                              {isDone && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200">
                                  สอนแล้ว
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                              {lesson.objectives}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {lesson.materials.length} ไฟล์
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWeek(lesson);
                              setEditNotes(lesson.notes || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                          >
                            บันทึก
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* EDIT NOTES MODAL */}
      {editingWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300">
                  สัปดาห์ที่ {editingWeek.week}
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                  บันทึกเตรียมการสอน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWeek(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 font-medium">
              {editingWeek.topic}
            </p>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                ข้อความบันทึกเตรียมการสอน / เตือนความจำ
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="ระบุข้อความ เช่น หัวข้อที่ต้องเน้น, สื่อที่ต้องเปิด, กำหนดส่งงาน..."
                rows={4}
                className="w-full p-3 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingWeek(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึก</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-150">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toast}</span>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (< md) */}
      <MobileBottomNav
        role="teacher"
        activeTab="schedule"
        pendingCount={totalPendingCount}
        onOpenDrawer={() => setMobileSidebarOpen(true)}
      />
    </div>
  );
}
