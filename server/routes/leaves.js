const express = require('express');
const multer = require('multer');
const path = require('path');
const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const { auth, isAdminOrHR } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leave-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// @route   POST /api/leaves
// @desc    Apply for leave
// @access  Private
router.post('/', [
  auth,
  upload.single('attachment'),
  body('leaveType').isIn(['paid_leave', 'sick_leave', 'unpaid_leave']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('numberOfDays').isInt({ min: 1 }).withMessage('Number of days must be at least 1')
], async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      return res.status(403).json({ message: 'Admin/HR cannot apply for leave through this endpoint' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;
    const employeeId = req.user.employeeId;

    // Check leave balance
    let leaveBalance = await LeaveBalance.findOne({ employeeId });
    if (!leaveBalance) {
      leaveBalance = new LeaveBalance({ employeeId });
      await leaveBalance.save();
    }

    if (leaveType === 'paid_leave' && leaveBalance.paidLeave < numberOfDays) {
      return res.status(400).json({ message: 'Insufficient paid leave balance' });
    }
    if (leaveType === 'sick_leave' && leaveBalance.sickLeave < numberOfDays) {
      return res.status(400).json({ message: 'Insufficient sick leave balance' });
    }

    const leave = new Leave({
      employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      numberOfDays: parseInt(numberOfDays),
      reason: reason || '',
      attachment: req.file ? req.file.path : ''
    });

    await leave.save();

    res.status(201).json({
      message: 'Leave application submitted successfully',
      leave
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/leaves
// @desc    Get leaves (own leaves for employees, all for Admin/HR)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      query.employeeId = req.user.employeeId;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email department')
      .populate('approvedBy', 'loginId')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/balance
// @desc    Get leave balance for current employee
// @access  Private
router.get('/balance', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      return res.status(403).json({ message: 'Use /api/leaves/balance/:employeeId for Admin/HR' });
    }

    let leaveBalance = await LeaveBalance.findOne({ employeeId: req.user.employeeId });
    if (!leaveBalance) {
      leaveBalance = new LeaveBalance({ employeeId: req.user.employeeId });
      await leaveBalance.save();
    }

    res.json(leaveBalance);
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave request (Admin/HR only)
// @access  Private (Admin/HR)
router.put('/:id/approve', [auth, isAdminOrHR], async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request already processed' });
    }

    // Update leave balance
    let leaveBalance = await LeaveBalance.findOne({ employeeId: leave.employeeId });
    if (!leaveBalance) {
      leaveBalance = new LeaveBalance({ employeeId: leave.employeeId });
    }

    if (leave.leaveType === 'paid_leave') {
      leaveBalance.paidLeave -= leave.numberOfDays;
    } else if (leave.leaveType === 'sick_leave') {
      leaveBalance.sickLeave -= leave.numberOfDays;
    }
    // unpaid_leave doesn't affect balance

    leaveBalance.lastUpdated = Date.now();
    await leaveBalance.save();

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    await leave.save();

    res.json({
      message: 'Leave request approved',
      leave
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave request (Admin/HR only)
// @access  Private (Admin/HR)
router.put('/:id/reject', [
  auth,
  isAdminOrHR,
  body('rejectionReason').optional().trim()
], async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request already processed' });
    }

    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.rejectionReason = req.body.rejectionReason || '';
    await leave.save();

    res.json({
      message: 'Leave request rejected',
      leave
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

