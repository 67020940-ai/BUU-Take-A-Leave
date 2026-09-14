'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  Activity,
  Search,
  X,
  Send,
} from 'lucide-react';
import { DAY_LABEL_TH, formatThaiDateTime } from '@/lib/ui';

const TICKET_FILTERS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'เปิดเรื่อง', label: 'เรื่องใหม่' },
  { id: 'ตอบกลับแล้ว', label: 'ตอบกลับแล้ว' },
];

function buildActivityFeed(leaves, tickets) {
  const leaveEvents = leaves.map((l) => {
    let text;
    if (l.status === 'อนุมัติ') text = `คำร้องลาของ ${l.studentName} วิชา "${l.courseName}" ได้รับการอนุมัติ`;
    else if (l.status === 'ไม่อนุมัติ') text = `คำร้องลาของ ${l.studentName} วิชา "${l.courseName}" ถูกปฏิเสธ`;
    else if (l.status === 'ยกเลิก') text = `${l.studentName} ยกเลิกคำร้องลาวิชา "${l.courseName}"`;
    else text = `${l.studentName} ยื่นคำร้องลาวิชา "${l.courseName}" (${l.type})`;
    return { id: `leave-${l.id}`, time: l.createdAt, text, kind: 'leave' };
  });
  const ticketEvents = tickets.map((t) => ({
    id: `ticket-${t.id}`,
    time: t.createdAt,
    text: `${t.userName} แจ้งปัญหา "${t.subject}"${t.status === 'ตอบกลับแล้ว' ? ' (ตอบกลับแล้ว)' : ''}`,
    kind: 'ticket',
  }));
  return [...leaveEvents, ...ticketEvents].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 25);
}

export default function AdminDashboard({ courses, leaves, tickets: initialTickets }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTab, setActiveTab] = useState('tickets');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [searchTicket, setSearchTicket] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const openTicketsCount = tickets.filter((t) => t.status === 'เปิดเรื่อง').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'อนุมัติ').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'รออนุมัติ').length;

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = ticketFilter === 'all' || t.status === ticketFilter;
    const q = searchTicket.toLowerCase();
    const matchesSearch = !q || t.subject.toLowerCase().includes(q) || t.userName.toLowerCase().includes(q) || t.message.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const activity = useMemo(() => buildActivityFeed(leaves, tickets), [leaves, tickets]);

  function openTicketModal(ticket) {
    setSelectedTicket(ticket);
    setReplyText(ticket.reply || '');
  }

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  async function handleSendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTicket.id, reply: replyText }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? data.ticket : t)));
        setSelectedTicket(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: 'tickets', label: `แจ้งปัญหา/ข้อผิดพลาด (${openTicketsCount} รอตอบ)`, icon: MessageSquare },
    { id: 'courses', label: 'รายวิชาในระบบ', icon: BookOpen },
    { id: 'activity', label: 'กิจกรรมล่าสุด', icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-500/15 via-white/80 to-white/60 dark:from-emerald-950/30 dark:via-slate-900/80 dark:to-slate-900/60 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-950/50 border border-emerald-500/20 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
              ศูนย์บริการเทคโนโลยีสารสนเทศ มหาวิทยาลัยบูรพา
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              สถานะระบบ: ทำงานปกติ (Online)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            แผงควบคุมระบบ (Administrator Hub)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-xl">
            จัดการคำร้องแจ้งปัญหา ตรวจสอบคำขอลาเรียน และดูแลรายวิชาทั้งหมดในระบบ e-Leave
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center space-x-2 shrink-0 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรชข้อมูล'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span>แจ้งปัญหา/ข้อผิดพลาด</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{openTicketsCount}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">เรื่องใหม่</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">จากทั้งหมด {tickets.length} รายการ</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span>คำขอลาเรียนทั้งเทอม</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{leaves.length}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">ฉบับ</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">อนุมัติแล้ว {approvedLeaves} รายการ</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span>รายวิชาในระบบ</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{courses.length}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">รายวิชา</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">รวมทุกภาคเรียนในระบบ</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span>คำร้องรออนุมัติ</span>
            <Clock className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{pendingLeaves}</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>รอการพิจารณาจากอาจารย์</span>
          </p>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-neutral-200/80 dark:border-slate-800 px-4 pt-2 rounded-2xl flex flex-wrap items-center gap-2 sm:gap-4 shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 pt-1 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
                active
                  ? 'border-emerald-600 text-emerald-900 dark:text-emerald-300'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">คำร้องแจ้งปัญหาของระบบ</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">รับเรื่องจากนิสิตและอาจารย์เพื่อตอบกลับหรือแก้ไข</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTicket}
                  onChange={(e) => setSearchTicket(e.target.value)}
                  placeholder="ค้นหาหัวข้อ/ผู้แจ้ง..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex items-center bg-white/70 dark:bg-slate-800/70 p-1 rounded-2xl border border-neutral-200 dark:border-slate-700 text-xs">
                {TICKET_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTicketFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                      ticketFilter === f.id
                        ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200 dark:border-slate-700'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-10 text-center text-xs text-neutral-400 shadow-xs">
                ไม่มีรายการแจ้งปัญหาในหมวดหมู่นี้
              </div>
            ) : (
              filteredTickets.map((t) => {
                const answered = t.status === 'ตอบกลับแล้ว';
                return (
                  <div
                    key={t.id}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-emerald-300/60 dark:hover:border-emerald-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            answered
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {answered ? 'ตอบกลับแล้ว' : 'เรื่องใหม่'}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono">#{t.id}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.subject}</h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{t.message}</p>
                      <p className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-2 pt-1">
                        <span>ผู้แจ้ง: {t.userName}</span>
                        <span>•</span>
                        <span>แจ้งเมื่อ: {formatThaiDateTime(t.createdAt)}</span>
                      </p>
                      {t.reply && (
                        <div className="mt-2 p-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                          <span className="font-semibold mr-1.5">ตอบกลับ:</span>
                          <span>{t.reply}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openTicketModal(t)}
                      className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-emerald-700 hover:bg-neutral-800 dark:hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shrink-0 self-end sm:self-center shadow-xs"
                    >
                      {answered ? 'แก้ไขคำตอบ' : 'จัดการและตอบกลับ'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">รายวิชาที่บันทึกในระบบ e-Leave</h3>
          {courses.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">ยังไม่มีรายวิชาในระบบ</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courses.map((c) => {
                const teacherName = c.teacher?.name || c.teacherName || null;
                const isGenEd = !teacherName && !c.day;
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/70 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-neutral-900 dark:text-neutral-100 gap-2">
                      <span className="truncate">
                        {c.code} {c.name}
                      </span>
                      {c.group && <span className="font-mono text-neutral-500 dark:text-neutral-400 shrink-0">กลุ่ม {c.group}</span>}
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400">ภาคเรียน {c.term}</p>
                    {isGenEd ? (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          วิชาศึกษาทั่วไป — นิสิตตรวจสอบวัน/เวลาเรียนจากระบบ Reg ของมหาวิทยาลัย
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-300 pt-1 flex flex-wrap items-center justify-between gap-1">
                        <span>
                          {c.day ? `${DAY_LABEL_TH[c.day] || c.day} ${c.time || ''} น.` : 'ไม่ระบุเวลาเรียน'}
                          {c.room ? ` (${c.room})` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {teacherName || 'ยังไม่ระบุผู้สอน'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">กิจกรรมล่าสุดในระบบ</h3>
            <span className="text-xs text-neutral-400">{activity.length} รายการล่าสุด</span>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">ยังไม่มีกิจกรรมในระบบ</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/70 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${a.kind === 'leave' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">{a.text}</span>
                  </div>
                  <span className="text-neutral-400 font-mono text-[11px] shrink-0">{formatThaiDateTime(a.time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTicket && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">จัดการรายการแจ้งปัญหา #{selectedTicket.id}</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700 text-xs space-y-1.5">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedTicket.subject}</p>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{selectedTicket.message}</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                ผู้แจ้ง: {selectedTicket.userName} • {formatThaiDateTime(selectedTicket.createdAt)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">ข้อความตอบกลับผู้แจ้ง</label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="พิมพ์ข้อความตอบกลับ..."
                className="w-full p-3 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={handleSendReply}
                disabled={saving || !replyText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{saving ? 'กำลังบันทึก...' : 'ส่งคำตอบกลับ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
