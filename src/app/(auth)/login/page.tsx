'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card } from '@/components/ui';
import { loginSchema, LoginInput } from '@/lib/validation';
import { ZodError } from 'zod';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    try {
      const validatedData = loginSchema.parse(formData);
      setIsLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        setGeneralError(error.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/5 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <h1 className="text-3xl font-display font-bold text-gray-900">
              Reachr
            </h1>
            <span className="text-xs text-gray-500 uppercase tracking-widest -mt-1">Client Portal</span>
          </Link>
          <p className="text-gray-500 mt-4">Welcome back! Sign in to your account.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {generalError}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-600">
                <input type="checkbox" className="mr-2 rounded bg-gray-50 border-gray-300 text-primary focus:ring-primary" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-primary hover:text-primary-dark font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary-dark font-medium">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
