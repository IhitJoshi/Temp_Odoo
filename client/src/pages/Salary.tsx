import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FiDollarSign, FiEdit2 } from 'react-icons/fi';
import './Salary.css';

interface Salary {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  baseWage: number;
  components: {
    basic: { amount: number; isPercentage: boolean; percentage: number };
    hra: { amount: number; isPercentage: boolean; percentage: number };
    standardAllowance: { amount: number; isPercentage: boolean };
    performanceBonus: { amount: number; isPercentage: boolean };
    leaveTravelAllowance: { amount: number; isPercentage: boolean };
    fixedAllowance: { amount: number; isPercentage: boolean };
  };
  deductions: {
    providentFund: { amount: number; isPercentage: boolean; percentage: number };
    professionalTax: { amount: number; isPercentage: boolean };
  };
  monthlySalary: number;
  yearlySalary: number;
}

const Salary: React.FC = () => {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'hr') {
      fetchSalaries();
      fetchEmployees();
    } else {
      fetchOwnSalary();
    }
  }, [user]);

  const fetchSalaries = async () => {
    try {
      const response = await axios.get('/salary');
      setSalaries(response.data);
    } catch (error) {
      console.error('Error fetching salaries:', error);
    }
  };

  const fetchOwnSalary = async () => {
    try {
      const response = await axios.get('/salary');
      if (response.data && response.data.length > 0) {
        setSalaries([response.data]);
      }
    } catch (error) {
      console.error('Error fetching salary:', error);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value === '' ? 0 : parseFloat(value)
    });
  };

  const handleComponentChange = (component: string, field: string, value: any) => {
    setFormData({
      ...formData,
      components: {
        ...formData.components,
        [component]: {
          ...formData.components?.[component],
          [field]: value
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/salary', {
        employeeId: selectedEmployee,
        baseWage: formData.baseWage,
        components: formData.components,
        deductions: formData.deductions
      });

      setShowForm(false);
      setSelectedEmployee('');
      setFormData({});
      fetchSalaries();
      alert('Salary information saved successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save salary information');
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (salary: Salary) => {
    setSelectedEmployee(salary.employeeId._id);
    setFormData({
      baseWage: salary.baseWage,
      components: salary.components,
      deductions: salary.deductions
    });
    setShowForm(true);
  };

  if (user?.role !== 'admin' && user?.role !== 'hr') {
    return (
      <>
        <Navbar />
        <div className="salary">
          <div className="salary-header">
            <h1>My Salary</h1>
          </div>
          {salaries.length > 0 ? (
            <SalaryDetails salary={salaries[0]} />
          ) : (
            <div className="empty-state">No salary information available</div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="salary">
        <div className="salary-header">
          <h1>Salary Management</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <FiDollarSign /> Add Salary
          </button>
        </div>
        <div className="salaries-list">
          {salaries.map((salary) => (
            <div key={salary._id} className="salary-card">
              <div className="salary-card-header">
                <div>
                  <h3>{salary.employeeId.name}</h3>
                  <p>{salary.employeeId.department} • {salary.employeeId.email}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => openEditForm(salary)}>
                  <FiEdit2 /> Edit
                </button>
              </div>
              <SalaryDetails salary={salary} />
            </div>
          ))}
          {salaries.length === 0 && (
            <div className="empty-state">No salary records found</div>
          )}
        </div>
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedEmployee ? 'Edit' : 'Add'} Salary</h2>
                <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                {!selectedEmployee && (
                  <div className="input-group">
                    <label>Employee</label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} - {emp.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="input-group">
                  <label>Base Wage</label>
                  <input
                    type="number"
                    name="baseWage"
                    value={formData.baseWage || ''}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-section">
                  <h3>Components</h3>
                  <div className="form-grid">
                    <ComponentInput
                      label="Basic"
                      value={formData.components?.basic}
                      onChange={(field, value) => handleComponentChange('basic', field, value)}
                    />
                    <ComponentInput
                      label="HRA"
                      value={formData.components?.hra}
                      onChange={(field, value) => handleComponentChange('hra', field, value)}
                    />
                    <ComponentInput
                      label="Standard Allowance"
                      value={formData.components?.standardAllowance}
                      onChange={(field, value) => handleComponentChange('standardAllowance', field, value)}
                    />
                    <ComponentInput
                      label="Performance Bonus"
                      value={formData.components?.performanceBonus}
                      onChange={(field, value) => handleComponentChange('performanceBonus', field, value)}
                    />
                    <ComponentInput
                      label="Leave Travel Allowance"
                      value={formData.components?.leaveTravelAllowance}
                      onChange={(field, value) => handleComponentChange('leaveTravelAllowance', field, value)}
                    />
                    <ComponentInput
                      label="Fixed Allowance"
                      value={formData.components?.fixedAllowance}
                      onChange={(field, value) => handleComponentChange('fixedAllowance', field, value)}
                    />
                  </div>
                </div>
                <div className="form-section">
                  <h3>Deductions</h3>
                  <div className="form-grid">
                    <ComponentInput
                      label="Provident Fund (PF)"
                      value={formData.deductions?.providentFund}
                      onChange={(field, value) => handleComponentChange('providentFund', field, value)}
                    />
                    <ComponentInput
                      label="Professional Tax"
                      value={formData.deductions?.professionalTax}
                      onChange={(field, value) => handleComponentChange('professionalTax', field, value)}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
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

const SalaryDetails: React.FC<{ salary: Salary }> = ({ salary }) => {
  return (
    <div className="salary-details">
      <div className="salary-summary">
        <div className="summary-item">
          <label>Monthly Salary</label>
          <h2>₹{salary.monthlySalary?.toLocaleString('en-IN') || '0'}</h2>
        </div>
        <div className="summary-item">
          <label>Yearly Salary</label>
          <h2>₹{salary.yearlySalary?.toLocaleString('en-IN') || '0'}</h2>
        </div>
        <div className="summary-item">
          <label>Base Wage</label>
          <h2>₹{salary.baseWage?.toLocaleString('en-IN') || '0'}</h2>
        </div>
      </div>
      <div className="salary-breakdown">
        <div className="breakdown-section">
          <h3>Components</h3>
          <div className="breakdown-list">
            <BreakdownItem label="Basic" value={salary.components.basic.amount} />
            <BreakdownItem label="HRA" value={salary.components.hra.amount} />
            <BreakdownItem label="Standard Allowance" value={salary.components.standardAllowance.amount} />
            <BreakdownItem label="Performance Bonus" value={salary.components.performanceBonus.amount} />
            <BreakdownItem label="Leave Travel Allowance" value={salary.components.leaveTravelAllowance.amount} />
            <BreakdownItem label="Fixed Allowance" value={salary.components.fixedAllowance.amount} />
          </div>
        </div>
        <div className="breakdown-section">
          <h3>Deductions</h3>
          <div className="breakdown-list">
            <BreakdownItem label="Provident Fund (PF)" value={salary.deductions.providentFund.amount} />
            <BreakdownItem label="Professional Tax" value={salary.deductions.professionalTax.amount} />
          </div>
        </div>
      </div>
    </div>
  );
};

const BreakdownItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="breakdown-item">
    <span>{label}</span>
    <span>₹{value.toLocaleString('en-IN')}</span>
  </div>
);

const ComponentInput: React.FC<{
  label: string;
  value: any;
  onChange: (field: string, value: any) => void;
}> = ({ label, value, onChange }) => {
  return (
    <div className="component-input">
      <label>{label}</label>
      <div className="component-input-group">
        <select
          value={value?.isPercentage ? 'percentage' : 'fixed'}
          onChange={(e) => onChange('isPercentage', e.target.value === 'percentage')}
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        {value?.isPercentage ? (
          <input
            type="number"
            value={value?.percentage || 0}
            onChange={(e) => onChange('percentage', parseFloat(e.target.value) || 0)}
            min="0"
            max="100"
            step="0.01"
          />
        ) : (
          <input
            type="number"
            value={value?.amount || 0}
            onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
          />
        )}
      </div>
    </div>
  );
};

export default Salary;

