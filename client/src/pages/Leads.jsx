import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { leadService } from '../services/leadService';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const Leads = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [industry, setIndustry] = useState(searchParams.get('industry') || 'all');
  const [source, setSource] = useState(searchParams.get('source') || 'all');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'all');
  const [aiCategory, setAiCategory] = useState(searchParams.get('aiCategory') || 'all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: 'Manager',
    industry: 'Technology',
    source: 'Website',
    dealValue: 5000,
    status: 'New',
    priority: 'Medium',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // CSV Import state
  const [csvFile, setCsvFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [pagination.page, status, industry, source, priority, aiCategory, sortBy, sortOrder]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 10,
        search: search.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        industry: industry !== 'all' ? industry : undefined,
        source: source !== 'all' ? source : undefined,
        priority: priority !== 'all' ? priority : undefined,
        aiCategory: aiCategory !== 'all' ? aiCategory : undefined,
        sortBy,
        sortOrder
      };

      const res = await leadService.getLeads(params);
      if (res.success) {
        setLeads(res.leads);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[Leads] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLeads();
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: 'Director of Operations',
      industry: 'Technology',
      source: 'Website',
      dealValue: 10000,
      status: 'New',
      priority: 'Medium',
      notes: ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (lead) => {
    setActiveLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company,
      jobTitle: lead.jobTitle,
      industry: lead.industry,
      source: lead.source,
      dealValue: lead.dealValue,
      status: lead.status,
      priority: lead.priority,
      notes: lead.notes || ''
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (lead) => {
    setActiveLead(lead);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await leadService.createLead(formData);
      setIsAddModalOpen(false);
      fetchLeads();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await leadService.updateLead(activeLead._id, formData);
      setIsEditModalOpen(false);
      fetchLeads();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error updating lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await leadService.deleteLead(activeLead._id);
      setIsDeleteModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = async () => {
    try {
      await leadService.exportCSV();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImportLoading(true);
    setImportResult(null);

    try {
      let payload;
      if (csvFile) {
        payload = new FormData();
        payload.append('file', csvFile);
      } else {
        payload = csvText;
      }

      const res = await leadService.importCSV(payload);
      setImportResult(res);
      fetchLeads();
    } catch (err) {
      setImportResult({
        success: false,
        message: err.response?.data?.message || 'CSV Import failed.'
      });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header with Action Buttons */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Lead Management</h1>
          <p className="page-subtitle">
            Create, qualify, analyze, and convert enterprise accounts using AI intelligence metrics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Add New Lead
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, company, or job title..."
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </form>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="select"
            style={{ width: '150px' }}
          >
            <option value="all">All Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          {/* AI Category Filter */}
          <select
            value={aiCategory}
            onChange={(e) => { setAiCategory(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="select"
            style={{ width: '140px' }}
          >
            <option value="all">All AI Scores</option>
            <option value="Hot">Hot (≥75)</option>
            <option value="Warm">Warm (45-74)</option>
            <option value="Cold">Cold (&lt;45)</option>
          </select>

          {/* Industry Filter */}
          <select
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="select"
            style={{ width: '150px' }}
          >
            <option value="all">All Industries</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Education">Education</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select"
            style={{ width: '140px' }}
          >
            <option value="createdAt">Date Created</option>
            <option value="aiScore">AI Score</option>
            <option value="dealValue">Deal Value</option>
            <option value="name">Lead Name</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="card" style={{ padding: '2rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '42px', marginBottom: '0.75rem' }} />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Try modifying your filters or search keywords, or add your first sales lead."
          actionText="Add New Lead"
          onAction={openAddModal}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Lead & Company</th>
                  <th>Industry / Source</th>
                  <th>Stage</th>
                  <th>Deal Value</th>
                  <th>AI Score</th>
                  <th>Conversion Est.</th>
                  <th>Assigned Rep</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            flexShrink: 0
                          }}
                        >
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <Link
                            to={`/leads/${lead._id}`}
                            style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                          >
                            {lead.name}
                          </Link>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {lead.jobTitle} • <strong>{lead.company}</strong>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{lead.industry}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>via {lead.source}</div>
                    </td>

                    <td>
                      <Badge type="status" value={lead.status} />
                    </td>

                    <td style={{ fontWeight: 700 }}>
                      ${(lead.dealValue || 0).toLocaleString()}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Badge type="category" value={lead.aiCategory} label={`${lead.aiScore}`} />
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '45px', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${lead.conversionLikelihood || 50}%`,
                              height: '100%',
                              backgroundColor: lead.conversionLikelihood >= 70 ? '#10b981' : lead.conversionLikelihood >= 40 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{lead.conversionLikelihood}%</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{lead.assignedTo?.name || 'Unassigned'}</div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Link
                          to={`/leads/${lead._id}`}
                          className="btn btn-secondary btn-icon"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => openEditModal(lead)}
                          className="btn btn-secondary btn-icon"
                          title="Edit Lead"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(lead)}
                          className="btn btn-secondary btn-icon"
                          style={{ color: 'var(--danger-text)' }}
                          title="Delete Lead"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          <div
            style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Showing {leads.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              <strong>{pagination.total}</strong> records
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '0 0.5rem' }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Sales Opportunity"
        footer={
          <>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="addLeadForm" disabled={formLoading} className="btn btn-primary">
              {formLoading ? 'Calculating AI Score...' : 'Save & Score Lead'}
            </button>
          </>
        }
      >
        <form id="addLeadForm" onSubmit={handleCreateSubmit}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8125rem' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Contact Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Elena Rostova"
                className="input"
              />
            </div>

            <div className="input-group">
              <label className="label">Work Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                placeholder="elena@cloudscale.io"
                className="input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData(f => ({ ...f, company: e.target.value }))}
                placeholder="CloudScale Technologies"
                className="input"
              />
            </div>

            <div className="input-group">
              <label className="label">Job Title / Seniority</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData(f => ({ ...f, jobTitle: e.target.value }))}
                placeholder="Chief Technology Officer"
                className="input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData(f => ({ ...f, industry: e.target.value }))}
                className="select"
              >
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Logistics">Logistics</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label className="label">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData(f => ({ ...f, source: e.target.value }))}
                className="select"
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="Event">Event</option>
                <option value="Partner">Partner</option>
                <option value="Inbound Form">Inbound Form</option>
              </select>
            </div>

            <div className="input-group">
              <label className="label">Deal Value ($)</label>
              <input
                type="number"
                min="0"
                value={formData.dealValue}
                onChange={(e) => setFormData(f => ({ ...f, dealValue: Number(e.target.value) }))}
                className="input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Pipeline Stage</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))}
                className="select"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="input-group">
              <label className="label">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(f => ({ ...f, priority: e.target.value }))}
                className="select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="label">Discovery & Background Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
              placeholder="Key requirements, budget timeline, executive pain points..."
              className="textarea"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Sales Opportunity"
        footer={
          <>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" form="editLeadForm" disabled={formLoading} className="btn btn-primary">
              {formLoading ? 'Recalculating...' : 'Update Lead'}
            </button>
          </>
        }
      >
        <form id="editLeadForm" onSubmit={handleEditSubmit}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8125rem' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Contact Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                className="input"
              />
            </div>

            <div className="input-group">
              <label className="label">Work Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData(f => ({ ...f, company: e.target.value }))}
                className="input"
              />
            </div>

            <div className="input-group">
              <label className="label">Job Title / Seniority</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData(f => ({ ...f, jobTitle: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Pipeline Stage</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))}
                className="select"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="input-group">
              <label className="label">Deal Value ($)</label>
              <input
                type="number"
                min="0"
                value={formData.dealValue}
                onChange={(e) => setFormData(f => ({ ...f, dealValue: Number(e.target.value) }))}
                className="input"
              />
            </div>

            <div className="input-group">
              <label className="label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(f => ({ ...f, priority: e.target.value }))}
                className="select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="label">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
              className="textarea"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Lead Deletion"
        footer={
          <>
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} className="btn btn-danger">
              Yes, Delete Permanently
            </button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Are you sure you want to delete lead <strong>{activeLead?.name}</strong> ({activeLead?.company})?
          This will permanently delete this opportunity along with all related interaction timelines and tasks.
        </p>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); setImportResult(null); }}
        title="Import Leads via CSV"
        footer={
          <button onClick={() => { setIsImportModalOpen(false); setImportResult(null); }} className="btn btn-secondary">
            Close
          </button>
        }
      >
        <form onSubmit={handleImportSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="input"
              style={{ padding: '0.4rem' }}
            />
          </div>

          <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            — OR PASTE RAW CSV CONTENT —
          </div>

          <div className="input-group">
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="name,email,company,jobTitle,industry,dealValue&#10;Alice Wang,alice@quantum.com,Quantum Labs,VP Engineering,Technology,55000"
              className="textarea"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={importLoading || (!csvFile && !csvText.trim())}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {importLoading ? 'Validating & Importing...' : 'Execute CSV Import'}
          </button>
        </form>

        {/* Import Report */}
        {importResult && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: importResult.failedCount > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              fontSize: '0.8125rem'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {importResult.failedCount === 0 ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#f59e0b" />}
              Import Results: {importResult.importedCount} Imported, {importResult.failedCount} Failed
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div style={{ marginTop: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>Error details:</div>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>Row {err.row}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
