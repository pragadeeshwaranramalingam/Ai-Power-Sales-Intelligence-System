import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  Building,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  Send,
  Plus,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { leadService } from '../services/leadService';
import { taskService } from '../services/taskService';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const LeadDetails = () => {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Activity form state
  const [activityType, setActivityType] = useState('call');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Quick Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('High');
  const [taskLoading, setTaskLoading] = useState(false);

  useEffect(() => {
    fetchLeadData();
  }, [id]);

  const fetchLeadData = async () => {
    setLoading(true);
    try {
      const [leadRes, actRes] = await Promise.all([
        leadService.getLeadById(id),
        leadService.getActivities(id)
      ]);

      if (leadRes.success) {
        setLead(leadRes.lead);
      }
      if (actRes.success) {
        setActivities(actRes.activities);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load lead profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStatus) => {
    try {
      const res = await leadService.updateLead(lead._id, { status: newStatus });
      if (res.success) {
        setLead(res.lead);
        const actRes = await leadService.getActivities(id);
        setActivities(actRes.activities);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!activityTitle.trim()) return;

    setSubmittingActivity(true);
    try {
      const payload = {
        type: activityType,
        title: activityTitle,
        description: activityDesc,
        metadata: followUpDate ? { nextFollowUpAt: followUpDate } : {}
      };

      const res = await leadService.addActivity(lead._id, payload);
      if (res.success) {
        setActivities([res.activity, ...activities]);
        setLead(res.lead); // Refreshed lead with updated score & dates
        setActivityTitle('');
        setActivityDesc('');
        setFollowUpDate('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate) return;

    setTaskLoading(true);
    try {
      const res = await taskService.createTask({
        title: taskTitle,
        lead: lead._id,
        dueDate: taskDueDate,
        priority: taskPriority
      });

      if (res.success) {
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDueDate('');
        // Refresh activities to see the linked task logged
        const actRes = await leadService.getActivities(id);
        setActivities(actRes.activities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="skeleton" style={{ height: '40px', width: '200px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: '140px', marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="skeleton" style={{ height: '450px' }} />
          <div className="skeleton" style={{ height: '450px' }} />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="page-wrapper">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3>{error || 'Lead not found'}</h3>
          <Link to="/leads" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Back Link */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/leads"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={14} /> Back to All Leads
        </Link>
      </div>

      {/* Main Profile Header Banner */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800
            }}
          >
            {lead.name.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{lead.name}</h1>
              <Badge type="category" value={lead.aiCategory} label={`${lead.aiScore} Pts (${lead.aiCategory})`} />
              <Badge type="priority" value={lead.priority} />
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {lead.jobTitle} at <strong>{lead.company}</strong> • Industry: {lead.industry}
            </div>
          </div>
        </div>

        {/* Stage Advancement & Deal Value */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Target Deal Value
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ${(lead.dealValue || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              PIPELINE STAGE
            </div>
            <select
              value={lead.status}
              onChange={(e) => handleStageChange(e.target.value)}
              className="select"
              style={{ fontWeight: 700, width: '150px' }}
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won (Closed)</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <button onClick={() => setIsTaskModalOpen(true)} className="btn btn-secondary">
            <Plus size={16} /> New Follow-Up Task
          </button>
        </div>
      </div>

      {/* 2-Column Split: AI Intelligence & Profile Left, Activity Timeline Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '1.75rem' }}>
        {/* Left Column: AI Intelligence & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* AI Scorecard Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#6366f1" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>AI Lead Intelligence Scorecard</h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Deterministic MCDA v2.0
              </span>
            </div>

            {/* Score Progress Gauge */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '2.25rem', fontWeight: 800, color: lead.aiScore >= 75 ? '#ef4444' : lead.aiScore >= 45 ? '#f59e0b' : '#3b82f6' }}>
                    {lead.aiScore}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}> / 100</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONVERSION LIKELIHOOD</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                    {lead.conversionLikelihood}% (Heuristic)
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-subtle)', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${lead.aiScore}%`,
                    height: '100%',
                    background: lead.aiScore >= 75
                      ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                      : lead.aiScore >= 45
                      ? 'linear-gradient(90deg, #6366f1 0%, #f59e0b 100%)'
                      : '#3b82f6',
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>

            {/* Next Best Action Card */}
            {lead.nextBestAction && (
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    RECOMMENDED NEXT-BEST-ACTION
                  </span>
                  <Badge type="priority" value={lead.nextBestAction.priority} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {lead.nextBestAction.action}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {lead.nextBestAction.reason}
                </div>
                {lead.nextBestAction.suggestedDate && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} /> Target Timing: {new Date(lead.nextBestAction.suggestedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Explainable Factor Breakdown */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Multi-Criteria Decision Factor Decomposition
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {lead.aiFactors?.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-tertiary)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{f.factor}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {f.description}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                        +{f.score} / {f.maxScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>Lead Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>EMAIL</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.email}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>PHONE</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.phone || 'Not recorded'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>SOURCE</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.source}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>ACCOUNT REP</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.assignedTo?.name || 'Unassigned'}</div>
              </div>
            </div>

            {lead.notes && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>NOTES</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{lead.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interaction Activity Timeline */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>Activity & Touchpoints</h3>

          {/* Quick Add Activity Form */}
          <form
            onSubmit={handleAddActivity}
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {['call', 'meeting', 'email', 'note'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setActivityType(t)}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: activityType === t ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    backgroundColor: activityType === t ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: activityType === t ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="input-group" style={{ marginBottom: '0.65rem' }}>
              <input
                type="text"
                required
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="Activity title (e.g. Discussed pricing model with CTO)"
                className="input"
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '0.65rem' }}>
              <textarea
                rows={2}
                value={activityDesc}
                onChange={(e) => setActivityDesc(e.target.value)}
                placeholder="Meeting notes or interaction takeaways..."
                className="textarea"
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={submittingActivity || !activityTitle.trim()}
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              <Send size={14} /> {submittingActivity ? 'Saving & Updating AI...' : 'Log Activity & Re-score'}
            </button>
          </form>

          {/* Timeline Feed */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
                No recorded interactions yet. Log a call or note above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                {activities.map((act) => (
                  <div
                    key={act._id}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.45rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--accent-primary)',
                        marginTop: '0.1rem'
                      }}
                    >
                      <Clock size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{act.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(act.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {act.description && (
                        <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {act.description}
                        </p>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Logged by {act.user?.name || 'Representative'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={`Schedule Follow-up for ${lead.company}`}
        footer={
          <>
            <button onClick={() => setIsTaskModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateTask} disabled={taskLoading || !taskTitle.trim() || !taskDueDate} className="btn btn-primary">
              {taskLoading ? 'Scheduling...' : 'Schedule Task'}
            </button>
          </>
        }
      >
        <div className="input-group">
          <label className="label">Task Title *</label>
          <input
            type="text"
            required
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Send redlined contract to counsel"
            className="input"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div className="input-group">
            <label className="label">Due Date *</label>
            <input
              type="date"
              required
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="label">Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="select"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
