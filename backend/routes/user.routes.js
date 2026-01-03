import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.model.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// All user routes require authentication
router.use(authenticate);

// Get own profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update own profile (Employee only, limited fields)
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Employees can only update limited fields
    if (req.user.role === 'employee') {
      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
    } else {
      // Admin can update more fields
      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        profileImage: user.profileImage,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Upload profile image
router.post('/profile/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old image from Cloudinary if exists
    if (user.profileImage) {
      try {
        const urlParts = user.profileImage.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        await cloudinary.uploader.destroy(`hrms/profiles/${publicId}`);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: 'hrms/profiles',
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
      }
    );

    user.profileImage = uploadResult.secure_url;
    await user.save();

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

export default router;

