import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Flame,
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowUpRight,
  Clock,
  Briefcase,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { analyticsService } from '../services/analyticsService';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';

const STATUS_COLORS = {
  New: '#94a3b8',
  Contacted: '#38bdf8',
  Qualified: '#818cf8',
  Proposal: '#c084fc',
  Negotiation: '#f59e0b',
  Won: '#10b981',
  Lost: '#ef4444'
};

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsService.getOverview(timeframe);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching analytics:', err);
      setError('Failed to load real-time analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ width: '250px', height: '36px' }} />
          <div className="skeleton" style={{ width: '180px', height: '36px' }} />
        </div>
        <div className="stats-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '110px' }} />
          ))}
        </div>
        <div className="charts-grid-2">
          <div className="skeleton" style={{ height: '320px' }} />
          <div className="skeleton" style={{ height: '320px' }} />
        </div>
      </div>
    );
  }

  const {
    summary = {},
    statusDistribution = [],
    sourceBreakdown = [],
    recentActivities = [],
    topScoringLeads = [],
    highestValueDeals = [],
    aiInsights = {}
  } = data || {};

  return (
    <div className="page-wrapper">
      {/* Header with Timeframe Filter */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Sales Intelligence</h1>
          <p className="page-subtitle">
            Real-time pipeline analytics powered by deterministic multi-criteria AI lead scoring.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }}>
            {['7d', '30d', '90d', '1y', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  background: timeframe === t ? 'var(--accent-primary)' : 'transparent',
                  color: timeframe === t ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* 8 Essential Key Metrics Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Pipeline Leads"
          value={summary.totalLeads?.toLocaleString() || 0}
          subtitle={`${summary.openOpportunities || 0} active deals in cycle`}
          icon={Users}
          color="#4f46e5"
        />
        <StatCard
          title="Hot Conversion Targets"
          value={summary.hotLeads || 0}
          subtitle="Score ≥ 75 (High buying signals)"
          icon={Flame}
          color="#ef4444"
        />
        <StatCard
          title="Open Pipeline Value"
          value={`$${(summary.pipelineValue || 0).toLocaleString()}`}
          subtitle="Negotiation & proposal potential"
          icon={DollarSign}
          color="#3b82f6"
        />
        <StatCard
          title="Realized Won Revenue"
          value={`$${(summary.wonRevenue || 0).toLocaleString()}`}
          subtitle="Closed-won commercial revenue"
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          title="Pipeline Win Rate"
          value={`${summary.conversionRate || 0}%`}
          subtitle="Won deals vs total resolved"
          icon={Percent}
          color="#8b5cf6"
        />
        <StatCard
          title="Overdue Follow-ups"
          value={summary.overdueFollowUps || 0}
          subtitle="Urgent client touchpoints needed"
          icon={AlertTriangle}
          color="#f59e0b"
          badge={summary.overdueFollowUps > 0 ? <Badge type="priority" value="Urgent" /> : null}
        />
        <StatCard
          title="Average Lead Score"
          value={`${summary.averageScore || 0}/100`}
          subtitle="Heuristic quality index across book"
          icon={Award}
          color="#6366f1"
        />
        <StatCard
          title="Average Deal Size"
          value={`$${(summary.averageDealValue || 0).toLocaleString()}`}
          subtitle="Mean target contract value"
          icon={Briefcase}
          color="#06b6d4"
        />
      </div>

      {/* AI Pipeline Insights Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          marginBottom: '1.75rem',
          padding: '1.25rem 1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <Sparkles size={20} color="#6366f1" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>AI Lead Intelligence Engine — Actionable Insights</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Model: Deterministic MCDA v2.0
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Top Priority Lead */}
          {aiInsights.topOpportunities && aiInsights.topOpportunities[0] && (
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Highest Conversion Target
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {aiInsights.topOpportunities[0].name} ({aiInsights.topOpportunities[0].company})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                AI Score: <strong>{aiInsights.topOpportunities[0].aiScore}</strong> | Next:{' '}
                <span style={{ color: 'var(--accent-primary)' }}>{aiInsights.topOpportunities[0].nextBestAction?.action}</span>
              </div>
              <Link to={`/leads/${aiInsights.topOpportunities[0]._id}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem' }}>
                Inspect Profile <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* Stale Deal Warning */}
          {aiInsights.staleLeads && aiInsights.staleLeads[0] && (
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                At-Risk Opportunity (Inactivity)
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {aiInsights.staleLeads[0].name} ({aiInsights.staleLeads[0].company})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Deal Value: <strong>${(aiInsights.staleLeads[0].dealValue || 0).toLocaleString()}</strong> | Inactive {'>'} 14 days
              </div>
              <Link to={`/leads/${aiInsights.staleLeads[0]._id}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem' }}>
                Re-engage Now <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* High-Value Closing Target */}
          {aiInsights.highValueDeals && aiInsights.highValueDeals[0] && (
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                High-Value Late Stage Opportunity
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {aiInsights.highValueDeals[0].name} ({aiInsights.highValueDeals[0].company})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Stage: <strong>{aiInsights.highValueDeals[0].status}</strong> | Value: <strong>${(aiInsights.highValueDeals[0].dealValue || 0).toLocaleString()}</strong>
              </div>
              <Link to={`/leads/${aiInsights.highValueDeals[0]._id}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem' }}>
                View Contract Details <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="charts-grid-2">
        {/* Pipeline Value by Stage Chart */}
        <div className="card">
          <div className="card-title">Pipeline Stage Distribution & Value</div>
          <div className="card-description">Aggregate deal volume and dollar value mapped across stages</div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="status" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-strong)', borderRadius: '8px' }}
                  formatter={(val, name) => [name === 'value' ? `$${val.toLocaleString()}` : val, name === 'value' ? 'Total Value' : 'Lead Count']}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Lead Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Distribution Pie Chart */}
        <div className="card">
          <div className="card-title">Acquisition Channel Breakdown</div>
          <div className="card-description">Origin channels fueling qualified pipeline volume</div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {sourceBreakdown.map((entry, index) => {
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-strong)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section: Top Scoring Leads & Recent Activity */}
      <div className="charts-grid-2">
        {/* Top Scoring Leads */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div className="card-title">Top-Scoring Sales Opportunities</div>
              <div className="card-description">High-conversion leads prioritized by AI engine</div>
            </div>
            <Link to="/leads?aiCategory=Hot" className="btn btn-secondary btn-sm">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Lead Contact</th>
                  <th>Company</th>
                  <th>Stage</th>
                  <th>Score</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {topScoringLeads.map((lead) => (
                  <tr key={lead._id}>
                    <td>
                      <Link to={`/leads/${lead._id}`} style={{ fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none' }}>
                        {lead.name}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.jobTitle}</div>
                    </td>
                    <td>{lead.company}</td>
                    <td><Badge type="status" value={lead.status} /></td>
                    <td><Badge type="category" value={lead.aiCategory} label={`${lead.aiScore}`} /></td>
                    <td style={{ fontWeight: 700 }}>${(lead.dealValue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="card">
          <div className="card-title">Recent Activity Feed</div>
          <div className="card-description">Chronological log of customer touchpoints and milestones</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
            {recentActivities.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity records.</div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Clock size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{act.title}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {act.description}
                    </div>
                    {act.lead && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                        Ref: {act.lead.name} ({act.lead.company})
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
