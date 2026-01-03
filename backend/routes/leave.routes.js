import express from 'express';
import { body, validationResult } from 'express-validator';
import Leave from '../models/Leave.model.js';
import Attendance from '../models/Attendance.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All leave routes require authentication
router.use(authenticate);

// Apply for leave (Employee only)
router.post(
  '/apply',
  authorize('employee'),
  [
    body('type').isIn(['sick', 'casual', 'annual', 'emergency']).withMessage('Invalid leave type'),
    body('fromDate').isISO8601().withMessage('Valid from date is required'),
    body('toDate').isISO8601().withMessage('Valid to date is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, fromDate, toDate, reason } = req.body;
      const userId = req.user._id;

      const from = new Date(fromDate);
      const to = new Date(toDate);

      if (to < from) {
        return res.status(400).json({ message: 'To date must be after from date' });
      }

      const leave = new Leave({
        userId,
        type,
        fromDate: from,
        toDate: to,
        reason,
      });

      await leave.save();
      await leave.populate('userId', 'name email department');

      res.status(201).json({
        message: 'Leave application submitted successfully',
        leave,
      });
    } catch (error) {
      console.error('Apply leave error:', error);
      res.status(500).json({ message: 'Error applying for leave', error: error.message });
    }
  }
);

// Get leaves (Employee: own, Admin: all)
router.get('/', async (req, res) => {
  try {
    const { userId, status, type, startDate, endDate } = req.query;
    const query = {};

    // Employee can only see their own leaves
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (startDate && endDate) {
      query.$or = [
        { fromDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { toDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      ];
    }

    const leaves = await Leave.find(query)
      .populate('userId', 'name email department')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ leaves });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: 'Error fetching leaves', error: error.message });
  }
});

// Approve/Reject leave (Admin only)
router.put(
  '/approve/:id',
  authorize('admin'),
  [
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, rejectionReason } = req.body;
      const leave = await Leave.findById(req.params.id);

      if (!leave) {
        return res.status(404).json({ message: 'Leave request not found' });
      }

      if (leave.status !== 'pending') {
        return res.status(400).json({ message: 'Leave request has already been processed' });
      }

      leave.status = status;
      leave.approvedBy = req.user._id;
      leave.approvedAt = new Date();

      if (status === 'rejected' && rejectionReason) {
        leave.rejectionReason = rejectionReason;
      }

      await leave.save();

      // If approved, mark attendance as absent for those dates
      if (status === 'approved') {
        const fromDate = new Date(leave.fromDate);
        const toDate = new Date(leave.toDate);
        const dates = [];

        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }

        for (const date of dates) {
          date.setHours(0, 0, 0, 0);
          try {
            await Attendance.findOneAndUpdate(
              { userId: leave.userId, date },
              {
                userId: leave.userId,
                date,
                status: 'absent',
              },
              { upsert: true, new: true }
            );
          } catch (error) {
            // Ignore duplicate key errors
            if (error.code !== 11000) {
              console.error('Error marking attendance for leave:', error);
            }
          }
        }
      }

      await leave.populate('userId', 'name email department');
      await leave.populate('approvedBy', 'name email');

      res.json({
        message: `Leave ${status} successfully`,
        leave,
      });
    } catch (error) {
      console.error('Approve leave error:', error);
      res.status(500).json({ message: 'Error processing leave request', error: error.message });
    }
  }
);

// Get leave stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.role === 'employee' ? req.user._id : req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const leaves = await Leave.find({ userId });

    const stats = {
      pending: leaves.filter((l) => l.status === 'pending').length,
      approved: leaves.filter((l) => l.status === 'approved').length,
      rejected: leaves.filter((l) => l.status === 'rejected').length,
      total: leaves.length,
    };

    res.json({ stats });
  } catch (error) {
    console.error('Leave stats error:', error);
    res.status(500).json({ message: 'Error fetching leave stats', error: error.message });
  }
});

export default router;

