import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Kanban,
  BarChart3,
  CheckSquare,
  Settings,
  Sparkles,
  LogOut,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Pipeline', path: '/pipeline', icon: Kanban },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Tasks & Follow-ups', path: '/tasks', icon: CheckSquare },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
        zIndex: 50,
        transition: 'width 0.2s ease'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.5rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--sidebar-border)'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Sparkles size={20} />
        </div>
        <div>
          <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            SalesIntel <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.3)', color: '#818cf8', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>v2.0</span>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>AI Lead Intelligence</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Theme Toggle & User Info Footer */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--sidebar-border)',
          backgroundColor: 'rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>THEME</span>
          <button
            onClick={toggleTheme}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#cbd5e1',
              borderRadius: '6px',
              padding: '0.3rem 0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#94a3b8" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                flexShrink: 0
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Sales User'}
              </div>
              <div style={{ color: '#818cf8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {user?.role === 'admin' ? 'Administrator' : 'Sales Representative'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '4px'
            }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
