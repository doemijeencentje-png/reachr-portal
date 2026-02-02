'use client';

import { User } from 'lucide-react';

interface NavbarProps {
  title?: string;
  user?: {
    email: string;
  };
}

export default function Navbar({ title = 'Dashboard', user }: NavbarProps) {
  return (
    <header className="h-16 border-b border-dark-200 bg-dark-100/80 backdrop-blur-sm flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-gray-400">{user.email}</span>
          </div>
        )}
      </div>
    </header>
  );
}
