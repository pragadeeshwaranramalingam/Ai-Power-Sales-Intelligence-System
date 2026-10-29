import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records matching your criteria.',
  actionText,
  onAction
}) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-strong)',
        margin: '1rem 0'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-muted)',
          marginBottom: '1rem'
        }}
      >
        <Icon size={32} />
      </div>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{title}</h4>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};
