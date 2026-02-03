import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout';

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      position: 'relative',
    }}>
      {/* Background Grid */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.5,
      }} />

      {/* Screen Glow Top */}
      <div style={{
        position: 'fixed',
        top: '-300px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(0, 200, 83, 0.2) 0%, transparent 60%)',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '2rem',
        overflow: 'auto',
        position: 'relative',
        zIndex: 10,
      }}>
        {children}
      </main>
    </div>
  );
}
