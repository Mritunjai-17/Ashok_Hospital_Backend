'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';
import { parseApiResponse } from '../utils/parseApiResponse';
import BrandLogo from '../components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [hasSuperAdmin, setHasSuperAdmin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/auth/setup-status')
      .then((res) => parseApiResponse(res))
      .then((json) => {
        if (json?.data && typeof json.data.hasSuperAdmin === 'boolean') {
          setHasSuperAdmin(json.data.hasSuperAdmin);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await parseApiResponse(res);
      if (!res.ok) {
        const msg = json.errors?.[0]?.message || json.message || 'Sign in failed';
        throw new Error(msg);
      }

      router.replace('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ambient-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <BrandLogo compact />
          <nav className="nav-links">
            <Link href="/login" className="nav-pill active">
              Sign In
            </Link>
            <Link href="/register" className="nav-pill">
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="enquiry-stage" style={{ maxWidth: '480px', marginTop: '54px' }}>
        <div className="enquiry-card">
          <div className="card-eyebrow-row">
            <span className="eyebrow-label">ADMIN &amp; CRM PORTAL</span>
            <span className="secure-badge">
              <Lock size={13} />
              <span>Protected</span>
            </span>
          </div>

          <h1 className="hero-title">
            Welcome <em>Back.</em>
          </h1>
          <p className="hero-subtitle">
            Sign in to manage Dr. Abhinav&rsquo;s appointment enquiries. Staff accounts require
            Super Admin approval before signing in.
          </p>

          {!hasSuperAdmin && (
            <div className="alert-success" style={{ marginBottom: '18px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px' }}>
                <ShieldCheck size={16} />
                <span>First-Time Setup Required</span>
              </div>
              <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                No Super Admin exists yet.{' '}
                <Link href="/register" className="consent-link">
                  Register the first account
                </Link>{' '}
                to become the Super Admin.
              </p>
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="field-group">
              <label className="field-label" htmlFor="loginEmail">
                Email address <span className="field-tag">Required</span>
              </label>
              <input
                id="loginEmail"
                type="email"
                required
                className="input-control"
                placeholder="you@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="loginPassword">
                Password <span className="field-tag">Required</span>
              </label>
              <input
                id="loginPassword"
                type="password"
                required
                className="input-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              <LogIn size={16} />
              <span>{submitting ? 'Signing In...' : 'Sign In to CRM'}</span>
            </button>
          </form>

          <p
            style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
            }}
          >
            {hasSuperAdmin ? 'Need CRM access? ' : 'Setting up for the first time? '}
            <Link href="/register" className="consent-link">
              {hasSuperAdmin ? 'Request staff registration' : 'Register Super Admin'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
