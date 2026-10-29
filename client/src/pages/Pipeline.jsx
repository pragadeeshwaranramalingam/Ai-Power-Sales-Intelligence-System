import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Kanban as KanbanIcon,
  Search,
  Filter,
  DollarSign,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { leadService } from '../services/leadService';
import { Badge } from '../components/common/Badge';

const STAGES = [
  { id: 'New', label: 'New Inquiry', color: '#94a3b8' },
  { id: 'Contacted', label: 'Contacted', color: '#38bdf8' },
  { id: 'Qualified', label: 'Qualified', color: '#818cf8' },
  { id: 'Proposal', label: 'Proposal', color: '#c084fc' },
  { id: 'Negotiation', label: 'Negotiation', color: '#f59e0b' },
  { id: 'Won', label: 'Closed Won', color: '#10b981' },
  { id: 'Lost', label: 'Closed Lost', color: '#ef4444' }
];

export const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [movingLeadId, setMovingLeadId] = useState(null);

  useEffect(() => {
    fetchPipelineLeads();
  }, []);

  const fetchPipelineLeads = async () => {
    setLoading(true);
    try {
      const res = await leadService.getLeads({ limit: 100 });
      if (res.success) {
        setLeads(res.leads);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageTransition = async (leadId, newStage) => {
    setMovingLeadId(leadId);
    try {
      const res = await leadService.updateLead(leadId, { status: newStage });
      if (res.success) {
        setLeads(prev =>
          prev.map(l => (l._id === leadId ? res.lead : l))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMovingLeadId(null);
    }
  };

  // Filter leads by search query
  const filteredLeads = leads.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      l.industry.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const openLeads = filteredLeads.filter(l => !['Won', 'Lost'].includes(l.status));
  const totalOpenValue = openLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const totalWonValue = filteredLeads.filter(l => l.status === 'Won').reduce((sum, l) => sum + (l.dealValue || 0), 0);

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Pipeline Board</h1>
          <p className="page-subtitle">
            Visual stage-by-stage deal progress, conversion velocity, and pipeline forecasting.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>OPEN PIPELINE</span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#3b82f6' }}>
                ${totalOpenValue.toLocaleString()}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>WON REVENUE</span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                ${totalWonValue.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter pipeline deals..."
              className="input"
              style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.8rem' }}
            />
          </div>
        </div>
      </div>

      {/* Horizontal Kanban Columns Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(280px, 1fr))',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '1.5rem',
          minHeight: '70vh'
        }}
      >
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter(l => l.status === stage.id);
          const stageTotal = stageLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);

          return (
            <div
              key={stage.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                height: 'fit-content',
                minHeight: '400px'
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderTop: `3px solid ${stage.color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>{stage.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ${stageTotal.toLocaleString()}
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards List in Stage */}
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stageLeads.map((lead) => (
                  <div
                    key={lead._id}
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Link
                        to={`/leads/${lead._id}`}
                        style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          textDecoration: 'none'
                        }}
                      >
                        {lead.name}
                      </Link>
                      <Badge type="category" value={lead.aiCategory} label={`${lead.aiScore}`} />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {lead.company} • <span style={{ color: 'var(--text-muted)' }}>{lead.industry}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        ${(lead.dealValue || 0).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Est. {lead.conversionLikelihood}%
                      </span>
                    </div>

                    {/* Stage Transition Control */}
                    <div
                      style={{
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.35rem'
                      }}
                    >
                      <select
                        disabled={movingLeadId === lead._id}
                        value={lead.status}
                        onChange={(e) => handleStageTransition(lead._id, e.target.value)}
                        className="select"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', height: '26px' }}
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>

                      <Link
                        to={`/leads/${lead._id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', height: '26px' }}
                      >
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2rem 1rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem'
                    }}
                  >
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
