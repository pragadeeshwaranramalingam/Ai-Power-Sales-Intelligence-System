import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Download, BarChart2, TrendingUp, Target, Award, PieChart } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { leadService } from '../services/leadService';

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getConversions();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      await leadService.exportCSV();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <div className="page-wrapper">
        <div className="skeleton" style={{ height: '40px', width: '250px', marginBottom: '1.5rem' }} />
        <div className="charts-grid-2">
          <div className="skeleton" style={{ height: '340px' }} />
          <div className="skeleton" style={{ height: '340px' }} />
        </div>
      </div>
    );
  }

  const {
    conversionsBySource = [],
    conversionsByIndustry = [],
    scoreDistribution = [],
    monthlyTrends = []
  } = data || {};

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Analytics & Reports</h1>
          <p className="page-subtitle">
            Conversion velocities, lead score histograms, and quarterly commercial pipeline trends.
          </p>
        </div>

        <button onClick={handleExportReport} className="btn btn-primary">
          <Download size={16} /> Export Intelligence Report (CSV)
        </button>
      </div>

      {/* 2-Chart Grid: Conversions by Source & Industry */}
      <div className="charts-grid-2">
        {/* Conversion Rate by Source */}
        <div className="card">
          <div className="card-title">Win Rate by Acquisition Channel (%)</div>
          <div className="card-description">Measured conversion percentage across marketing and outreach channels</div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionsBySource} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="source" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-strong)', borderRadius: '8px' }}
                  formatter={(val) => [`${val}%`, 'Conversion Rate']}
                />
                <Bar dataKey="conversionRate" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Win Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Industry */}
        <div className="card">
          <div className="card-title">Win Rate by Vertical Segment (%)</div>
          <div className="card-description">Industry fit and product-market alignment conversion rates</div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionsByIndustry} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="industry" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-strong)', borderRadius: '8px' }}
                  formatter={(val) => [`${val}%`, 'Conversion Rate']}
                />
                <Bar dataKey="conversionRate" fill="#10b981" radius={[4, 4, 0, 0]} name="Industry Win Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2-Chart Grid: Monthly Trends & Score Histogram */}
      <div className="charts-grid-2">
        {/* 6-Month Revenue & Pipeline Growth Trend */}
        <div className="card">
          <div className="card-title">6-Month Pipeline & Realized Revenue ($)</div>
          <div className="card-description">Comparison of created pipeline volume vs closed-won contracts</div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 15, right: 15, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-strong)', borderRadius: '8px' }}
                  formatter={(val) => [`$${val.toLocaleString()}`]}
                />
                <Legend />
                <Line type="monotone" dataKey="pipeline" stroke="#3b82f6" strokeWidth={2} name="Pipeline Created ($)" />
                <Line type="monotone" dataKey="won" stroke="#10b981" strokeWidth={3} name="Won Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Score Distribution Histogram */}
        <div className="card">
          <div className="card-title">AI Lead Score Distribution</div>
          <div className="card-description">Frequency of leads across score brackets (0-100 range)</div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="bracket" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-strong)', borderRadius: '8px' }}
                  formatter={(val) => [val, 'Number of Leads']}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Lead Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
