'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import Sidebar from './Sidebar';

const STATUS_OPTIONS = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'];

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminCrmDashboard({
  initialUser,
  initialTab = 'enquiries',
  initialEnquiries = [],
  initialMeta = { total: 0, page: 1, limit: 10, totalPages: 1 },
  initialUsers = [],
  initialUserCounts = { pending: 0, approved: 0, rejected: 0 },
}) {
  const router = useRouter();
  const [currentUser] = useState(initialUser);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [health, setHealth] = useState({ database: 'connected' });

  // Enquiries CRM state
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selected enquiry drawer
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    mobileNumber: '',
    preferredDate: '',
    preferredTime: 'Any time',
    consultationPreference: '',
    message: '',
    status: 'pending',
    confirmedDate: '',
    confirmedTime: '',
    staffNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [drawerNotice, setDrawerNotice] = useState('');
  const [drawerAvailability, setDrawerAvailability] = useState(null);
  const [drawerNotifications, setDrawerNotifications] = useState([]);

  // Availability tab state
  const [availDate, setAvailDate] = useState(getTodayIso());
  const [availReport, setAvailReport] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  // Notifications tab state
  const [allNotifications, setAllNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Super Admin User Approvals state
  const [users, setUsers] = useState(initialUsers);
  const [userCounts, setUserCounts] = useState(initialUserCounts);
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    if (typeof window !== 'undefined') {
      const url = nextTab === 'enquiries' ? '/' : `/?tab=${encodeURIComponent(nextTab)}`;
      window.history.replaceState(null, '', url);
    }
  }

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/health');
      const json = await res.json();
      if (res.ok) setHealth(json.data);
    } catch {
      // ignore transient check errors
    }
  }, []);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);

      const res = await fetch(`/api/v1/enquiries?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load enquiries');

      setEnquiries(json.data || []);
      setMeta(json.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, dateFilter, router]);

  const fetchUsers = useCallback(async () => {
    if (!isSuperAdmin) return;
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userStatusFilter) params.set('approvalStatus', userStatusFilter);
      if (userSearch.trim()) params.set('search', userSearch.trim());

      const res = await fetch(`/api/v1/auth/users?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setUsers(json.data || []);
        if (json.meta?.counts) setUserCounts(json.meta.counts);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [isSuperAdmin, userStatusFilter, userSearch]);

  const fetchAvailabilityTab = useCallback(async (targetDate) => {
    if (!targetDate) return;
    setAvailLoading(true);
    try {
      const res = await fetch(`/api/v1/availability?date=${encodeURIComponent(targetDate)}`);
      const json = await res.json();
      if (res.ok) setAvailReport(json.data);
    } catch {
      // ignore
    } finally {
      setAvailLoading(false);
    }
  }, []);

  const fetchAllNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('/api/v1/notifications?limit=30');
      const json = await res.json();
      if (res.ok) setAllNotifications(json.data || []);
    } catch {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const enquiriesMountedRef = useRef(false);
  const usersMountedRef = useRef(false);

  useEffect(() => {
    if (!enquiriesMountedRef.current) {
      enquiriesMountedRef.current = true;
      return;
    }
    fetchEnquiries();
  }, [page, search, statusFilter, dateFilter, fetchEnquiries]);

  useEffect(() => {
    if (!usersMountedRef.current) {
      usersMountedRef.current = true;
      return;
    }
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin, userStatusFilter, userSearch, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'availability') {
      fetchAvailabilityTab(availDate);
    } else if (activeTab === 'notifications') {
      fetchAllNotifications();
    } else if (activeTab === 'approvals' && isSuperAdmin) {
      fetchUsers();
    }
  }, [
    activeTab,
    availDate,
    isSuperAdmin,
    fetchAvailabilityTab,
    fetchAllNotifications,
    fetchUsers,
  ]);

  async function handleLogout() {
    await fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  }

  const loadDrawerDetails = useCallback(async (enquiry) => {
    setSelected(enquiry);
    setDrawerNotice('');
    setEditForm({
      fullName: enquiry.fullName || '',
      mobileNumber: enquiry.mobileNumber || '',
      preferredDate: enquiry.preferredDate ? enquiry.preferredDate.slice(0, 10) : '',
      preferredTime: enquiry.preferredTime || 'Any time',
      consultationPreference: enquiry.consultationPreference || '',
      message: enquiry.message || '',
      status: enquiry.status || 'pending',
      confirmedDate: enquiry.confirmedDate ? enquiry.confirmedDate.slice(0, 10) : '',
      confirmedTime: enquiry.confirmedTime || '',
      staffNotes: enquiry.staffNotes || '',
    });

    const dateKey = enquiry.preferredDate ? enquiry.preferredDate.slice(0, 10) : '';
    const [availRes, notifRes] = await Promise.all([
      dateKey
        ? fetch(`/api/v1/availability?date=${dateKey}`).then((r) => r.json()).catch(() => null)
        : null,
      fetch(`/api/v1/notifications/enquiry/${enquiry._id}`).then((r) => r.json()).catch(() => null),
    ]);

    setDrawerAvailability(availRes?.data || null);
    setDrawerNotifications(notifRes?.data || []);
  }, []);

  async function handleSaveChanges(e) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setDrawerNotice('');

    try {
      const res = await fetch(`/api/v1/enquiries/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errors?.[0]?.message || json.message || 'Update failed');

      setDrawerNotice('Enquiry updated successfully.');
      await fetchEnquiries();
      await loadDrawerDetails(json.data);
    } catch (err) {
      setDrawerNotice(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatus(enquiry, nextStatus) {
    try {
      const payload = {
        status: nextStatus,
        ...(nextStatus === 'confirmed'
          ? {
              confirmedDate: enquiry.preferredDate?.slice(0, 10),
              confirmedTime: enquiry.preferredTime || 'Morning (09:00 AM - 12:00 PM)',
            }
          : {}),
      };
      const res = await fetch(`/api/v1/enquiries/${enquiry._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Status update failed');

      await fetchEnquiries();
      if (selected?._id === enquiry._id) {
        await loadDrawerDetails(json.data);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(enquiry) {
    if (!window.confirm(`Delete enquiry ${enquiry.referenceId} for ${enquiry.fullName}?`)) return;
    try {
      const res = await fetch(`/api/v1/enquiries/${enquiry._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Delete failed');

      if (selected?._id === enquiry._id) {
        setSelected(null);
      }
      await fetchEnquiries();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResendNotification(channel = 'whatsapp') {
    if (!selected) return;
    setDrawerNotice('');
    try {
      const res = await fetch(`/api/v1/notifications/enquiry/${selected._id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to dispatch notification');

      setDrawerNotifications((prev) => [json.data, ...prev]);
      setDrawerNotice(`Notification logged via ${channel}.`);
    } catch (err) {
      setDrawerNotice(`Error: ${err.message}`);
    }
  }

  async function handleApproveUser(user) {
    try {
      const res = await fetch(`/api/v1/auth/users/${user._id}/approve`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to approve user');
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRejectUser(user) {
    const reason = window.prompt(
      `Optional rejection reason for ${user.fullName} (${user.email}):`,
      ''
    );
    if (reason === null) return;

    try {
      const res = await fetch(`/api/v1/auth/users/${user._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to reject user');
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`Permanently remove user ${user.fullName} (${user.email})?`)) return;
    try {
      const res = await fetch(`/api/v1/auth/users/${user._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete user');
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  const stats = useMemo(() => {
    return {
      total: meta.total || enquiries.length,
      pending: enquiries.filter((e) => e.status === 'pending').length,
      confirmed: enquiries.filter((e) => e.status === 'confirmed').length,
      rescheduledOrCompleted: enquiries.filter(
        (e) => e.status === 'rescheduled' || e.status === 'completed'
      ).length,
    };
  }, [enquiries, meta.total]);

  return (
    <div className="ambient-shell crm-shell">
      <Sidebar
        health={health}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        pendingUsersCount={userCounts.pending}
        onLogout={handleLogout}
      />

      <main className="crm-main">
        <div className="crm-container">
        {isSuperAdmin && userCounts.pending > 0 && activeTab !== 'approvals' && (
          <div
            className="sub-card"
            style={{
              marginBottom: '18px',
              background: 'var(--status-pending-bg)',
              borderColor: 'var(--status-pending-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#946200', fontSize: '13.5px', fontWeight: 600 }}>
              <ShieldAlert size={16} />
              <span>
                {userCounts.pending} staff registration{userCounts.pending > 1 ? 's' : ''} awaiting
                your Super Admin approval.
              </span>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() => handleTabChange('approvals')}
            >
              Review Registrations
            </button>
          </div>
        )}

        <div className="crm-header">
          <div>
            <span className="eyebrow-label">ADMIN PANEL &amp; CRM</span>
            <h1 className="hero-title" style={{ marginTop: '6px', marginBottom: '4px' }}>
              Appointment <em>Submissions</em>
            </h1>
            <p className="hero-subtitle" style={{ marginBottom: 0 }}>
              Manage patient enquiries submitted from your frontend form, verify Dr. Abhinav&rsquo;s
              slot availability, and track confirmation notifications.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              fetchHealth();
              if (activeTab === 'enquiries') fetchEnquiries();
              if (activeTab === 'availability') fetchAvailabilityTab(availDate);
              if (activeTab === 'notifications') fetchAllNotifications();
              if (activeTab === 'approvals' && isSuperAdmin) fetchUsers();
            }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Summary KPI Strip */}
        <section className="crm-stats-grid" aria-label="Enquiry summary">
          <div className="stat-card">
            <div className="stat-label">Total Submissions</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Review (Page)</div>
            <div className="stat-value" style={{ color: '#946200' }}>
              {stats.pending}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Confirmed (Page)</div>
            <div className="stat-value" style={{ color: '#1b6b46' }}>
              {stats.confirmed}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rescheduled / Completed</div>
            <div className="stat-value" style={{ color: 'var(--brand-primary)' }}>
              {stats.rescheduledOrCompleted}
            </div>
          </div>
        </section>

        {error && (
          <div className="alert-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* TAB 1: Enquiries CRM */}
        {activeTab === 'enquiries' && (
          <section className="crm-panel">
            <div className="crm-toolbar">
              <div className="toolbar-filters">
                <div className="search-wrap">
                  <Search size={16} />
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Search name, mobile, or ENQ ID..."
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                  />
                </div>

                <select
                  className="select-control"
                  style={{ width: '170px' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                >
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  className="input-control"
                  style={{ width: '170px' }}
                  value={dateFilter}
                  onChange={(e) => {
                    setPage(1);
                    setDateFilter(e.target.value);
                  }}
                />

                {(search || statusFilter || dateFilter) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                      setDateFilter('');
                      setPage(1);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="table-scroll">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Patient &amp; Ref</th>
                    <th>Schedule Request</th>
                    <th>Preference</th>
                    <th>Scheduling Note</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        Loading form submissions...
                      </td>
                    </tr>
                  ) : enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No form submissions yet. External frontend submissions to{' '}
                        <code>POST /api/v1/enquiries</code> will appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.fullName}</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {item.countryCode} {item.mobileNumber}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--brand-primary)',
                              fontWeight: 600,
                              marginTop: '4px',
                            }}
                          >
                            {item.referenceId}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <Calendar size={14} color="var(--brand-primary)" />
                            <span>{item.preferredDateFormatted}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12.5px',
                              color: 'var(--text-secondary)',
                              marginTop: '4px',
                            }}
                          >
                            <Clock size={13} />
                            <span>{item.preferredTime || 'Any time'}</span>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                            {item.consultationPreference || 'Not specified'}
                          </span>
                        </td>

                        <td style={{ maxWidth: '240px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {item.message || '—'}
                          </span>
                        </td>

                        <td>
                          <span className={`status-badge status-${item.status}`}>{item.status}</span>
                        </td>

                        <td>
                          <div className="action-row">
                            <button
                              type="button"
                              className="icon-btn"
                              title="Inspect & Edit"
                              onClick={() => loadDrawerDetails(item)}
                            >
                              <Edit3 size={15} />
                            </button>

                            {item.status !== 'confirmed' && (
                              <button
                                type="button"
                                className="icon-btn"
                                title="Quick Confirm"
                                onClick={() => handleQuickStatus(item, 'confirmed')}
                              >
                                <CheckCircle2 size={15} color="#1b6b46" />
                              </button>
                            )}

                            <a
                              href={`https://wa.me/${(item.countryCode || '+91').replace('+', '')}${item.mobileNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="icon-btn"
                              title="Message on WhatsApp"
                            >
                              <MessageCircle size={15} color="#25d366" />
                            </a>

                            <a
                              href={`tel:${item.countryCode || '+91'}${item.mobileNumber}`}
                              className="icon-btn"
                              title="Call Patient"
                            >
                              <Phone size={15} color="var(--brand-primary)" />
                            </a>

                            <button
                              type="button"
                              className="icon-btn"
                              title="Delete Submission"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 size={15} color="#a53838" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="crm-toolbar" style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: 'none' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: Availability Microservice View */}
        {activeTab === 'availability' && (
          <section className="crm-panel" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Dr. Abhinav · Slot Capacity &amp; Availability
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Live output from the Availability Microservice (<code>/api/v1/availability</code>).
                </p>
              </div>
              <input
                type="date"
                className="input-control"
                style={{ width: '190px' }}
                value={availDate}
                onChange={(e) => setAvailDate(e.target.value)}
              />
            </div>

            {availLoading ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Checking slot availability...</p>
            ) : !availReport ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Select a date to view slot counts.</p>
            ) : !availReport.isBookable ? (
              <div className="alert-error">{availReport.reason}</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                }}
              >
                {availReport.slots.map((slot) => (
                  <div key={slot.slot} className="sub-card" style={{ background: '#ffffff' }}>
                    <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
                      {slot.slot}
                    </div>
                    <div
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Booked: {slot.bookedCount} / {slot.maxBookings}
                      </span>
                      <span
                        className={`status-badge ${
                          slot.available ? 'status-confirmed' : 'status-cancelled'
                        }`}
                      >
                        {slot.available ? `${slot.remaining} open` : 'Full'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Notification Microservice View */}
        {activeTab === 'notifications' && (
          <section className="crm-panel">
            <div className="crm-toolbar">
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
                  Notification Microservice Audit Log
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Automated WhatsApp/SMS confirmation logs generated on enquiry submission and
                  status updates.
                </p>
              </div>
            </div>

            <div className="table-scroll">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Patient &amp; Mobile</th>
                    <th>Channel &amp; Event</th>
                    <th>Message</th>
                    <th>Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {notifLoading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                        Loading notification logs...
                      </td>
                    </tr>
                  ) : allNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No notification logs yet.
                      </td>
                    </tr>
                  ) : (
                    allNotifications.map((n) => (
                      <tr key={n._id}>
                        <td style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{n.referenceId}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{n.recipientName}</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            {n.recipientMobile}
                          </div>
                        </td>
                        <td>
                          <span className="status-badge status-completed">{n.channel}</span>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {n.eventType}
                          </div>
                        </td>
                        <td style={{ maxWidth: '360px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {n.messageBody}
                        </td>
                        <td>
                          <span className="status-badge status-confirmed">{n.deliveryStatus}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: Super Admin User Approvals */}
        {activeTab === 'approvals' && isSuperAdmin && (
          <section className="crm-panel">
            <div className="crm-toolbar">
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
                  Super Admin · Staff Registration Approvals
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Pending ({userCounts.pending}) · Approved ({userCounts.approved}) · Rejected (
                  {userCounts.rejected})
                </p>
              </div>

              <div className="toolbar-filters" style={{ flex: 'none' }}>
                <div className="search-wrap" style={{ minWidth: '210px' }}>
                  <Search size={16} />
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Search name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <select
                  className="select-control"
                  style={{ width: '160px' }}
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                >
                  <option value="">All users</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="table-scroll">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Approval Status</th>
                    <th>Registered</th>
                    <th>Audit / Notes</th>
                    <th>Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                        Loading registered accounts...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.fullName}</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{u.email}</div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              u.role === 'super_admin' ? 'status-completed' : 'status-rescheduled'
                            }`}
                          >
                            {u.role === 'super_admin' ? 'Super Admin' : 'Staff'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              u.approvalStatus === 'approved'
                                ? 'status-confirmed'
                                : u.approvalStatus === 'rejected'
                                  ? 'status-cancelled'
                                  : 'status-pending'
                            }`}
                          >
                            {u.approvalStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '220px' }}>
                          {u.rejectionReason
                            ? `Rejected: ${u.rejectionReason}`
                            : u.approvedBy
                              ? `By ${u.approvedBy.fullName}`
                              : 'Awaiting Super Admin review'}
                        </td>
                        <td>
                          {u.role === 'super_admin' ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Protected</span>
                          ) : (
                            <div className="action-row">
                              {u.approvalStatus !== 'approved' && (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  title="Approve CRM Access"
                                  onClick={() => handleApproveUser(u)}
                                >
                                  <UserCheck size={15} color="#1b6b46" />
                                </button>
                              )}
                              {u.approvalStatus !== 'rejected' && (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  title="Reject / Revoke Access"
                                  onClick={() => handleRejectUser(u)}
                                >
                                  <UserX size={15} color="#946200" />
                                </button>
                              )}
                              <button
                                type="button"
                                className="icon-btn"
                                title="Delete User"
                                onClick={() => handleDeleteUser(u)}
                              >
                                <Trash2 size={15} color="#a53838" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        </div>
      </main>

      {/* Slide-over Detail, Microservice Inspection & Edit Drawer */}
      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="eyebrow-label">{selected.referenceId}</span>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
                  {selected.fullName}
                </h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            {drawerNotice && (
              <div
                className={drawerNotice.startsWith('Error:') ? 'alert-error' : 'alert-success'}
                style={{ padding: '10px 14px', fontSize: '13px' }}
              >
                {drawerNotice}
              </div>
            )}

            {drawerAvailability && (
              <div className="sub-card">
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '6px' }}>
                  AVAILABILITY MICROSERVICE · {drawerAvailability.displayDate}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {drawerAvailability.slots?.map((slot) => (
                    <span
                      key={slot.slot}
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: slot.available ? '#e9f5ee' : '#fdf0f0',
                        color: slot.available ? '#1b6b46' : '#a53838',
                        border: `1px solid ${slot.available ? '#b6e0c8' : '#efc6c6'}`,
                      }}
                    >
                      {slot.slot.split(' ')[0]}: {slot.remaining}/{slot.maxBookings} open
                    </span>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveChanges} className="form-stack">
              <div className="form-row-two">
                <div className="field-group">
                  <label className="field-label">Full name</label>
                  <input
                    type="text"
                    className="input-control"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Mobile number</label>
                  <input
                    type="text"
                    className="input-control"
                    maxLength={10}
                    value={editForm.mobileNumber}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row-two">
                <div className="field-group">
                  <label className="field-label">Status</label>
                  <select
                    className="select-control"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Consultation preference</label>
                  <input
                    type="text"
                    className="input-control"
                    value={editForm.consultationPreference}
                    onChange={(e) =>
                      setEditForm({ ...editForm, consultationPreference: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row-two">
                <div className="field-group">
                  <label className="field-label">Confirmed date</label>
                  <input
                    type="date"
                    className="input-control"
                    value={editForm.confirmedDate}
                    onChange={(e) => setEditForm({ ...editForm, confirmedDate: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Confirmed time</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. 10:30 AM"
                    value={editForm.confirmedTime}
                    onChange={(e) => setEditForm({ ...editForm, confirmedTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Patient scheduling note</label>
                <textarea
                  className="textarea-control"
                  style={{ minHeight: '72px' }}
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Clinic staff notes</label>
                <textarea
                  className="textarea-control"
                  style={{ minHeight: '72px' }}
                  placeholder="Internal scheduling notes..."
                  value={editForm.staffNotes}
                  onChange={(e) => setEditForm({ ...editForm, staffNotes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDelete(selected)}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="sub-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand-primary)',
                  }}
                >
                  <Bell size={14} />
                  <span>NOTIFICATION MICROSERVICE ({drawerNotifications.length})</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => handleResendNotification('whatsapp')}
                >
                  <Send size={12} />
                  <span>Resend WhatsApp</span>
                </button>
              </div>

              {drawerNotifications.length === 0 ? (
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>No notification logs recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {drawerNotifications.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '12.5px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>
                          {n.channel.toUpperCase()} · {n.eventType}
                        </span>
                        <span style={{ color: '#1b6b46' }}>{n.deliveryStatus}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                        {n.messageBody}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
