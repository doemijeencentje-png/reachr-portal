'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card } from '@/components/ui';
import { signupSchema, SignupInput } from '@/lib/validation';
import { ZodError } from 'zod';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    try {
      const validatedData = signupSchema.parse(formData);
      setIsLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            company_name: validatedData.companyName,
          },
        },
      });

      if (error) {
        setGeneralError(error.message);
        return;
      }

      // Redirect to onboarding after successful signup
      router.push('/onboarding');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/5 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <h1 className="text-3xl font-display font-bold text-gray-900">
              Reachr
            </h1>
            <span className="text-xs text-gray-500 uppercase tracking-widest -mt-1">Client Portal</span>
          </Link>
          <p className="text-gray-500 mt-4">Create your account and start optimizing.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {generalError}
              </div>
            )}

            <Input
              label="Company Name"
              type="text"
              placeholder="Your Company"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              error={errors.companyName}
              autoComplete="organization"
            />

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
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              helperText="At least 8 characters"
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <div className="text-sm text-gray-500">
              By signing up, you agree to our{' '}
              <a href="#" className="text-primary hover:text-primary-dark font-medium">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:text-primary-dark font-medium">Privacy Policy</a>.
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
