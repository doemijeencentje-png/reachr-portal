'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validation';
import { ZodError } from 'zod';
import BackgroundEffects from '@/components/ui/BackgroundEffects';

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
    <div className="min-h-screen auth-gradient flex items-center justify-center p-8 relative">
      <BackgroundEffects />

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center">
            <span className="logo-main text-2xl">Reachr</span>
            <span className="text-xs text-gray-500 uppercase tracking-[3px] -mt-1">Client Portal</span>
          </div>
          <p className="text-gray-500 mt-4">Reset your password</p>
        </div>

        {/* Card */}
        <div className="card-hover bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[rgba(0,200,83,0.15)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 mb-6">
                We&apos;ve sent a password reset link to <span className="text-gray-900 font-medium">{formData.email}</span>
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Back to Sign In
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

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 transition-all ${
                    errors.email ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ email: e.target.value })}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-glow w-full bg-[var(--primary)] text-white font-semibold py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
