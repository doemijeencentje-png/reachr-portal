'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#111827',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#00C853';
    e.target.style.boxShadow = '0 0 0 3px rgba(0, 200, 83, 0.2)';
    e.target.style.backgroundColor = '#ffffff';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, hasError: boolean) => {
    e.target.style.borderColor = hasError ? '#fca5a5' : '#d1d5db';
    e.target.style.boxShadow = 'none';
    e.target.style.backgroundColor = '#f9fafb';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, rgba(0,200,83,0.05) 100%)',
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
        opacity: 0.2,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Screen Glow Bottom */}
      <div style={{
        position: 'fixed',
        bottom: '-400px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1000px',
        height: '600px',
        background: 'radial-gradient(ellipse, rgba(0, 200, 83, 0.2) 0%, transparent 70%)',
        opacity: 0.1,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '2rem',
              color: '#111827',
            }}>
              Reachr
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              marginTop: '-4px',
            }}>
              Client Portal
            </span>
          </div>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            Create your account and start optimizing.
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {generalError && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.875rem',
              }}>
                {generalError}
              </div>
            )}

            {/* Company Name */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#374151',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}>
                Company Name
              </label>
              <input
                type="text"
                placeholder="Your Company"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                autoComplete="organization"
                style={{
                  ...inputStyle,
                  borderColor: errors.companyName ? '#fca5a5' : '#d1d5db',
                }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.companyName)}
              />
              {errors.companyName && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626' }}>{errors.companyName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#374151',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
                style={{
                  ...inputStyle,
                  borderColor: errors.email ? '#fca5a5' : '#d1d5db',
                }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.email)}
              />
              {errors.email && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#374151',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  borderColor: errors.password ? '#fca5a5' : '#d1d5db',
                }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.password)}
              />
              {errors.password && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626' }}>{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#374151',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  borderColor: errors.confirmPassword ? '#fca5a5' : '#d1d5db',
                }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.confirmPassword)}
              />
              {errors.confirmPassword && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626' }}>{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              By signing up, you agree to our{' '}
              <Link href="/terms" style={{ color: '#00C853', fontWeight: 500, textDecoration: 'none' }}>
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: '#00C853', fontWeight: 500, textDecoration: 'none' }}>
                Privacy Policy
              </Link>.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#00C853',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(0, 200, 83, 0.3)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            color: '#6b7280',
          }}>
            Already have an account?{' '}
            <Link
              href="/login"
              style={{ color: '#00C853', fontWeight: 500, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
