const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true
  },
  paidLeave: {
    type: Number,
    default: 12
  },
  sickLeave: {
    type: Number,
    default: 6
  },
  unpaidLeave: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);

