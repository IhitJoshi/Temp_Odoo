const Employee = require('../models/Employee');

const generateLoginId = async (companyCode, employeeInitials, yearOfJoining) => {
  // Find the highest serial number for the given company code and year
  const existingEmployees = await Employee.find({
    companyCode,
    yearOfJoining
  }).sort({ serialNumber: -1 }).limit(1);

  let serialNumber = 1;
  if (existingEmployees.length > 0) {
    serialNumber = existingEmployees[0].serialNumber + 1;
  }

  // Format serial number with leading zeros (4 digits)
  const serialStr = serialNumber.toString().padStart(4, '0');
  
  // Generate login ID: <CompanyCode><EmployeeInitials><YearOfJoining><SerialNumber>
  const loginId = `${companyCode}${employeeInitials}${yearOfJoining}${serialStr}`;

  return { loginId, serialNumber };
};

const generateTemporaryPassword = () => {
  // Generate a random 8-character password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

module.exports = { generateLoginId, generateTemporaryPassword };

