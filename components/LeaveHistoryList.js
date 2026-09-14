import Link from 'next/link';
import { STATUS_DETAILS, LEAVE_TYPE_DETAILS, LEAVE_TYPE_DEFAULT, formatThaiDate } from '@/lib/ui';
import { Calendar, Clock, FileText, RotateCcw } from 'lucide-react';
import AttachmentPreview from '@/components/AttachmentPreview';
import CancelLeaveButton from '@/components/CancelLeaveButton';

// leaves: [{ ...leaveRequest, courseName }]
export default function LeaveHistoryList({ leaves }) {
  if (leaves.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
        <FileText className="w-10 h-10 text-neutral-300 dark:text-slate-700 mx-auto mb-3" />
        <p className="text-sm text-neutral-500">ยังไม่มีข้อมูลการลา</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaves.map((leave) => {
        const status = STATUS_DETAILS[leave.status];
        const typeCls = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;
        return (
          <div
            key={leave.id}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 shadow-xs"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                <span>{status.label}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${typeCls}`}>{leave.type}</span>
              <span className="text-xs text-neutral-400 font-mono">#{leave.id}</span>
            </div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{leave.courseName}</h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">เหตุผล: {leave.reason}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 pt-2 mt-2 border-t border-neutral-100 dark:border-slate-800">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                <span>
                  {formatThaiDate(leave.startDate)} - {formatThaiDate(leave.endDate)}
                </span>
              </span>
              {leave.period && (
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{leave.period}</span>
                </span>
              )}
              {leave.attachment && (
                <AttachmentPreview src={`/api/leaves/attachment/${leave.attachment}`} label="ดูไฟล์แนบ" />
              )}
            </div>
            {leave.status === 'รออนุมัติ' && (
              <div className="pt-3 mt-1">
                <CancelLeaveButton leaveId={leave.id} />
              </div>
            )}
            {leave.status === 'ยกเลิก' && (
              <div className="pt-3 mt-1">
                <Link
                  href={`/student/leave?resubmit=${leave.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7749BC] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ส่งใบลาอีกครั้ง</span>
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
