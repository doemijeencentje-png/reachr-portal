import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar, Navbar } from '@/components/layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-dark">
      <Sidebar />
      <div className="ml-64">
        <Navbar user={{ email: user.email || '' }} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
