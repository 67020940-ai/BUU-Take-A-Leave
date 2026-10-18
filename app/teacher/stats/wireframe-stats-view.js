'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  HeartPulse,
  User,
  HelpCircle,
  Search,
  ArrowLeft,
  Clock,
  MoreVertical,
  ChevronDown,
  Filter,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import TeacherSidebar from '@/components/TeacherSidebar';
import TeacherTopBar from '@/components/TeacherTopBar';
import AttachmentPreview from '@/components/AttachmentPreview';
import ArchiveView from '@/app/teacher/archive/archive-view';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Archive, BarChart3 } from 'lucide-react';
import { useSidebarCollapsed } from '@/lib/useSidebarCollapsed';
import LeaveBarChart from '@/components/charts/LeaveBarChart';
import LeaveDonutChart from '@/components/charts/LeaveDonutChart';

// Helper to format Thai date
function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    if (dateStr.includes('/')) return dateStr;
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const thaiYear = d.getFullYear() + 543;
    return `${day}/${month}/${thaiYear}`;
  } catch {
    return dateStr;
  }
}

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

// Mock leave distribution strictly adhering to user requirement: <= 3 leaves per student
// Mathematically synchronizes 4 summary boxes, bar chart (01 vs 02), donut chart, and student table
const MOCK_LEAVES_BY_STUDENT = {
  // กลุ่ม 01: 8 คน -> ยื่นลา 10 ครั้ง, เสี่ยงหมดสิทธิ์ 1 คน (ปิยะดา ลา 3 ครั้ง)
  // ประเภท: ป่วย 5, กิจ 3, กิจกรรม 1, อื่น ๆ 1 = รวม 10 ครั้ง
  '67000001': [
    { type: 'ลาป่วย', date: '2026-09-02', reason: 'มีอาการไข้หวัด ปวดศีรษะ พักรักษาตัวที่บ้าน', attachment: null },
    { type: 'ลากิจส่วนตัว', date: '2026-09-23', reason: 'ไปทำธุระเอกสารราชการที่ภูมิลำเนา', attachment: null },
  ],
  '67000002': [
    { type: 'ลาป่วย', date: '2026-08-26', reason: 'มีอาการไข้สูง ปวดศีรษะ พบแพทย์ที่ รพ.บูรพา', attachment: '/sample-medical-cert.png' },
    { type: 'ลาป่วย', date: '2026-09-16', reason: 'ท้องเสียเฉียบพลัน อาหารเป็นพิษ พักฟื้น', attachment: '/sample-medical-cert.png' },
    { type: 'ลากิจส่วนตัว', date: '2026-10-07', reason: 'กิจธุระสำคัญของครอบครัวต่างจังหวัด', attachment: null },
  ],
  '67000003': [
    { type: 'ลากิจกรรม', date: '2026-09-09', reason: 'เข้าร่วมกิจกรรมอบรมวิชาการของคณะวิทยาการสารสนเทศ', attachment: '/sample-activity-cert.png' },
  ],
  '67000004': [
    { type: 'ลาป่วย', date: '2026-09-16', reason: 'ปวดฟันคุด มีนัดผ่าตัดช่องปากที่คลินิกทันตกรรม', attachment: null },
    { type: 'อื่นๆ', date: '2026-10-14', reason: 'ประสบอุบัติเหตุเฉี่ยวชนระหว่างเดินทาง', attachment: null },
  ],
  '67000005': [
    { type: 'ลาป่วย', date: '2026-09-30', reason: 'มีไข้หวัด เจ็บคอ แพทย์แนะนำให้พัก 1 วัน', attachment: null },
  ],
  '67000006': [],
  '67000007': [
    { type: 'ลากิจส่วนตัว', date: '2026-10-07', reason: 'ธุระต่ออายุใบขับขี่และบัตรประชาชน', attachment: null },
  ],
  '67000008': [],

  // กลุ่ม 02: 8 คน -> ยื่นลา 7 ครั้ง, เสี่ยงหมดสิทธิ์ 0 คน
  // ประเภท: ป่วย 4, กิจ 2, กิจกรรม 1, อื่น ๆ 0 = รวม 7 ครั้ง
  '68000001': [
    { type: 'ลาป่วย', date: '2026-09-02', reason: 'มีอาการไข้หวัด ไอ เจ็บคอ', attachment: null },
  ],
  '68000002': [
    { type: 'ลาป่วย', date: '2026-09-09', reason: 'ไมเกรนกำเริบ พักรักษาตัว', attachment: null },
    { type: 'ลากิจส่วนตัว', date: '2026-09-30', reason: 'งานมงคลสมรสคนในครอบครัว', attachment: null },
  ],
  '68000003': [],
  '68000004': [
    { type: 'ลากิจกรรม', date: '2026-09-23', reason: 'ตัวแทนแข่งขันโครงงานเทคโนโลยีสารสนเทศ', attachment: '/sample-activity-cert.png' },
  ],
  '68000005': [
    { type: 'ลาป่วย', date: '2026-09-16', reason: 'มีอาการไข้และปวดเมื่อยตามร่างกาย', attachment: null },
    { type: 'ลากิจส่วนตัว', date: '2026-10-14', reason: 'เดินทางไปติดต่อราชการกับผู้ปกครอง', attachment: null },
  ],
  '68000006': [],
  '68000007': [
    { type: 'ลาป่วย', date: '2026-10-07', reason: 'พบแพทย์ตามนัดตรวจสุขภาพฟัน', attachment: null },
  ],
  '68000008': [],
};

export default function WireframeStatsView({
  user,
  courses = [],
  leaves = [],
  rosterByCourse = {},
  usingMock = false,
}) {
  // Controls & States
  const [semester, setSemester] = useState('1/2569');
  const [activeStatsView, setActiveStatsView] = useState('current'); // 'current' | 'archive'
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedLeaveTypeFilter, setSelectedLeaveTypeFilter] = useState(null); // 'all' | 'ป่วย' | 'กิจ' | 'กิจกรรม' | 'อื่น ๆ'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const availableSemesters = useMemo(() => {
    const terms = new Set();
    courses.forEach((c) => {
      if (c.term && c.term !== '2/2569') terms.add(c.term);
    });
    if (terms.size === 0) terms.add('1/2569');
    return Array.from(terms);
  }, [courses]);

  const coursesForSemester = useMemo(() => {
    if (!semester) return courses;
    const match = courses.filter((c) => !c.term || c.term === semester);
    return match.length > 0 ? match : courses;
  }, [courses, semester]);

  // 1. Group courses by unique Subject (Code + Acronym)
  const subjectGroups = useMemo(() => {
    const map = new Map();
    coursesForSemester.forEach((c) => {
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
      const existing = map.get(key);
      const isDuplicate = existing.sections.some(
        (s) => (s.group || '').toString() === (c.group || '').toString()
      );
      if (!isDuplicate) {
        existing.sections.push(c);
      }
    });
    return Array.from(map.values());
  }, [coursesForSemester]);

  // Selected Subject (default to first subject or OSS)
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(
    subjectGroups[0]?.key || 'OSS'
  );

  // Sync selected subject when semester changes
  useEffect(() => {
    if (subjectGroups.length > 0) {
      const exists = subjectGroups.some((s) => s.key === selectedSubjectKey);
      if (!exists) {
        setSelectedSubjectKey(subjectGroups[0].key);
        setSelectedCourseId(subjectGroups[0].sections[0]?.id || null);
        setSelectedLeaveTypeFilter(null);
        setCurrentPage(1);
      }
    }
  }, [subjectGroups, selectedSubjectKey]);

  const currentSubject = useMemo(() => {
    return subjectGroups.find((s) => s.key === selectedSubjectKey) || subjectGroups[0] || null;
  }, [subjectGroups, selectedSubjectKey]);

  // Selected Section (Course ID) — default to first section of selected subject
  const [selectedCourseId, setSelectedCourseId] = useState(
    currentSubject?.sections[0]?.id || null
  );

  // When subject changes, pick its first section
  function handleSelectSubject(key) {
    setSelectedSubjectKey(key);
    const sub = subjectGroups.find((s) => s.key === key);
    if (sub && sub.sections.length > 0) {
      setSelectedCourseId(sub.sections[0].id);
    } else {
      setSelectedCourseId(null);
    }
    // reset filter
    setSelectedLeaveTypeFilter(null);
    setCurrentPage(1);
  }

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || currentSubject?.sections[0] || null;
  }, [courses, selectedCourseId, currentSubject]);

  const displayGroup = selectedCourse?.group || '01';

  // Sync archive query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('view') === 'archive' || sp.get('tab') === 'archive') {
        setActiveStatsView('archive');
      }
    }
  }, []);

  // Modal State for Individual Student Drill-down (Step 3)
  const [modalStudent, setModalStudent] = useState(null);
  const [modalLeaveCategory, setModalLeaveCategory] = useState(null);

  // Student list in current section
  const sectionStudents = useMemo(() => {
    if (!selectedCourse?.id) return [];
    const roster = rosterByCourse[selectedCourse.id] || [];

    return roster.map((s, idx) => {
      // Find approved leaves belonging to this student in this specific section from DB props
      const dbLeaves = leaves.filter(
        (l) =>
          l.status === 'อนุมัติ' &&
          l.courseId === selectedCourse.id &&
          (l.studentCode === s.studentCode || l.studentId === s.studentId || l.studentName === s.studentName)
      );

      // If database has leaves for this student, use them.
      // Otherwise, only use mock distribution if usingMock is true (pure mock prototype mode)
      let completeLeaves = [...dbLeaves];
      if (usingMock && completeLeaves.length === 0) {
        const studentMocks = MOCK_LEAVES_BY_STUDENT[s.studentCode] || [];
        studentMocks.forEach((m, mIdx) => {
          completeLeaves.push({
            id: `leave-${s.studentCode}-${mIdx + 1}`,
            status: 'อนุมัติ',
            type: m.type,
            period: selectedCourse.time ? `เวลาเรียน ${selectedCourse.time}` : 'เวลาเรียน 13:00-16:50',
            startDate: m.date,
            endDate: m.date,
            reason: m.reason,
            attachment: m.attachment || null,
            attachmentUrl: m.attachment || null,
            createdAt: `${m.date}T08:30:00`,
            courseId: selectedCourse.id,
            courseCode: selectedCourse.code,
            courseName: selectedCourse.name,
            courseTerm: selectedCourse.term,
            section: selectedCourse.group,
            studentName: s.studentName,
            studentCode: s.studentCode,
            studentEmail: s.email,
            approvedBy: user?.name || 'ผศ.ดร.อัครา ธรรมมาสถิตย์กุล',
            approvedAt: `${m.date}T12:00:00`,
          });
        });
      }

      const sickCount = completeLeaves.filter((l) => l.type === 'ลาป่วย').length;
      const personalCount = completeLeaves.filter((l) => l.type === 'ลากิจส่วนตัว' || l.type === 'ลากิจ').length;
      const activityCount = completeLeaves.filter((l) => l.type === 'ลากิจกรรม').length;
      const otherCount = completeLeaves.filter(
        (l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน'
      ).length;

      const totalLeaves = completeLeaves.length;

      // Latest leave date
      let latestDate = s.lastLeaveDate;
      if (!latestDate && completeLeaves.length > 0) {
        const sorted = [...completeLeaves].sort(
          (a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt)
        );
        latestDate = formatThaiDate(sorted[0].startDate || sorted[0].createdAt);
      }

      // Attendance percentage and at-risk flag (15 sessions total, <= 3 leaves allowed before risk)
      const totalSessions = selectedCourse.totalSessions || 15;
      const attended = Math.max(0, totalSessions - totalLeaves);
      const percentage = Math.round((attended / totalSessions) * 100);
      const isAtRisk = totalLeaves >= 3 || percentage <= 80;

      return {
        ...s,
        totalLeavesCount: totalLeaves,
        lastLeaveDate: latestDate || '-',
        sickCount,
        personalCount,
        activityCount,
        otherCount,
        leaves: completeLeaves,
        percentage,
        overQuota: isAtRisk,
      };
    });
  }, [selectedCourse, rosterByCourse, leaves, user]);

  // Group summary stats - 100% derived from sectionStudents!
  const stats = useMemo(() => {
    const totalStudents = sectionStudents.length;
    const submittedLeaves = sectionStudents.reduce((sum, s) => sum + s.totalLeavesCount, 0);
    const atRiskCount = sectionStudents.filter(
      (s) => s.overQuota || s.percentage <= 80 || s.totalLeavesCount >= 3
    ).length;
    const sickCount = sectionStudents.reduce((sum, s) => sum + s.sickCount, 0);
    const personalCount = sectionStudents.reduce((sum, s) => sum + s.personalCount, 0);
    const activityCount = sectionStudents.reduce((sum, s) => sum + s.activityCount, 0);
    const otherCount = sectionStudents.reduce((sum, s) => sum + s.otherCount, 0);

    return {
      totalStudents,
      submittedLeaves,
      atRiskCount,
      sickCount,
      personalCount,
      activityCount,
      otherCount,
    };
  }, [sectionStudents]);

  // Cross-section comparison: Group 01 vs Group 02
  const sectionComparison = useMemo(() => {
    const sections = currentSubject?.sections || [];

    if (sections.length > 1) {
      const labels = sections.map((s, idx) => `กลุ่ม ${s.group || (idx === 0 ? '01' : '02')}`);
      const leavesData = [];
      const atRiskData = [];
      const studentsData = [];

      sections.forEach((sec) => {
        const roster = rosterByCourse[sec.id] || [];
        let secLeaves = 0;
        let secAtRisk = 0;

        roster.forEach((s) => {
          const dbLeaves = leaves.filter(
            (l) =>
              l.status === 'อนุมัติ' &&
              l.courseId === sec.id &&
              (l.studentCode === s.studentCode || l.studentId === s.studentId || l.studentName === s.studentName)
          );
          const count =
            dbLeaves.length > 0 ? dbLeaves.length : (usingMock ? (MOCK_LEAVES_BY_STUDENT[s.studentCode]?.length || 0) : 0);
          secLeaves += count;
          if (count >= 3) secAtRisk++;
        });

        leavesData.push(secLeaves);
        atRiskData.push(secAtRisk);
        studentsData.push(roster.length);
      });

      return {
        hasMultipleSections: true,
        labels,
        leavesData,
        atRiskData,
        studentsData,
        group1Leaves: leavesData[0] || 0,
        group2Leaves: leavesData[1] || 0,
        group1Students: studentsData[0] || 0,
        group2Students: studentsData[1] || 0,
      };
    }

    // Single section case
    return {
      hasMultipleSections: false,
      labels: [`กลุ่ม ${displayGroup}`],
      leavesData: [stats.submittedLeaves],
      atRiskData: [stats.atRiskCount],
      studentsData: [stats.totalStudents],
      group1Leaves: stats.submittedLeaves,
      group2Leaves: 0,
      group1Students: stats.totalStudents,
      group2Students: 0,
    };
  }, [currentSubject, rosterByCourse, leaves, stats, displayGroup]);

  // Filtered by search & leave type
  const filteredStudents = useMemo(() => {
    let result = sectionStudents;

    // Search filter
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      result = result.filter(
        (s) =>
          (s.studentName || '').toLowerCase().includes(q) ||
          (s.studentCode || '').includes(q)
      );
    }

    // Leave type filter
    if (selectedLeaveTypeFilter === 'ป่วย') {
      result = result.filter((s) => s.sickCount > 0);
    } else if (selectedLeaveTypeFilter === 'กิจ') {
      result = result.filter((s) => s.personalCount > 0);
    } else if (selectedLeaveTypeFilter === 'กิจกรรม') {
      result = result.filter((s) => s.activityCount > 0);
    } else if (selectedLeaveTypeFilter === 'อื่น ๆ') {
      result = result.filter((s) => s.otherCount > 0);
    } else if (selectedLeaveTypeFilter === 'atRisk') {
      result = result.filter((s) => s.overQuota || s.percentage < 80);
    }

    return result;
  }, [sectionStudents, studentSearch, selectedLeaveTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const [isSidebarCollapsed] = useSidebarCollapsed();

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* 1. Left Sidebar (mode="stats") */}
      <TeacherSidebar
        user={user}
        mode="stats"
        subjects={subjectGroups}
        selectedSubjectKey={selectedSubjectKey}
        onSelectSubject={(key) => {
          setActiveStatsView('current');
          handleSelectSubject(key);
        }}
        activeStatsView={activeStatsView}
        onSelectArchive={() => setActiveStatsView('archive')}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className={`flex-1 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-w-0 w-full transition-all duration-300`}>
        {/* Top Bar with Semester & Search Pill */}
        <TeacherTopBar
          user={user}
          semester={semester}
          onSemesterChange={setSemester}
          availableSemesters={availableSemesters}
          searchValue={studentSearch}
          onSearchChange={setStudentSearch}
          searchPlaceholder="ค้นหารหัสนิสิต หรือชื่อ-นามสกุล..."
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6 ${isSidebarCollapsed ? 'max-w-none' : 'max-w-7xl'} w-full mx-auto transition-all duration-300`}>
          {activeStatsView === 'archive' ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                      <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                        คลังสถิติย้อนหลัง
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 hidden sm:block">
                        สืบค้นข้อมูลการลาเรียนย้อนหลัง สรุปอัตราส่วนการอนุมัติ และสถิติสะสมตามภาคการศึกษา
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStatsView('current')}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">กลับไปดูรายวิชาปัจจุบัน</span>
                    <span className="sm:hidden">กลับ</span>
                  </button>
                </div>
              </div>
              <ArchiveView courses={courses} leaves={leaves} />
            </div>
          ) : (
            <>
          {/* COURSE & GROUP HEADER (Strictly matching wireframe S__3366939_0.jpg) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            {/* Left: Course Code and Name */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-mono font-black text-sm tracking-tight border border-purple-200/80 dark:border-purple-800">
                {currentSubject?.code || selectedCourse?.code}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {currentSubject?.name || selectedCourse?.name}
              </h2>
            </div>

            {/* Right: Group 01 & Group 02 buttons with highlight on active */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {currentSubject?.sections.map((sec, idx) => {
                const isSelected = selectedCourse?.id === sec.id;
                const groupLabel = `กลุ่ม ${sec.group || (idx === 0 ? '01' : '02')}`;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(sec.id);
                      setSelectedLeaveTypeFilter(null);
                      setCurrentPage(1);
                    }}
                    className={`px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/25 ring-2 ring-purple-300/40'
                        : 'bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-slate-700 border border-neutral-200/60 dark:border-slate-700'
                    }`}
                  >
                    {groupLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TWO CONNECTED HORIZONTAL STATS BOXES (Strictly matching wireframe) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* BOX 1 (Left): นิสิต | ยื่นลา | เสี่ยงหมดสิทธิ์ */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-neutral-300/90 dark:border-slate-700/80 p-5 shadow-xs">
              <div className="grid grid-cols-3 divide-x divide-neutral-200/80 dark:divide-slate-800 text-center">
                {/* 1. นิสิต */}
                <div
                  onClick={() => setSelectedLeaveTypeFilter(null)}
                  className="px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">นิสิต</p>
                  <div className="mt-2 flex items-baseline justify-center gap-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 dark:text-neutral-100">
                      {stats.totalStudents}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">คน</span>
                  </div>
                </div>

                {/* 2. ยื่นลา */}
                <div
                  onClick={() => setSelectedLeaveTypeFilter(null)}
                  className="px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">ยื่นลา</p>
                  <div className="mt-2 flex items-baseline justify-center gap-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#7749BC] dark:text-purple-300">
                      {stats.submittedLeaves}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">ครั้ง</span>
                  </div>
                </div>

                {/* 3. เสี่ยงหมดสิทธิ์ */}
                <div
                  onClick={() => setSelectedLeaveTypeFilter(selectedLeaveTypeFilter === 'atRisk' ? null : 'atRisk')}
                  className={`px-2 py-1 cursor-pointer rounded-xl transition-all ${
                    selectedLeaveTypeFilter === 'atRisk' ? 'bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-400' : 'hover:opacity-80'
                  }`}
                  title="คลิกเพื่อกรองเฉพาะนิสิตที่เสี่ยงหมดสิทธิ์"
                >
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">เสี่ยงหมดสิทธิ์</p>
                  <div className="mt-2 flex items-baseline justify-center gap-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
                      {stats.atRiskCount}
                    </span>
                    <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">คน</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOX 2 (Right): ประเภทการลา ป่วย | กิจ | กิจกรรม | อื่น ๆ */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-neutral-300/90 dark:border-slate-700/80 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left w-full sm:w-auto pb-2 sm:pb-0 sm:border-r border-neutral-200/80 dark:border-slate-800 sm:pr-4">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap block">
                  ประเภทการลา
                </span>
                <span className="text-[10px] text-neutral-400 hidden sm:block mt-0.5">
                  คลิกเพื่อกรอง
                </span>
              </div>

              {/* 4 Types: ป่วย, กิจ, กิจกรรม, อื่น ๆ */}
              <div className="grid grid-cols-4 gap-2 w-full flex-1">
                {/* ป่วย */}
                <button
                  type="button"
                  onClick={() => setSelectedLeaveTypeFilter(selectedLeaveTypeFilter === 'ป่วย' ? null : 'ป่วย')}
                  className={`p-2.5 rounded-2xl text-center transition-all cursor-pointer border ${
                    selectedLeaveTypeFilter === 'ป่วย'
                      ? 'bg-sky-100 dark:bg-sky-950 border-sky-300 dark:border-sky-700 ring-2 ring-sky-300'
                      : 'border-neutral-200/60 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 block">ป่วย</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-sky-600 dark:text-sky-400 mt-0.5 block">
                    {stats.sickCount}
                  </span>
                </button>

                {/* กิจ */}
                <button
                  type="button"
                  onClick={() => setSelectedLeaveTypeFilter(selectedLeaveTypeFilter === 'กิจ' ? null : 'กิจ')}
                  className={`p-2.5 rounded-2xl text-center transition-all cursor-pointer border ${
                    selectedLeaveTypeFilter === 'กิจ'
                      ? 'bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-700 ring-2 ring-purple-300'
                      : 'border-neutral-200/60 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 block">กิจ</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-[#7749BC] dark:text-purple-300 mt-0.5 block">
                    {stats.personalCount}
                  </span>
                </button>

                {/* กิจกรรม */}
                <button
                  type="button"
                  onClick={() => setSelectedLeaveTypeFilter(selectedLeaveTypeFilter === 'กิจกรรม' ? null : 'กิจกรรม')}
                  className={`p-2.5 rounded-2xl text-center transition-all cursor-pointer border ${
                    selectedLeaveTypeFilter === 'กิจกรรม'
                      ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-300'
                      : 'border-neutral-200/60 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 block">กิจกรรม</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {stats.activityCount}
                  </span>
                </button>

                {/* อื่น ๆ */}
                <button
                  type="button"
                  onClick={() => setSelectedLeaveTypeFilter(selectedLeaveTypeFilter === 'อื่น ๆ' ? null : 'อื่น ๆ')}
                  className={`p-2.5 rounded-2xl text-center transition-all cursor-pointer border ${
                    selectedLeaveTypeFilter === 'อื่น ๆ'
                      ? 'bg-neutral-200 dark:bg-slate-700 border-neutral-400 dark:border-slate-600 ring-2 ring-neutral-400'
                      : 'border-neutral-200/60 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 block">อื่น ๆ</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-neutral-700 dark:text-neutral-300 mt-0.5 block">
                    {stats.otherCount}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN CHART GRID: BAR CHART (COMPARISON) & DONUT CHART (PROPORTIONS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            {/* LEFT COLUMN: Bar Chart - Cross-Section Comparison (กลุ่ม 01 vs กลุ่ม 02) */}
            <div className="lg:col-span-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-neutral-300/90 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between overflow-hidden min-w-0">
              <div>
                <div className="pb-3 border-b border-neutral-100 dark:border-slate-800">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#7749BC]" />
                    <span>เปรียบเทียบสถิติระหว่าง กลุ่ม 01 vs กลุ่ม 02</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    เปรียบเทียบจำนวนการลาและนิสิตกลุ่มเสี่ยงในรายวิชา {currentSubject?.code || selectedCourse?.code}
                  </p>
                </div>

                <div className="pt-3">
                  <LeaveBarChart
                    labels={sectionComparison.hasMultipleSections ? sectionComparison.labels : ['กลุ่ม 01', 'กลุ่ม 02 (ไม่มีการเปิดสอน)']}
                    datasets={[
                      {
                        label: 'ยื่นลาสะสม (ครั้ง)',
                        data: sectionComparison.hasMultipleSections
                          ? sectionComparison.leavesData
                          : [sectionComparison.group1Leaves, 0],
                        backgroundColor: '#7749BC',
                        hoverBackgroundColor: '#5B21B6',
                      },
                      {
                        label: 'เสี่ยงหมดสิทธิ์สอบ (คน)',
                        data: sectionComparison.hasMultipleSections
                          ? sectionComparison.atRiskData
                          : [sectionComparison.atRiskData[0] || 0, 0],
                        backgroundColor: '#F43F5E',
                        hoverBackgroundColor: '#E11D48',
                      },
                    ]}
                    yAxisLabel="จำนวน"
                    height={220}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-neutral-500">
                <span>กลุ่ม 01: ยื่นลา <strong className="text-[#7749BC] dark:text-purple-300">{sectionComparison.group1Leaves} ครั้ง</strong> ({sectionComparison.group1Students} คน)</span>
                <span>กลุ่ม 02: ยื่นลา <strong className="text-[#7749BC] dark:text-purple-300">{sectionComparison.group2Leaves} ครั้ง</strong> ({sectionComparison.group2Students} คน)</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Donut Chart (Proportion Breakdown) */}
            <div className="lg:col-span-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-neutral-300/90 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between overflow-hidden min-w-0">
              <div>
                <div className="pb-3 border-b border-neutral-100 dark:border-slate-800">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-sky-500" />
                    <span>สัดส่วนประเภทการลา (Leave Proportions)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    คลิกที่กราฟวงกลมเพื่อกรองรายชื่อนิสิตในตารางด้านล่างทันที
                  </p>
                </div>

                <div className="pt-2">
                  <LeaveDonutChart
                    labels={['ลาป่วย', 'ลากิจ', 'ลากิจกรรม', 'อื่น ๆ']}
                    dataValues={[stats.sickCount, stats.personalCount, stats.activityCount, stats.otherCount]}
                    colors={['#0284C7', '#7749BC', '#6366F1', '#F59E0B']}
                    hoverColors={['#0369A1', '#5B21B6', '#4F46E5', '#D97706']}
                    unit="ครั้ง"
                    height={180}
                    centerTitle="ยื่นลาสะสม"
                    centerValue={`${stats.submittedLeaves}`}
                    onSelectCategory={(cat) => {
                      if (cat === 'ลาป่วย') setSelectedLeaveTypeFilter('ป่วย');
                      else if (cat === 'ลากิจ' || cat === 'ลากิจส่วนตัว') setSelectedLeaveTypeFilter('กิจ');
                      else if (cat === 'ลากิจกรรม') setSelectedLeaveTypeFilter('กิจกรรม');
                      else if (cat === 'อื่น ๆ' || cat === 'อื่นๆ') setSelectedLeaveTypeFilter('อื่น ๆ');
                    }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between text-xs">
                <span className="text-[#7749BC] dark:text-purple-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>นิสิตเสี่ยงหมดสิทธิ์สอบ:</span>
                </span>
                <span className={`font-mono font-black ${stats.atRiskCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                  {stats.atRiskCount} คน
                </span>
              </div>
            </div>
          </div>

          {/* STUDENT ROSTER TABLE (Strictly matching wireframe) */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-neutral-300/90 dark:border-slate-700/80 shadow-xs overflow-hidden">
            {/* Table Heading */}
            <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-neutral-50/60 dark:bg-slate-900/50">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>รายชื่อนิสิต : กลุ่ม {displayGroup}</span>
                {selectedLeaveTypeFilter && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-normal">
                    (กรอง: {selectedLeaveTypeFilter})
                  </span>
                )}
              </h3>
              {selectedLeaveTypeFilter && (
                <button
                  onClick={() => setSelectedLeaveTypeFilter(null)}
                  className="text-xs text-[#7749BC] dark:text-purple-300 hover:underline font-semibold cursor-pointer"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>

            {/* 1. Mobile Student Cards List (< md) */}
            <div className="block md:hidden p-3 space-y-2.5">
              {paginatedStudents.length === 0 ? (
                <div className="py-10 text-center text-neutral-400 text-xs">
                  ไม่พบรายชื่อนิสิตตามเงื่อนไขที่เลือก
                </div>
              ) : (
                paginatedStudents.map((student) => (
                  <div
                    key={student.studentId}
                    onClick={() => {
                      setModalStudent(student);
                      setModalLeaveCategory(null);
                    }}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-neutral-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col gap-2.5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                          {student.studentName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500 font-mono">
                          <span>{student.studentCode}</span>
                          <span>•</span>
                          <span>ลาล่าสุด: {student.lastLeaveDate}</span>
                        </div>
                      </div>

                      {student.overQuota || student.totalLeavesCount >= 3 ? (
                        <span className="shrink-0 inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <AlertCircle className="w-3 h-3" />
                          <span>{student.totalLeavesCount} ครั้ง (เสี่ยง)</span>
                        </span>
                      ) : student.totalLeavesCount > 0 ? (
                        <span className="shrink-0 inline-flex items-center font-mono font-bold text-[11px] px-2.5 py-1 rounded-full bg-purple-100 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                          {student.totalLeavesCount} ครั้ง
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                          0 ครั้ง (100%)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-slate-800/80 text-[11px]">
                      <div className="flex flex-wrap items-center gap-1">
                        {student.sickCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-medium">
                            ป่วย {student.sickCount}
                          </span>
                        )}
                        {student.personalCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-medium">
                            กิจ {student.personalCount}
                          </span>
                        )}
                        {student.activityCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                            กิจกรรม {student.activityCount}
                          </span>
                        )}
                        {student.otherCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium">
                            อื่น ๆ {student.otherCount}
                          </span>
                        )}
                        {student.totalLeavesCount === 0 && (
                          <span className="text-neutral-400">ไม่มีประวัติการลา</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalStudent(student);
                          setModalLeaveCategory(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-slate-700 hover:bg-[#7749BC] hover:text-white text-[#7749BC] dark:text-purple-300 font-semibold cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>ดูประวัติ</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 2. Desktop & Tablet Student Roster Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-slate-800 bg-neutral-100/70 dark:bg-slate-800/70 font-bold text-neutral-700 dark:text-neutral-300">
                    <th className="py-3.5 px-4 sm:px-6 font-mono">รหัสนิสิต</th>
                    <th className="py-3.5 px-4 sm:px-6">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">จำแนกการลา</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">จำนวนครั้ง & สถานะ</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center font-mono">วันที่ลาล่าสุด</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400">
                        ไม่พบรายชื่อนิสิตตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => (
                      <tr
                        key={student.studentId}
                        onClick={() => {
                          setModalStudent(student);
                          setModalLeaveCategory(null);
                        }}
                        className="hover:bg-purple-50/70 dark:hover:bg-purple-950/30 transition-colors group cursor-pointer"
                        title="คลิกเพื่อดูรายละเอียดการลาของนิสิต"
                      >
                        {/* รหัสนิสิต */}
                        <td className="py-4 px-4 sm:px-6 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {student.studentCode}
                        </td>

                        {/* ชื่อ - นามสกุล */}
                        <td className="py-4 px-4 sm:px-6 font-medium text-neutral-900 dark:text-neutral-100">
                          {student.studentName}
                        </td>

                        {/* จำแนกการลา (Breakdown badges) */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {student.totalLeavesCount > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {student.sickCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                  ป่วย {student.sickCount}
                                </span>
                              )}
                              {student.personalCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  กิจ {student.personalCount}
                                </span>
                              )}
                              {student.activityCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  กิจกรรม {student.activityCount}
                                </span>
                              )}
                              {student.otherCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  อื่น ๆ {student.otherCount}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-400 font-mono text-xs">-</span>
                          )}
                        </td>

                        {/* จำนวนครั้งที่ลา & สถานะ */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {student.overQuota || student.totalLeavesCount >= 3 ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{student.totalLeavesCount} ครั้ง (เสี่ยงหมดสิทธิ์)</span>
                            </span>
                          ) : student.totalLeavesCount > 0 ? (
                            <span className="inline-flex items-center font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-purple-100 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {student.totalLeavesCount} ครั้ง
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>0 ครั้ง (100%)</span>
                            </span>
                          )}
                        </td>

                        {/* วันที่ลาล่าสุด */}
                        <td className="py-4 px-4 sm:px-6 text-center font-mono text-neutral-600 dark:text-neutral-400">
                          {student.lastLeaveDate}
                        </td>

                        {/* Action: ดูประวัติ Button */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalStudent(student);
                              setModalLeaveCategory(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-slate-800 hover:bg-[#7749BC] hover:text-white dark:hover:bg-[#7749BC] text-[#7749BC] dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs group-hover:border-[#7749BC]"
                            title="ดูรายละเอียดการลาทั้งหมด"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>ดูประวัติ</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-neutral-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-slate-900/40">
              {/* Previous / Page / Next */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                <span className="px-3 py-1 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {currentPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>

              {/* Counter label */}
              <div>
                แสดง {filteredStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
                {Math.min(currentPage * pageSize, filteredStudents.length)} จาก {filteredStudents.length} รายการ
              </div>
            </div>
          </div>
            </>
          )}
        </main>
      </div>

      {/* STEP 3: INDIVIDUAL STUDENT LEAVE MODAL (Opened by 3 dots ⋮) */}
      {modalStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-2 duration-200">
            {/* Grab Handle for Mobile */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white dark:bg-slate-900 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-slate-700" />
            </div>

            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-purple-900/20 shrink-0">
                  {initials(modalStudent.studentName)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {modalStudent.studentName}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    รหัสนิสิต {modalStudent.studentCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:block text-right">
                  <span className="text-[10px] text-neutral-400 block leading-tight">จำนวนครั้งที่ลา</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
                    {modalStudent.totalLeavesCount} ครั้ง
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (modalLeaveCategory) {
                      setModalLeaveCategory(null);
                    } else {
                      setModalStudent(null);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                  title="ย้อนกลับ"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ย้อนกลับ</span>
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
              {/* Category selector */}
              {!modalLeaveCategory ? (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    เลือกประเภทการลาเพื่อดูรายละเอียดของ {modalStudent.studentName}:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* ลาป่วย */}
                    <button
                      onClick={() => setModalLeaveCategory('ลาป่วย')}
                      className="p-4 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30 text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
                    >
                      <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 block">ลาป่วย</span>
                      <span className="text-2xl font-bold text-sky-900 dark:text-sky-100 mt-1 block">
                        {modalStudent.sickCount}
                      </span>
                      <span className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 block">คลิกดูรายการ</span>
                    </button>

                    {/* ลากิจส่วนตัว */}
                    <button
                      onClick={() => setModalLeaveCategory('ลากิจส่วนตัว')}
                      className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
                    >
                      <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 block">
                        ลากิจส่วนตัว
                      </span>
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1 block">
                        {modalStudent.personalCount}
                      </span>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 block">คลิกดูรายการ</span>
                    </button>

                    {/* ลากิจกรรม */}
                    <button
                      onClick={() => setModalLeaveCategory('ลากิจกรรม')}
                      className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
                    >
                      <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 block">
                        ลากิจกรรม
                      </span>
                      <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1 block">
                        {modalStudent.activityCount}
                      </span>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 block">คลิกดูรายการ</span>
                    </button>

                    {/* อื่นๆ */}
                    <button
                      onClick={() => setModalLeaveCategory('อื่นๆ')}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
                    >
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">อื่น ๆ</span>
                      <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 block">
                        {modalStudent.otherCount}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 block">คลิกดูรายการ</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Category Drilldown */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-[#7749BC] dark:text-purple-300">
                      แสดงรายการ: {modalLeaveCategory}
                    </span>
                    <button
                      onClick={() => setModalLeaveCategory(null)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>เลือกหมวดอื่น</span>
                    </button>
                  </div>

                  {(() => {
                    const leavesInCat = modalStudent.leaves.filter((l) => {
                      if (modalLeaveCategory === 'อื่นๆ' || modalLeaveCategory === 'อื่น ๆ') {
                        return l.type === 'อื่นๆ' || l.type === 'อื่น ๆ' || l.type === 'เหตุฉุกเฉิน';
                      }
                      if (modalLeaveCategory === 'ลากิจส่วนตัว' || modalLeaveCategory === 'ลากิจ') {
                        return l.type === 'ลากิจส่วนตัว' || l.type === 'ลากิจ';
                      }
                      return l.type === modalLeaveCategory;
                    });

                    if (leavesInCat.length === 0) {
                      return (
                        <div className="p-8 text-center rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-200/60 dark:border-slate-700/60 text-xs text-neutral-400">
                          ไม่มีประวัติการลาในหมวด &quot;{modalLeaveCategory}&quot;
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3.5">
                        {leavesInCat.map((leave, idx) => (
                          <div
                            key={leave.id || idx}
                            className="p-4 rounded-2xl border border-neutral-200/80 dark:border-slate-800 bg-neutral-50/40 dark:bg-slate-800/50 space-y-3 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                วันที่ลา: {formatThaiDate(leave.startDate)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  leave.status === 'อนุมัติ'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : leave.status === 'ไม่อนุมัติ'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {leave.status}
                              </span>
                            </div>

                            <p className="text-neutral-700 dark:text-neutral-300">
                              <strong>เหตุผล:</strong> {leave.reason || 'มีธุระจำเป็น'}
                            </p>

                            {leave.attachment && (
                              <div className="pt-2 border-t border-neutral-100 dark:border-slate-700/50 flex items-center justify-between">
                                <span className="text-[11px] text-neutral-400">หลักฐาน:</span>
                                <AttachmentPreview
                                  src={
                                    leave.attachment.startsWith('/')
                                      ? leave.attachment
                                      : `/api/leaves/attachment/${leave.attachment}`
                                  }
                                  label="ดูใบลา / เอกสารแนบ"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation Bar (< md) */}
      <MobileBottomNav
        role="teacher"
        activeTab="stats"
        onOpenDrawer={() => setMobileSidebarOpen(true)}
      />
    </div>
  );
}
