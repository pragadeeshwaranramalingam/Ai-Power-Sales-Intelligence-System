const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const { generatePipelineInsights } = require('../services/aiEngine');

const getLeadScope = (user) => {
  if (user.role === 'admin') return {};
  return {
    $or: [{ owner: user._id }, { assignedTo: user._id }]
  };
};

// Date filter helper
const buildDateFilter = (timeframe) => {
  const now = new Date();
  if (timeframe === '7d') {
    return { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  }
  if (timeframe === '30d') {
    return { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  }
  if (timeframe === '90d') {
    return { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
  }
  if (timeframe === '1y') {
    return { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
  }
  return null;
};

// @desc    Get comprehensive sales dashboard overview metrics
// @route   GET /api/v1/analytics/overview
// @access  Private
const getOverviewMetrics = async (req, res, next) => {
  try {
    const scope = getLeadScope(req.user);
    const query = { ...scope };

    if (req.query.timeframe && req.query.timeframe !== 'all') {
      const dateRange = buildDateFilter(req.query.timeframe);
      if (dateRange) {
        query.createdAt = dateRange;
      }
    }

    const leads = await Lead.find(query).populate('assignedTo', 'name email avatar');
    const totalLeads = leads.length;

    // Filter by pipeline stages
    const openStatuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation'];
    const openOpportunities = leads.filter(l => openStatuses.includes(l.status));
    const hotLeads = leads.filter(l => l.aiCategory === 'Hot');
    const wonLeads = leads.filter(l => l.status === 'Won');
    const lostLeads = leads.filter(l => l.status === 'Lost');

    // Values & Revenue
    const pipelineValue = openOpportunities.reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const wonRevenue = wonLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const totalClosed = wonLeads.length + lostLeads.length;

    // Conversion rate calculation guarded against division by zero
    const conversionRate = totalClosed > 0
      ? Math.round((wonLeads.length / totalClosed) * 100 * 10) / 10
      : (totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100 * 10) / 10 : 0);

    // Average Deal Value & Lead Score
    const totalDealVal = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const averageDealValue = totalLeads > 0 ? Math.round(totalDealVal / totalLeads) : 0;

    const totalScore = leads.reduce((sum, l) => sum + (l.aiScore || 0), 0);
    const averageScore = totalLeads > 0 ? Math.round(totalScore / totalLeads) : 0;

    // Overdue follow-ups
    const now = new Date();
    const overdueFollowUps = leads.filter(l => l.nextFollowUpAt && new Date(l.nextFollowUpAt) < now && !['Won', 'Lost'].includes(l.status)).length;

    // Status breakdown distribution
    const statusCounts = {};
    const pipelineStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    pipelineStages.forEach(s => { statusCounts[s] = 0; });
    leads.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    const statusDistribution = pipelineStages.map(stage => ({
      status: stage,
      count: statusCounts[stage],
      value: leads.filter(l => l.status === stage).reduce((sum, l) => sum + (l.dealValue || 0), 0)
    }));

    // Sources breakdown
    const sourceMap = {};
    leads.forEach(l => {
      const src = l.source || 'Other';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const sourceBreakdown = Object.keys(sourceMap).map(source => ({
      source,
      count: sourceMap[source]
    }));

    // Industry breakdown
    const industryMap = {};
    leads.forEach(l => {
      const ind = l.industry || 'Other';
      industryMap[ind] = (industryMap[ind] || 0) + 1;
    });
    const industryBreakdown = Object.keys(industryMap).map(industry => ({
      industry,
      count: industryMap[industry]
    }));

    // Recent activity feed
    const leadIds = leads.map(l => l._id);
    const recentActivities = await Activity.find({ lead: { $in: leadIds } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user', 'name avatar')
      .populate('lead', 'name company');

    // Top high-scoring leads and highest-value deals
    const topScoringLeads = [...leads]
      .filter(l => !['Won', 'Lost'].includes(l.status))
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 5);

    const highestValueDeals = [...leads]
      .filter(l => !['Won', 'Lost'].includes(l.status))
      .sort((a, b) => b.dealValue - a.dealValue)
      .slice(0, 5);

    // AI Pipeline Insights
    const aiInsights = await generatePipelineInsights(Lead, Task, scope);

    res.status(200).json({
      success: true,
      summary: {
        totalLeads,
        hotLeads: hotLeads.length,
        openOpportunities: openOpportunities.length,
        pipelineValue,
        wonRevenue,
        conversionRate,
        averageDealValue,
        averageScore,
        overdueFollowUps
      },
      statusDistribution,
      sourceBreakdown,
      industryBreakdown,
      recentActivities,
      topScoringLeads,
      highestValueDeals,
      aiInsights
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get conversion rates by source and by industry
// @route   GET /api/v1/analytics/conversions
// @access  Private
const getConversions = async (req, res, next) => {
  try {
    const scope = getLeadScope(req.user);
    const leads = await Lead.find(scope);

    // Group by source
    const sourceStats = {};
    leads.forEach(l => {
      const src = l.source || 'Other';
      if (!sourceStats[src]) {
        sourceStats[src] = { source: src, total: 0, won: 0, lost: 0, revenue: 0 };
      }
      sourceStats[src].total += 1;
      if (l.status === 'Won') {
        sourceStats[src].won += 1;
        sourceStats[src].revenue += (l.dealValue || 0);
      } else if (l.status === 'Lost') {
        sourceStats[src].lost += 1;
      }
    });

    const conversionsBySource = Object.values(sourceStats).map(s => {
      const closed = s.won + s.lost;
      const rate = closed > 0 ? Math.round((s.won / closed) * 100) : (s.total > 0 ? Math.round((s.won / s.total) * 100) : 0);
      return { ...s, conversionRate: rate };
    });

    // Group by industry
    const industryStats = {};
    leads.forEach(l => {
      const ind = l.industry || 'Other';
      if (!industryStats[ind]) {
        industryStats[ind] = { industry: ind, total: 0, won: 0, revenue: 0 };
      }
      industryStats[ind].total += 1;
      if (l.status === 'Won') {
        industryStats[ind].won += 1;
        industryStats[ind].revenue += (l.dealValue || 0);
      }
    });

    const conversionsByIndustry = Object.values(industryStats).map(ind => {
      const rate = ind.total > 0 ? Math.round((ind.won / ind.total) * 100) : 0;
      return { ...ind, conversionRate: rate };
    });

    // Lead Score distribution brackets (0-20, 21-40, 41-60, 61-80, 81-100)
    const scoreBrackets = [
      { bracket: '0-20', count: 0 },
      { bracket: '21-40', count: 0 },
      { bracket: '41-60', count: 0 },
      { bracket: '61-80', count: 0 },
      { bracket: '81-100', count: 0 }
    ];

    leads.forEach(l => {
      const score = l.aiScore || 0;
      if (score <= 20) scoreBrackets[0].count++;
      else if (score <= 40) scoreBrackets[1].count++;
      else if (score <= 60) scoreBrackets[2].count++;
      else if (score <= 80) scoreBrackets[3].count++;
      else scoreBrackets[4].count++;
    });

    // Monthly pipeline and won revenue for the last 6 months
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthDate.toLocaleString('default', { month: 'short' });

      const monthLeads = leads.filter(l => {
        const cDate = new Date(l.createdAt);
        return cDate >= monthDate && cDate < nextMonthDate;
      });

      const pipeline = monthLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
      const won = monthLeads.filter(l => l.status === 'Won').reduce((sum, l) => sum + (l.dealValue || 0), 0);

      monthlyData.push({
        month: monthLabel,
        leadsCreated: monthLeads.length,
        pipeline,
        won
      });
    }

    res.status(200).json({
      success: true,
      conversionsBySource,
      conversionsByIndustry,
      scoreDistribution: scoreBrackets,
      monthlyTrends: monthlyData
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverviewMetrics,
  getConversions
};
