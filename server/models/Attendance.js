const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    time: { type: Date },
    location: { type: String, trim: true }
  },
  checkOut: {
    time: { type: Date },
    location: { type: String, trim: true }
  },
  workHours: {
    type: Number,
    default: 0
  },
  extraHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'on_leave'],
    default: 'absent'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

