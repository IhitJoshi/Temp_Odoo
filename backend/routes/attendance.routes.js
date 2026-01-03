import express from 'express';
import Attendance from '../models/Attendance.model.js';
import User from '../models/User.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All attendance routes require authentication
router.use(authenticate);

// Mark attendance (Employee only)
router.post('/mark', authorize('employee'), async (req, res) => {
  try {
    const { date, status } = req.body;
    const userId = req.user._id;

    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status are required' });
    }

    if (!['present', 'absent', 'half-day'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be present, absent, or half-day' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already marked for this date
    const existingAttendance = await Attendance.findOne({
      userId,
      date: attendanceDate,
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    const attendance = new Attendance({
      userId,
      date: attendanceDate,
      status,
      checkIn: status !== 'absent' ? new Date() : null,
    });

    await attendance.save();

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
});

// Get attendance (Employee: own, Admin: all)
router.get('/', async (req, res) => {
  try {
    const { userId, startDate, endDate, month } = req.query;
    const query = {};

    // Employee can only see their own attendance
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    // Date filtering
    if (month) {
      const [year, monthNum] = month.split('-');
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email department')
      .sort({ date: -1 });

    res.json({ attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
});

// Get attendance stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.role === 'employee' ? req.user._id : req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const { month } = req.query;
    const query = { userId };

    if (month) {
      const [year, monthNum] = month.split('-');
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    } else {
      // Current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query);

    const stats = {
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      halfDay: attendance.filter((a) => a.status === 'half-day').length,
      total: attendance.length,
    };

    res.json({ stats });
  } catch (error) {
    console.error('Attendance stats error:', error);
    res.status(500).json({ message: 'Error fetching attendance stats', error: error.message });
  }
});

export default router;

