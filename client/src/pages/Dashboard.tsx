import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { FiUser, FiCheckCircle, FiXCircle, FiPlane } from 'react-icons/fi';
import './Dashboard.css';

interface Employee {
  _id: string;
  name: string;
  email: string;
  department: string;
  profilePicture: string;
}

interface AttendanceStatus {
  [key: string]: 'present' | 'absent' | 'on_leave';
}

const Dashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees');
      setEmployees(response.data);
      
      // Fetch attendance status for each employee
      const statuses: AttendanceStatus = {};
      const today = new Date().toISOString().split('T')[0];
      
      for (const employee of response.data) {
        try {
          const attendanceResponse = await axios.get(`/attendance/admin?date=${today}&employeeId=${employee._id}`);
          if (attendanceResponse.data.length > 0) {
            statuses[employee._id] = attendanceResponse.data[0].status;
          } else {
            statuses[employee._id] = 'absent';
          }
        } catch (error) {
          statuses[employee._id] = 'absent';
        }
      }
      
      setAttendanceStatus(statuses);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <FiCheckCircle className="status-icon present" />;
      case 'on_leave':
        return <FiPlane className="status-icon on-leave" />;
      default:
        return <FiXCircle className="status-icon absent" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#10b981';
      case 'on_leave':
        return '#3b82f6';
      default:
        return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-loading">
          <div>Loading employees...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Employees</h1>
        </div>
        <div className="employee-grid">
          {employees.map((employee) => (
            <div
              key={employee._id}
              className="employee-card"
              onClick={() => navigate(`/employee/${employee._id}`)}
            >
              <div className="employee-avatar">
                {employee.profilePicture ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${employee.profilePicture}`}
                    alt={employee.name}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <FiUser />
                  </div>
                )}
                <div
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(attendanceStatus[employee._id] || 'absent') }}
                >
                  {getStatusIcon(attendanceStatus[employee._id] || 'absent')}
                </div>
              </div>
              <div className="employee-info">
                <h3>{employee.name}</h3>
                <p>{employee.department || 'No Department'}</p>
                <p className="employee-email">{employee.email}</p>
              </div>
            </div>
          ))}
        </div>
        {employees.length === 0 && (
          <div className="empty-state">
            <p>No employees found</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;

