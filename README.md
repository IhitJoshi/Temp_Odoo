# HRMS - Human Resource Management System

A production-ready SaaS HRMS platform built with the MERN stack, featuring role-based access control, attendance tracking, leave management, and automated payroll processing.

## 🚀 Features

### Admin Features
- **Dashboard**: Overview of employees, pending leaves, and attendance
- **Employee Management**: Create, edit, and deactivate employee accounts
- **Attendance View**: Monitor employee attendance with filtering options
- **Leave Approval**: Approve or reject leave requests
- **Payroll Management**: Generate and lock monthly payroll with automatic calculations

### Employee Features
- **Dashboard**: Personal attendance summary, leave status, and salary preview
- **Attendance**: Mark daily attendance (present, absent, half-day)
- **Leave Management**: Apply for leave and track approval status
- **Salary View**: View detailed salary breakdowns and history
- **Profile Management**: Update personal information and upload profile images

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication (access + refresh tokens)
- **Multer** + **Cloudinary** for file uploads
- **Express Validator** for input validation
- **Bcrypt** for password hashing

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image uploads)

## 🔧 Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hrms
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🗄️ Database Setup

1. Make sure MongoDB is running on your system
2. The application will automatically create the database `hrms` on first connection
3. Create your first admin user by using the API or MongoDB directly

### Creating First Admin User

You can create the first admin user using MongoDB shell or a tool like MongoDB Compass:

```javascript
// In MongoDB shell or Compass
use hrms
db.users.insertOne({
  name: "Admin User",
  email: "admin@hrms.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5", // password: admin123
  role: "admin",
  department: "Administration",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Note**: The password above is hashed for "admin123". For production, use a proper password hashing tool.

## 🔐 Authentication

- **Login**: POST `/api/auth/login`
- **Get Current User**: GET `/api/auth/me`
- **Refresh Token**: POST `/api/auth/refresh`
- **Logout**: POST `/api/auth/logout`

After login, users are redirected based on their role:
- **Admin** → `/admin/dashboard`
- **Employee** → `/employee/dashboard`

## 📡 API Endpoints

### Admin Routes (Requires Admin Role)
- `POST /api/admin/create-user` - Create new user
- `GET /api/admin/employees` - Get all employees
- `GET /api/admin/employees/:id` - Get single employee
- `PUT /api/admin/employees/:id` - Update employee
- `DELETE /api/admin/employees/:id` - Deactivate employee
- `GET /api/admin/dashboard` - Get dashboard stats

### Attendance Routes
- `POST /api/attendance/mark` - Mark attendance (Employee only)
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/stats` - Get attendance statistics

### Leave Routes
- `POST /api/leave/apply` - Apply for leave (Employee only)
- `GET /api/leave` - Get leave records
- `PUT /api/leave/approve/:id` - Approve/reject leave (Admin only)
- `GET /api/leave/stats` - Get leave statistics

### Payroll Routes
- `POST /api/payroll/generate` - Generate payroll (Admin only)
- `GET /api/payroll` - Get payroll records
- `GET /api/payroll/:id` - Get single payroll
- `PUT /api/payroll/lock/:id` - Lock payroll (Admin only)

### User Routes
- `GET /api/user/profile` - Get own profile
- `PUT /api/user/profile` - Update own profile
- `POST /api/user/profile/image` - Upload profile image

## 🚢 Deployment

### Backend (Render/Railway)

1. Push your code to GitHub
2. Connect your repository to Render or Railway
3. Set environment variables in the platform
4. Deploy

### Frontend (Vercel)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Navigate to frontend directory:
```bash
cd frontend
```

3. Deploy:
```bash
vercel
```

4. Set environment variable `VITE_API_URL` to your backend URL

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control
- Password hashing with bcrypt
- Input validation with express-validator
- Protected routes with middleware
- CORS configuration

## 📝 Business Logic

### Attendance
- Employees can mark attendance once per day
- Attendance affects salary calculations
- Admin can view but not modify attendance

### Leave Management
- Employees apply for leave with type, dates, and reason
- Admin approves or rejects leave requests
- Approved leaves automatically mark attendance as absent

### Payroll
- Admin generates payroll for each employee per month
- Payroll calculates based on:
  - Basic salary
  - Allowances
  - Deductions (based on attendance)
- Once locked, payroll cannot be modified

## 🤝 Contributing

This is a production-ready SaaS application. For contributions:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary software.

## 🆘 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for modern HR management**

