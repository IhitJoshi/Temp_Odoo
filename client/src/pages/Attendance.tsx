import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import './Attendance.css';

interface AttendanceRecord {
  employee?: {
    id: string;
    name: string;
    email: string;
    department: string;
    profilePicture: string;
  };
  date: string;
  status: 'present' | 'absent' | 'on_leave';
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  extraHours: number;
}

interface MonthlySummary {
  month: number;
  year: number;
  presentDays: number;
  absentDays: number;
  onLeaveDays: number;
  totalWorkHours: number;
  totalExtraHours: number;
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [adminAttendance, setAdminAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'hr') {
      fetchAdminAttendance();
      fetchEmployees();
    } else {
      fetchTodayAttendance();
      fetchMonthlySummary();
    }
  }, [user, selectedDate, selectedEmployee]);

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get('/attendance/today');
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const now = new Date();
      const response = await axios.get(`/attendance/monthly?month=${now.getMonth()}&year=${now.getFullYear()}`);
      setMonthlySummary(response.data);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    }
  };

  const fetchAdminAttendance = async () => {
    setLoading(true);
    try {
      const params: any = { date: selectedDate };
      if (selectedEmployee) {
        params.employeeId = selectedEmployee;
      }
      const response = await axios.get('/attendance/admin', { params });
      setAdminAttendance(response.data);
    } catch (error) {
      console.error('Error fetching admin attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      await axios.post('/attendance/checkin');
      fetchTodayAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post('/attendance/checkout');
      fetchTodayAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check out');
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      present: { label: 'Present', class: 'badge-success' },
      absent: { label: 'Absent', class: 'badge-warning' },
      on_leave: { label: 'On Leave', class: 'badge-info' }
    };
    return badges[status] || badges.absent;
  };

  if (user?.role === 'admin' || user?.role === 'hr') {
    return (
      <>
        <Navbar />
        <div className="attendance">
          <div className="attendance-header">
            <h1>Attendance Management</h1>
          </div>
          <div className="attendance-filters">
            <div className="filter-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Hours</th>
                    <th>Extra Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAttendance.map((record, index) => {
                    const badge = getStatusBadge(record.status);
                    return (
                      <tr key={index}>
                        <td>
                          <div className="employee-cell">
                            {record.employee?.profilePicture ? (
                              <img
                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${record.employee.profilePicture}`}
                                alt={record.employee.name}
                                className="employee-avatar-small"
                              />
                            ) : (
                              <div className="employee-avatar-small placeholder">
                                {record.employee?.name?.[0] || 'E'}
                              </div>
                            )}
                            <div>
                              <div className="employee-name">{record.employee?.name || 'N/A'}</div>
                              <div className="employee-dept">{record.employee?.department || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${badge.class}`}>{badge.label}</span>
                        </td>
                        <td>{formatTime(record.checkIn)}</td>
                        <td>{formatTime(record.checkOut)}</td>
                        <td>{record.workHours.toFixed(2)} hrs</td>
                        <td>{record.extraHours.toFixed(2)} hrs</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {adminAttendance.length === 0 && (
                <div className="empty-state">No attendance records found</div>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="attendance">
        <div className="attendance-header">
          <h1>My Attendance</h1>
        </div>
        <div className="attendance-card">
          <div className="check-in-out">
            <h2>Today's Attendance</h2>
            <div className="attendance-status">
              {todayAttendance?.attendance?.checkIn ? (
                <div className="status-item">
                  <FiCheckCircle className="icon success" />
                  <div>
                    <div className="status-label">Checked In</div>
                    <div className="status-time">
                      {formatTime(todayAttendance.attendance.checkIn.time)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="status-item">
                  <FiXCircle className="icon error" />
                  <div>
                    <div className="status-label">Not Checked In</div>
                  </div>
                </div>
              )}
              {todayAttendance?.attendance?.checkOut ? (
                <div className="status-item">
                  <FiCheckCircle className="icon success" />
                  <div>
                    <div className="status-label">Checked Out</div>
                    <div className="status-time">
                      {formatTime(todayAttendance.attendance.checkOut.time)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="status-item">
                  <FiXCircle className="icon error" />
                  <div>
                    <div className="status-label">Not Checked Out</div>
                  </div>
                </div>
              )}
            </div>
            <div className="attendance-actions">
              {!todayAttendance?.attendance?.checkIn ? (
                <button className="btn btn-success" onClick={handleCheckIn}>
                  <FiClock /> Check In
                </button>
              ) : !todayAttendance?.attendance?.checkOut ? (
                <button className="btn btn-primary" onClick={handleCheckOut}>
                  <FiClock /> Check Out
                </button>
              ) : (
                <div className="completed-message">
                  <FiCheckCircle className="icon success" />
                  <span>Attendance completed for today</span>
                </div>
              )}
            </div>
            {todayAttendance?.attendance && (
              <div className="work-hours">
                <div className="work-hours-item">
                  <label>Work Hours</label>
                  <span>{todayAttendance.attendance.workHours?.toFixed(2) || '0.00'} hrs</span>
                </div>
                <div className="work-hours-item">
                  <label>Extra Hours</label>
                  <span>{todayAttendance.attendance.extraHours?.toFixed(2) || '0.00'} hrs</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {monthlySummary && (
          <div className="monthly-summary">
            <h2>Monthly Summary ({monthlySummary.month}/{monthlySummary.year})</h2>
            <div className="summary-grid">
              <div className="summary-card">
                <label>Present Days</label>
                <h3>{monthlySummary.presentDays}</h3>
              </div>
              <div className="summary-card">
                <label>Absent Days</label>
                <h3>{monthlySummary.absentDays}</h3>
              </div>
              <div className="summary-card">
                <label>On Leave</label>
                <h3>{monthlySummary.onLeaveDays}</h3>
              </div>
              <div className="summary-card">
                <label>Total Work Hours</label>
                <h3>{monthlySummary.totalWorkHours.toFixed(2)} hrs</h3>
              </div>
              <div className="summary-card">
                <label>Total Extra Hours</label>
                <h3>{monthlySummary.totalExtraHours.toFixed(2)} hrs</h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Attendance;

