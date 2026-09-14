import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCourse, getUserById, listAllCourses, listAllLeaves, listAllTickets } from '@/lib/db';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
    <div className="min-h-screen flex flex-col">
      <Header user={{ name: user.name, role: user.role, email: user.email, faculty: user.faculty, major: user.major }} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AdminDashboard courses={courses} leaves={leaves} tickets={tickets} />
      </main>
      <Footer role={user.role} />
    </div>
  );
}
