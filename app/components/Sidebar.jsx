'use client';

import {
  Bell,
  CalendarClock,
  ClipboardList,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Sidebar({
  health,
  activeTab,
  onTabChange,
  currentUser,
  pendingUsersCount = 0,
  onLogout,
}) {
  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <aside className="crm-sidebar" aria-label="Dashboard navigation">
      <div>
        <div className="sidebar-brand">
          <BrandLogo />
          <div className="sidebar-brand-sub" style={{ paddingLeft: 0, marginTop: '10px' }}>
            Mental Health Admin &amp; CRM
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Dashboard</div>

          <button
            type="button"
            className={`sidebar-item ${activeTab === 'enquiries' ? 'active' : ''}`}
            onClick={() => onTabChange?.('enquiries')}
          >
            <span className="sidebar-item-left">
              <ClipboardList size={17} />
              <span>Enquiries CRM</span>
            </span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => onTabChange?.('availability')}
          >
            <span className="sidebar-item-left">
              <CalendarClock size={17} />
              <span>Availability</span>
            </span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => onTabChange?.('notifications')}
          >
            <span className="sidebar-item-left">
              <Bell size={17} />
              <span>Notification Logs</span>
            </span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => onTabChange?.('approvals')}
            >
              <span className="sidebar-item-left">
                <UserCheck size={17} />
                <span>User Approvals</span>
              </span>
              {pendingUsersCount > 0 && (
                <span
                  style={{
                    background: activeTab === 'approvals' ? '#ffffff' : '#946200',
                    color: activeTab === 'approvals' ? 'var(--brand-primary)' : '#ffffff',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {pendingUsersCount}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      <div className="sidebar-footer">
        {health && (
          <div
            className="secure-badge"
            style={{ justifyContent: 'center', width: '100%', padding: '8px 12px' }}
            title={`Database: ${health.database}`}
          >
            <ShieldCheck size={14} />
            <span>{health.database === 'connected' ? 'API & DB Connected' : 'DB Offline'}</span>
          </div>
        )}

        {currentUser && (
          <div className="sidebar-user-card">
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentUser.fullName}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                {isSuperAdmin ? 'Super Admin' : 'Staff'}
              </div>
            </div>

            <button
              type="button"
              className="icon-btn"
              title="Sign Out"
              aria-label="Sign Out"
              onClick={onLogout}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
