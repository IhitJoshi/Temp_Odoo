import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './CreateEmployee.css';

const CreateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    companyCode: '',
    yearOfJoining: new Date().getFullYear(),
    department: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post('/auth/create-employee', formData);
      setResult(response.data);
      setFormData({
        name: '',
        email: '',
        company: '',
        companyCode: '',
        yearOfJoining: new Date().getFullYear(),
        department: '',
        phone: ''
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create employee account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-employee">
        <div className="create-employee-header">
          <h1>Create Employee Account</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
        <div className="create-employee-content">
          <form onSubmit={handleSubmit} className="create-employee-form">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Full Name"
                  />
                </div>
                <div className="input-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="email@example.com"
                  />
                </div>
                <div className="input-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                  />
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3>Employment Information</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    placeholder="Company Name"
                  />
                </div>
                <div className="input-group">
                  <label>Company Code *</label>
                  <input
                    type="text"
                    name="companyCode"
                    value={formData.companyCode}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., OIJDOD"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <small>Used to generate Login ID</small>
                </div>
                <div className="input-group">
                  <label>Year of Joining *</label>
                  <input
                    type="number"
                    name="yearOfJoining"
                    value={formData.yearOfJoining}
                    onChange={handleInputChange}
                    required
                    min="2000"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="input-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Department Name"
                  />
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Employee Account'}
              </button>
            </div>
          </form>
          {result && (
            <div className="result-card">
              <h3>Employee Account Created Successfully!</h3>
              <div className="result-details">
                <div className="result-item">
                  <label>Login ID</label>
                  <p className="login-id">{result.employee.loginId}</p>
                </div>
                <div className="result-item">
                  <label>Temporary Password</label>
                  <p className="temp-password">{result.employee.temporaryPassword}</p>
                </div>
                <div className="result-item">
                  <label>Employee Name</label>
                  <p>{result.employee.name}</p>
                </div>
                <div className="result-item">
                  <label>Email</label>
                  <p>{result.employee.email}</p>
                </div>
              </div>
              <div className="result-note">
                <strong>Note:</strong> Please share the Login ID and Temporary Password with the employee.
                They will be required to change their password on first login.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateEmployee;

