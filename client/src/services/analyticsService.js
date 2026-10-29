import api from './api';

export const analyticsService = {
  async getOverview(timeframe = '30d') {
    const res = await api.get('/analytics/overview', { params: { timeframe } });
    return res.data;
  },

  async getConversions() {
    const res = await api.get('/analytics/conversions');
    return res.data;
  }
};
