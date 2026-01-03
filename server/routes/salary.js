const express = require('express');
const Salary = require('../models/Salary');
const Attendance = require('../models/Attendance');
const { auth, isAdminOrHR } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/salary
// @desc    Get salary info (own for employees, all for Admin/HR)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      const { employeeId } = req.query;
      let query = {};
      if (employeeId) {
        query.employeeId = employeeId;
      }

      const salaries = await Salary.find(query)
        .populate('employeeId', 'name email department');
      res.json(salaries);
    } else {
      const salary = await Salary.findOne({ employeeId: req.user.employeeId });
      if (!salary) {
        return res.status(404).json({ message: 'Salary information not found' });
      }
      res.json(salary);
    }
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/salary/:employeeId
// @desc    Get salary for specific employee
// @access  Private (Admin/HR for any, Employee for own)
router.get('/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Employees can only view their own salary
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      if (employeeId !== req.user.employeeId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const salary = await Salary.findOne({ employeeId })
      .populate('employeeId', 'name email department');

    if (!salary) {
      return res.status(404).json({ message: 'Salary information not found' });
    }

    res.json(salary);
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/salary
// @desc    Create or update salary (Admin/HR only)
// @access  Private (Admin/HR)
router.post('/', [
  auth,
  isAdminOrHR,
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('baseWage').isFloat({ min: 0 }).withMessage('Base wage must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, baseWage, components, deductions } = req.body;

    let salary = await Salary.findOne({ employeeId });
    
    if (salary) {
      // Update existing salary
      salary.baseWage = baseWage;
      if (components) {
        Object.assign(salary.components, components);
      }
      if (deductions) {
        Object.assign(salary.deductions, deductions);
      }
      salary.lastUpdated = Date.now();
    } else {
      // Create new salary
      salary = new Salary({
        employeeId,
        baseWage,
        components: components || {},
        deductions: deductions || {}
      });
    }

    await salary.save();

    res.json({
      message: 'Salary information saved successfully',
      salary
    });
  } catch (error) {
    console.error('Save salary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/salary/:employeeId/payroll
// @desc    Calculate payroll for employee (considering attendance)
// @access  Private (Admin/HR)
router.get('/:employeeId/payroll', [auth, isAdminOrHR], async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const salary = await Salary.findOne({ employeeId })
      .populate('employeeId', 'name email department');
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary information not found' });
    }

    // Calculate attendance for the month
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
    const endDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
      status: 'present'
    });

    const totalDays = endDate.getDate();
    const presentDays = attendances.length;
    const payableDays = presentDays; // Missing attendance reduces payable days

    const dailyWage = salary.baseWage / totalDays;
    const payableAmount = dailyWage * payableDays;

    // Calculate deductions based on payable amount
    let pfAmount = 0;
    let profTaxAmount = 0;

    if (salary.deductions.providentFund.isPercentage) {
      pfAmount = (payableAmount * salary.deductions.providentFund.percentage) / 100;
    } else {
      pfAmount = salary.deductions.providentFund.amount;
    }

    if (salary.deductions.professionalTax.isPercentage) {
      profTaxAmount = (payableAmount * salary.deductions.professionalTax.percentage) / 100;
    } else {
      profTaxAmount = salary.deductions.professionalTax.amount;
    }

    const netSalary = payableAmount - pfAmount - profTaxAmount;

    res.json({
      employee: salary.employeeId,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      baseWage: salary.baseWage,
      totalDays,
      presentDays,
      payableDays,
      dailyWage: Math.round(dailyWage * 100) / 100,
      payableAmount: Math.round(payableAmount * 100) / 100,
      deductions: {
        providentFund: Math.round(pfAmount * 100) / 100,
        professionalTax: Math.round(profTaxAmount * 100) / 100,
        total: Math.round((pfAmount + profTaxAmount) * 100) / 100
      },
      netSalary: Math.round(netSalary * 100) / 100
    });
  } catch (error) {
    console.error('Calculate payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

