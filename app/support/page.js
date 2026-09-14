import { redirect } from 'next/navigation';
import { getCurrentUser, homePathForRole } from '@/lib/auth';
import { listTicketsForUser } from '@/lib/db';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import SupportForm from './support-form';
import { LifeBuoy } from 'lucide-react';

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'admin') redirect('/admin');

  const tickets = await listTicketsForUser(user.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ name: user.name, role: user.role, email: user.email, faculty: user.faculty, major: user.major }} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          icon={LifeBuoy}
          eyebrow="ศูนย์ช่วยเหลือ"
          title="แจ้งปัญหาการใช้งานระบบ"
          subtitle="ทีมงานผู้ดูแลระบบจะตอบกลับผ่านหน้านี้"
        />
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <SupportForm initialTickets={tickets} homePath={homePathForRole(user.role)} />
        </div>
      </main>
      <Footer role={user.role} />
    </div>
  );
}
