import api from './api';

export const leadService = {
  async getLeads(params = {}) {
    const res = await api.get('/leads', { params });
    return res.data;
  },

  async getLeadById(id) {
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },

  async createLead(data) {
    const res = await api.post('/leads', data);
    return res.data;
  },

  async updateLead(id, data) {
    const res = await api.put(`/leads/${id}`, data);
    return res.data;
  },

  async deleteLead(id) {
    const res = await api.delete(`/leads/${id}`);
    return res.data;
  },

  async addActivity(leadId, data) {
    const res = await api.post(`/leads/${leadId}/activities`, data);
    return res.data;
  },

  async getActivities(leadId) {
    const res = await api.get(`/leads/${leadId}/activities`);
    return res.data;
  },

  async getLeadInsights(leadId) {
    const res = await api.get(`/leads/${leadId}/insights`);
    return res.data;
  },

  async importCSV(formDataOrText) {
    if (formDataOrText instanceof FormData) {
      const res = await api.post('/leads/import', formDataOrText, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    }
    const res = await api.post('/leads/import', { csvText: formDataOrText });
    return res.data;
  },

  async exportCSV() {
    const res = await api.get('/leads/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
