'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  Users,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  HeartPulse,
  User,
  HelpCircle,
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import AttachmentPreview from '@/components/AttachmentPreview';

// Helper to format Thai date with day of the week
function formatThaiDayOfWeekDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];
    const thaiYear = d.getFullYear() + 543;
    const dayName = dayNames[d.getDay()];
    return `${dayName}ที่ ${d.getDate()} ${monthNames[d.getMonth()]} ${thaiYear}`;
  } catch {
    return dateStr;
  }
}

function extractTime(periodStr) {
  if (!periodStr) return '09:00 - 11:50';
  const match = periodStr.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/);
  return match ? match[0] : periodStr;
}

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

export default function WireframeStatsView({ courses = [], leaves = [], rosterByCourse = {} }) {
  // 1. Group courses by unique Subject (Code + Acronym)
  const subjectGroups = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      const key = c.acronym || c.code;
      if (!map.has(key)) {
        map.set(key, {
          key,
          acronym: c.acronym || key,
          code: c.code,
          name: c.name,
          shortName: c.shortName || 'รายวิชา',
          term: c.term,
          sections: [],
        });
      }
      map.get(key).sections.push(c);
    });
    return Array.from(map.values());
  }, [courses]);

  // Selected Subject on the Left Sidebar (default to first subject, e.g. SA)
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(
    subjectGroups[0]?.key || 'SA'
  );

  const currentSubject = useMemo(() => {
    return subjectGroups.find((s) => s.key === selectedSubjectKey) || subjectGroups[0] || null;
  }, [subjectGroups, selectedSubjectKey]);

  // Selected Section (Course ID) — default to first section of selected subject if available
  const [selectedCourseId, setSelectedCourseId] = useState(
    currentSubject?.sections[0]?.id || null
  );

  // When subject changes, reset section or pick its first section
  function handleSelectSubject(key) {
    setSelectedSubjectKey(key);
    const sub = subjectGroups.find((s) => s.key === key);
    if (sub && sub.sections.length > 0) {
      setSelectedCourseId(sub.sections[0].id);
    } else {
      setSelectedCourseId(null);
    }
  }

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Year and Semester Filter State (as drawn in wireframe: < 2569 > and [ 1 | 2 ])
  const [selectedYear, setSelectedYear] = useState('2569');
  const [selectedSemester, setSelectedSemester] = useState('1');

  // Search input for students
  const [studentSearch, setStudentSearch] = useState('');

  // Modal State for Individual Student Drill-down (Step 3)
  const [modalStudent, setModalStudent] = useState(null); // student object
  const [modalLeaveCategory, setModalLeaveCategory] = useState(null); // null = Overview, 'ลาป่วย' | 'ลากิจส่วนตัว' | 'ลากิจกรรม' | 'อื่นๆ'

  // Student list in current section
  const sectionStudents = useMemo(() => {
    if (!selectedCourseId) return [];
    const roster = rosterByCourse[selectedCourseId] || [];

    return roster.map((s) => {
      // Find leaves belonging to this student in this course
      const studentLeaves = leaves.filter(
        (l) =>
          (l.courseId === selectedCourseId || l.courseCode === selectedCourse?.code) &&
          (l.studentCode === s.studentCode || l.studentId === s.studentId || l.studentName === s.studentName)
      );

      const sickCount = studentLeaves.filter((l) => l.type === 'ลาป่วย').length;
      const personalCount = studentLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;
      const activityCount = studentLeaves.filter((l) => l.type === 'ลากิจกรรม').length;
      const otherCount = studentLeaves.filter(
        (l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน'
      ).length;

      const totalLeavesCount = studentLeaves.length;

      return {
        ...s,
        totalLeavesCount,
        sickCount,
        personalCount,
        activityCount,
        otherCount,
        leaves: studentLeaves,
      };
    });
  }, [selectedCourseId, rosterByCourse, leaves, selectedCourse]);

  // Filtered by search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return sectionStudents;
    const q = studentSearch.toLowerCase();
    return sectionStudents.filter(
      (s) =>
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.studentCode || '').includes(q)
    );
  }, [sectionStudents, studentSearch]);

  return (
    <div className="space-y-6">
      {/* 2-Column Hierarchical Layout from Wireframe (Page 2) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Mobile Course Dropdown (Visible on < lg screens) */}
        <div className="lg:hidden w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-neutral-200/80 dark:border-slate-800 p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-light text-neutral-500 dark:text-neutral-400 px-1 uppercase tracking-wider">
            <span>รายวิชาที่สอน</span>
            <span className="text-[11px] font-normal normal-case text-[#7749BC] dark:text-purple-300 font-bold">
              {subjectGroups.length} รายวิชา
            </span>
          </div>
          <div className="relative">
            <select
              value={selectedSubjectKey}
              onChange={(e) => handleSelectSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-9 cursor-pointer shadow-xs"
            >
              {subjectGroups.map((subject) => (
                <option key={subject.key} value={subject.key}>
                  {subject.acronym} - {subject.shortName} ({subject.sections.length} กลุ่ม)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Desktop Left Sidebar: รายวิชาที่สอน (Visible on lg+ screens) */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3 sticky top-24">
          <div className="px-2 pb-2 border-b border-neutral-100 dark:border-slate-800">
            <h3 className="font-light text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              รายวิชาที่สอน
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">เลือกวิชาเพื่อดูกลุ่มเรียน</p>
          </div>

          <nav className="flex flex-col gap-1.5">
            {subjectGroups.map((subject) => {
              const isActive = selectedSubjectKey === subject.key;
              return (
                <button
                  key={subject.key}
                  onClick={() => handleSelectSubject(subject.key)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all shrink-0 w-full text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20 ring-2 ring-purple-300/30'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-10 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs tracking-wider shadow-xs ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300'
                      }`}
                    >
                      {subject.acronym}
                    </span>
                    <div>
                      <p className="font-semibold">{subject.shortName}</p>
                      <p
                        className={`text-[10px] font-mono ${
                          isActive ? 'text-white/80' : 'text-neutral-400'
                        }`}
                      >
                        {subject.code}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-100 dark:bg-slate-800 text-neutral-500'
                    }`}
                  >
                    {subject.sections.length} กลุ่ม
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* STEP 1: กลุ่มเรียน (Section Selector) */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                  {currentSubject?.acronym}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {currentSubject?.code} {currentSubject?.name}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    กดเลือกรายวิชาจากแถบเมนูแล้ว กดเลือกกลุ่มเรียน
                  </p>
                </div>
              </div>
            </div>

            {/* List of Sections for this course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentSubject?.sections.map((section) => {
                const isSelected = selectedCourseId === section.id;
                const rosterCount = (rosterByCourse[section.id] || []).length;
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedCourseId(section.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#7749BC] bg-purple-50/70 dark:bg-purple-950/40 text-[#7749BC] dark:text-purple-300 shadow-sm ring-2 ring-purple-300/30'
                        : 'border-neutral-200/80 dark:border-slate-800 hover:border-purple-200 dark:hover:border-slate-700 hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-[#7749BC] bg-[#7749BC]'
                            : 'border-neutral-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {section.code} {currentSubject.shortName} กลุ่ม {section.group}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {section.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-800 border border-neutral-200/60 dark:border-slate-700 font-semibold text-neutral-600 dark:text-neutral-300">
                      {rosterCount} คน
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: SECTION ROSTER VIEW ("เลือกดูแบบบุคคล") */}
          {selectedCourse && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              {/* Header / Filter Row from Wireframe */}
              <div className="p-5 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/60 dark:bg-slate-900/50 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Subject and Section Info */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-[#7749BC] text-white font-bold">
                        รหัสวิชา: {selectedCourse.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 font-semibold">
                        ชื่อวิชา: {currentSubject?.shortName || selectedCourse.name}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                        กลุ่ม: {selectedCourse.group}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                      {selectedCourse.name}
                    </h3>
                  </div>

                  {/* Filters: เลือกปี / เลือกเทอม */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 w-full lg:w-auto">
                    {/* เลือกปี */}
                    <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-start gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-neutral-200/80 dark:border-slate-700 shadow-xs">
                      <span className="text-[11px] font-semibold text-neutral-500">เลือกปี:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedYear((y) => String(Number(y) - 1))}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                          title="ปีก่อนหน้า"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 px-1 font-mono">
                          {selectedYear}
                        </span>
                        <button
                          onClick={() => setSelectedYear((y) => String(Number(y) + 1))}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                          title="ปีถัดไป"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* เลือกเทอม */}
                    <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-neutral-200/80 dark:border-slate-700 shadow-xs">
                      <span className="text-[11px] font-semibold text-neutral-500 px-2">เลือกเทอม:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedSemester('1')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedSemester === '1'
                              ? 'bg-[#7749BC] text-white shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                          }`}
                        >
                          1
                        </button>
                        <button
                          onClick={() => setSelectedSemester('2')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedSemester === '2'
                              ? 'bg-[#7749BC] text-white shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                          }`}
                        >
                          2
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtitle & Search Box */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#7749BC]" />
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      เลือกดูแบบบุคคล
                    </span>
                    <span className="text-xs text-neutral-400">
                      (นิสิตทั้งหมดในกลุ่มเรียน {sectionStudents.length} คน)
                    </span>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="ค้นหารหัสนิสิต หรือชื่อ-นามสกุล..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-1 focus:ring-[#7749BC]"
                    />
                  </div>
                </div>
              </div>

              {/* Student Roster Table/List */}
              <div className="divide-y divide-neutral-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400">
                    ไม่พบรายชื่อนิสิตที่ตรงกับคำค้นหา
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.studentId}
                      onClick={() => {
                        setModalStudent(student);
                        setModalLeaveCategory(null); // start at overview
                      }}
                      className="p-4 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-slate-600 group-hover:border-[#7749BC] group-hover:bg-[#7749BC] transition-colors flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200/60 dark:border-purple-800/60">
                          {initials(student.studentName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                              {student.studentCode}
                            </span>
                            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors">
                              {student.studentName}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            เข้าเรียน {student.attended}/{student.totalSessions} คาบ • เข้าเรียน {student.percentage}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {student.totalLeavesCount > 0 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            ลาเรียน {student.totalLeavesCount} ครั้ง
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-slate-800 text-neutral-400">
                            ไม่มีประวัติการลา
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-[#7749BC] transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: INDIVIDUAL STUDENT LEAVE MODAL (Pop-up / Bottom Sheet from Page 2 Wireframe) */}
      {modalStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-2 duration-200">
            {/* Grab Handle for Mobile Bottom Sheet */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white dark:bg-slate-900 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-slate-700" />
            </div>

            {/* Modal Header — Sticky top for mobile & desktop */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-purple-900/20 shrink-0">
                  {initials(modalStudent.studentName)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {modalStudent.studentName}
                  </h3>
                  <p className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 font-mono">
                    รหัสนิสิต {modalStudent.studentCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden xs:block sm:block text-right">
                  <span className="text-[10px] sm:text-[11px] text-neutral-400 block leading-tight">จำนวนครั้งที่ลา</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
                    {modalStudent.totalLeavesCount} ครั้ง
                  </span>
                </div>
                {/* ฟังก์ชันย้อนกลับมุมบนสุดด้านขวา กดได้จริง */}
                <button
                  type="button"
                  onClick={() => {
                    if (modalLeaveCategory) {
                      setModalLeaveCategory(null);
                    } else {
                      setModalStudent(null);
                    }
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer shadow-xs"
                  title="ย้อนกลับ"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalStudent(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
                  title="ปิด"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* PHASE 1: OVERVIEW (Choose leave category) */}
              {!modalLeaveCategory ? (
                <div className="space-y-5">
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 text-xs text-[#7749BC] dark:text-purple-300 font-medium">
                    หลังจากเลือกนิสิตแล้ว เลือกประเภทการลาที่จะดูรายละเอียด
                  </div>

                  {/* 4 Leave Category Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* 1. ลาป่วย */}
                    <button
                      onClick={() => setModalLeaveCategory('ลาป่วย')}
                      className="p-4 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30 text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
                    >
                      <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 block">
                        1. ลาป่วย
                      </span>
                      <span className="text-2xl font-bold text-sky-900 dark:text-sky-100 mt-1 block">
                        {modalStudent.sickCount}
                      </span>
                      <span className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 block">
                        คลิกเพื่อดูรายการ
                      </span>
                    </button>

                    {/* 2. ลากิจส่วนตัว */}
                    <button
                      onClick={() => setModalLeaveCategory('ลากิจส่วนตัว')}
                      className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
                    >
                      <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 block">
                        2. ลากิจส่วนตัว
                      </span>
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1 block">
                        {modalStudent.personalCount}
                      </span>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 block">
                        คลิกเพื่อดูรายการ
                      </span>
                    </button>

                    {/* 3. ลากิจกรรม */}
                    <button
                      onClick={() => setModalLeaveCategory('ลากิจกรรม')}
                      className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
                    >
                      <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 block">
                        3. ลากิจกรรม
                      </span>
                      <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1 block">
                        {modalStudent.activityCount}
                      </span>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 block">
                        คลิกเพื่อดูรายการ
                      </span>
                    </button>

                    {/* 4. อื่นๆ */}
                    <button
                      onClick={() => setModalLeaveCategory('อื่นๆ')}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
                    >
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                        4. อื่น ๆ
                      </span>
                      <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 block">
                        {modalStudent.otherCount}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 block">
                        คลิกเพื่อดูรายการ
                      </span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => setModalStudent(null)}
                      className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      ย้อนกลับ / ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              ) : (
                /* PHASE 2: DETAIL BY CATEGORY (Strictly matching wireframe) */
                <div className="space-y-4">
                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'อื่นๆ'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setModalLeaveCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            modalLeaveCategory === cat
                              ? 'bg-[#7749BC] text-white shadow-xs ring-2 ring-purple-300/30'
                              : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                          }`}
                        >
                          {cat} (
                          {cat === 'ลาป่วย'
                            ? modalStudent.sickCount
                            : cat === 'ลากิจส่วนตัว'
                            ? modalStudent.personalCount
                            : cat === 'ลากิจกรรม'
                            ? modalStudent.activityCount
                            : modalStudent.otherCount}
                          )
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setModalLeaveCategory(null)}
                      className="text-xs font-semibold text-[#7749BC] dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>กลับไปเลือกประเภทอื่น</span>
                    </button>
                  </div>

                  {/* Leave Items List for this category */}
                  {(() => {
                    const leavesInCat = modalStudent.leaves.filter((l) => {
                      if (modalLeaveCategory === 'อื่นๆ') {
                        return l.type === 'อื่นๆ' || l.type === 'อื่น ๆ' || l.type === 'เหตุฉุกเฉิน';
                      }
                      return l.type === modalLeaveCategory;
                    });

                    const currentCatCount =
                      modalLeaveCategory === 'ลาป่วย'
                        ? modalStudent.sickCount
                        : modalLeaveCategory === 'ลากิจส่วนตัว'
                        ? modalStudent.personalCount
                        : modalLeaveCategory === 'ลากิจกรรม'
                        ? modalStudent.activityCount
                        : modalStudent.otherCount;

                    if (leavesInCat.length === 0) {
                      return (
                        <div className="p-8 text-center rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-200/60 dark:border-slate-700/60 text-xs text-neutral-400">
                          ไม่มีประวัติการลาในหมวด &quot;{modalLeaveCategory}&quot;
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {leavesInCat.map((leave, idx) => (
                          <div
                            key={leave.id || idx}
                            className="p-5 rounded-2xl border border-neutral-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-800/60 shadow-xs space-y-3.5"
                          >
                            {/* 1. รหัสวิชา ถัดมาคือ ชื่อวิชา | ด้านขวา: จำนวนครั้งที่ลาและแสดงตัวเลข */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-neutral-100 dark:border-slate-700/60">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-[#7749BC] text-white">
                                  {selectedCourse.code}
                                </span>
                                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                  {selectedCourse.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                  จำนวนครั้งที่ลา
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
                                  {currentCatCount} ครั้ง
                                </span>
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ml-1 ${
                                    leave.status === 'อนุมัติ'
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      : leave.status === 'ไม่อนุมัติ'
                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  {leave.status}
                                </span>
                              </div>
                            </div>

                            {/* 2. ประเภทการลา ให้อยู่ด้านล่างรหัสวิชา ถัดมาคือ วันที่ลา และ เวลาที่เรียน */}
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-neutral-500 dark:text-neutral-400">
                                  ประเภทการลา:
                                </span>
                                <span className="font-bold text-[#7749BC] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">
                                  {leave.type || modalLeaveCategory}
                                </span>
                              </div>
                              <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-neutral-500 dark:text-neutral-400">
                                  วันที่ลา:
                                </span>
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                  {formatThaiDayOfWeekDate(leave.startDate)}
                                </span>
                              </div>
                              <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-neutral-500 dark:text-neutral-400">
                                  เวลาที่เรียน:
                                </span>
                                <span className="font-mono text-neutral-800 dark:text-neutral-200">
                                  {extractTime(leave.period)}
                                </span>
                              </div>
                            </div>

                            {/* 3. ด้านล่างประเภทการลาคือ เหตุผลการลาเรียน */}
                            <div className="p-3 rounded-xl bg-neutral-50/90 dark:bg-slate-900/60 border border-neutral-100 dark:border-slate-800 text-xs">
                              <span className="font-bold text-neutral-700 dark:text-neutral-300">
                                เหตุผลการลาเรียน:
                              </span>
                              <span className="ml-2 text-neutral-800 dark:text-neutral-200">
                                {leave.reason || 'ป่วยเป็นโควิด-19'}
                              </span>
                            </div>

                            {/* 4. และด้านล่างคือหลักฐาน สามารถกดหลักฐานเพื่อดูใบลาที่แนบมาด้วยได้ */}
                            <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                                  หลักฐาน:
                                </span>
                                {leave.attachment ? (
                                  <AttachmentPreview
                                    src={
                                      leave.attachment.startsWith('/')
                                        ? leave.attachment
                                        : `/api/leaves/attachment/${leave.attachment}`
                                    }
                                    label="หลักฐาน (สามารถกดดูใบลาได้)"
                                    thumbClassName="w-7 h-7 rounded-lg"
                                  />
                                ) : (
                                  <span className="text-neutral-400 italic">ไม่มีเอกสารแนบ</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="pt-4 border-t border-neutral-100 dark:border-slate-800 flex justify-between">
                    <button
                      onClick={() => setModalLeaveCategory(null)}
                      className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>ย้อนกลับไปหน้าสรุป</span>
                    </button>
                    <button
                      onClick={() => setModalStudent(null)}
                      className="px-4 py-2 rounded-xl bg-[#7749BC] text-white text-xs font-semibold shadow-xs hover:bg-[#5B21B6] transition-colors cursor-pointer"
                    >
                      ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
