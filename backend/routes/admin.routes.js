import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.model.js';
import Attendance from '../models/Attendance.model.js';
import Leave from '../models/Leave.model.js';
import Payroll from '../models/Payroll.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Create employee
router.post(
  '/create-user',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('role').isIn(['admin', 'employee']).withMessage('Role must be admin or employee'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, department, role, phone, address } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const user = new User({
        name,
        email,
        password,
        department,
        role: role || 'employee',
        phone,
        address,
      });

      await user.save();

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  }
);

// Get all employees
router.get('/employees', async (req, res) => {
  try {
    const { search, department, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) {
      query.department = department;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const employees = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

// Get single employee
router.get('/employees/:id', async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee', error: error.message });
  }
});

// Update employee
router.put('/employees/:id', async (req, res) => {
  try {
    const { name, email, department, role, phone, address, isActive } = req.body;

    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (email && email !== employee.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      employee.email = email;
    }

    if (name) employee.name = name;
    if (department) employee.department = department;
    if (role) employee.role = role;
    if (phone !== undefined) employee.phone = phone;
    if (address !== undefined) employee.address = address;
    if (isActive !== undefined) employee.isActive = isActive;

    await employee.save();

    res.json({
      message: 'Employee updated successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

// Delete employee (soft delete by deactivating)
router.delete('/employees/:id', async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.isActive = false;
    await employee.save();

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating employee', error: error.message });
  }
});

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const activeEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({ date: { $gte: today } });

    const recentLeaves = await Leave.find({ status: 'pending' })
      .populate('userId', 'name email department')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalEmployees,
        activeEmployees,
        pendingLeaves,
        todayAttendance,
      },
      recentLeaves,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

export default router;

