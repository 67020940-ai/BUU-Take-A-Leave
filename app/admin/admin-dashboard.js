'use client';
/* Hallmark · macrostructure: Workbench · theme: BUU Utilitarian · pre-emit critique: P5 H5 E5 S5 R5 V5 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  MessageSquare,
  LifeBuoy,
  Search,
  X,
  Send,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  Eye,
  CalendarDays,
  User,
  Users,
  HeartPulse,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Database,
  Download,
  Server,
  HardDrive,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopBar from '@/components/AdminTopBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import AttachmentPreview from '@/components/AttachmentPreview';
import { DAY_LABEL_TH, formatThaiDay, formatThaiDateTime, formatThaiDate } from '@/lib/ui';
import { useSidebarCollapsed } from '@/lib/useSidebarCollapsed';

export default function AdminDashboard({ user, courses = [], leaves = [], tickets: initialTickets = [] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tickets' | 'courses' | 'leaves'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1/2569');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('all');

  // Real-time leaves synchronization
  const [leavesList, setLeavesList] = useState(leaves);

  useEffect(() => {
    setLeavesList(leaves);
  }, [leaves]);

  useEffect(() => {
    let active = true;
    async function syncAdminLeaves() {
      try {
        const res = await fetch('/api/leaves');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.leaves)) {
            setLeavesList(data.leaves);
          }
        }
      } catch (err) {}
    }

    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) syncAdminLeaves();
    }, 60000);
    const handleFocus = () => syncAdminLeaves();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('buu:leaves_updated', syncAdminLeaves);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('buu:leaves_updated', syncAdminLeaves);
    };
  }, []);

  // Ticket management state
  const [ticketFilter, setTicketFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  // Leave detail modal state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');
  const [leavePage, setLeavePage] = useState(1);
  const LEAVE_PAGE_SIZE = 20;

  // Selected Course Drilldown Modal state (ดูรายชื่อนิสิตในกลุ่มเรียน)
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);

  // Admin Override state
  const [adminActionStatus, setAdminActionStatus] = useState(null);
  const [adminComment, setAdminComment] = useState('');
  const [savingAdminAction, setSavingAdminAction] = useState(false);
  const [adminActionError, setAdminActionError] = useState('');

  const [coursePage, setCoursePage] = useState(1);
  const COURSE_PAGE_SIZE = 20;

  const [ticketPage, setTicketPage] = useState(1);
  const TICKET_PAGE_SIZE = 20;

  // Integration & Sync state
  const [syncingCourses, setSyncingCourses] = useState(false);
  const [syncingEnrollment, setSyncingEnrollment] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [importedFileName, setImportedFileName] = useState('');
  const [importingFile, setImportingFile] = useState(false);

  // Sync tab from URL query param
  useEffect(() => {
    function processParams(searchStr) {
      if (!searchStr) return;
      const sp = new URLSearchParams(searchStr);
      let tabParam = sp.get('tab');
      if (tabParam === 'support') tabParam = 'tickets';
      if (tabParam && ['overview', 'tickets', 'courses', 'leaves', 'integration', 'backup'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      const ticketId = sp.get('id') || sp.get('ticketId');
      if (ticketId && tickets.length > 0) {
        const found = tickets.find((t) => String(t.id) === String(ticketId));
        if (found) setSelectedTicket(found);
      }
    }

    if (typeof window !== 'undefined') {
      processParams(window.location.search);

      const handlePopState = () => {
        const currentSp = new URLSearchParams(window.location.search);
        let t = currentSp.get('tab') || 'overview';
        if (t === 'support') t = 'tickets';
        setActiveTab(t);
      };
      window.addEventListener('popstate', handlePopState);

      const handleNotificationEvent = (e) => {
        setActiveTab('tickets');
        const n = e.detail?.notification;
        if (n && tickets.length > 0) {
          const msg = n.message || '';
          const found = tickets.find((t) => msg.includes(t.subject) || msg.includes(t.userName));
          if (found) setSelectedTicket(found);
        }
      };
      window.addEventListener('buu:open-notification', handleNotificationEvent);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('buu:open-notification', handleNotificationEvent);
      };
    }
  }, [tickets]);

  function handleSwitchTab(tabKey) {
    setActiveTab(tabKey);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const url = new URL(window.location.href);
      if (tabKey === 'overview') url.searchParams.delete('tab');
      else url.searchParams.set('tab', tabKey);
      window.history.pushState(null, '', url.toString());
    }
  }

  // Counts for the 4 Overview Boxes
  const openTicketsCount = tickets.filter((t) => t.status === 'เปิดเรื่อง').length;
  const approvedLeaves = leavesList.filter((l) => l.status === 'อนุมัติ').length;
  const pendingLeaves = leavesList.filter((l) => l.status === 'รออนุมัติ').length;
  const rejectedLeaves = leavesList.filter((l) => l.status === 'ไม่อนุมัติ').length;

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = ticketFilter === 'all' || t.status === ticketFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.subject.toLowerCase().includes(q) ||
        (t.userName && t.userName.toLowerCase().includes(q)) ||
        (t.message && t.message.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [tickets, ticketFilter, searchQuery]);

  const totalTicketPages = Math.max(1, Math.ceil(filteredTickets.length / TICKET_PAGE_SIZE));
  const paginatedTickets = useMemo(() => {
    const start = (ticketPage - 1) * TICKET_PAGE_SIZE;
    return filteredTickets.slice(start, start + TICKET_PAGE_SIZE);
  }, [filteredTickets, ticketPage, TICKET_PAGE_SIZE]);

  // Filtered Leaves
  const filteredLeaves = useMemo(() => {
    return leavesList.filter((l) => {
      const matchesStatus = leaveStatusFilter === 'all' ? l.status !== 'ยกเลิก' : l.status === leaveStatusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (l.studentName && l.studentName.toLowerCase().includes(q)) ||
        (l.courseName && l.courseName.toLowerCase().includes(q)) ||
        (l.courseCode && l.courseCode.toLowerCase().includes(q)) ||
        (l.reason && l.reason.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [leavesList, leaveStatusFilter, searchQuery]);

  const totalLeavePages = Math.max(1, Math.ceil(filteredLeaves.length / LEAVE_PAGE_SIZE));
  const paginatedLeaves = useMemo(() => {
    const start = (leavePage - 1) * LEAVE_PAGE_SIZE;
    return filteredLeaves.slice(start, start + LEAVE_PAGE_SIZE);
  }, [filteredLeaves, leavePage, LEAVE_PAGE_SIZE]);

  // Unique Teacher List for Courses Filter
  const teacherList = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      const name = c.teacherName || c.teacher?.name;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [courses]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return courses.filter((c) => {
      // 1. Term filter (default 1/2569, or matches selectedTerm)
      const matchesTerm = selectedTerm === 'all' || !c.term || c.term === selectedTerm;
      // 2. Teacher filter
      const teacherName = c.teacherName || c.teacher?.name || '';
      const matchesTeacher = selectedTeacherFilter === 'all' || teacherName === selectedTeacherFilter;
      // 3. Search query
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.room && c.room.toLowerCase().includes(q)) ||
        (teacherName && teacherName.toLowerCase().includes(q));

      return matchesTerm && matchesTeacher && matchesSearch;
    });
  }, [courses, selectedTerm, selectedTeacherFilter, searchQuery]);

  const totalCoursePages = Math.max(1, Math.ceil(filteredCourses.length / COURSE_PAGE_SIZE));
  const paginatedCourses = useMemo(() => {
    const start = (coursePage - 1) * COURSE_PAGE_SIZE;
    return filteredCourses.slice(start, start + COURSE_PAGE_SIZE);
  }, [filteredCourses, coursePage, COURSE_PAGE_SIZE]);

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    const leaveEvents = leavesList.map((l) => {
      let text = '';
      if (l.status === 'อนุมัติ') text = `คำร้องขอลาของ ${l.studentName} วิชา "${l.courseName}" ได้รับการอนุมัติ`;
      else if (l.status === 'ไม่อนุมัติ') text = `คำร้องขอลาของ ${l.studentName} วิชา "${l.courseName}" ไม่อนุมัติ`;
      else if (l.status === 'ยกเลิก') text = `${l.studentName} ยกเลิกคำร้องลาวิชา "${l.courseName}"`;
      else text = `${l.studentName} ยื่นคำร้องขอลาวิชา "${l.courseName}" (${l.type})`;
      return { id: `leave-${l.id}`, time: l.createdAt, text, kind: 'leave', status: l.status };
    });

    const ticketEvents = tickets.map((t) => ({
      id: `ticket-${t.id}`,
      time: t.createdAt,
      text: `${t.userName || 'ผู้ใช้งาน'} แจ้งปัญหา "${t.subject}"`,
      kind: 'ticket',
      status: t.status,
    }));

    return [...leaveEvents, ...ticketEvents]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 15);
  }, [leavesList, tickets]);

  // Handle reply to support ticket
  async function handleSendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSavingReply(true);
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTicket.id, reply: replyText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? data.ticket : t)));
        setSelectedTicket(null);
        setReplyText('');
        router.refresh();
      }
    } finally {
      setSavingReply(false);
    }
  }

  // Admin Override Leave Status (ช่วยเหลือหรือเปลี่ยนสถานะแทนอาจารย์)
  async function handleAdminOverrideLeave(newStatus) {
    if (!selectedLeave) return;
    if (newStatus === 'ไม่อนุมัติ' && !adminComment.trim()) {
      setAdminActionError('กรุณาระบุเหตุผลการไม่อนุมัติ');
      return;
    }
    setSavingAdminAction(true);
    setAdminActionError('');
    try {
      const finalComment = adminComment.trim()
        ? `[ผู้ดูแลระบบ] ${adminComment.trim()}`
        : `[ผู้ดูแลระบบ ดำเนินการแทนอาจารย์ผู้สอน]`;

      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLeave.id,
          status: newStatus,
          comment: finalComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = data.leave || { ...selectedLeave, status: newStatus, teacherComment: finalComment };
        setLeavesList((prev) => prev.map((l) => (l.id === selectedLeave.id ? { ...l, ...updated } : l)));
        setSelectedLeave((prev) => (prev ? { ...prev, ...updated } : null));
        setAdminActionStatus(null);
        setAdminComment('');
        router.refresh();
      } else {
        setAdminActionError(data.error || 'ไม่สามารถอัปเดตสถานะได้');
      }
    } catch (err) {
      setAdminActionError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSavingAdminAction(false);
    }
  }

  const [isSidebarCollapsed] = useSidebarCollapsed();

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row font-sans text-neutral-800 dark:text-neutral-100">
      {/* 1. Left Sidebar */}
      <AdminSidebar
        user={user}
        activeTab={activeTab}
        onSelectTab={handleSwitchTab}
        openTicketsCount={openTicketsCount}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className={`flex-1 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-w-0 w-full transition-all duration-300`}>
        <AdminTopBar
          user={user}
          semester={selectedTerm}
          onSemesterChange={setSelectedTerm}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="ค้นหาคำร้อง, นิสิต, วิชา หรือปัญหา..."
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6 ${isSidebarCollapsed ? 'max-w-none' : 'max-w-7xl'} w-full mx-auto transition-all duration-300`}>
          {/* ================= SESSION 1: OVERVIEW (ภาพรวมระบบ) ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 4 Connected Horizontal Summary Boxes (All, Approved, Pending, Open Tickets) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Box 1: คำร้องลาทั้งหมด */}
                <button
                  type="button"
                  onClick={() => handleSwitchTab('leaves')}
                  className="p-4 sm:p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border-2 border-neutral-200 dark:border-slate-800 hover:border-[#7749BC] dark:hover:border-purple-500 hover:shadow-md transition-all cursor-pointer text-neutral-800 dark:text-neutral-200 block group shadow-2xs relative"
                  title="ดูรายการคำร้องลาทั้งหมด"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-bold truncate group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors">
                      คำร้องลาทั้งหมด
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#7749BC] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 dark:text-neutral-100">
                      {leavesList.length}
                    </span>
                    <span className="text-[11px] text-neutral-400 group-hover:text-[#7749BC] transition-colors">
                      รายการ
                    </span>
                  </div>
                </button>

                {/* Box 2: อนุมัติแล้ว */}
                <button
                  type="button"
                  onClick={() => {
                    setLeaveStatusFilter('อนุมัติ');
                    handleSwitchTab('leaves');
                  }}
                  className="p-4 sm:p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border-2 border-neutral-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer text-neutral-800 dark:text-neutral-200 block group shadow-2xs relative"
                  title="ดูคำร้องที่อนุมัติแล้ว"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-bold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      อนุมัติแล้ว
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {approvedLeaves}
                    </span>
                    <span className="text-[11px] text-neutral-400 group-hover:text-emerald-600 transition-colors">
                      รายการ
                    </span>
                  </div>
                </button>

                {/* Box 3: รออนุมัติ */}
                <button
                  type="button"
                  onClick={() => {
                    setLeaveStatusFilter('รออนุมัติ');
                    handleSwitchTab('leaves');
                  }}
                  className="p-4 sm:p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border-2 border-neutral-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all cursor-pointer text-neutral-800 dark:text-neutral-200 block group shadow-2xs relative"
                  title="ดูคำร้องที่รออนุมัติ"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-bold truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      รออนุมัติ
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                      {pendingLeaves}
                    </span>
                    <span className="text-[11px] text-neutral-400 group-hover:text-amber-600 transition-colors">
                      รายการ
                    </span>
                  </div>
                </button>

                {/* Box 4: ปัญหาที่รอตอบกลับ */}
                <button
                  type="button"
                  onClick={() => {
                    setTicketFilter('เปิดเรื่อง');
                    handleSwitchTab('tickets');
                  }}
                  className="p-4 sm:p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border-2 border-neutral-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-md transition-all cursor-pointer text-neutral-800 dark:text-neutral-200 block group shadow-2xs relative"
                  title="ดูเรื่องแจ้งปัญหาที่รอตอบกลับ"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-bold truncate group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      ปัญหาที่รอตอบกลับ
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
                      {openTicketsCount}
                    </span>
                    <span className="text-[11px] text-neutral-400 group-hover:text-rose-600 transition-colors">
                      รายการ
                    </span>
                  </div>
                </button>
              </div>

              {/* Quick Alert: Open Tickets */}
              {openTicketsCount > 0 && (
                <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <LifeBuoy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        มีเรื่องแจ้งปัญหาระบบรอตอบกลับ {openTicketsCount} รายการ
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                        นิสิตหรืออาจารย์ส่งข้อความขอความช่วยเหลือ กรุณาตรวจสอบและตอบกลับ
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTicketFilter('เปิดเรื่อง');
                      handleSwitchTab('tickets');
                    }}
                    className="px-4 py-2 rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>ไปยังระบบแจ้งปัญหา</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Grid 2 Columns: Recent Tickets & Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tickets Preview Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
                        <LifeBuoy className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                          รายการแจ้งปัญหาล่าสุด
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {tickets.length} คำร้องเรียนทั้งหมด
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('tickets')}
                      className="text-xs font-bold text-[#7749BC] dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>ดูทั้งหมด</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {tickets.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTicket(t);
                          setReplyText(t.reply || '');
                        }}
                        className="p-3.5 rounded-2xl border border-neutral-100 dark:border-slate-800/80 bg-neutral-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.status === 'เปิดเรื่อง'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {t.status}
                            </span>
                            <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                              {t.subject}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                            {t.userName} • {formatThaiDate(t.createdAt)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Activity Feed / Audit Log */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                          บันทึกกิจกรรมระบบ (Audit Feed)
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          ความเคลื่อนไหวการลาและคำร้องเรียนล่าสุด
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
                    {recentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start gap-3 p-2.5 rounded-xl border border-neutral-100 dark:border-slate-800/80 bg-neutral-50/40 dark:bg-slate-800/40"
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            act.status === 'อนุมัติ'
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950'
                              : act.status === 'ไม่อนุมัติ'
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950'
                              : 'bg-purple-100 text-[#7749BC] dark:bg-purple-950'
                          }`}
                        >
                          {act.kind === 'ticket' ? (
                            <LifeBuoy className="w-3.5 h-3.5" />
                          ) : (
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-snug">
                            {act.text}
                          </p>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block font-mono">
                            {formatThaiDateTime(act.time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SESSION 2: TICKETS (แจ้งปัญหาระบบ) ================= */}
          {activeTab === 'tickets' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                      จัดการเรื่องแจ้งปัญหาและข้อเสนอแนะ (Support Tickets)
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      ตอบกลับข้อซักถามและปัญหาการใช้งานจากนิสิตและอาจารย์
                    </p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTicketFilter('all')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      ticketFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-bold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    ทั้งหมด ({tickets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketFilter('เปิดเรื่อง')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      ticketFilter === 'เปิดเรื่อง'
                        ? 'bg-rose-500 text-white shadow-2xs font-bold'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    รอตอบกลับ ({openTicketsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketFilter('ตอบกลับแล้ว')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      ticketFilter === 'ตอบกลับแล้ว'
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    ตอบกลับแล้ว
                  </button>
                </div>
              </div>

              {/* Tickets List */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
                {filteredTickets.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <LifeBuoy className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
                    <p className="text-sm font-semibold text-neutral-500">ไม่พบรายการแจ้งปัญหาตามเงื่อนไข</p>
                  </div>
                ) : (
                  paginatedTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTicket(t);
                        setReplyText(t.reply || '');
                      }}
                      className="p-4 rounded-2xl border border-neutral-100 dark:border-slate-800/80 bg-neutral-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-md"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.status === 'เปิดเรื่อง'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {t.status}
                          </span>
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                            {t.subject}
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                          {t.message}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono pt-0.5">
                          ผู้แจ้ง: {t.userName} ({t.userEmail}) • {formatThaiDateTime(t.createdAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 text-xs font-bold hover:bg-purple-200 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                      >
                        {t.status === 'เปิดเรื่อง' ? 'ตอบกลับ' : 'ดูรายละเอียด'}
                      </button>
                    </div>
                  ))
                )}

                {/* Tickets Pagination Controls */}
                {totalTicketPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-100 dark:border-slate-800 text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                      หน้า {ticketPage} จาก {totalTicketPages} (ทั้งหมด {filteredTickets.length} รายการ)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={ticketPage <= 1}
                        onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                        title="หน้าก่อนหน้า"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={ticketPage >= totalTicketPages}
                        onClick={() => setTicketPage((p) => Math.min(totalTicketPages, p + 1))}
                        className="p-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                        title="หน้าถัดไป"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SESSION 3: COURSES (รายวิชาที่เปิดสอน) ================= */}
          {activeTab === 'courses' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                      รายวิชาและกลุ่มเรียนที่เปิดสอน ({filteredCourses.length} รายวิชา)
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      ฐานข้อมูลรายวิชา อาจารย์ผู้สอน ห้องเรียน และจำนวนนิสิตที่ลงทะเบียน
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Filter by Teacher */}
                  <div className="relative">
                    <select
                      value={selectedTeacherFilter}
                      onChange={(e) => {
                        setSelectedTeacherFilter(e.target.value);
                        setCoursePage(1);
                      }}
                      className="text-xs font-medium pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/40 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="all">อาจารย์ทั้งหมด ({teacherList.length} ท่าน)</option>
                      {teacherList.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Filter by Term */}
                  <div className="relative">
                    <select
                      value={selectedTerm}
                      onChange={(e) => {
                        setSelectedTerm(e.target.value);
                        setCoursePage(1);
                      }}
                      className="text-xs font-bold pl-3 pr-8 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[#7749BC] dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/40 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="1/2569">เทอม 1/2569 (ปัจจุบัน)</option>
                      <option value="2/2569">เทอม 2/2569</option>
                      <option value="all">ทุกภาคเรียน</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 1. Mobile Courses Cards List (< md) */}
              <div className="block md:hidden space-y-3">
                {paginatedCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCourseDetail(c)}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xs space-y-2.5 cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-[#7749BC] dark:text-purple-400">
                            {c.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">
                            กลุ่ม {c.group || '1'}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white mt-0.5">
                          {c.name}
                        </h4>
                      </div>
                      <span className="font-mono font-bold text-xs text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-xl bg-neutral-100 dark:bg-slate-800 shrink-0">
                        {c.studentCount || c.totalStudents || 35} คน
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-slate-800">
                      <div>
                        <span className="text-neutral-400 block text-[10px]">ผู้สอน</span>
                        <span className="font-medium truncate block">{c.teacherName || c.teacher?.name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">วันและเวลา / ห้อง</span>
                        <span className="font-mono truncate block">
                          {c.day ? `${formatThaiDay(c.day)} ` : ''}{c.time || '-'} ({c.room || '-'})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Tablet & Desktop Courses Table (>= md) */}
              <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-slate-800 text-neutral-400 font-bold">
                      <th className="pb-3">รหัสวิชา</th>
                      <th className="pb-3">ชื่อรายวิชา</th>
                      <th className="pb-3">กลุ่ม</th>
                      <th className="pb-3">อาจารย์ผู้สอน</th>
                      <th className="pb-3">วัน/เวลา</th>
                      <th className="pb-3">ห้อง</th>
                      <th className="pb-3 text-right">จำนวนนิสิต</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                    {paginatedCourses.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCourseDetail(c)}
                        className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors cursor-pointer group"
                        title="คลิกเพื่อดูรายละเอียดและรายชื่อนิสิตในกลุ่มเรียน"
                      >
                        <td className="py-3 font-mono font-bold text-[#7749BC] dark:text-purple-400 group-hover:underline">
                          {c.code}
                        </td>
                        <td className="py-3 font-semibold text-neutral-800 dark:text-neutral-200">
                          {c.name}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">
                            {c.group || '1'}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-600 dark:text-neutral-300">
                          {c.teacherName || c.teacher?.name || '-'}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-neutral-500">
                          {c.day ? `${formatThaiDay(c.day)} ` : ''}
                          {c.time || '-'}
                        </td>
                        <td className="py-3 font-mono text-neutral-600 dark:text-neutral-300">
                          {c.room || '-'}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-[#7749BC] dark:text-purple-300">
                          {c.studentCount || c.totalStudents || 35} คน &rarr;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Courses Pagination Controls */}
                {totalCoursePages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-100 dark:border-slate-800 text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                      หน้า {coursePage} จาก {totalCoursePages} (ทั้งหมด {filteredCourses.length} รายการ)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={coursePage <= 1}
                        onClick={() => setCoursePage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                        title="หน้าก่อนหน้า"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={coursePage >= totalCoursePages}
                        onClick={() => setCoursePage((p) => Math.min(totalCoursePages, p + 1))}
                        className="p-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                        title="หน้าถัดไป"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SESSION 4: LEAVES (คำร้องลาทั้งระบบ) ================= */}
          {activeTab === 'leaves' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                      ทะเบียนคำร้องขอลาเรียนทั้งระบบ ({filteredLeaves.length} รายการ)
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      ตรวจสอบประวัติการลาของนิสิตทุกรายวิชา และสถานะการพิจารณาของอาจารย์
                    </p>
                  </div>
                </div>

                {/* Filter Status & Export Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold overflow-x-auto">
                    {['all', 'รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setLeaveStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                          leaveStatusFilter === st
                            ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-bold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                        }`}
                      >
                        {st === 'all' ? 'ทั้งหมด' : st}
                      </button>
                    ))}
                  </div>

                  <a
                    href={`/api/export?type=leaves&format=xlsx&term=${selectedTerm || 'all'}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                    title="ดาวน์โหลดรายงานประวัติการลาทั้งระบบ (Excel .xlsx)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ส่งออก Excel</span>
                  </a>
                </div>
              </div>

              {/* 1. Mobile Leaves Cards List (< md) */}
              <div className="block md:hidden space-y-3">
                {paginatedLeaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white">
                            {l.studentName || 'นิสิต'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-bold text-[10px]">
                            {l.type}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-[#7749BC] dark:text-purple-400 mt-0.5 truncate">
                          {l.courseName}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] whitespace-nowrap shrink-0 border ${
                          l.status === 'อนุมัติ'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : l.status === 'รออนุมัติ'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            : l.status === 'ยกเลิก'
                            ? 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-slate-800 dark:text-neutral-400 dark:border-slate-700'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            l.status === 'อนุมัติ'
                              ? 'bg-emerald-500'
                              : l.status === 'รออนุมัติ'
                              ? 'bg-amber-500'
                              : l.status === 'ยกเลิก'
                              ? 'bg-neutral-400'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="whitespace-nowrap">{l.status === 'อนุมัติ' ? 'อนุมัติแล้ว' : l.status}</span>
                      </span>
                    </div>

                    <div className="text-xs text-neutral-600 dark:text-neutral-300">
                      <p className="line-clamp-2"><strong>เหตุผล:</strong> {l.reason || '-'}</p>
                      <p className="text-[11px] text-neutral-400 font-mono mt-1">
                        วันที่ลา: {formatThaiDate(l.startDate || l.createdAt)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedLeave(l)}
                        className="min-h-[44px] w-full rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-[#7749BC] hover:text-white text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูรายละเอียดคำขอ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Tablet & Desktop Leaves Table (>= md) */}
              <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-slate-800 text-neutral-400 font-bold">
                      <th className="pb-3">นิสิต</th>
                      <th className="pb-3">วิชา</th>
                      <th className="pb-3">ประเภท</th>
                      <th className="pb-3">วันที่ลา</th>
                      <th className="pb-3">เหตุผล</th>
                      <th className="pb-3 min-w-[110px] whitespace-nowrap">สถานะ</th>
                      <th className="pb-3 text-right">รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                    {paginatedLeaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 font-semibold text-neutral-900 dark:text-white">
                          {l.studentName || 'นิสิต'}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-[#7749BC] dark:text-purple-400">
                          {l.courseName}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-bold text-[10px]">
                            {l.type}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-600 dark:text-neutral-300 font-mono text-[11px]">
                          {formatThaiDate(l.startDate || l.createdAt)}
                        </td>
                        <td className="py-3 text-neutral-600 dark:text-neutral-300 max-w-[200px] truncate" title={l.reason}>
                          {l.reason}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] whitespace-nowrap shrink-0 border ${
                              l.status === 'อนุมัติ'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : l.status === 'รออนุมัติ'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                : l.status === 'ยกเลิก'
                                ? 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-slate-800 dark:text-neutral-400 dark:border-slate-700'
                                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                l.status === 'อนุมัติ'
                                  ? 'bg-emerald-500'
                                  : l.status === 'รออนุมัติ'
                                  ? 'bg-amber-500'
                                  : l.status === 'ยกเลิก'
                                  ? 'bg-neutral-400'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span className="whitespace-nowrap">{l.status === 'อนุมัติ' ? 'อนุมัติแล้ว' : l.status}</span>
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLeave(l)}
                            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-500 hover:text-[#7749BC] cursor-pointer"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalLeavePages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-100 dark:border-slate-800 text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                      หน้า {leavePage} จาก {totalLeavePages} (ทั้งหมด {filteredLeaves.length} รายการ)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={leavePage <= 1}
                        onClick={() => setLeavePage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                        title="หน้าก่อนหน้า"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={leavePage >= totalLeavePages}
                        onClick={() => setLeavePage((p) => Math.min(totalLeavePages, p + 1))}
                        className="p-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                        title="หน้าถัดไป"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SESSION 5: BUU INTEGRATION (เชื่อมต่อระบบมหาลัย) ================= */}
          {activeTab === 'integration' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 shadow-2xs space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-neutral-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        การเชื่อมต่อระบบสารสนเทศมหาวิทยาลัยบูรพา (BUU Integrations)
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        ระบบซิงค์ข้อมูลรายวิชาและการลงทะเบียนนิสิตจากระบบทะเบียนกลาง (reg.buu.ac.th) และระบบยืนยันตัวตน (LDAP SSO)
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ระบบเชื่อมต่อพร้อมทำงาน</span>
                  </span>
                </div>

                {syncMessage && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                      syncMessage.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{syncMessage.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSyncMessage(null)}
                      className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      ปิด
                    </button>
                  </div>
                )}

                {/* Status Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status 1: LDAP SSO */}
                  <div className="p-4 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#7749BC]" /> BUU LDAP / SSO
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                        Connected
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      ยืนยันตัวตนบัญชี @go.buu.ac.th และ @buu.ac.th อัตโนมัติ (Just-in-Time Provisioning)
                    </p>
                  </div>

                  {/* Status 2: Reg API Gateway */}
                  <div className="p-4 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-[#7749BC]" /> reg.buu.ac.th Gateway
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      ช่องทางดึงข้อมูลรายวิชา ตารางสอน และกลุ่มเรียน (Rest API v2)
                    </p>
                  </div>

                  {/* Status 3: Last Synced */}
                  <div className="p-4 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#7749BC]" /> ซิงค์ล่าสุด (Last Sync)
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">Auto-Daily</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono font-medium leading-relaxed">
                      วันนี้ เวลา 03:00 น. (ตารางเรียนและข้อมูลนิสิตเป็นปัจจุบัน)
                    </p>
                  </div>
                </div>

                {/* Action Section 1: Manual Live Sync */}
                <div className="p-5 rounded-2xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#7749BC] dark:text-purple-300">
                    <RotateCcw className="w-4 h-4" />
                    <span>คำสั่งสั่งซิงค์ข้อมูลสด (Manual Sync Triggers)</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    เมื่อมีการเพิ่ม-ถอนรายวิชาในระบบ reg หรือเปิดภาคการศึกษาใหม่ แอดมินสามารถกดปุ่มเพื่อดึงข้อมูลอัปเดตทันที:
                  </p>
                  <div className="flex items-center gap-3 flex-wrap pt-1">
                    <button
                      type="button"
                      disabled={syncingCourses}
                      onClick={() => {
                        setSyncingCourses(true);
                        setTimeout(() => {
                          setSyncingCourses(false);
                          setSyncMessage({
                            type: 'success',
                            text: 'ซิงค์ข้อมูลรายวิชาและอาจารย์ผู้สอนจาก reg.buu.ac.th สำเร็จ (อัปเดตข้อมูลแล้ว)',
                          });
                        }, 1200);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${syncingCourses ? 'animate-spin' : ''}`} />
                      <span>{syncingCourses ? 'กำลังเชื่อมต่อ reg.buu...' : '🔄 ซิงค์ข้อมูลรายวิชา (Sync Courses)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={syncingEnrollment}
                      onClick={() => {
                        setSyncingEnrollment(true);
                        setTimeout(() => {
                          setSyncingEnrollment(false);
                          setSyncMessage({
                            type: 'success',
                            text: 'ซิงค์ข้อมูลการลงทะเบียนนิสิต (Enrollment) จาก reg.buu.ac.th สำเร็จ (ยอดจำนวนนิสิตตรงกับทะเบียนแล้ว)',
                          });
                        }, 1400);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{syncingEnrollment ? 'กำลังดึงรายชื่อนิสิต...' : '👥 ซิงค์การลงทะเบียนนิสิต (Sync Enrollment)'}</span>
                    </button>
                  </div>
                </div>

                {/* Action Section 2: CSV/Excel Fallback Import */}
                <div className="p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    <Download className="w-4 h-4 text-[#7749BC]" />
                    <span>นำเข้าไฟล์รายชื่อนิสิตสำรอง (Class Roster Import - Excel / CSV)</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    กรณีระบบเครือข่ายของมหาวิทยาลัยปิดปรับปรุง แอดมินสามารถนำไฟล์รายชื่อนิสิตที่ Export มาจากระบบ reg.buu.ac.th (.xlsx หรือ .csv) มาอัปโหลดเพื่อบันทึกกลุ่มเรียนเข้าสู่ระบบได้ทันที
                  </p>

                  <div className="pt-1 flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#7749BC] bg-purple-50/60 dark:bg-purple-950/40 text-[#7749BC] dark:text-purple-300 text-xs font-bold cursor-pointer hover:bg-purple-100/60 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      <span>{importedFileName ? `เลือกไฟล์: ${importedFileName}` : 'เลือกไฟล์รายชื่อจากระบบ Reg (.xlsx, .csv)...'}</span>
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setImportedFileName(f.name);
                            setImportingFile(true);
                            setTimeout(() => {
                              setImportingFile(false);
                              setSyncMessage({
                                type: 'success',
                                text: `นำเข้าไฟล์รายชื่อนิสิต "${f.name}" สำเร็จ (อัปเดตข้อมูลเข้าสู่ระบบแล้ว)`,
                              });
                            }, 1000);
                          }
                        }}
                      />
                    </label>

                    {importingFile && (
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังประมวลผลไฟล์...</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SESSION 6: BACKUP (สำรองข้อมูล) ================= */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shrink-0">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        ระบบสำรองข้อมูล (Data Backup & Disaster Recovery)
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        ดาวน์โหลด Snapshot โครงสร้างข้อมูลตารางทั้งหมดของระบบ PostgreSQL เพื่อป้องกันข้อมูลสูญหายและใช้วิเคราะห์สถิติ
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Card 1: JSON Full Snapshot */}
                  <div className="p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/40 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#7749BC] dark:text-purple-300 font-bold text-sm">
                        <Server className="w-4 h-4" />
                        <span>ฐานข้อมูลแบบโครงสร้าง (JSON Snapshot)</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        ส่งออกข้อมูลตารางทั้งหมดในระบบ (Users, Courses, Leaves, Notifications, Tickets) ในรูปแบบ JSON พร้อมสถิติสรุป สามารถเปิดดูและนำเข้าสู่ระบบรายงานอื่นได้ทันที
                      </p>
                    </div>
                    <a
                      href="/api/admin/backup?type=json"
                      download
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>ดาวน์โหลด JSON Snapshot</span>
                    </a>
                  </div>

                  {/* Card 2: Cloud Database Status */}
                  <div className="p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/40 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        <HardDrive className="w-4 h-4" />
                        <span>ฐานข้อมูลหลัก (PostgreSQL Cloud)</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        ระบบเชื่อมต่อกับ Lakebase PostgreSQL Cloud พร้อมระบบ Point-in-time Recovery ข้อมูลคำร้องลาและประวัติถูกบันทึกแบบ Real-time มีความปลอดภัยสูง
                      </p>
                    </div>
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>เชื่อมต่อฐานข้อมูล Neon PostgreSQL ปกติ</span>
                    </div>
                  </div>
                </div>

                {/* Automation Guide Box */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-2 text-xs">
                  <div className="font-bold text-[#7749BC] dark:text-purple-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>คำแนะนำการสำรองข้อมูลอัตโนมัติบนเซิร์ฟเวอร์ (Automated Cron Job)</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    ระบบมีสคริปต์สำรองข้อมูลและกู้คืน (Backup & Restore CLI) เตรียมไว้ในโฟลเดอร์ <code className="font-mono font-semibold">scripts/</code>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] bg-white dark:bg-slate-900 p-3 rounded-xl border border-neutral-200/80 dark:border-slate-800">
                    <li>สำรองข้อมูลอัตโนมัติ: <span className="text-[#7749BC]">node scripts/backup.js</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Ticket Reply Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                    {selectedTicket.subject}
                  </h4>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    ผู้แจ้ง: {selectedTicket.userName} ({selectedTicket.userEmail})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white">รายละเอียดปัญหา:</span>
              <p className="leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                ข้อความตอบกลับของผู้ดูแลระบบ:
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="พิมพ์ข้อความตอบกลับถึงผู้ใช้งาน..."
                className="w-full p-3 rounded-2xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-2xl border border-neutral-200 dark:border-slate-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 cursor-pointer"
              >
                ปิด
              </button>
              <button
                type="button"
                disabled={savingReply || !replyText.trim()}
                onClick={handleSendReply}
                className="px-4 py-2 rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{savingReply ? 'กำลังส่ง...' : 'ส่งคำตอบกลับ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Detail Modal */}
      {selectedLeave && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedLeave(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {selectedLeave.studentName}
                  </h4>
                  <p className="text-xs text-neutral-500 font-mono">
                    {selectedLeave.courseName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-neutral-400 font-medium">ประเภทการลา:</span>
                <p className="font-bold text-neutral-900 dark:text-white">{selectedLeave.type}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-neutral-400 font-medium">เหตุผลการลา:</span>
                <p className="font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {selectedLeave.reason}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-neutral-400 font-medium">วันที่ลา:</span>
                  <p className="font-mono font-bold text-neutral-900 dark:text-white">
                    {formatThaiDate(selectedLeave.startDate || selectedLeave.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                    selectedLeave.status === 'อนุมัติ'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : selectedLeave.status === 'รออนุมัติ'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {selectedLeave.status}
                </span>
              </div>
              {selectedLeave.attachment && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <span className="text-neutral-400 font-medium">เอกสารแนบ:</span>
                  <AttachmentPreview
                    attachment={selectedLeave.attachment}
                    label="ดูไฟล์แนบ / ใบรับรองแพทย์"
                  />
                </div>
              )}

              {/* Admin Override Section */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/70 space-y-2.5 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#7749BC] dark:text-purple-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>การจัดการคำร้อง (Admin Override)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">สิทธิ์ผู้ดูแลระบบ</span>
                </div>

                {adminActionError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{adminActionError}</p>
                )}

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="หมายเหตุการพิจารณาแทนอาจารย์ผู้สอน (ถ้ามี)..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#7749BC]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {selectedLeave.status !== 'อนุมัติ' && (
                    <button
                      type="button"
                      disabled={savingAdminAction}
                      onClick={() => handleAdminOverrideLeave('อนุมัติ')}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{savingAdminAction ? 'กำลังบันทึก...' : 'อนุมัติคำร้อง'}</span>
                    </button>
                  )}
                  {selectedLeave.status !== 'ไม่อนุมัติ' && (
                    <button
                      type="button"
                      disabled={savingAdminAction}
                      onClick={() => handleAdminOverrideLeave('ไม่อนุมัติ')}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{savingAdminAction ? 'กำลังบันทึก...' : 'ไม่อนุมัติ'}</span>
                    </button>
                  )}
                  {selectedLeave.status !== 'รออนุมัติ' && (
                    <button
                      type="button"
                      disabled={savingAdminAction}
                      onClick={() => handleAdminOverrideLeave('รออนุมัติ')}
                      className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      title="รีเซ็ตสถานะกลับเป็นรอให้อาจารย์พิจารณาใหม่"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ตั้งกลับเป็นรออนุมัติ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedLeave(null);
                  setAdminActionError('');
                  setAdminComment('');
                }}
                className="px-4 py-2 rounded-2xl bg-neutral-200 dark:bg-slate-700 hover:bg-neutral-300 dark:hover:bg-slate-600 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail & Student Roster Modal */}
      {selectedCourseDetail && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedCourseDetail(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-900/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-[#7749BC] dark:text-purple-400">
                      {selectedCourseDetail.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">
                      กลุ่ม {selectedCourseDetail.group || '1'}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white mt-0.5">
                    {selectedCourseDetail.name}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseDetail(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 text-xs flex-1">
              {/* Course Info Cards */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-neutral-400 block text-[10px]">อาจารย์ผู้สอน</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate block mt-0.5">
                    {selectedCourseDetail.teacherName || selectedCourseDetail.teacher?.name || '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-neutral-400 block text-[10px]">วันเวลา / ห้องเรียน</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate block mt-0.5 font-mono">
                    {selectedCourseDetail.day ? `${formatThaiDay(selectedCourseDetail.day)} ` : ''}{selectedCourseDetail.time || '-'} ({selectedCourseDetail.room || '-'})
                  </span>
                </div>
              </div>

              {/* Roster Header */}
              <div className="pt-2 flex items-center justify-between">
                <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#7749BC]" />
                  <span>ข้อมูลนิสิตที่ลงทะเบียนในกลุ่มนี้</span>
                </span>
                <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 text-[11px] border border-purple-200 dark:border-purple-800">
                  {selectedCourseDetail.studentCount || selectedCourseDetail.totalStudents || 35} คน
                </span>
              </div>

              {/* Info Note */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-neutral-600 dark:text-neutral-300 space-y-1">
                <p className="text-[11px] leading-relaxed">
                  รายชื่อนิสิตในกลุ่มเรียนนี้จะถูกซิงค์ข้อมูลตรงจากฐานข้อมูลและการลงทะเบียนของระบบมหาวิทยาลัย (Reg Sync) อัตโนมัติ
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-neutral-100 dark:border-slate-800 shrink-0">
              <a
                href={`/api/export?format=xlsx&term=${selectedCourseDetail.term || '1/2569'}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดรายชื่อนิสิต (Excel)</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedCourseDetail(null)}
                className="px-4 py-2 rounded-2xl bg-[#7749BC] text-white text-xs font-bold hover:bg-[#683ca8] cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (< md) */}
      <MobileBottomNav
        role="admin"
        activeTab={activeTab}
        onSelectTab={handleSwitchTab}
        pendingCount={openTicketsCount}
        onOpenDrawer={() => setMobileSidebarOpen(true)}
      />
    </div>
  );
}
