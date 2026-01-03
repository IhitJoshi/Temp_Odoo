import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { FiUser, FiArrowLeft } from 'react-icons/fi';
import './EmployeeProfile.css';

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  department: string;
  manager: string;
  dateOfBirth: string;
  address: string;
  nationality: string;
  gender: string;
  profilePicture: string;
  bankDetails: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    pan: string;
    uan: string;
  };
}

const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(`/employees/${id}`);
      setEmployee(response.data);
    } catch (error) {
      console.error('Error fetching employee:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-loading">Loading...</div>
      </>
    );
  }

  if (!employee) {
    return (
      <>
        <Navbar />
        <div className="profile-error">Employee not found</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="employee-profile">
        <div className="profile-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <FiArrowLeft /> Back
          </button>
          <h1>Employee Profile</h1>
        </div>
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-picture-large">
              {employee.profilePicture ? (
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${employee.profilePicture}`}
                  alt={employee.name}
                />
              ) : (
                <div className="avatar-placeholder-large">
                  <FiUser />
                </div>
              )}
            </div>
            <h2>{employee.name}</h2>
            <p className="employee-role">{employee.department || 'No Department'}</p>
          </div>
          <div className="profile-details">
            <div className="detail-section">
              <h3>Personal Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Email</label>
                  <p>{employee.email}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{employee.phone || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Date of Birth</label>
                  <p>{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Gender</label>
                  <p>{employee.gender ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1) : 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Nationality</label>
                  <p>{employee.nationality || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Address</label>
                  <p>{employee.address || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="detail-section">
              <h3>Employment Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Company</label>
                  <p>{employee.company}</p>
                </div>
                <div className="detail-item">
                  <label>Department</label>
                  <p>{employee.department || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Manager</label>
                  <p>{employee.manager || 'N/A'}</p>
                </div>
              </div>
            </div>
            {employee.bankDetails && (
              <div className="detail-section">
                <h3>Bank Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Account Number</label>
                    <p>{employee.bankDetails.accountNumber || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Bank Name</label>
                    <p>{employee.bankDetails.bankName || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>IFSC Code</label>
                    <p>{employee.bankDetails.ifscCode || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>PAN</label>
                    <p>{employee.bankDetails.pan || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>UAN</label>
                    <p>{employee.bankDetails.uan || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeProfile;

