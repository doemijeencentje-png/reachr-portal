'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card } from '@/components/ui';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validation';
import { ZodError } from 'zod';

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordInput>({ email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSuccess(false);

    try {
      const validatedData = forgotPasswordSchema.parse(formData);
      setIsLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setGeneralError(error.message);
        return;
      }

      setSuccess(true);
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
          <p className="text-gray-500 mt-4">Reset your password</p>
        </div>

        <Card>
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 mb-6">
                We&apos;ve sent a password reset link to <span className="text-gray-900 font-medium">{formData.email}</span>
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {generalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {generalError}
                </div>
              )}

              <p className="text-gray-500 text-sm">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ email: e.target.value })}
                error={errors.email}
                autoComplete="email"
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send Reset Link
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
