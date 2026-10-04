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
  ShieldCheck,
  AlertCircle,
  Eye,
  CalendarDays,
  User,
  Users,
  HeartPulse,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopBar from '@/components/AdminTopBar';
import { DAY_LABEL_TH, formatThaiDateTime, formatThaiDate } from '@/lib/ui';

export default function AdminDashboard({ user, courses = [], leaves = [], tickets: initialTickets = [] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tickets' | 'courses' | 'leaves'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1/2569');

  // Ticket management state
  const [ticketFilter, setTicketFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  // Leave detail modal state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

  // Sync tab from URL query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get('tab');
      if (tabParam && ['overview', 'tickets', 'courses', 'leaves'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      const handlePopState = () => {
        const currentSp = new URLSearchParams(window.location.search);
        setActiveTab(currentSp.get('tab') || 'overview');
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  function handleSwitchTab(tabKey) {
    setActiveTab(tabKey);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tabKey === 'overview') url.searchParams.delete('tab');
      else url.searchParams.set('tab', tabKey);
      window.history.pushState(null, '', url.toString());
    }
  }

  // Counts for the 4 Overview Boxes
  const openTicketsCount = tickets.filter((t) => t.status === 'เปิดเรื่อง').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'อนุมัติ').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'รออนุมัติ').length;
  const rejectedLeaves = leaves.filter((l) => l.status === 'ไม่อนุมัติ').length;

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

  // Filtered Leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const matchesStatus = leaveStatusFilter === 'all' || l.status === leaveStatusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (l.studentName && l.studentName.toLowerCase().includes(q)) ||
        (l.courseName && l.courseName.toLowerCase().includes(q)) ||
        (l.courseCode && l.courseCode.toLowerCase().includes(q)) ||
        (l.reason && l.reason.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [leaves, leaveStatusFilter, searchQuery]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.room && c.room.toLowerCase().includes(q)) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(q))
      );
    });
  }, [courses, searchQuery]);

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    const leaveEvents = leaves.map((l) => {
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
  }, [leaves, tickets]);

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

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row font-sans text-neutral-800 dark:text-neutral-100">
      {/* 1. Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleSwitchTab}
        openTicketsCount={openTicketsCount}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 lg:pl-64 sm:lg:pl-68 flex flex-col min-w-0">
        <AdminTopBar
          user={user}
          semester={selectedTerm}
          onSemesterChange={setSelectedTerm}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="ค้นหาคำร้อง, นิสิต, วิชา หรือปัญหา..."
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* 4 Connected Horizontal Summary Boxes (All, Approved, Pending, Open Tickets) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-2 border-neutral-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {/* Box 1: คำร้องลาทั้งหมด */}
            <button
              type="button"
              onClick={() => handleSwitchTab('leaves')}
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-purple-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูรายการคำร้องลาทั้งหมด"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors">
                คำร้องลาทั้งหมด
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1">: {leaves.length}</p>
            </button>

            {/* Box 2: อนุมัติแล้ว */}
            <button
              type="button"
              onClick={() => {
                setLeaveStatusFilter('อนุมัติ');
                handleSwitchTab('leaves');
              }}
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูคำร้องที่อนุมัติแล้ว"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                อนุมัติแล้ว
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                : {approvedLeaves}
              </p>
            </button>

            {/* Box 3: รออนุมัติ */}
            <button
              type="button"
              onClick={() => {
                setLeaveStatusFilter('รออนุมัติ');
                handleSwitchTab('leaves');
              }}
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-amber-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูคำร้องที่รออนุมัติ"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                รออนุมัติ
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-amber-600 dark:text-amber-400">
                : {pendingLeaves}
              </p>
            </button>

            {/* Box 4: ปัญหาที่รอตอบกลับ */}
            <button
              type="button"
              onClick={() => {
                setTicketFilter('เปิดเรื่อง');
                handleSwitchTab('tickets');
              }}
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-rose-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูเรื่องแจ้งปัญหาที่รอตอบกลับ"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                ปัญหาที่รอตอบกลับ
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-rose-600 dark:text-rose-400">
                : {openTicketsCount}
              </p>
            </button>
          </div>

          {/* ================= SESSION 1: OVERVIEW (ภาพรวมระบบ) ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                    จัดการเรื่องแจ้งปัญหาและข้อเสนอแนะ (Support Tickets)
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    ตอบกลับข้อซักถามและปัญหาการใช้งานจากนิสิตและอาจารย์
                  </p>
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
                  filteredTickets.map((t) => (
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
              </div>
            </div>
          )}

          {/* ================= SESSION 3: COURSES (รายวิชาที่เปิดสอน) ================= */}
          {activeTab === 'courses' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  รายวิชาและกลุ่มเรียนที่เปิดสอน ({filteredCourses.length} รายวิชา)
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  ฐานข้อมูลรายวิชา อาจารย์ผู้สอน ห้องเรียน และจำนวนนิสิตที่ลงทะเบียน
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs overflow-x-auto">
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
                    {filteredCourses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 font-mono font-bold text-[#7749BC] dark:text-purple-400">
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
                          {c.day ? `${DAY_LABEL_TH[c.day] || c.day} ` : ''}
                          {c.time || '-'}
                        </td>
                        <td className="py-3 font-mono text-neutral-600 dark:text-neutral-300">
                          {c.room || '-'}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {c.studentCount || c.totalStudents || 35} คน
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SESSION 4: LEAVES (คำร้องลาทั้งระบบ) ================= */}
          {activeTab === 'leaves' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                    ทะเบียนคำร้องขอลาเรียนทั้งระบบ ({filteredLeaves.length} รายการ)
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    ตรวจสอบประวัติการลาของนิสิตทุกรายวิชา และสถานะการพิจารณาของอาจารย์
                  </p>
                </div>

                {/* Filter Status */}
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
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-slate-800 text-neutral-400 font-bold">
                      <th className="pb-3">นิสิต</th>
                      <th className="pb-3">วิชา</th>
                      <th className="pb-3">ประเภท</th>
                      <th className="pb-3">วันที่ลา</th>
                      <th className="pb-3">เหตุผล</th>
                      <th className="pb-3">สถานะ</th>
                      <th className="pb-3 text-right">รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                    {filteredLeaves.map((l) => (
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
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              l.status === 'อนุมัติ'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : l.status === 'รออนุมัติ'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {l.status}
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
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Ticket Reply Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
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
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2 rounded-2xl bg-[#7749BC] text-white text-xs font-bold hover:bg-[#683ca8] cursor-pointer"
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
