import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { taskService } from '../services/taskService';
import { leadService } from '../services/leadService';
import { authService } from '../services/authService';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterTab, setFilterTab] = useState('all'); // all, pending, in_progress, completed, overdue

  // Create Task Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTasks();
    loadLeadAndUserData();
  }, [filterTab]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTab === 'pending') params.status = 'pending';
      if (filterTab === 'in_progress') params.status = 'in_progress';
      if (filterTab === 'completed') params.status = 'completed';
      if (filterTab === 'overdue') params.overdue = 'true';

      const res = await taskService.getTasks(params);
      if (res.success) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeadAndUserData = async () => {
    try {
      const [leadsRes, usersRes] = await Promise.all([
        leadService.getLeads({ limit: 100 }),
        authService.getUsers()
      ]);
      if (leadsRes.success) setLeads(leadsRes.leads);
      if (usersRes.success) setUsers(usersRes.users);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (taskId) => {
    try {
      const res = await taskService.toggleTaskStatus(taskId);
      if (res.success) {
        setTasks(prev => prev.map(t => (t._id === taskId ? res.task : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        title,
        description,
        lead: leadId || undefined,
        assignedTo: assignedTo || undefined,
        dueDate,
        priority
      };

      const res = await taskService.createTask(payload);
      if (res.success) {
        setTasks([res.task, ...tasks]);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setLeadId('');
        setDueDate('');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating task');
    } finally {
      setFormLoading(false);
    }
  };

  const isTaskOverdue = (task) => {
    if (task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks & Follow-up Actions</h1>
          <p className="page-subtitle">
            Manage scheduled customer discovery calls, demos, SLA reviews, and overdue obligations.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Create Follow-up Task
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'pending', label: 'Pending' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'overdue', label: 'Overdue Reminders' },
          { id: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              background: filterTab === tab.id ? 'var(--accent-primary)' : 'transparent',
              color: filterTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '8px' }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="You are caught up! Create a new follow-up task to stay on top of leads."
          actionText="Create Task"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tasks.map((task) => {
            const overdue = isTaskOverdue(task);

            return (
              <div
                key={task._id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: overdue ? '1px solid #f87171' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Left: Checkbox + Title + Meta */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => handleToggleStatus(task._id)}
                    style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer' }}
                  />

                  <div>
                    <div
                      style={{
                        fontSize: '0.925rem',
                        fontWeight: 700,
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)'
                      }}
                    >
                      {task.title}
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {task.lead && (
                        <Link
                          to={`/leads/${task.lead._id}`}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--accent-primary)',
                            textDecoration: 'none'
                          }}
                        >
                          Account: {task.lead.company} ({task.lead.name})
                        </Link>
                      )}

                      <span
                        style={{
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: overdue ? '#dc2626' : 'var(--text-muted)',
                          fontWeight: overdue ? 700 : 500
                        }}
                      >
                        <Calendar size={13} />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {overdue && ' (OVERDUE)'}
                      </span>

                      {task.assignedTo && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={13} /> {task.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge type="priority" value={task.priority} />
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: task.status === 'completed' ? '#dcfce7' : 'var(--bg-tertiary)',
                      color: task.status === 'completed' ? '#15803d' : 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="btn btn-secondary btn-icon"
                    style={{ color: 'var(--danger-text)' }}
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Follow-up Task"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={formLoading || !title.trim() || !dueDate}
              className="btn btn-primary"
            >
              {formLoading ? 'Scheduling...' : 'Save Task'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTask}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8125rem' }}>
              {formError}
            </div>
          )}

          <div className="input-group">
            <label className="label">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Executive Discovery Call with VP of Procurement"
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="label">Task Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key objectives, agenda items, or deliverables..."
              className="textarea"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Link to Lead Account</label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="select"
              >
                <option value="">-- Optional: Select Lead --</option>
                {leads.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.company} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="label">Assign To</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="select"
              >
                <option value="">-- Self / Default --</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="label">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </div>

            <div className="input-group">
              <label className="label">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
