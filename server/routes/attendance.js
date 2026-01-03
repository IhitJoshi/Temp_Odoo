const express = require('express');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { auth, isAdminOrHR } = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate work hours
const calculateWorkHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return diff / (1000 * 60 * 60); // Convert to hours
};

// Helper function to get attendance status
const getAttendanceStatus = async (employeeId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Check if employee is on leave
  const leave = await Leave.findOne({
    employeeId,
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
    status: 'approved'
  });

  if (leave) {
    return 'on_leave';
  }

  // Check attendance record
  const attendance = await Attendance.findOne({
    employeeId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (attendance && attendance.checkIn && attendance.checkOut) {
    return 'present';
  }

  return 'absent';
};

// @route   POST /api/attendance/checkin
// @desc    Employee check-in
// @access  Private
router.post('/checkin', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      return res.status(403).json({ message: 'Admin/HR cannot check in' });
    }

    const employeeId = req.user.employeeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date: today,
        checkIn: { time: new Date() },
        status: 'present'
      });
    } else {
      attendance.checkIn = { time: new Date() };
      attendance.status = 'present';
    }

    await attendance.save();

    res.json({
      message: 'Checked in successfully',
      attendance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/checkout
// @desc    Employee check-out
// @access  Private
router.post('/checkout', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      return res.status(403).json({ message: 'Admin/HR cannot check out' });
    }

    const employeeId = req.user.employeeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'Please check in first' });
    }

    if (attendance.checkOut && attendance.checkOut.time) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    attendance.checkOut = { time: checkOutTime };
    
    // Calculate work hours
    const workHours = calculateWorkHours(attendance.checkIn.time, checkOutTime);
    attendance.workHours = workHours;
    
    // Calculate extra hours (assuming 8 hours is standard)
    const standardHours = 8;
    attendance.extraHours = Math.max(0, workHours - standardHours);

    await attendance.save();

    res.json({
      message: 'Checked out successfully',
      attendance
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance for current employee
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      return res.status(403).json({ message: 'Use /api/attendance/admin endpoint' });
    }

    const employeeId = req.user.employeeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    const status = await getAttendanceStatus(employeeId, today);

    res.json({
      attendance: attendance || null,
      status
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/monthly
// @desc    Get monthly attendance summary for current employee
// @access  Private
router.get('/monthly', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      return res.status(403).json({ message: 'Use /api/attendance/admin endpoint' });
    }

    const employeeId = req.user.employeeId;
    const { month, year } = req.query;
    
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
    const endDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Get leave records for the month
    const leaves = await Leave.find({
      employeeId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: 'approved'
    });

    let presentDays = 0;
    let absentDays = 0;
    let onLeaveDays = 0;
    let totalWorkHours = 0;
    let totalExtraHours = 0;

    // Process each day of the month
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStatus = await getAttendanceStatus(employeeId, d);
      
      if (dayStatus === 'present') {
        presentDays++;
        const dayAttendance = attendances.find(a => 
          a.date.toDateString() === d.toDateString()
        );
        if (dayAttendance) {
          totalWorkHours += dayAttendance.workHours || 0;
          totalExtraHours += dayAttendance.extraHours || 0;
        }
      } else if (dayStatus === 'on_leave') {
        onLeaveDays++;
      } else {
        absentDays++;
      }
    }

    res.json({
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      presentDays,
      absentDays,
      onLeaveDays,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      totalExtraHours: Math.round(totalExtraHours * 100) / 100,
      attendances,
      leaves
    });
  } catch (error) {
    console.error('Get monthly attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/admin
// @desc    Get all employees attendance (Admin/HR only)
// @access  Private (Admin/HR)
router.get('/admin', [auth, isAdminOrHR], async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    
    let query = {};
    if (date) {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: selectedDate, $lte: endDate };
    }
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const attendances = await Attendance.find(query)
      .populate('employeeId', 'name email department profilePicture')
      .sort({ date: -1, 'employeeId.name': 1 });

    // Get all employees for status calculation
    const employees = await Employee.find();
    const attendanceList = [];

    for (const employee of employees) {
      if (employeeId && employee._id.toString() !== employeeId) continue;

      const targetDate = date ? new Date(date) : new Date();
      const status = await getAttendanceStatus(employee._id, targetDate);
      
      const attendanceRecord = attendances.find(a => 
        a.employeeId._id.toString() === employee._id.toString()
      );

      attendanceList.push({
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          profilePicture: employee.profilePicture
        },
        date: targetDate,
        status,
        checkIn: attendanceRecord?.checkIn?.time || null,
        checkOut: attendanceRecord?.checkOut?.time || null,
        workHours: attendanceRecord?.workHours || 0,
        extraHours: attendanceRecord?.extraHours || 0
      });
    }

    res.json(attendanceList);
  } catch (error) {
    console.error('Get admin attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

