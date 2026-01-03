const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true
  },
  baseWage: {
    type: Number,
    required: true
  },
  components: {
    basic: {
      amount: { type: Number, default: 0 },
      isPercentage: { type: Boolean, default: true },
      percentage: { type: Number, default: 50 }
    },
    hra: {
      amount: { type: Number, default: 0 },
      isPercentage: { type: Boolean, default: true },
      percentage: { type: Number, default: 40 }
    },
    standardAllowance: {
      amount: { type: Number, default: 0 },
      isPercentage: { type: Boolean, default: false }
    },
    performanceBonus: {
      amount: { type: Number, default: 0 },
      isPercentage: { type: Boolean, default: false }
    },
    leaveTravelAllowance: {
      amount: { type: Number, default: 0 },
      isPercentage: { type: Boolean, default: false }
    },
    fixedAllowance: {
      amount: { type: Number, default: 0 },
      isPercentage: { type: Boolean, default: false }
    }
  },
  deductions: {
    providentFund: {
      amount: { type: Number, default: 0 },
      isPercentage: { type: Boolean, default: true },
      percentage: { type: Number, default: 12 }
    },
    professionalTax: {
      amount: { type: Number, default: 0 },
      isPercentage: { type: Boolean, default: false }
    }
  },
  monthlySalary: {
    type: Number,
    default: 0
  },
  yearlySalary: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

salarySchema.pre('save', function(next) {
  // Calculate component amounts if percentage-based
  if (this.components.basic.isPercentage) {
    this.components.basic.amount = (this.baseWage * this.components.basic.percentage) / 100;
  }
  if (this.components.hra.isPercentage) {
    this.components.hra.amount = (this.baseWage * this.components.hra.percentage) / 100;
  }
  if (this.deductions.providentFund.isPercentage) {
    this.deductions.providentFund.amount = (this.baseWage * this.deductions.providentFund.percentage) / 100;
  }

  // Calculate total components
  const totalComponents = 
    this.components.basic.amount +
    this.components.hra.amount +
    this.components.standardAllowance.amount +
    this.components.performanceBonus.amount +
    this.components.leaveTravelAllowance.amount +
    this.components.fixedAllowance.amount;

  // Ensure total doesn't exceed base wage
  if (totalComponents > this.baseWage) {
    return next(new Error('Total salary components exceed base wage'));
  }

  // Calculate net salary
  const totalDeductions = 
    this.deductions.providentFund.amount +
    this.deductions.professionalTax.amount;

  this.monthlySalary = this.baseWage - totalDeductions;
  this.yearlySalary = this.monthlySalary * 12;

  next();
});

module.exports = mongoose.model('Salary', salarySchema);

