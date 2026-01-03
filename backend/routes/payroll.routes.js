import express from 'express';
import { body, validationResult } from 'express-validator';
import Payroll from '../models/Payroll.model.js';
import Attendance from '../models/Attendance.model.js';
import Leave from '../models/Leave.model.js';
import User from '../models/User.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All payroll routes require authentication
router.use(authenticate);

// Generate payroll (Admin only)
router.post(
  '/generate',
  authorize('admin'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
    body('basic').isNumeric().withMessage('Basic salary must be a number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, month, basic, allowances = 0 } = req.body;

      // Check if payroll already exists and is locked
      const existingPayroll = await Payroll.findOne({ userId, month });
      if (existingPayroll && existingPayroll.isLocked) {
        return res.status(400).json({ message: 'Payroll for this month is already locked' });
      }

      // Calculate attendance days
      const [year, monthNum] = month.split('-');
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);

      const attendance = await Attendance.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
      });

      const presentDays = attendance.filter((a) => a.status === 'present').length;
      const halfDays = attendance.filter((a) => a.status === 'half-day').length;
      const attendanceDays = presentDays + halfDays * 0.5;

      // Calculate leave days
      const leaves = await Leave.find({
        userId,
        status: 'approved',
        $or: [
          { fromDate: { $gte: startDate, $lte: endDate } },
          { toDate: { $gte: startDate, $lte: endDate } },
        ],
      });

      let leaveDays = 0;
      leaves.forEach((leave) => {
        const leaveStart = leave.fromDate > startDate ? leave.fromDate : startDate;
        const leaveEnd = leave.toDate < endDate ? leave.toDate : endDate;
        const days = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
        leaveDays += days;
      });

      // Calculate deductions based on attendance
      const totalDays = new Date(year, monthNum, 0).getDate();
      const expectedDays = totalDays - leaveDays;
      const deductionPerDay = basic / expectedDays;
      const absentDays = expectedDays - attendanceDays;
      const deductions = absentDays > 0 ? absentDays * deductionPerDay : 0;

      const payroll = existingPayroll || new Payroll({ userId, month });
      payroll.basic = basic;
      payroll.allowances = allowances;
      payroll.deductions = deductions;
      payroll.attendanceDays = attendanceDays;
      payroll.leaveDays = leaveDays;
      payroll.isLocked = false;

      await payroll.save();

      res.json({
        message: 'Payroll generated successfully',
        payroll,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Payroll for this month already exists' });
      }
      console.error('Generate payroll error:', error);
      res.status(500).json({ message: 'Error generating payroll', error: error.message });
    }
  }
);

// Lock payroll (Admin only)
router.put('/lock/:id', authorize('admin'), async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    if (payroll.isLocked) {
      return res.status(400).json({ message: 'Payroll is already locked' });
    }

    payroll.isLocked = true;
    payroll.lockedAt = new Date();
    payroll.lockedBy = req.user._id;

    await payroll.save();

    res.json({
      message: 'Payroll locked successfully',
      payroll,
    });
  } catch (error) {
    console.error('Lock payroll error:', error);
    res.status(500).json({ message: 'Error locking payroll', error: error.message });
  }
});

// Get payroll (Employee: own, Admin: all)
router.get('/', async (req, res) => {
  try {
    const { userId, month } = req.query;
    const query = {};

    // Employee can only see their own payroll
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    if (month) {
      query.month = month;
    }

    const payroll = await Payroll.find(query)
      .populate('userId', 'name email department')
      .populate('lockedBy', 'name email')
      .sort({ month: -1 });

    res.json({ payroll });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ message: 'Error fetching payroll', error: error.message });
  }
});

// Get single payroll
router.get('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('userId', 'name email department')
      .populate('lockedBy', 'name email');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Employee can only see their own payroll
    if (req.user.role === 'employee' && payroll.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payroll });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payroll', error: error.message });
  }
});

export default router;

