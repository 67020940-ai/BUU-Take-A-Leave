import { redirect } from 'next/navigation';

export default function TeacherHistoryPage() {
  redirect('/teacher?status=' + encodeURIComponent('ประวัติการอนุมัติ'));
}
