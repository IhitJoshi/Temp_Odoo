import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiFileText, FiDollarSign } from 'react-icons/fi';
import './MyProfile.css';

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
  resume: string;
  bankDetails: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    pan: string;
    uan: string;
  };
}

const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('private');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (user?.employeeId) {
      fetchEmployee();
    }
  }, [user]);

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(`/employees/${user?.employeeId}`);
      setEmployee(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        department: response.data.department || '',
        manager: response.data.manager || '',
        dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
        address: response.data.address || '',
        nationality: response.data.nationality || '',
        gender: response.data.gender || '',
        accountNumber: response.data.bankDetails?.accountNumber || '',
        bankName: response.data.bankDetails?.bankName || '',
        ifscCode: response.data.bankDetails?.ifscCode || '',
        pan: response.data.bankDetails?.pan || '',
        uan: response.data.bankDetails?.uan || ''
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formDataToSend = new FormData();
      formDataToSend.append(field, file);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('department', formData.department);
      formDataToSend.append('manager', formData.manager);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('nationality', formData.nationality);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('accountNumber', formData.accountNumber);
      formDataToSend.append('bankName', formData.bankName);
      formDataToSend.append('ifscCode', formData.ifscCode);
      formDataToSend.append('pan', formData.pan);
      formDataToSend.append('uan', formData.uan);

      setSaving(true);
      try {
        const response = await axios.put(`/employees/${user?.employeeId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setEmployee(response.data);
        alert('Profile updated successfully');
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.put(`/employees/${user?.employeeId}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEmployee(response.data);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
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
      <div className="my-profile">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            <FiFileText /> Resume
          </button>
          <button
            className={`tab ${activeTab === 'private' ? 'active' : ''}`}
            onClick={() => setActiveTab('private')}
          >
            <FiUser /> Private Info
          </button>
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <button
              className={`tab ${activeTab === 'salary' ? 'active' : ''}`}
              onClick={() => setActiveTab('salary')}
            >
              <FiDollarSign /> Salary Info
            </button>
          )}
          <button
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiLock /> Security
          </button>
        </div>
        <div className="profile-content">
          {activeTab === 'resume' && (
            <div className="tab-content">
              <div className="input-group">
                <label>Resume</label>
                {employee.resume ? (
                  <div>
                    <a
                      href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${employee.resume}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      View Resume
                    </a>
                  </div>
                ) : (
                  <p>No resume uploaded</p>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'resume')}
                  style={{ marginTop: '10px' }}
                />
              </div>
            </div>
          )}
          {activeTab === 'private' && (
            <div className="tab-content">
              <div className="form-section">
                <h3>Profile Picture</h3>
                <div className="profile-picture-upload">
                  {employee.profilePicture ? (
                    <img
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${employee.profilePicture}`}
                      alt="Profile"
                      className="profile-preview"
                    />
                  ) : (
                    <div className="profile-preview-placeholder">
                      <FiUser />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'profilePicture')}
                    id="profile-picture-input"
                  />
                  <label htmlFor="profile-picture-input" className="btn btn-secondary">
                    Change Picture
                  </label>
                </div>
              </div>
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Email</label>
                    <input type="email" value={employee.email} disabled />
                  </div>
                  <div className="input-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Nationality</label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
              <div className="form-section">
                <h3>Employment Information</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Company</label>
                    <input type="text" value={employee.company} disabled />
                  </div>
                  <div className="input-group">
                    <label>Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Manager</label>
                    <input
                      type="text"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h3>Bank Details</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>PAN</label>
                    <input
                      type="text"
                      name="pan"
                      value={formData.pan}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>UAN</label>
                    <input
                      type="text"
                      name="uan"
                      value={formData.uan}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
          {activeTab === 'salary' && (user?.role === 'admin' || user?.role === 'hr') && (
            <div className="tab-content">
              <SalaryInfo employeeId={user.employeeId || ''} />
            </div>
          )}
          {activeTab === 'security' && (
            <div className="tab-content">
              <ChangePasswordForm />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const SalaryInfo: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const [salary, setSalary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalary();
  }, [employeeId]);

  const fetchSalary = async () => {
    try {
      const response = await axios.get(`/salary/${employeeId}`);
      setSalary(response.data);
    } catch (error) {
      console.error('Error fetching salary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading salary information...</div>;
  if (!salary) return <div>No salary information available</div>;

  return (
    <div className="salary-info">
      <div className="salary-summary">
        <div className="salary-card">
          <label>Monthly Salary</label>
          <h2>₹{salary.monthlySalary?.toLocaleString('en-IN') || '0'}</h2>
        </div>
        <div className="salary-card">
          <label>Yearly Salary</label>
          <h2>₹{salary.yearlySalary?.toLocaleString('en-IN') || '0'}</h2>
        </div>
        <div className="salary-card">
          <label>Base Wage</label>
          <h2>₹{salary.baseWage?.toLocaleString('en-IN') || '0'}</h2>
        </div>
      </div>
      <div className="salary-details">
        <h3>Components</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Basic</label>
            <p>₹{salary.components?.basic?.amount?.toLocaleString('en-IN') || '0'}</p>
          </div>
          <div className="detail-item">
            <label>HRA</label>
            <p>₹{salary.components?.hra?.amount?.toLocaleString('en-IN') || '0'}</p>
          </div>
          <div className="detail-item">
            <label>Standard Allowance</label>
            <p>₹{salary.components?.standardAllowance?.amount?.toLocaleString('en-IN') || '0'}</p>
          </div>
          <div className="detail-item">
            <label>Performance Bonus</label>
            <p>₹{salary.components?.performanceBonus?.amount?.toLocaleString('en-IN') || '0'}</p>
          </div>
          <div className="detail-item">
            <label>Leave Travel Allowance</label>
            <p>₹{salary.components?.leaveTravelAllowance?.amount?.toLocaleString('en-IN') || '0'}</p>
          </div>
          <div className="detail-item">
            <label>Fixed Allowance</label>
            <p>₹{salary.components?.fixedAllowance?.amount?.toLocaleString('en-IN') || '0'}</p>
          </div>
        </div>
        <h3>Deductions</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Provident Fund (PF)</label>
            <p>₹{salary.deductions?.providentFund?.amount?.toLocaleString('en-IN') || '0'}</p>
          </div>
          <div className="detail-item">
            <label>Professional Tax</label>
            <p>₹{salary.deductions?.professionalTax?.amount?.toLocaleString('en-IN') || '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="change-password-form">
      <div className="input-group">
        <label>Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="input-group">
        <label>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="input-group">
        <label>Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
};

export default MyProfile;

