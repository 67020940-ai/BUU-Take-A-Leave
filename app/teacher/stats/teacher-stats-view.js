'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Clock,
  HeartPulse,
  User,
  Users,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
  Award,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Filter,
  Search,
  FileText,
  Layers,
  Eye,
  X,
  ChevronRight,
  GraduationCap,
  Hourglass,
  Check,
  CalendarRange,
  MousePointerClick,
  Sparkles,
  CalendarCheck,
  Flame,
  Info,
} from 'lucide-react';
import { STATUS_DETAILS, LEAVE_TYPE_DETAILS, formatThaiDate, formatThaiDateTime, initials } from '@/lib/ui';
import AttachmentPreview from '@/components/AttachmentPreview';

// Helper to format Thai date with day of the week
function formatThaiDayOfWeekDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];
    return `${dayNames[d.getDay()]}ที่ ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch {
    return dateStr;
  }
}

// Short Thai date for chart labels (e.g. "2 ก.ย.")
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const monthShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${monthShort[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

export default function TeacherStatsView({ courses = [], leaves = [], rosterByCourse = {} }) {
  // Extract unique academic terms
  const academicTerms = useMemo(() => {
    const terms = new Set();
    courses.forEach((c) => {
      if (c.term) terms.add(c.term);
    });
    leaves.forEach((l) => {
      if (l.courseTerm && l.courseTerm !== '-') terms.add(l.courseTerm);
    });
    if (terms.size === 0) terms.add('1/2569');
    return Array.from(terms).sort().reverse();
  }, [courses, leaves]);

  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('all');

  // Selected Month for Calendar Heatmap
  const [dailyMonth, setDailyMonth] = useState('2026-09'); // '2026-09' | '2026-08' | 'all'
  const [selectedDailyDate, setSelectedDailyDate] = useState(null); // '2026-09-02'
  const [dailyDrawerOpen, setDailyDrawerOpen] = useState(false);

  // Student table filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'multi'
  const [studentTypeFilter, setStudentTypeFilter] = useState('all'); // 'all' | 'ลาป่วย' | 'ลากิจส่วนตัว' | 'ลากิจกรรม' | 'อื่น ๆ'

  // Selected Student Modal State
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  // Filtered leaves according to selected term & course
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (selectedTerm !== 'all') {
        const leaveTerm = leave.courseTerm || courses.find((c) => c.id === leave.courseId)?.term;
        if (leaveTerm && leaveTerm !== selectedTerm) return false;
      }
      if (selectedCourseId !== 'all' && leave.courseId !== selectedCourseId) {
        return false;
      }
      return true;
    });
  }, [leaves, courses, selectedTerm, selectedCourseId]);

  // Total Students Roster in selected courses and term
  const allStudents = useMemo(() => {
    const map = new Map();
    Object.entries(rosterByCourse).forEach(([cId, students]) => {
      if (selectedCourseId !== 'all' && cId !== selectedCourseId) return;
      if (selectedTerm !== 'all') {
        const course = courses.find((c) => c.id === cId);
        if (course && course.term && course.term !== selectedTerm) return;
      }
      students.forEach((s) => {
        const key = s.studentCode && s.studentCode !== '-' ? s.studentCode : s.studentId || s.studentName;
        if (key && !map.has(key)) map.set(key, s);
      });
    });
    return Array.from(map.values());
  }, [rosterByCourse, selectedCourseId, selectedTerm, courses]);

  const overQuotaStudentsCount = useMemo(() => {
    return allStudents.filter((s) => s.overQuota || (s.percentage !== undefined && s.percentage < 80)).length;
  }, [allStudents]);

  // Overview Statistics (Reactive based on filteredLeaves)
  const stats = useMemo(() => {
    const total = filteredLeaves.length;
    const approved = filteredLeaves.filter((l) => l.status === 'อนุมัติ').length;
    const pending = filteredLeaves.filter((l) => l.status === 'รออนุมัติ').length;
    const rejected = filteredLeaves.filter((l) => l.status === 'ไม่อนุมัติ').length;

    const sick = filteredLeaves.filter((l) => l.type === 'ลาป่วย').length;
    const personal = filteredLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;
    const activity = filteredLeaves.filter((l) => l.type === 'ลากิจกรรม').length;
    const others = filteredLeaves.filter((l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน').length;

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 100;

    // Unique students who took leaves
    const studentCodes = new Set(filteredLeaves.map((l) => l.studentCode || l.studentId || l.studentName));
    const uniqueStudentsCount = studentCodes.size;

    // Unique students with pending leaves (ยังไม่อนุมัติ)
    const pendingLeaves = filteredLeaves.filter((l) => l.status === 'รออนุมัติ');
    const pendingStudentCodes = new Set(pendingLeaves.map((l) => l.studentCode || l.studentId || l.studentName));
    const uniquePendingStudentsCount = pendingStudentCodes.size;

    const avgPerWeek = ((total / 15) || 0).toFixed(1);
    const avgPerMonth = ((total / 4) || 0).toFixed(1);

    return {
      total,
      approved,
      pending,
      rejected,
      sick,
      personal,
      activity,
      others,
      approvalRate,
      uniqueStudentsCount,
      uniquePendingStudentsCount,
      avgPerWeek,
      avgPerMonth,
    };
  }, [filteredLeaves]);

  // Statistics broken down by each course and academic term
  const courseStatsList = useMemo(() => {
    // If selectedTerm is not 'all', filter courses for that term; otherwise all courses
    const targetCourses = courses.filter((c) => {
      if (selectedTerm !== 'all' && c.term && c.term !== selectedTerm) return false;
      return true;
    });

    return targetCourses.map((c) => {
      const courseLeaves = leaves.filter((l) => l.courseId === c.id || l.courseCode === c.code);
      const enrolledStudents = rosterByCourse[c.id] || [];
      const totalStudents = enrolledStudents.length || c.studentCount || 0;

      const totalLeaves = courseLeaves.length;
      const approved = courseLeaves.filter((l) => l.status === 'อนุมัติ').length;
      const pending = courseLeaves.filter((l) => l.status === 'รออนุมัติ').length;
      const rejected = courseLeaves.filter((l) => l.status === 'ไม่อนุมัติ').length;

      const sick = courseLeaves.filter((l) => l.type === 'ลาป่วย').length;
      const personal = courseLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;
      const activity = courseLeaves.filter((l) => l.type === 'ลากิจกรรม').length;
      const others = courseLeaves.filter(
        (l) => l.type !== 'ลาป่วย' && l.type !== 'ลากิจส่วนตัว' && l.type !== 'ลากิจกรรม'
      ).length;

      const atRiskCount = enrolledStudents.filter(
        (s) => (s.percentage ?? 100) < 80 || s.approvedLeaves >= 3 || s.overQuota
      ).length;
      const approvalRate = totalLeaves > 0 ? Math.round((approved / totalLeaves) * 100) : 100;

      return {
        course: c,
        totalStudents,
        totalLeaves,
        approved,
        pending,
        rejected,
        sick,
        personal,
        activity,
        others,
        atRiskCount,
        approvalRate,
      };
    });
  }, [courses, leaves, rosterByCourse, selectedTerm]);

  // Unique months available in leave data
  const availableMonths = useMemo(() => {
    const months = new Set();
    filteredLeaves.forEach((l) => {
      if (l.startDate) {
        const ym = l.startDate.slice(0, 7); // '2026-09'
        months.add(ym);
      }
    });
    if (months.size === 0) {
      months.add('2026-09');
      months.add('2026-08');
    }
    return Array.from(months).sort().reverse();
  }, [filteredLeaves]);

  // Daily Leaves Aggregated Map: { '2026-09-02': [leave1, leave2, ...] }
  const dailyLeavesMap = useMemo(() => {
    const map = new Map();
    filteredLeaves.forEach((leave) => {
      const date = leave.startDate;
      if (!date) return;
      if (!map.has(date)) map.set(date, []);
      map.get(date).push(leave);
    });
    return map;
  }, [filteredLeaves]);

  // Peak Leave Analytics & Patterns
  const peakLeaveStats = useMemo(() => {
    const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    let maxDate = null;
    let maxDateCount = 0;

    dailyLeavesMap.forEach((leavesList, dateStr) => {
      if (leavesList.length > maxDateCount) {
        maxDateCount = leavesList.length;
        maxDate = dateStr;
      }
      try {
        const d = new Date(dateStr);
        dayCounts[d.getDay()] += leavesList.length;
      } catch {}
    });

    let peakDayIdx = 3; // Wednesday default
    let peakDayCount = 0;
    dayCounts.forEach((c, idx) => {
      if (c > peakDayCount) {
        peakDayCount = c;
        peakDayIdx = idx;
      }
    });

    return {
      peakDayName: days[peakDayIdx],
      peakDayCount,
      maxDate,
      maxDateCount,
    };
  }, [dailyLeavesMap]);

  // Calendar Days Grid Construction for dailyMonth
  const calendarDays = useMemo(() => {
    const activeMonth = dailyMonth === 'all' ? '2026-09' : dailyMonth;
    const [yearStr, monthStr] = activeMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sun

    const days = [];
    // Padding for days before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null, leaves: [], count: 0 });
    }
    // All days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${yearStr}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayLeaves = dailyLeavesMap.get(dStr) || [];
      days.push({
        dayNumber: d,
        dateStr: dStr,
        leaves: dayLeaves,
        count: dayLeaves.length,
        hasPending: dayLeaves.some((l) => l.status === 'รออนุมัติ'),
      });
    }
    return days;
  }, [dailyMonth, dailyLeavesMap]);

  const handleDayCellClick = (dateStr) => {
    if (!dateStr) return;
    setSelectedDailyDate(dateStr);
    setDailyDrawerOpen(true);
  };

  const selectedDayLeaves = useMemo(() => {
    if (!selectedDailyDate) return [];
    return dailyLeavesMap.get(selectedDailyDate) || [];
  }, [selectedDailyDate, dailyLeavesMap]);

  // Breakdown by Leave Type (จำนวนคน + จำนวนครั้ง)
  const leaveTypeBreakdown = useMemo(() => {
    const types = [
      {
        key: 'ลาป่วย',
        label: 'ลาป่วย',
        desc: 'มีไข้ ไม่สบาย หรือมีนัดพบแพทย์',
        icon: HeartPulse,
        themeColor: 'sky',
        bgLight: 'bg-sky-50 dark:bg-sky-950/40',
        textColor: 'text-sky-600 dark:text-sky-400',
        borderColor: 'border-sky-200 dark:border-sky-800',
        badgeBg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
        barColor: 'bg-sky-500',
      },
      {
        key: 'ลากิจส่วนตัว',
        label: 'ลากิจส่วนตัว',
        desc: 'ติดภารกิจส่วนตัวหรือครอบครัว',
        icon: User,
        themeColor: 'purple',
        bgLight: 'bg-purple-50 dark:bg-purple-950/40',
        textColor: 'text-[#7749BC] dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800',
        badgeBg: 'bg-purple-100 text-[#7749BC] dark:bg-purple-900/60 dark:text-purple-300',
        barColor: 'bg-[#7749BC]',
      },
      {
        key: 'ลากิจกรรม',
        label: 'ลากิจกรรม',
        desc: 'ตัวแทนแข่งขัน หรือกิจกรรมมหาวิทยาลัย',
        icon: Users,
        themeColor: 'indigo',
        bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
        barColor: 'bg-indigo-500',
      },
      {
        key: 'อื่น ๆ',
        label: 'อื่น ๆ / ฉุกเฉิน',
        desc: 'เหตุฉุกเฉินและกรณีอื่นๆ',
        icon: HelpCircle,
        themeColor: 'amber',
        bgLight: 'bg-amber-50 dark:bg-amber-950/40',
        textColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
        badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
        barColor: 'bg-amber-500',
      },
    ];

    return types.map((t) => {
      const typeLeaves = filteredLeaves.filter((l) => {
        if (t.key === 'อื่น ๆ') return l.type === 'อื่น ๆ' || l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน';
        return l.type === t.key;
      });

      const uniqueStudents = new Set(typeLeaves.map((l) => l.studentCode || l.studentId || l.studentName));
      const studentCount = uniqueStudents.size;
      const totalTimes = typeLeaves.length;
      const pendingCount = typeLeaves.filter((l) => l.status === 'รออนุมัติ').length;
      const approvedCount = typeLeaves.filter((l) => l.status === 'อนุมัติ').length;
      const rejectedCount = typeLeaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
      const percentage = filteredLeaves.length > 0 ? Math.round((totalTimes / filteredLeaves.length) * 100) : 0;

      return {
        ...t,
        studentCount,
        totalTimes,
        pendingCount,
        approvedCount,
        rejectedCount,
        percentage,
      };
    });
  }, [filteredLeaves]);

  // Aggregated Student Leave Statistics (includes ALL enrolled students in roster)
  const studentLeaveStats = useMemo(() => {
    const studentMap = new Map();

    // 1. Initialize with all roster students (so even students with 0 leaves show up)
    allStudents.forEach((s) => {
      const key = s.studentCode && s.studentCode !== '-' ? s.studentCode : s.studentId || s.studentName;
      studentMap.set(key, {
        key,
        studentId: s.studentId,
        studentCode: s.studentCode && s.studentCode !== '-' ? s.studentCode : '-',
        studentName: s.studentName || 'ไม่ระบุชื่อ',
        studentEmail: s.email || '-',
        courses: new Set(),
        leaves: [],
        totalCount: 0,
        sickCount: 0,
        personalCount: 0,
        activityCount: 0,
        otherCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        rosterInfo: s,
      });
    });

    // 2. Map filtered leaves into students
    filteredLeaves.forEach((leave) => {
      const key =
        leave.studentCode && leave.studentCode !== '-'
          ? leave.studentCode
          : leave.studentId || leave.studentName || 'unknown';

      if (!studentMap.has(key)) {
        // Fallback for students in leave list not in roster
        studentMap.set(key, {
          key,
          studentId: leave.studentId,
          studentCode: leave.studentCode && leave.studentCode !== '-' ? leave.studentCode : '-',
          studentName: leave.studentName || 'ไม่ระบุชื่อ',
          studentEmail: leave.studentEmail || '-',
          courses: new Set(),
          leaves: [],
          totalCount: 0,
          sickCount: 0,
          personalCount: 0,
          activityCount: 0,
          otherCount: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          rosterInfo: allStudents.find(
            (s) =>
              (leave.studentCode && leave.studentCode !== '-' && s.studentCode === leave.studentCode) ||
              s.studentName === leave.studentName ||
              s.studentId === leave.studentId
          ) || null,
        });
      }

      const item = studentMap.get(key);
      item.leaves.push(leave);
      item.totalCount += 1;

      const courseTitle = `${leave.courseCode || ''} ${leave.courseName || ''} ${
        leave.section ? `(กลุ่ม ${leave.section})` : ''
      }`.trim();
      if (courseTitle) item.courses.add(courseTitle);

      if (leave.type === 'ลาป่วย') item.sickCount += 1;
      else if (leave.type === 'ลากิจส่วนตัว') item.personalCount += 1;
      else if (leave.type === 'ลากิจกรรม') item.activityCount += 1;
      else item.otherCount += 1;

      if (leave.status === 'รออนุมัติ') item.pendingCount += 1;
      else if (leave.status === 'อนุมัติ') item.approvedCount += 1;
      else if (leave.status === 'ไม่อนุมัติ') item.rejectedCount += 1;
    });

    return Array.from(studentMap.values()).map((st) => ({
      ...st,
      coursesList: Array.from(st.courses),
    }));
  }, [allStudents, filteredLeaves]);

  // Students at risk of losing exam eligibility (< 80% or >= 3 leaves or overQuota)
  const atRiskStudents = useMemo(() => {
    return studentLeaveStats.filter((st) => {
      const pct = st.rosterInfo?.percentage ?? 100;
      return pct < 80 || st.totalCount >= 3 || st.rosterInfo?.overQuota;
    });
  }, [studentLeaveStats]);

  // Filtered student list based on search and table filters
  const displayedStudents = useMemo(() => {
    return studentLeaveStats.filter((st) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = st.studentName.toLowerCase().includes(q);
        const matchCode = st.studentCode.toLowerCase().includes(q);
        const matchEmail = st.studentEmail.toLowerCase().includes(q);
        const matchCourse = st.coursesList.some((c) => c.toLowerCase().includes(q));
        if (!matchName && !matchCode && !matchEmail && !matchCourse) return false;
      }

      // Status Filter
      if (studentStatusFilter === 'pending' && st.pendingCount === 0) return false;
      if (studentStatusFilter === 'approved' && (st.approvedCount === 0 || st.pendingCount > 0)) return false;
      if (studentStatusFilter === 'multi' && st.totalCount < 2) return false;
      if (studentStatusFilter === 'atRisk') {
        const pct = st.rosterInfo?.percentage ?? 100;
        const leavesCount = st.totalCount;
        if (pct >= 80 && leavesCount < 3 && !st.rosterInfo?.overQuota) return false;
      }

      // Type Filter
      if (studentTypeFilter === 'ลาป่วย' && st.sickCount === 0) return false;
      if (studentTypeFilter === 'ลากิจส่วนตัว' && st.personalCount === 0) return false;
      if (studentTypeFilter === 'ลากิจกรรม' && st.activityCount === 0) return false;
      if (studentTypeFilter === 'อื่น ๆ' && st.otherCount === 0) return false;

      return true;
    });
  }, [studentLeaveStats, searchQuery, studentStatusFilter, studentTypeFilter]);

  return (
    <div className="space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-neutral-200/80 dark:border-slate-700 text-neutral-600 hover:text-[#7749BC] dark:text-neutral-300 dark:hover:text-purple-400 transition-colors shadow-xs"
            title="กลับไปหน้าหลัก"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-[#7749BC]/10 text-[#7749BC] dark:bg-purple-950/60 dark:text-purple-300 border border-[#7749BC]/20">
                BUU · Instructor Analytics
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#7749BC] dark:text-purple-400" />
              <span>สถิติการลาเรียน (Instructor Analytics & Statistics)</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              วิเคราะห์จำนวนการลาจำแนกตามรายวัน รายวิชา และสถิติการลาของนิสิตรายบุคคล
            </p>
          </div>
        </div>

        {/* Global Selectors: Academic Term & Course */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Term Selector */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-8 cursor-pointer shadow-xs"
            >
              <option value="all">ทุกภาคการศึกษา</option>
              {academicTerms.map((t) => (
                <option key={t} value={t}>
                  ภาคเรียน {t}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Course Selector */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-8 cursor-pointer shadow-xs"
            >
              <option value="all">ทุกรายวิชา ({courses.length} กลุ่ม)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} {c.name} {c.group ? `(กลุ่ม ${c.group})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 1.1 Summary Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Leaves & Unique Students */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">ยอดรวมคำขอลาทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {stats.total}
            </span>
            <span className="text-xs text-neutral-400">คำขอ</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px]">
            <span className="inline-flex items-center text-[#7749BC] dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
              <Users className="w-3 h-3 mr-1" />
              <span>นิสิต {stats.uniqueStudentsCount} คน</span>
            </span>
            <span className="text-neutral-400">ยื่นคำขอในระบบ</span>
          </div>
        </div>

        {/* Metric 2: Pending Approval Leaves (ยังไม่อนุมัติ) */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">ยังไม่อนุมัติ (รอการอนุมัติ)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.pending}
            </span>
            <span className="text-xs text-neutral-400">คำขอ</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px]">
            <span className="inline-flex items-center text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
              <User className="w-3 h-3 mr-1" />
              <span>นิสิต {stats.uniquePendingStudentsCount} คน</span>
            </span>
            <span className="text-neutral-400">รอพิจารณา</span>
          </div>
        </div>

        {/* Metric 3: Approval Rate */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">อัตราส่วนการอนุมัติ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.approvalRate}%
            </span>
            <span className="text-xs text-neutral-400">({stats.approved}/{stats.total})</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px]">
            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              <Check className="w-3 h-3 mr-1" />
              <span>อนุมัติแล้ว {stats.approved} รายการ</span>
            </span>
          </div>
        </div>

        {/* Metric 4: Average Leave Velocity */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">การลาเฉลี่ย</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {stats.avgPerWeek}
            </span>
            <span className="text-xs text-neutral-400">ครั้ง / สัปดาห์</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>เฉลี่ย {stats.avgPerMonth} ครั้ง/เดือน</span>
          </div>
        </div>

        {/* Metric 5: Risk / Over Quota Alert */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">นิสิตเสี่ยงหมดสิทธิ์สอบ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-3xl font-extrabold ${
                overQuotaStudentsCount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {overQuotaStudentsCount}
            </span>
            <span className="text-xs text-neutral-400">คน (จาก {allStudents.length})</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px]">
            {overQuotaStudentsCount > 0 ? (
              <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                <span>ขาด/ลาเกิน 20% หรือเกิน 3 ครั้ง</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                <span>เวลาเรียนปกติทุกคน</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1.15 สถิติแยกตามรายวิชาและภาคการศึกษา (Course & Term Breakdown Cards) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#7749BC] dark:text-purple-400" />
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                สถิติแยกตามรายวิชาและภาคการศึกษา (Course & Term Breakdown)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              คลิกที่การ์ดรายวิชาเพื่อกรองข้อมูลทั้งหน้า (ปฏิทิน, กราฟ, รายชื่อนิสิต) ให้เจาะจงเฉพาะวิชานั้น
            </p>
          </div>

          {/* Academic Term Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-slate-800 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => {
                setSelectedTerm('all');
                setSelectedCourseId('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedTerm === 'all'
                  ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              ทุกภาคการศึกษา
            </button>
            {academicTerms.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSelectedTerm(term);
                  const currentCourse = courses.find((c) => c.id === selectedCourseId);
                  if (currentCourse && currentCourse.term && currentCourse.term !== term) {
                    setSelectedCourseId('all');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTerm === term
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                ภาคเรียน {term}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Course Quick Reset Banner */}
        {selectedCourseId !== 'all' && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-xs">
            <span className="text-purple-900 dark:text-purple-200 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
              <span>
                กำลังกรองเฉพาะรายวิชา:{' '}
                <strong>
                  {courses.find((c) => c.id === selectedCourseId)?.code}{' '}
                  {courses.find((c) => c.id === selectedCourseId)?.name}{' '}
                  {courses.find((c) => c.id === selectedCourseId)?.group ? `(กลุ่ม ${courses.find((c) => c.id === selectedCourseId)?.group})` : ''}
                </strong>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedCourseId('all')}
              className="text-[#7749BC] dark:text-purple-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>รีเซ็ตแสดงทุกวิชา</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {courseStatsList.map((item) => {
            const isSelected = selectedCourseId === item.course.id;

            return (
              <div
                key={item.course.id}
                onClick={() => setSelectedCourseId(isSelected ? 'all' : item.course.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group bg-white dark:bg-slate-900 ${
                  isSelected
                    ? 'border-[#7749BC] ring-2 ring-[#7749BC]/25 shadow-sm'
                    : 'border-neutral-200/80 dark:border-slate-800 hover:border-neutral-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                {/* Active Top Accent Bar */}
                {isSelected && (
                  <span className="absolute top-0 left-0 right-0 h-1 bg-[#7749BC] rounded-t-2xl" />
                )}

                <div className="space-y-3">
                  {/* Top Meta: Course Code, Group & Term */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="font-bold text-[#7749BC] dark:text-purple-400">
                        {item.course.code}
                      </span>
                      {item.course.group && (
                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-sans font-medium">
                          กลุ่ม {item.course.group}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                      ภาคเรียน {item.course.term || '1/2569'}
                    </span>
                  </div>

                  {/* Course Title (2 full lines without cut-off) */}
                  <h3
                    className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 min-h-[40px] leading-snug group-hover:text-[#7749BC] transition-colors"
                    title={item.course.name}
                  >
                    {item.course.name}
                  </h3>

                  {/* Clean 2-Metric Stats: นิสิตในชั้น & ยื่นลาสะสม */}
                  <div className="grid grid-cols-2 gap-3 py-2.5 px-3 rounded-xl bg-neutral-50/70 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 text-center">
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-0.5 font-medium">นิสิตในชั้น</span>
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {item.totalStudents} <span className="text-[10px] font-normal text-neutral-400">คน</span>
                      </span>
                    </div>
                    <div className="border-l border-neutral-200/80 dark:border-slate-700/80">
                      <span className="text-[10px] text-neutral-400 block mb-0.5 font-medium">ยื่นลาสะสม</span>
                      <span className="text-sm font-bold text-[#7749BC] dark:text-purple-400">
                        {item.totalLeaves} <span className="text-[10px] font-normal text-neutral-400">ครั้ง</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Risk Warning (shown ONLY when > 0) & Action */}
                <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs min-h-[38px]">
                  <div>
                    {item.atRiskCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        <span>เสี่ยงหมดสิทธิ์ {item.atRiskCount} คน</span>
                      </span>
                    ) : null}
                  </div>

                  <span
                    className={`text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                      isSelected
                        ? 'text-[#7749BC] dark:text-purple-300 font-bold'
                        : 'text-neutral-400 group-hover:text-[#7749BC]'
                    }`}
                  >
                    <span>{isSelected ? 'กำลังแสดง' : 'เลือกวิชานี้'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1.2 Executive Overview: Pattern Analytics + Risk Spotlight + Calendar Heatmap (แทนที่ Bar/Pie Chart ตามคำขอ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg): Calendar Heatmap */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-[#7749BC]" />
                <span>ปฏิทินความหนาแน่นของการลาเรียน (Leave Activity Heatmap)</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                คลิกที่วันที่ในปฏิทินเพื่อดูรายชื่อนิสิตและใบลาของวันนั้นทันที
              </p>
            </div>

            {/* Month Selector Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">เดือน:</span>
              <select
                value={dailyMonth}
                onChange={(e) => {
                  setDailyMonth(e.target.value);
                  setSelectedDailyDate(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#7749BC] cursor-pointer shadow-xs"
              >
                {availableMonths.map((m) => {
                  const [year, month] = m.split('-');
                  const thYear = parseInt(year) + 543;
                  const monthNames = [
                    '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
                  ];
                  const label = `${monthNames[parseInt(month)]} ${thYear}`;
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-neutral-500 dark:text-neutral-400 py-1 border-b border-neutral-100 dark:border-slate-800">
              <div className="text-rose-500">อา.</div>
              <div>จ.</div>
              <div>อ.</div>
              <div>พ.</div>
              <div>พฤ.</div>
              <div>ศ.</div>
              <div className="text-purple-600 dark:text-purple-400">ส.</div>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                if (!cell.dayNumber) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[58px] sm:min-h-[70px] rounded-2xl bg-neutral-50/40 dark:bg-slate-800/20 border border-transparent"
                    />
                  );
                }

                const hasLeaves = cell.count > 0;
                const isSelected = selectedDailyDate === cell.dateStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleDayCellClick(cell.dateStr)}
                    className={`min-h-[58px] sm:min-h-[70px] p-2 rounded-2xl text-left transition-all flex flex-col justify-between cursor-pointer border ${
                      isSelected
                        ? 'ring-2 ring-[#7749BC] bg-purple-100/80 dark:bg-purple-950 border-[#7749BC] shadow-sm'
                        : hasLeaves
                        ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-100/90 dark:hover:bg-purple-900/60 shadow-xs'
                        : 'bg-white/50 dark:bg-slate-800/40 border-neutral-100 dark:border-slate-800/70 hover:bg-neutral-100/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${
                          hasLeaves
                            ? 'text-neutral-900 dark:text-neutral-100'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {cell.hasPending && (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 shrink-0"
                          title="มีคำขอรออนุมัติ"
                        />
                      )}
                    </div>

                    {hasLeaves ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#7749BC] text-white text-[10px] font-bold shadow-xs">
                          <User className="w-2.5 h-2.5" />
                          <span>{cell.count} คน</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-neutral-300 dark:text-neutral-600 block">-</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Legend / Footer */}
          <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#7749BC]" />
                <span>มีนิสิตลา (คลิกวันที่เพื่อดูรายชื่อ)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>มีคำขอรอตรวจ</span>
              </span>
            </div>
            <span className="text-[#7749BC] dark:text-purple-300 font-medium">
              ยอดรวมเดือนนี้: {calendarDays.reduce((acc, c) => acc + c.count, 0)} คน-ครั้ง
            </span>
          </div>
        </div>

        {/* Right Column (1 Col on lg): Executive Insight Cards & Risk Spotlight */}
        <div className="space-y-4">
          {/* Card 1: Peak Leave Day Insight */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border border-purple-200/80 dark:border-purple-800/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7749BC] dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>วันที่มีการลาหนาแน่นสุด</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7749BC]/10 text-[#7749BC] dark:bg-purple-900/60 dark:text-purple-300">
                สถิติรวม
              </span>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
                {peakLeaveStats.peakDayName}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                นิสิตยื่นลาใน{peakLeaveStats.peakDayName}สูงที่สุด ({peakLeaveStats.peakDayCount} ครั้ง) แนะนำหลีกเลี่ยงการจัดกิจกรรมเก็บคะแนนหรือสอบย่อยในวันดังกล่าว
              </p>
            </div>

            {peakLeaveStats.maxDate && (
              <div className="pt-2 border-t border-purple-100 dark:border-purple-900/50 flex items-center justify-between text-xs">
                <span className="text-neutral-500">วันชุกชุมสุด:</span>
                <button
                  type="button"
                  onClick={() => handleDayCellClick(peakLeaveStats.maxDate)}
                  className="font-bold text-[#7749BC] hover:underline cursor-pointer"
                >
                  {formatThaiDate(peakLeaveStats.maxDate)} ({peakLeaveStats.maxDateCount} คน)
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Risk Group Spotlight (นิสิตกลุ่มเสี่ยงหมดสิทธิ์สอบ) */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>นิสิตที่ต้องเฝ้าระวังเป็นพิเศษ</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {atRiskStudents.length} คน
              </span>
            </div>

            {atRiskStudents.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  นิสิตที่มีเวลาเรียนต่ำกว่า 80% หรือลาสะสมตั้งแต่ 3 ครั้งขึ้นไป
                </p>
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {atRiskStudents.map((st) => {
                    const pct = st.rosterInfo?.percentage ?? 100;
                    return (
                      <div
                        key={st.key}
                        onClick={() => setSelectedStudentDetail(st)}
                        className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between gap-2 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials(st.studentName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                              {st.studentName}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400">
                              {st.studentCode} • ลา {st.totalCount} ครั้ง
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-xs text-rose-600 dark:text-rose-400 block">
                            {pct}%
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 underline font-medium">
                            เปิดแดชบอร์ด
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  เวลาเรียนอยู่ในเกณฑ์ปกติทุกคน
                </p>
                <p className="text-[11px] text-neutral-400">
                  ไม่มีนิสิตที่มีเวลาเรียนต่ำกว่า 80% ในรายวิชาที่เลือก
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. สถิติจำแนกตามประเภทการลา (จำนวนคน และ จำนวนครั้งที่นิสิตลา) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#7749BC] dark:text-purple-400" />
              <span>สถิติจำแนกตามประเภทการลา (Leave Types Breakdown)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              แสดงจำนวนนิสิตที่ลา (คน) และจำนวนครั้งที่ยื่นลาทั้งหมดในแต่ละหมวดหมู่
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              รวม {stats.uniqueStudentsCount} คน
            </span>
            <span>•</span>
            <span className="font-semibold text-[#7749BC] dark:text-purple-300">
              {stats.total} ครั้ง
            </span>
          </div>
        </div>

        {/* 4 Leave Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveTypeBreakdown.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.key}
                onClick={() => setStudentTypeFilter(studentTypeFilter === item.key ? 'all' : item.key)}
                className={`p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border transition-all cursor-pointer hover:shadow-md ${
                  studentTypeFilter === item.key
                    ? `${item.borderColor} ring-2 ring-[#7749BC]/30 shadow-sm`
                    : 'border-neutral-200/80 dark:border-slate-800 hover:border-neutral-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl ${item.bgLight} ${item.textColor} flex items-center justify-center shrink-0`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{item.label}</h3>
                      <p className="text-[11px] text-neutral-400 line-clamp-1">{item.desc}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeBg}`}>
                    {item.percentage}%
                  </span>
                </div>

                {/* Main Stats: People vs Times */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-100 dark:border-slate-700/50 my-3">
                  <div>
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">
                      จำนวนนิสิต
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                        {item.studentCount}
                      </span>
                      <span className="text-xs text-neutral-400">คน</span>
                    </div>
                  </div>

                  <div className="border-l border-neutral-200 dark:border-slate-700 pl-2.5">
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">
                      จำนวนครั้งที่ลา
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-xl font-black ${item.textColor}`}>
                        {item.totalTimes}
                      </span>
                      <span className="text-xs text-neutral-400">ครั้ง</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full ${item.barColor} transition-all duration-500 rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                {/* Status Breakdown (Pending / Approved) */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Hourglass className="w-3 h-3" />
                    <span>รออนุมัติ: {item.pendingCount}</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>อนุมัติแล้ว: {item.approvedCount}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ตารางแสดงเฉพาะรายชื่อกับรหัสนิสิต (คลิกเพื่อดูแดชบอร์ดรายบุคคล) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
        {/* Table Header & Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7749BC] dark:text-purple-400" />
              <span>รายชื่อนิสิตและรหัสนิสิต (คลิกเพื่อเปิดแดชบอร์ดรายบุคคล)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              แสดงนิสิตทุกคนในรายวิชาที่เลือก — คลิกที่แถวหรือปุ่ม &quot;ดูแดชบอร์ด&quot; เพื่อดูสถิติการลาแบบละเอียด
            </p>
          </div>

          {/* Search & Quick Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสนิสิต หรือ ชื่อ-นามสกุล..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50/50 dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-[#7749BC] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="inline-flex p-1 bg-neutral-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setStudentStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  studentStatusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                ทั้งหมด ({studentLeaveStats.length})
              </button>
              <button
                onClick={() => setStudentStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  studentStatusFilter === 'pending'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <span>มีคำขอรออนุมัติ</span>
                {stats.uniquePendingStudentsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-bold">
                    {stats.uniquePendingStudentsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStudentStatusFilter('atRisk')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  studentStatusFilter === 'atRisk'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                เสี่ยงเกินเกณฑ์ ({overQuotaStudentsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Filter Badges Active Indicator */}
        {(studentTypeFilter !== 'all' || studentStatusFilter !== 'all' || searchQuery.trim() !== '') && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-neutral-400 font-medium">กำลังกรองตาม:</span>
            {studentTypeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                ประเภท: {studentTypeFilter}
                <button onClick={() => setStudentTypeFilter('all')} className="hover:text-purple-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {studentStatusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                สถานะ: {studentStatusFilter === 'pending' ? 'มีคำขอรออนุมัติ' : 'เสี่ยงเกินเกณฑ์'}
                <button onClick={() => setStudentStatusFilter('all')} className="hover:text-amber-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                คำค้นหา: &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-neutral-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setStudentTypeFilter('all');
                setStudentStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-neutral-500 hover:text-[#7749BC] underline ml-1 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}

        {/* Clean Student Table (เน้นแสดงเฉพาะรหัสและชื่อนิสิตตามที่ขอ) */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200/70 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/90 dark:bg-slate-800/80 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 border-b border-neutral-200/80 dark:border-slate-800 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-44">รหัสนิสิต</th>
                <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3.5 px-4 text-center w-36">จำนวนครั้งที่ลา</th>
                <th className="py-3.5 px-4 text-center w-40">สิทธิ์การเข้าสอบ</th>
                <th className="py-3.5 px-4 text-right w-40">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80 text-xs">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                      <User className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm">ไม่พบนิสิตที่ตรงกับเงื่อนไข</p>
                    <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรอง</p>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((st) => {
                  const totalSessions = st.rosterInfo?.totalSessions ?? 15;
                  const attended = st.rosterInfo?.attended ?? Math.max(totalSessions - st.approvedCount, 0);
                  const totalMissed = Math.max(totalSessions - attended, 0);
                  const leavesInSystem = st.totalCount;
                  const unexcusedAbsence = Math.max(totalMissed - leavesInSystem, 0);
                  const attendancePct = st.rosterInfo?.percentage ?? 100;
                  const isAtRisk = attendancePct < 80 || st.totalCount >= 3 || st.rosterInfo?.overQuota || unexcusedAbsence > 0;

                  return (
                    <tr
                      key={st.key}
                      onClick={() => setSelectedStudentDetail(st)}
                      className="hover:bg-purple-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      {/* รหัสนิสิต */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-slate-800 group-hover:bg-[#7749BC]/10 group-hover:text-[#7749BC] transition-colors">
                          {st.studentCode}
                        </span>
                      </td>

                      {/* ชื่อ-นามสกุล */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 text-[#7749BC] dark:text-purple-300 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-200/50 dark:border-purple-800/50 shadow-xs">
                            {initials(st.studentName)}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-[#7749BC] transition-colors text-sm">
                              {st.studentName}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              {st.studentEmail && st.studentEmail !== '-' ? st.studentEmail : 'นิสิต มหาวิทยาลัยบูรพา'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* จำนวนครั้งที่ลา / ขาดเรียน */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-bold text-xs ${
                              st.totalCount === 0
                                ? 'bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-neutral-400'
                                : st.totalCount >= 3
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : 'bg-purple-50 dark:bg-purple-950/60 text-[#7749BC] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                            }`}
                          >
                            ลา {st.totalCount} ครั้ง
                          </span>
                          {unexcusedAbsence > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs"
                              title={`ขาดเรียนโดยไม่แจ้งลา ${unexcusedAbsence} คาบ (ไม่เข้าเรียนรวม ${totalMissed} คาบ, ส่งใบลา ${leavesInSystem} ครั้ง)`}
                            >
                              <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                              <span>ขาดไม่แจ้งลา {unexcusedAbsence}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* สถานะสิทธิ์การเข้าสอบ */}
                      <td className="py-3.5 px-4 text-center">
                        {isAtRisk ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>เสี่ยงหมดสิทธิ์ ({attendancePct}%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>มีสิทธิ์สอบ ({attendancePct}%)</span>
                          </span>
                        )}
                      </td>

                      {/* ปุ่มเปิดดูแดชบอร์ด */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentDetail(st);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-[#7749BC] text-neutral-700 hover:text-white dark:bg-slate-800 dark:hover:bg-[#7749BC] dark:text-neutral-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูแดชบอร์ด</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary in Table */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span>
              แสดงนิสิต <strong>{displayedStudents.length}</strong> จากทั้งหมด <strong>{studentLeaveStats.length}</strong> คน
            </span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              มีคำขอรอพิจารณา {stats.uniquePendingStudentsCount} คน ({stats.pending} คำขอ)
            </span>
          </div>
          <span className="text-neutral-400 text-[11px]">
            คลิกที่แถวหรือปุ่ม &quot;ดูแดชบอร์ด&quot; เพื่อเปิดแดชบอร์ดสถิติและการลาแบบละเอียดของนิสิต
          </span>
        </div>
      </div>

      {/* 4. DAILY DRILL-DOWN MODAL / DRAWER (แสดงเมื่อคลิกแท่งวันที่ในกราฟ) */}
      {dailyDrawerOpen && selectedDailyDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#7749BC] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#7749BC] dark:text-purple-300 uppercase tracking-wide">
                      สถิติการลาประจำวัน
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#7749BC] dark:bg-purple-900/60 dark:text-purple-300">
                      {selectedDayLeaves.length} คำขอ
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {formatThaiDayOfWeekDate(selectedDailyDate)}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDailyDrawerOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    ยอดคำขอวันนี้
                  </span>
                  <span className="text-lg font-black text-[#7749BC] dark:text-purple-300">
                    {selectedDayLeaves.length} คำขอ
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    ลาป่วย / กิจ
                  </span>
                  <span className="text-lg font-black text-sky-700 dark:text-sky-300">
                    {selectedDayLeaves.filter((l) => l.type === 'ลาป่วย').length} /{' '}
                    {selectedDayLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    รอการอนุมัติ
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {selectedDayLeaves.filter((l) => l.status === 'รออนุมัติ').length} คำขอ
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    อนุมัติแล้ว
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {selectedDayLeaves.filter((l) => l.status === 'อนุมัติ').length} คำขอ
                  </span>
                </div>
              </div>

              {/* List of students on this day */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                  <span>รายชื่อนิสิตที่ยื่นลาในวันนี้</span>
                  <span className="text-neutral-400 font-normal">
                    {selectedDayLeaves.length} รายการ
                  </span>
                </h4>

                {selectedDayLeaves.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400 bg-neutral-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-xs">ไม่มีรายการนิสิตยื่นลาในวันนี้</p>
                  </div>
                ) : (
                  selectedDayLeaves.map((leave, idx) => {
                    const statusInfo = STATUS_DETAILS[leave.status] || STATUS_DETAILS['รออนุมัติ'];
                    return (
                      <div
                        key={leave.id || idx}
                        className="p-4 rounded-2xl border border-neutral-200/80 dark:border-slate-800 bg-neutral-50/40 dark:bg-slate-800/40 space-y-2.5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                              {initials(leave.studentName)}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">
                                {leave.studentName}
                              </div>
                              <div className="text-[11px] text-neutral-400 font-mono">
                                {leave.studentCode || '-'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                                LEAVE_TYPE_DETAILS[leave.type] || 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              {leave.type}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="font-medium">
                              {leave.courseCode} {leave.courseName} {leave.section ? `(กลุ่ม ${leave.section})` : ''}
                            </span>
                          </div>
                          {leave.period && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span>{leave.period}</span>
                            </div>
                          )}
                        </div>

                        {leave.reason && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200/60 dark:border-slate-700/60 text-xs">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-0.5">
                              เหตุผลการลา:
                            </span>
                            <p className="text-neutral-600 dark:text-neutral-400">{leave.reason}</p>
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              const foundStudent = studentLeaveStats.find(
                                (s) =>
                                  (leave.studentCode && s.studentCode === leave.studentCode) ||
                                  s.studentName === leave.studentName
                              );
                              if (foundStudent) {
                                setSelectedStudentDetail(foundStudent);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7749BC] dark:text-purple-300 hover:underline cursor-pointer"
                          >
                            <span>เปิดแดชบอร์ดสถิติและการลาของนิสิตคนนี้</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-neutral-500">
              <span>สามารถคลิกเปลี่ยนวันที่บนแท่งกราฟด้านหลังได้ตลอดเวลา</span>
              <button
                onClick={() => setDailyDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-slate-700 hover:bg-neutral-300 dark:hover:bg-slate-600 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. INDIVIDUAL STUDENT DASHBOARD MODAL (แดชบอร์ดสถิติและการลาแบบรายบุคคล) */}
      {selectedStudentDetail && (() => {
        const studentLeaves = selectedStudentDetail.leaves || [];
        const roster = selectedStudentDetail.rosterInfo;
        const totalSessions = roster?.totalSessions ?? 15;
        const attended = roster?.attended ?? Math.max(totalSessions - selectedStudentDetail.approvedCount, 0);
        const totalMissed = Math.max(totalSessions - attended, 0);
        const leavesInSystem = selectedStudentDetail.totalCount;
        const unexcusedAbsence = Math.max(totalMissed - leavesInSystem, 0);
        const attendancePct = roster?.percentage ?? Math.round((attended / totalSessions) * 100);
        const isExamEligible = attendancePct >= 80 && selectedStudentDetail.totalCount < 4 && !roster?.overQuota && unexcusedAbsence < 4;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200/90 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-200/80 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#7749BC] text-white font-bold flex items-center justify-center text-xl shadow-md border-2 border-white dark:border-slate-800">
                    {initials(selectedStudentDetail.studentName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7749BC]/10 text-[#7749BC] dark:bg-purple-950/80 dark:text-purple-300 border border-[#7749BC]/20">
                        แดชบอร์ดการลารายบุคคล
                      </span>
                      <span className="text-xs text-neutral-400">ภาคเรียน {selectedTerm === 'all' ? '1/2569' : selectedTerm}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {selectedStudentDetail.studentName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                      <span>รหัสนิสิต: <strong>{selectedStudentDetail.studentCode}</strong></span>
                      {selectedStudentDetail.studentEmail && selectedStudentDetail.studentEmail !== '-' && (
                        <>
                          <span>•</span>
                          <span className="font-sans">{selectedStudentDetail.studentEmail}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudentDetail(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="ปิดแดชบอร์ด"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* 1. สรุปภาพรวม: จำนวนครั้งที่ลาทั้งหมดในเทอมนี้ + แยกตามประเภทการลา */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#7749BC]" />
                    <span>สรุปสถิติการลาในภาคเรียนนี้</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* ยอดรวมการลา */}
                    <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 shadow-xs">
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 block mb-1">
                        จำนวนครั้งที่ลาทั้งหมด
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-[#7749BC] dark:text-purple-200">
                          {selectedStudentDetail.totalCount}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">ครั้ง</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        {selectedStudentDetail.totalCount === 0 ? 'ไม่เคยยื่นลาในเทอมนี้' : 'ยื่นในระบบทั้งหมด'}
                      </span>
                    </div>

                    {/* ลาป่วย */}
                    <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 shadow-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-1">
                        <HeartPulse className="w-3.5 h-3.5" />
                        <span>ลาป่วย</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-sky-800 dark:text-sky-200">
                          {selectedStudentDetail.sickCount}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">ครั้ง</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 block">ป่วย/พบแพทย์</span>
                    </div>

                    {/* ลากิจส่วนตัว */}
                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 shadow-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7749BC] dark:text-purple-300 mb-1">
                        <User className="w-3.5 h-3.5" />
                        <span>ลากิจส่วนตัว</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-[#7749BC] dark:text-purple-200">
                          {selectedStudentDetail.personalCount}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">ครั้ง</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 block">ธุระครอบครัว</span>
                    </div>

                    {/* ลากิจกรรม */}
                    <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>ลากิจกรรม</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-indigo-800 dark:text-indigo-200">
                          {selectedStudentDetail.activityCount}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">ครั้ง</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 block">ตัวแทนมหาวิทยาลัย</span>
                    </div>

                    {/* อื่นๆ */}
                    <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>อื่นๆ</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-amber-800 dark:text-amber-200">
                          {selectedStudentDetail.otherCount}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">ครั้ง</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 block">เหตุฉุกเฉิน/อื่นๆ</span>
                    </div>
                  </div>
                </div>

                {/* 2. สถานะสิทธิ์การเข้าสอบ: คำนวณเปอร์เซ็นต์เวลาเรียนคงเหลือ หรือแจ้งเตือนล่วงหน้าหากใกล้เกินเกณฑ์ */}
                <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-[#7749BC]" />
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          สถานะสิทธิ์การเข้าสอบปลายภาค (Exam Eligibility Status)
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        เกณฑ์มหาวิทยาลัยบูรพา: นิสิตต้องมีเวลาเรียนไม่น้อยกว่า 80% (ขาด/ลาได้ไม่เกิน 20% หรือไม่เกิน 3 ครั้ง จาก 15 คาบ)
                      </p>
                    </div>

                    {/* Badge สิทธิ์การสอบ */}
                    {isExamEligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs self-start sm:self-auto">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>มีสิทธิ์เข้าสอบตามเกณฑ์ปกติ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs self-start sm:self-auto">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>เสี่ยงหมดสิทธิ์สอบ (ขาด/ลาเกินเกณฑ์)</span>
                      </span>
                    )}
                  </div>

                  {/* สรุปการเข้าเรียน / การลา / ขาดเรียนไม่แจ้งลา */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-700/80">
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">ขาด/ไม่เข้าชั้นเรียนรวม</p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-bold text-neutral-800 dark:text-neutral-200">{totalMissed}</span>
                        <span className="text-xs text-neutral-400">คาบ (จาก {totalSessions})</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-700/80">
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">ยื่นใบลาในระบบแล้ว</p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-bold text-purple-700 dark:text-purple-300">{leavesInSystem}</span>
                        <span className="text-xs text-neutral-400">ครั้ง</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      unexcusedAbsence > 0 
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80' 
                        : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    }`}>
                      <p className={`text-[11px] font-semibold ${
                        unexcusedAbsence > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                      }`}>
                        ขาดเรียนโดยไม่แจ้งลา
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className={`text-xl font-black ${
                          unexcusedAbsence > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {unexcusedAbsence}
                        </span>
                        <span className="text-xs text-neutral-400">คาบ</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar เวลาเรียน */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-600 dark:text-neutral-300">
                        เวลาเรียนคงเหลือ: <strong>{attendancePct}%</strong> (เข้าเรียน {attended} จาก {totalSessions} คาบ)
                      </span>
                      <span className={attendancePct < 80 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {attendancePct < 80 ? 'ต่ำกว่าเกณฑ์ 80%' : 'ผ่านเกณฑ์ขั้นต่ำ 80%'}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          attendancePct < 80 ? 'bg-rose-500' : attendancePct < 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, attendancePct))}%` }}
                      />
                    </div>
                  </div>

                  {/* Alert Banner กรณีขาดเรียนโดยไม่แจ้งลา */}
                  {unexcusedAbsence > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">พบนิสิตขาดเรียนโดยไม่ได้ยื่นเอกสารการลาในระบบ {unexcusedAbsence} คาบ</p>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                          (จากบันทึกการเช็คชื่อเข้าชั้นเรียนพบว่าขาดเรียนรวม {totalMissed} คาบ แต่มีการยื่นเอกสารขอลาในระบบ {leavesInSystem} ครั้ง) อาจารย์สามารถแจ้งเตือนให้นิสิตส่งใบลาหรือตรวจสอบเหตุผลการขาดเรียนได้
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Alert Banner เมื่อใกล้เกินเกณฑ์ */}
                  {!isExamEligible && (
                    <div className="p-3.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">แจ้งเตือน: นิสิตขาด/ลาเกิน 20% หรือเกิน 3 ครั้งในรายวิชานี้แล้ว</p>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                          หากมีคำขอลาเพิ่มเติม ควรพิจารณาตรวจสอบเอกสารรับรองแพทย์ฉบับจริง หรือแนะนำให้นิสิตเข้าพบอาจารย์ผู้สอน/อาจารย์ที่ปรึกษา
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ประวัติการลาแบบละเอียด แสดงรายการประวัติทั้งหมดของนิสิตคนนั้น */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#7749BC]" />
                      <span>รายการประวัติการลาแบบละเอียด ({studentLeaves.length} รายการ)</span>
                    </h4>
                    <span className="text-xs text-neutral-400">
                      แสดงรายการใบลาทั้งหมดในวิชา/เทอมที่เลือก
                    </span>
                  </div>

                  {studentLeaves.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-200 dark:border-slate-800 text-neutral-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                      <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                        นิสิตคนนี้ไม่เคยยื่นใบลาในเทอมนี้ (x = 0)
                      </p>
                      <p className="text-xs text-neutral-400">มีประวัติการเข้าเรียนครบถ้วน 100%</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-neutral-100/80 dark:bg-slate-800/80 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-slate-700 uppercase tracking-wider">
                            <th className="py-3 px-3.5">วันที่ลา / คาบเรียน</th>
                            <th className="py-3 px-3.5">ประเภทการลา</th>
                            <th className="py-3 px-3.5">เหตุผลการลา</th>
                            <th className="py-3 px-3.5 text-center">หลักฐานแนบ</th>
                            <th className="py-3 px-3.5 text-center">สถานะคำร้อง</th>
                            <th className="py-3 px-3.5">วันที่ส่งคำร้อง / ผู้อนุมัติ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {studentLeaves.map((leave, idx) => {
                            const statusInfo = STATUS_DETAILS[leave.status] || STATUS_DETAILS['รออนุมัติ'];
                            const typeBadgeClass =
                              leave.type === 'ลาป่วย'
                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                : leave.type === 'ลากิจส่วนตัว'
                                ? 'bg-purple-50 text-[#7749BC] dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : leave.type === 'ลากิจกรรม'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';

                            return (
                              <tr key={leave.id || idx} className="hover:bg-neutral-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                {/* วันที่ลา / คาบเรียน */}
                                <td className="py-3.5 px-3.5 whitespace-nowrap">
                                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {formatThaiDate(leave.startDate)}
                                    {leave.endDate && leave.endDate !== leave.startDate && ` - ${formatThaiDate(leave.endDate)}`}
                                  </div>
                                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {leave.period || 'เต็มคาบเรียน'}
                                  </div>
                                </td>

                                {/* ประเภทการลา: แสดง Badge สีระบุชัดเจน */}
                                <td className="py-3.5 px-3.5 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${typeBadgeClass}`}>
                                    {leave.type}
                                  </span>
                                </td>

                                {/* เหตุผลการลา */}
                                <td className="py-3.5 px-3.5 max-w-[220px]">
                                  <p className="text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-relaxed">
                                    {leave.reason || '-'}
                                  </p>
                                  {leave.teacherComment && (
                                    <p className="text-[11px] text-[#7749BC] dark:text-purple-300 mt-1 italic">
                                      หมายเหตุ: {leave.teacherComment}
                                    </p>
                                  )}
                                </td>

                                {/* หลักฐานแนบ: ปุ่มดูใบรับรองแพทย์ / หนังสือขออนุญาต */}
                                <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                                  {leave.attachment ? (
                                    <AttachmentPreview
                                      src={
                                        leave.attachment.startsWith('/')
                                          ? leave.attachment
                                          : `/api/leaves/attachment/${leave.attachment}`
                                      }
                                      label={leave.type === 'ลาป่วย' ? 'ดูใบรับรองแพทย์' : 'ดูหนังสือขออนุญาต'}
                                      thumbClassName="w-6 h-6 rounded-md"
                                    />
                                  ) : (
                                    <span className="text-[11px] text-neutral-400 italic">ไม่มีเอกสารแนบ</span>
                                  )}
                                </td>

                                {/* สถานะคำร้อง */}
                                <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                    {statusInfo.label}
                                  </span>
                                </td>

                                {/* วันที่ส่งคำร้อง / ผู้อนุมัติ */}
                                <td className="py-3.5 px-3.5 whitespace-nowrap">
                                  <div className="text-neutral-700 dark:text-neutral-300 font-medium">
                                    ส่งเมื่อ: {formatThaiDateTime(leave.createdAt)}
                                  </div>
                                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    ผู้อนุมัติ: {leave.approvedBy || (leave.status === 'รออนุมัติ' ? 'รอการพิจารณา' : 'อาจารย์ผู้สอน')}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-neutral-200/80 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  สถิตินี้คำนวณตามการลงทะเบียนและประวัติใบลาในระบบ BUU Take A Leave
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStudentDetail(null)}
                  className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
