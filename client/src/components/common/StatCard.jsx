import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = '#4f46e5', badge }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {subtitle}
          </div>
        )}
        {badge && <div style={{ marginTop: '0.5rem' }}>{badge}</div>}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}18`, color }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};
