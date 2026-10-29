import React from 'react';

export const Badge = ({ type = 'status', value = '', label }) => {
  const displayLabel = label || value;
  const valLower = String(value).toLowerCase();

  let className = 'badge';

  if (type === 'category') {
    if (valLower === 'hot') className += ' badge-hot';
    else if (valLower === 'warm') className += ' badge-warm';
    else className += ' badge-cold';
  } else if (type === 'priority') {
    if (valLower === 'urgent') className += ' badge-urgent';
    else if (valLower === 'high') className += ' badge-high';
    else if (valLower === 'medium') className += ' badge-medium';
    else className += ' badge-low';
  } else if (type === 'status') {
    if (valLower === 'new') className += ' badge-status-new';
    else if (valLower === 'contacted') className += ' badge-status-contacted';
    else if (valLower === 'qualified') className += ' badge-status-qualified';
    else if (valLower === 'proposal') className += ' badge-status-proposal';
    else if (valLower === 'negotiation') className += ' badge-status-negotiation';
    else if (valLower === 'won') className += ' badge-status-won';
    else if (valLower === 'lost') className += ' badge-status-lost';
    else className += ' badge-low';
  } else if (type === 'impact') {
    if (valLower === 'positive') className += ' badge-status-won';
    else if (valLower === 'negative') className += ' badge-status-lost';
    else className += ' badge-low';
  }

  return <span className={className}>{displayLabel}</span>;
};
