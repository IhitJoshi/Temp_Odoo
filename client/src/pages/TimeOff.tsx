import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiCheck, FiX, FiFile } from 'react-icons/fi';
import './TimeOff.css';

interface Leave {
  _id: string;
  leaveType: 'paid_leave' | 'sick_leave' | 'unpaid_leave';
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  attachment: string;
  status: 'pending' | 'approved' | 'rejected';
  employeeId: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  approvedBy?: {
    loginId: string;
  };
  rejectionReason?: string;
}

interface LeaveBalance {
  paidLeave: number;
  sickLeave: number;
  unpaidLeave: number;
}

const TimeOff: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'paid_leave',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null as File | null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaves();
    if (user?.role !== 'admin' && user?.role !== 'hr') {
      fetchLeaveBalance();
    }
  }, [user]);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/leaves');
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const response = await axios.get('/leaves/balance');
      setLeaveBalance(response.data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        attachment: e.target.files[0]
      });
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('leaveType', formData.leaveType);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('numberOfDays', calculateDays().toString());
      formDataToSend.append('reason', formData.reason);
      if (formData.attachment) {
        formDataToSend.append('attachment', formData.attachment);
      }

      await axios.post('/leaves', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowApplyForm(false);
      setFormData({
        leaveType: 'paid_leave',
        startDate: '',
        endDate: '',
        reason: '',
        attachment: null
      });
      fetchLeaves();
      fetchLeaveBalance();
      alert('Leave application submitted successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await axios.put(`/leaves/${leaveId}/approve`);
      fetchLeaves();
      alert('Leave approved successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = async (leaveId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    try {
      await axios.put(`/leaves/${leaveId}/reject`, { rejectionReason: reason || '' });
      fetchLeaves();
      alert('Leave rejected');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject leave');
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: any = {
      paid_leave: 'Paid Leave',
      sick_leave: 'Sick Leave',
      unpaid_leave: 'Unpaid Leave'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: { label: 'Pending', class: 'badge-warning' },
      approved: { label: 'Approved', class: 'badge-success' },
      rejected: { label: 'Rejected', class: 'badge-danger' }
    };
    return badges[status] || badges.pending;
  };

  if (user?.role === 'admin' || user?.role === 'hr') {
    return (
      <>
        <Navbar />
        <div className="time-off">
          <div className="time-off-header">
            <h1>Leave Management</h1>
          </div>
          <div className="leaves-list">
            {leaves.map((leave) => {
              const badge = getStatusBadge(leave.status);
              return (
                <div key={leave._id} className="leave-card">
                  <div className="leave-header">
                    <div>
                      <h3>{leave.employeeId.name}</h3>
                      <p className="leave-employee-info">
                        {leave.employeeId.department} • {leave.employeeId.email}
                      </p>
                    </div>
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="leave-details">
                    <div className="leave-detail-item">
                      <label>Leave Type</label>
                      <p>{getLeaveTypeLabel(leave.leaveType)}</p>
                    </div>
                    <div className="leave-detail-item">
                      <label>Start Date</label>
                      <p>{new Date(leave.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="leave-detail-item">
                      <label>End Date</label>
                      <p>{new Date(leave.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="leave-detail-item">
                      <label>Number of Days</label>
                      <p>{leave.numberOfDays}</p>
                    </div>
                    {leave.reason && (
                      <div className="leave-detail-item full-width">
                        <label>Reason</label>
                        <p>{leave.reason}</p>
                      </div>
                    )}
                    {leave.attachment && (
                      <div className="leave-detail-item">
                        <label>Attachment</label>
                        <a
                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${leave.attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attachment-link"
                        >
                          <FiFile /> View Attachment
                        </a>
                      </div>
                    )}
                    {leave.rejectionReason && (
                      <div className="leave-detail-item full-width">
                        <label>Rejection Reason</label>
                        <p className="rejection-reason">{leave.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                  {leave.status === 'pending' && (
                    <div className="leave-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleApprove(leave._id)}
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleReject(leave._id)}
                      >
                        <FiX /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {leaves.length === 0 && (
              <div className="empty-state">No leave requests found</div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="time-off">
        <div className="time-off-header">
          <h1>Time Off</h1>
          <button className="btn btn-primary" onClick={() => setShowApplyForm(true)}>
            <FiCalendar /> Apply for Leave
          </button>
        </div>
        {leaveBalance && (
          <div className="leave-balance">
            <h2>Leave Balance</h2>
            <div className="balance-grid">
              <div className="balance-card">
                <label>Paid Leave</label>
                <h3>{leaveBalance.paidLeave}</h3>
              </div>
              <div className="balance-card">
                <label>Sick Leave</label>
                <h3>{leaveBalance.sickLeave}</h3>
              </div>
              <div className="balance-card">
                <label>Unpaid Leave</label>
                <h3>{leaveBalance.unpaidLeave}</h3>
              </div>
            </div>
          </div>
        )}
        <div className="leaves-list">
          {leaves.map((leave) => {
            const badge = getStatusBadge(leave.status);
            return (
              <div key={leave._id} className="leave-card">
                <div className="leave-header">
                  <div>
                    <h3>{getLeaveTypeLabel(leave.leaveType)}</h3>
                    <p className="leave-dates">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge ${badge.class}`}>{badge.label}</span>
                </div>
                <div className="leave-details">
                  <div className="leave-detail-item">
                    <label>Number of Days</label>
                    <p>{leave.numberOfDays} days</p>
                  </div>
                  {leave.reason && (
                    <div className="leave-detail-item full-width">
                      <label>Reason</label>
                      <p>{leave.reason}</p>
                    </div>
                  )}
                  {leave.rejectionReason && (
                    <div className="leave-detail-item full-width">
                      <label>Rejection Reason</label>
                      <p className="rejection-reason">{leave.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {leaves.length === 0 && (
            <div className="empty-state">No leave applications found</div>
          )}
        </div>
        {showApplyForm && (
          <div className="modal-overlay" onClick={() => setShowApplyForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Apply for Leave</h2>
                <button className="modal-close" onClick={() => setShowApplyForm(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Leave Type</label>
                  <select name="leaveType" value={formData.leaveType} onChange={handleInputChange} required>
                    <option value="paid_leave">Paid Leave</option>
                    <option value="sick_leave">Sick Leave</option>
                    <option value="unpaid_leave">Unpaid Leave</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Number of Days</label>
                  <input
                    type="number"
                    value={calculateDays()}
                    disabled
                  />
                </div>
                <div className="input-group">
                  <label>Reason</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
                <div className="input-group">
                  <label>Attachment (Medical Certificate, etc.)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowApplyForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TimeOff;

