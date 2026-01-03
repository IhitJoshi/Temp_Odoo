const express = require('express');
const multer = require('multer');
const path = require('path');
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
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

// @route   GET /api/employees
// @desc    Get all employees (Admin/HR) or own profile (Employee)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      const employees = await Employee.find().sort({ name: 1 });
      res.json(employees);
    } else {
      const employee = await Employee.findById(req.user.employeeId);
      res.json([employee]);
    }
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Employees can only view their own profile, Admin/HR can view any
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      if (employee._id.toString() !== req.user.employeeId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee profile
// @access  Private
router.put('/:id', [
  auth,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ])
], async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Employees can only update their own profile, Admin/HR can update any
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      if (employee._id.toString() !== req.user.employeeId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const updateData = {
      name: req.body.name || employee.name,
      department: req.body.department || employee.department,
      manager: req.body.manager || employee.manager,
      phone: req.body.phone || employee.phone,
      dateOfBirth: req.body.dateOfBirth || employee.dateOfBirth,
      address: req.body.address || employee.address,
      nationality: req.body.nationality || employee.nationality,
      gender: req.body.gender || employee.gender,
      bankDetails: {
        accountNumber: req.body.accountNumber || employee.bankDetails?.accountNumber,
        bankName: req.body.bankName || employee.bankDetails?.bankName,
        ifscCode: req.body.ifscCode || employee.bankDetails?.ifscCode,
        pan: req.body.pan || employee.bankDetails?.pan,
        uan: req.body.uan || employee.bankDetails?.uan
      },
      updatedAt: Date.now()
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.profilePicture) {
        updateData.profilePicture = req.files.profilePicture[0].path;
      }
      if (req.files.resume) {
        updateData.resume = req.files.resume[0].path;
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

