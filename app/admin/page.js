import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCourse, getUserById, listAllCourses, listAllLeaves, listAllTickets } from '@/lib/db';
import AdminDashboard from './admin-dashboard';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/login');

  const courses = await listAllCourses();
  const rawLeaves = await listAllLeaves();
  const tickets = await listAllTickets();

  const leaves = await Promise.all(
    rawLeaves.map(async (l) => {
      const course = await getCourse(l.courseId);
      const student = await getUserById(l.studentId);
      return {
        ...l,
        courseName: course ? `${course.code} ${course.name}` : '-',
        studentName: student?.name || '-',
      };
    })
  );

  return (
    <AdminDashboard
      user={user}
      courses={courses}
      leaves={leaves}
      tickets={tickets}
    />
  );
}
