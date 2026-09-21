import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStudentData } from '@/lib/studentData';
import StudentHomepageView from './student-homepage-view';

export const metadata = {
  title: 'หน้าหลักนิสิต | BUU Take A Leave',
  description: 'ระบบยื่นและอนุมัติคำขอลาเรียนออนไลน์ สรุปเวลาเรียน มหาวิทยาลัยบูรพา',
};

export default async function StudentPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const { summaries = [], leaves = [] } = await getStudentData(user.id);

  return (
    <StudentHomepageView
      user={user}
      summaries={summaries}
      leaves={leaves}
    />
  );
}
