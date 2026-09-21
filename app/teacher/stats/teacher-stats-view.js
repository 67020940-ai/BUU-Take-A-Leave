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
} from 'lucide-react';
import LeaveBarChart from '@/components/charts/LeaveBarChart';
import LeaveDonutChart from '@/components/charts/LeaveDonutChart';
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

  // Chart View Mode: 'byCourse' | 'byWeek' | 'byDay'
  const [barChartMode, setBarChartMode] = useState('byDay');

  // Daily View Filters & Selected Day State
  const [dailyMonth, setDailyMonth] = useState('2026-09'); // '2026-09' | '2026-08' | 'all'
  const [dailyRangePreset, setDailyRangePreset] = useState('month'); // 'month' | '7days' | '14days' | 'all'
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

  // Total Students Roster
  const allStudents = useMemo(() => {
    const map = new Map();
    Object.entries(rosterByCourse).forEach(([cId, students]) => {
      if (selectedCourseId !== 'all' && cId !== selectedCourseId) return;
      students.forEach((s) => {
        if (!map.has(s.studentId)) map.set(s.studentId, s);
      });
    });
    return Array.from(map.values());
  }, [rosterByCourse, selectedCourseId]);

  const overQuotaStudentsCount = useMemo(() => {
    return allStudents.filter((s) => s.overQuota).length;
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

  // 1.2 Bar Chart Data Construction (byCourse, byWeek, byDay)
  const barChartData = useMemo(() => {
    // 1. By Course
    if (barChartMode === 'byCourse') {
      const activeCourses = selectedCourseId === 'all' ? courses : courses.filter((c) => c.id === selectedCourseId);
      const labels = activeCourses.map((c) => `${c.code} ${c.group ? `(กลุ่ม ${c.group})` : ''}`);

      const studentCounts = activeCourses.map((c) => {
        const courseLeaves = filteredLeaves.filter((l) => l.courseId === c.id || l.courseCode === c.code);
        const unique = new Set(courseLeaves.map((l) => l.studentCode || l.studentId || l.studentName));
        return unique.size;
      });

      const requestCounts = activeCourses.map((c) => {
        return filteredLeaves.filter((l) => l.courseId === c.id || l.courseCode === c.code).length;
      });

      return {
        labels,
        dates: [],
        datasets: [
          {
            label: 'จำนวนนิสิตที่ยื่นลา (คน)',
            data: studentCounts,
            backgroundColor: '#7749BC',
            hoverBackgroundColor: '#5B21B6',
          },
          {
            label: 'ยอดคำขอลาทั้งหมด (ครั้ง)',
            data: requestCounts,
            backgroundColor: '#38BDF8',
            hoverBackgroundColor: '#0284C7',
          },
        ],
      };
    }

    // 2. By Week
    if (barChartMode === 'byWeek') {
      const weeks = ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4', 'สัปดาห์ 5', 'สัปดาห์ 6'];
      const sickByWeek = [1, 2, 1, 3, 2, 1];
      const personalByWeek = [0, 1, 1, 0, 1, 1];
      const activityByWeek = [0, 0, 1, 2, 0, 0];

      return {
        labels: weeks,
        dates: [],
        datasets: [
          {
            label: 'ลาป่วย (คน)',
            data: sickByWeek,
            backgroundColor: '#0284C7',
            hoverBackgroundColor: '#0369A1',
          },
          {
            label: 'ลากิจส่วนตัว (คน)',
            data: personalByWeek,
            backgroundColor: '#7749BC',
            hoverBackgroundColor: '#5B21B6',
          },
          {
            label: 'ลากิจกรรม (คน)',
            data: activityByWeek,
            backgroundColor: '#6366F1',
            hoverBackgroundColor: '#4F46E5',
          },
        ],
      };
    }

    // 3. By Day (Daily Breakdown)
    // Gather all distinct dates based on selectedMonth / range
    let sortedDates = Array.from(dailyLeavesMap.keys()).sort();

    if (dailyMonth !== 'all') {
      sortedDates = sortedDates.filter((d) => d.startsWith(dailyMonth));
    }

    if (dailyRangePreset === '7days') {
      sortedDates = sortedDates.slice(-7);
    } else if (dailyRangePreset === '14days') {
      sortedDates = sortedDates.slice(-14);
    }

    // If no leaves found for month, generate a sample spread of days for that month
    if (sortedDates.length === 0 && dailyMonth !== 'all') {
      const daysInMonth = dailyMonth === '2026-09' ? 30 : 31;
      sortedDates = Array.from({ length: Math.min(15, daysInMonth) }, (_, i) => {
        const d = String(i * 2 + 1).padStart(2, '0');
        return `${dailyMonth}-${d}`;
      });
    }

    const labels = sortedDates.map((d) => formatShortDate(d));

    // Daily breakdown by leave type
    const sickData = [];
    const personalData = [];
    const activityData = [];
    const otherData = [];

    sortedDates.forEach((date) => {
      const dayLeaves = dailyLeavesMap.get(date) || [];
      sickData.push(dayLeaves.filter((l) => l.type === 'ลาป่วย').length);
      personalData.push(dayLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length);
      activityData.push(dayLeaves.filter((l) => l.type === 'ลากิจกรรม').length);
      otherData.push(
        dayLeaves.filter((l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน').length
      );
    });

    return {
      labels,
      dates: sortedDates,
      datasets: [
        {
          label: 'ลาป่วย (คน)',
          data: sickData,
          backgroundColor: '#0284C7',
          hoverBackgroundColor: '#0369A1',
        },
        {
          label: 'ลากิจส่วนตัว (คน)',
          data: personalData,
          backgroundColor: '#7749BC',
          hoverBackgroundColor: '#5B21B6',
        },
        {
          label: 'ลากิจกรรม (คน)',
          data: activityData,
          backgroundColor: '#6366F1',
          hoverBackgroundColor: '#4F46E5',
        },
        {
          label: 'อื่น ๆ (คน)',
          data: otherData,
          backgroundColor: '#F59E0B',
          hoverBackgroundColor: '#D97706',
        },
      ],
    };
  }, [barChartMode, courses, selectedCourseId, filteredLeaves, dailyLeavesMap, dailyMonth, dailyRangePreset]);

  // Handle click on chart bar for daily drill-down
  const handleBarClick = (index) => {
    if (barChartMode === 'byDay' && barChartData.dates && barChartData.dates[index]) {
      const clickedDate = barChartData.dates[index];
      setSelectedDailyDate(clickedDate);
      setDailyDrawerOpen(true);
    }
  };

  // Leaves for the currently selected day
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

  // Aggregated Student Leave Statistics
  const studentLeaveStats = useMemo(() => {
    const map = new Map();

    filteredLeaves.forEach((leave) => {
      const key =
        leave.studentCode && leave.studentCode !== '-'
          ? leave.studentCode
          : leave.studentName || leave.studentId || 'unknown';
      if (!map.has(key)) {
        map.set(key, {
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
        });
      }

      const item = map.get(key);
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

    return Array.from(map.values()).map((st) => {
      const rosterStudent = allStudents.find(
        (s) => (st.studentCode !== '-' && s.studentCode === st.studentCode) || s.studentName === st.studentName
      );
      return {
        ...st,
        coursesList: Array.from(st.courses),
        rosterInfo: rosterStudent || null,
      };
    });
  }, [filteredLeaves, allStudents]);

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
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#7749BC] dark:text-purple-400" />
              <span>สถิติการลาเรียน (Instructor Analytics & Statistics)</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              วิเคราะห์จำนวนนิสิตที่ลาจำแนกตามรายวัน รายวิชา รายชื่อนิสิต สัดส่วนประเภทการลา และสถานะการพิจารณา
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
            <span className="font-semibold">นิสิตเกินโควต้าลา</span>
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
                <span>เสี่ยงหมดสิทธิ์สอบ</span>
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

      {/* 1.2 Two-Column Grid: Left Bar Chart (with Daily Tab) & Right Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Bar Chart with Segmented Control: byCourse | byWeek | byDay */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7749BC]" />
                <span>
                  {barChartMode === 'byDay'
                    ? 'สถิติการลาของนิสิตแบบรายวัน (Daily Leave Analytics)'
                    : barChartMode === 'byCourse'
                    ? 'สถิติการลาของนิสิต จำแนกตามรายวิชา'
                    : 'สถิติการลาของนิสิต จำแนกตามช่วงสัปดาห์'}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {barChartMode === 'byDay'
                  ? 'แสดงจำนวนนิสิตที่ลาในแต่ละวัน (คลิกที่แท่งกราฟเพื่อดูรายชื่อนิสิตรายวัน)'
                  : barChartMode === 'byCourse'
                  ? 'จำนวนนิสิตที่ยื่นลาในแต่ละรายวิชาที่สอน (แกน X: รายวิชา, แกน Y: จำนวนคน)'
                  : 'จำนวนนิสิตที่ยื่นลาในแต่ละช่วงสัปดาห์ (แกน X: สัปดาห์, แกน Y: จำนวนคน)'}
              </p>
            </div>

            {/* Segmented Control: byDay | byCourse | byWeek */}
            <div className="inline-flex p-1 bg-neutral-100 dark:bg-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto shrink-0 shadow-inner">
              <button
                onClick={() => setBarChartMode('byDay')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  barChartMode === 'byDay'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>รายวัน (Daily)</span>
              </button>
              <button
                onClick={() => setBarChartMode('byCourse')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  barChartMode === 'byCourse'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                ตามรายวิชา
              </button>
              <button
                onClick={() => setBarChartMode('byWeek')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  barChartMode === 'byWeek'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                ตามสัปดาห์
              </button>
            </div>
          </div>

          {/* Sub-header controls specifically for Daily View (Month & Range Picker) */}
          {barChartMode === 'byDay' && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7749BC]" />
                  <span>เลือกเดือน/ช่วงเวลา:</span>
                </span>

                {/* Month Selector */}
                <select
                  value={dailyMonth}
                  onChange={(e) => {
                    setDailyMonth(e.target.value);
                    setSelectedDailyDate(null);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#7749BC] cursor-pointer"
                >
                  <option value="all">ทุกเดือน</option>
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

              {/* Range Presets: Month / 7 Days / 14 Days */}
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 text-[11px]">แสดงผล:</span>
                <div className="inline-flex p-0.5 bg-white dark:bg-slate-800 rounded-lg border border-purple-200/70 dark:border-purple-800/50 text-[11px]">
                  <button
                    onClick={() => setDailyRangePreset('month')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      dailyRangePreset === 'month'
                        ? 'bg-[#7749BC] text-white font-bold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    ทั้งเดือน
                  </button>
                  <button
                    onClick={() => setDailyRangePreset('14days')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      dailyRangePreset === '14days'
                        ? 'bg-[#7749BC] text-white font-bold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    14 วันล่าสุด
                  </button>
                  <button
                    onClick={() => setDailyRangePreset('7days')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      dailyRangePreset === '7days'
                        ? 'bg-[#7749BC] text-white font-bold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    7 วันล่าสุด
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chart Canvas */}
          <div className="pt-2">
            <LeaveBarChart
              labels={barChartData.labels}
              datasets={barChartData.datasets}
              yAxisLabel="คน"
              height={300}
              stacked={barChartMode !== 'byCourse'}
              onBarClick={handleBarClick}
            />
          </div>

          {/* Chart Footer Tip */}
          <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <MousePointerClick className="w-3.5 h-3.5 text-[#7749BC]" />
              {barChartMode === 'byDay' ? (
                <span>
                  คลิกที่ <strong>แท่งกราฟของวัน</strong> เพื่อดูรายชื่อนิสิตและใบลาของวันนั้นทันที
                </span>
              ) : barChartMode === 'byCourse' ? (
                <span>แกน X: รายวิชา & กลุ่มเรียน</span>
              ) : (
                <span>แกน X: ช่วงสัปดาห์ของการสอน</span>
              )}
            </span>
            <span className="text-[#7749BC] dark:text-purple-300 font-medium">
              Hover ดู Tooltip เพื่ออ่านรายละเอียดจำนวนคน
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Donut Chart (Proportion of Leave Types) */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-2 border-b border-neutral-100 dark:border-slate-800">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-sky-500" />
              <span>สัดส่วนประเภทการลาทั้งหมดของนิสิต</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              การกระจายตัวของประเภทการลาในทุกรายวิชาที่อาจารย์รับผิดชอบ
            </p>
          </div>

          <div className="pt-2">
            <LeaveDonutChart
              labels={['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'อื่น ๆ']}
              dataValues={[stats.sick, stats.personal, stats.activity, stats.others]}
              colors={['#0284C7', '#7749BC', '#6366F1', '#F59E0B']}
              hoverColors={['#0369A1', '#5B21B6', '#4F46E5', '#D97706']}
              unit="ครั้ง"
              height={200}
              centerTitle="คำขอลาทั้งหมด"
              centerValue={`${stats.total}`}
            />
          </div>

          {/* Analysis Insight Box */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-[#7749BC] dark:text-purple-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>ข้อสังเกตและแนวโน้มการลา</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">อนุมัติแล้ว {stats.approved}</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              การลาส่วนใหญ่เป็นประเภท <strong>ลาป่วย ({stats.total > 0 ? Math.round((stats.sick / stats.total) * 100) : 0}%)</strong> ซึ่งนิสิตมีเอกสารใบรับรองแพทย์ประกอบอย่างถูกต้อง
            </p>
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
                  {/* Student Count */}
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

                  {/* Total Leave Times */}
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

      {/* 3. รายชื่อนิสิตที่ลา และสถิติการลารายบุคคล (Detailed Student Leave Directory) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
        {/* Table Header & Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7749BC] dark:text-purple-400" />
              <span>รายชื่อนิสิตที่ยื่นคำขอลา และสถิติการลารายบุคคล</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              แสดงรายชื่อนิสิตทุกคนที่ลา จำนวนครั้งที่ลา แยกประเภทการลา และสถานะที่ยังไม่อนุมัติ/อนุมัติแล้ว
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
                placeholder="ค้นหารหัสนิสิต / ชื่อ-นามสกุล..."
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
                <span>ยังไม่อนุมัติ</span>
                {stats.uniquePendingStudentsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-bold">
                    {stats.uniquePendingStudentsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStudentStatusFilter('multi')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  studentStatusFilter === 'multi'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                ลา 2 ครั้งขึ้นไป
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
                สถานะ: {studentStatusFilter === 'pending' ? 'มีคำขอรออนุมัติ' : 'ลา 2 ครั้งขึ้นไป'}
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

        {/* Student Table */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200/70 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/90 dark:bg-slate-800/80 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 border-b border-neutral-200/80 dark:border-slate-800 uppercase tracking-wider">
                <th className="py-3.5 px-4">นิสิต (ชื่อ-สกุล / รหัส)</th>
                <th className="py-3.5 px-4">รายวิชาที่ยื่นลา</th>
                <th className="py-3.5 px-4 text-center">จำนวนครั้งที่ลา</th>
                <th className="py-3.5 px-4">จำแนกตามประเภทการลา</th>
                <th className="py-3.5 px-4 text-center">สถานะการอนุมัติ</th>
                <th className="py-3.5 px-4 text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80 text-xs">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                      <User className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm">ไม่พบนิสิตที่ตรงกับเงื่อนไข</p>
                    <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรอง</p>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((st) => {
                  const hasPending = st.pendingCount > 0;
                  return (
                    <tr
                      key={st.key}
                      className="hover:bg-purple-50/30 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 text-[#7749BC] dark:text-purple-300 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-200/50 dark:border-purple-800/50 shadow-xs">
                            {initials(st.studentName)}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-[#7749BC] transition-colors">
                              {st.studentName}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                              <span>{st.studentCode}</span>
                              {st.studentEmail && st.studentEmail !== '-' && (
                                <>
                                  <span>•</span>
                                  <span className="font-sans truncate max-w-[140px]">{st.studentEmail}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Courses */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {st.coursesList.map((c, i) => (
                            <div
                              key={i}
                              className="text-xs font-medium text-neutral-700 dark:text-neutral-300 line-clamp-1 flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total Leave Count */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7749BC] dark:text-purple-300 font-black text-sm border border-purple-200/60 dark:border-purple-800/60">
                            {st.totalCount} ครั้ง
                          </span>
                          {st.totalCount >= 3 && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                              ลาบ่อย
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Leave Types Breakdown for this student */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {st.sickCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              <HeartPulse className="w-3 h-3" />
                              <span>ลาป่วย {st.sickCount}</span>
                            </span>
                          )}
                          {st.personalCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <User className="w-3 h-3" />
                              <span>ลากิจ {st.personalCount}</span>
                            </span>
                          )}
                          {st.activityCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <Users className="w-3 h-3" />
                              <span>กิจกรรม {st.activityCount}</span>
                            </span>
                          )}
                          {st.otherCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <HelpCircle className="w-3 h-3" />
                              <span>อื่น ๆ {st.otherCount}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col gap-1 items-center">
                          {hasPending && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Hourglass className="w-3 h-3" />
                              <span>รออนุมัติ {st.pendingCount}</span>
                            </span>
                          )}
                          {st.approvedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" />
                              <span>อนุมัติ {st.approvedCount}</span>
                            </span>
                          )}
                          {st.rejectedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <X className="w-3 h-3" />
                              <span>ไม่อนุมัติ {st.rejectedCount}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Detail Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudentDetail(st)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-950/60 text-neutral-700 hover:text-[#7749BC] dark:text-neutral-300 dark:hover:text-purple-300 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูประวัติการลา</span>
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
              ยังไม่อนุมัติ {stats.uniquePendingStudentsCount} คน ({stats.pending} คำขอ)
            </span>
          </div>
          <span className="text-neutral-400 text-[11px]">
            กดปุ่ม &quot;ดูประวัติการลา&quot; เพื่อเปิดดูรายละเอียดใบลาและเอกสารแนบรายบุคคล
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
              {/* Daily Overview KPIs */}
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
                        {/* Header row */}
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

                        {/* Course & Time info */}
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

                        {/* Reason */}
                        {leave.reason && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200/60 dark:border-slate-700/60 text-xs">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-0.5">
                              เหตุผลการลา:
                            </span>
                            <p className="text-neutral-600 dark:text-neutral-400">{leave.reason}</p>
                          </div>
                        )}

                        {/* Quick View Button */}
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
                            <span>เปิดดูประวัติและเอกสารแนบทั้งหมดของนิสิต</span>
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

      {/* 5. Student Leave History Detail Modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between bg-neutral-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#7749BC] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {initials(selectedStudentDetail.studentName)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedStudentDetail.studentName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    <span>รหัสนิสิต: {selectedStudentDetail.studentCode}</span>
                    {selectedStudentDetail.studentEmail !== '-' && (
                      <>
                        <span>•</span>
                        <span className="font-sans">{selectedStudentDetail.studentEmail}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Summary Badges for this student */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    ยอดการลาทั้งหมด
                  </span>
                  <span className="text-lg font-black text-[#7749BC] dark:text-purple-300">
                    {selectedStudentDetail.totalCount} ครั้ง
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    ลาป่วย / กิจ
                  </span>
                  <span className="text-lg font-black text-sky-700 dark:text-sky-300">
                    {selectedStudentDetail.sickCount} / {selectedStudentDetail.personalCount}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    รออนุมัติ
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {selectedStudentDetail.pendingCount} คำขอ
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    อนุมัติแล้ว
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {selectedStudentDetail.approvedCount} คำขอ
                  </span>
                </div>
              </div>

              {/* Leave Records List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  ประวัติใบลา ({selectedStudentDetail.leaves.length} รายการ)
                </h4>

                {selectedStudentDetail.leaves.map((leave, idx) => {
                  const statusInfo = STATUS_DETAILS[leave.status] || STATUS_DETAILS['รออนุมัติ'];
                  return (
                    <div
                      key={leave.id || idx}
                      className="p-4 rounded-2xl border border-neutral-200/80 dark:border-slate-800 bg-neutral-50/30 dark:bg-slate-800/30 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                              LEAVE_TYPE_DETAILS[leave.type] || 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {leave.type}
                          </span>
                          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                            {leave.courseCode} {leave.courseName} {leave.section ? `(กลุ่ม ${leave.section})` : ''}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>
                            วันที่ลา: <strong>{formatThaiDate(leave.startDate)}</strong>
                            {leave.endDate && leave.endDate !== leave.startDate && ` ถึง ${formatThaiDate(leave.endDate)}`}
                          </span>
                        </div>
                        {leave.period && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>ช่วงเวลา: {leave.period}</span>
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

                      {leave.teacherComment && (
                        <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/50 text-xs">
                          <span className="font-semibold text-[#7749BC] dark:text-purple-300 block mb-0.5">
                            ความเห็นอาจารย์ผู้สอน:
                          </span>
                          <p className="text-neutral-700 dark:text-neutral-300">{leave.teacherComment}</p>
                        </div>
                      )}

                      {leave.attachment && (
                        <div className="pt-1">
                          <AttachmentPreview attachment={leave.attachment} leaveId={leave.id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-slate-700 hover:bg-neutral-300 dark:hover:bg-slate-600 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
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
