const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected');

    // Get admin details from command line arguments or use defaults
    const loginId = process.argv[2] || 'ADMIN001';
    const email = process.argv[3] || 'admin@company.com';
    const password = process.argv[4] || 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ loginId });
    if (existingAdmin) {
      console.log('Admin account already exists with this Login ID');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = new User({
      loginId,
      email,
      password: hashedPassword,
      role: 'admin',
      isFirstLogin: false
    });

    await admin.save();

    console.log('Admin account created successfully!');
    console.log('Login ID:', loginId);
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nPlease change the password after first login for security.');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

