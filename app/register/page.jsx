'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ShieldCheck, UserPlus } from 'lucide-react';
import { parseApiResponse } from '../utils/parseApiResponse';
import BrandLogo from '../components/BrandLogo';

export default function RegisterPage() {
  const router = useRouter();
  const [hasSuperAdmin, setHasSuperAdmin] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);

  useEffect(() => {
    fetch('/api/v1/auth/setup-status')
      .then((res) => parseApiResponse(res))
      .then((json) => {
        setHasSuperAdmin(Boolean(json?.data?.hasSuperAdmin));
      })
      .catch(() => setHasSuperAdmin(true));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const json = await parseApiResponse(res);
      if (!res.ok) {
        const msg = json.errors?.[0]?.message || json.message || 'Registration failed';
        throw new Error(msg);
      }

      if (json.data?.isFirstSuperAdmin) {
        router.replace('/');
        return;
      }

      setRegisteredUser(json.data?.user || json.data);
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isFirstSetup = hasSuperAdmin === false;

  return (
    <div className="ambient-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <BrandLogo compact />
          <nav className="nav-links">
            <Link href="/login" className="nav-pill">
              Sign In
            </Link>
            <Link href="/register" className="nav-pill active">
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="enquiry-stage" style={{ maxWidth: '500px', marginTop: '48px' }}>
        <div className="enquiry-card">
          <div className="card-eyebrow-row">
            <span className="eyebrow-label">
              {isFirstSetup ? 'FIRST-TIME SETUP' : 'STAFF REGISTRATION'}
            </span>
            <span className="secure-badge">
              <ShieldCheck size={13} />
              <span>{isFirstSetup ? 'Super Admin Account' : 'Super Admin Approval'}</span>
            </span>
          </div>

          <h1 className="hero-title">
            {isFirstSetup ? (
              <>
                Create <em>Super Admin.</em>
              </>
            ) : (
              <>
                Request <em>Access.</em>
              </>
            )}
          </h1>
          <p className="hero-subtitle">
            {isFirstSetup
              ? 'No Super Admin is registered yet. The first account created through this form becomes the Super Admin with full approval control over all future registrations.'
              : 'Register for a CRM staff account. All new registrations are reviewed by the Super Admin before panel access is granted.'}
          </p>

          {registeredUser ? (
            <div className="alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Clock size={18} />
                <span>Pending Super Admin Approval</span>
              </div>
              <p style={{ fontSize: '13.5px', marginTop: '8px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Thank you, <strong>{registeredUser.fullName}</strong> ({registeredUser.email}). Your
                registration has been logged with status <strong>pending</strong>. Once the Super
                Admin approves your account, you can sign in.
              </p>
              <div style={{ marginTop: '14px' }}>
                <Link href="/login" className="btn-primary" style={{ width: '100%' }}>
                  Go to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert-error" style={{ marginBottom: '18px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-stack">
                <div className="field-group">
                  <label className="field-label" htmlFor="regName">
                    Full name <span className="field-tag">Required</span>
                  </label>
                  <input
                    id="regName"
                    type="text"
                    required
                    className="input-control"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="regEmail">
                    Email address <span className="field-tag">Required</span>
                  </label>
                  <input
                    id="regEmail"
                    type="email"
                    required
                    className="input-control"
                    placeholder={isFirstSetup ? 'admin@hospital.com' : 'staff@hospital.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-row-two">
                  <div className="field-group">
                    <label className="field-label" htmlFor="regPassword">
                      Password <span className="field-tag">Min 8 chars</span>
                    </label>
                    <input
                      id="regPassword"
                      type="password"
                      required
                      minLength={8}
                      className="input-control"
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="regConfirm">
                      Confirm <span className="field-tag">Required</span>
                    </label>
                    <input
                      id="regConfirm"
                      type="password"
                      required
                      minLength={8}
                      className="input-control"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                  <UserPlus size={16} />
                  <span>
                    {submitting
                      ? 'Submitting...'
                      : isFirstSetup
                        ? 'Register as Super Admin'
                        : 'Submit Registration'}
                  </span>
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
                Already registered?{' '}
                <Link href="/login" className="consent-link">
                  Sign in here
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
