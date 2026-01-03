const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');
const { generateLoginId, generateTemporaryPassword } = require('../utils/generateLoginId');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('loginId').notEmpty().withMessage('Login ID is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { loginId, password } = req.body;

    const user = await User.findOne({ loginId }).populate('employeeId');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        employee: user.employeeId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password (required on first login)
// @access  Private
router.post('/change-password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // If first login, skip current password check
    if (!user.isFirstLogin) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('employeeId');
    res.json({
      user: {
        id: user._id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        employee: user.employeeId
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/create-employee
// @desc    Create employee account (Admin/HR only)
// @access  Private (Admin/HR)
router.post('/create-employee', [
  auth,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('company').notEmpty().withMessage('Company is required'),
  body('companyCode').notEmpty().withMessage('Company code is required'),
  body('yearOfJoining').isInt().withMessage('Year of joining is required')
], async (req, res) => {
  try {
    // Check if user is Admin or HR
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied. Only Admin/HR can create employee accounts.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, company, companyCode, yearOfJoining, department, phone } = req.body;

    // Generate employee initials from name
    const nameParts = name.trim().split(' ');
    const initials = nameParts.map(part => part[0]?.toUpperCase() || '').join('').substring(0, 4);

    // Generate login ID
    const { loginId, serialNumber } = await generateLoginId(companyCode, initials, yearOfJoining);
    
    // Generate temporary password
    const tempPassword = generateTemporaryPassword();

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Create employee
    const employee = new Employee({
      loginId,
      name,
      email,
      company,
      companyCode,
      yearOfJoining,
      serialNumber,
      employeeInitials: initials,
      department: department || '',
      phone: phone || ''
    });

    await employee.save();

    // Create user account
    const user = new User({
      loginId,
      email,
      password: tempPassword,
      role: 'employee',
      employeeId: employee._id,
      isFirstLogin: true
    });

    await user.save();

    res.status(201).json({
      message: 'Employee account created successfully',
      employee: {
        loginId,
        name: employee.name,
        email: employee.email,
        temporaryPassword: tempPassword
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

