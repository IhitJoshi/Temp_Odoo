# HRMS - Human Resource Management System

A complete, modern Human Resource Management System web application with role-based access control for Admin/HR Officers and Employees.

## Features

### Authentication & Access Control
- Login system with auto-generated Login IDs
- Only Admin/HR can create employee accounts
- Auto-generated temporary passwords for first login
- Mandatory password change on first login
- Login ID format: `<CompanyCode><EmployeeInitials><YearOfJoining><SerialNumber>`

### Dashboard
- Employee cards grid layout with profile pictures
- Real-time attendance status indicators:
  - 🟢 Green = Present
  - ✈️ Blue = On Leave
  - 🟡 Yellow = Absent
- Clickable cards to view employee profiles
- Top navigation with company logo, tabs, and profile dropdown

### My Profile Section
- Tab-based layout: Resume, Private Info, Salary Info (Admin only), Security
- Profile fields: Name, Company, Department, Manager, Email, Phone, DOB, Address, Nationality, Gender
- Bank Details: Account Number, Bank Name, IFSC Code, PAN, UAN
- Profile picture and resume upload

### Attendance Management
**Employee View:**
- Check-In / Check-Out buttons
- Display check-in/out times
- Work hours & extra hours calculation
- Monthly attendance summary

**Admin/HR View:**
- Day-wise attendance list for all employees
- Filter by date & employee
- Used for payroll calculation
- Missing attendance automatically reduces payable days

### Salary Management (Admin Only)
- Fixed wage structure
- Monthly & yearly salary display
- Salary components:
  - Basic (percentage or fixed)
  - HRA (percentage or fixed)
  - Standard Allowance
  - Performance Bonus
  - Leave Travel Allowance
  - Fixed Allowance
- Automatic calculation when base wage changes
- Deductions:
  - Provident Fund (PF)
  - Professional Tax
- Total components validation (must not exceed base wage)

### Time Off (Leave Management)
**Leave Types:**
- Paid Leave
- Sick Leave
- Unpaid Leave

**Employee:**
- Apply for leave with start/end dates, type, number of days
- Upload attachments (medical certificates, etc.)
- View leave status (Pending / Approved / Rejected)

**Admin/HR:**
- View all leave requests
- Approve or Reject leave requests
- Automatic leave balance updates

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- bcryptjs for password hashing

### Frontend
- React with TypeScript
- React Router for navigation
- Axios for API calls
- React Icons for icons
- Modern CSS with responsive design

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Configure environment variables:**
   - Create `server/.env` file (already created with defaults)
   - Update MongoDB connection string if needed
   - Change JWT secret for production

3. **Start MongoDB:**
   - Make sure MongoDB is running on `localhost:27017` or update the connection string

4. **Run the application:**
   ```bash
   npm run dev
   ```
   This will start both the backend server (port 5000) and frontend (port 3000)

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
HRMS/
├── server/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── utils/           # Utility functions
│   ├── uploads/         # Uploaded files
│   └── index.js         # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── App.tsx      # Main app component
│   └── public/          # Static files
└── package.json         # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/create-employee` - Create employee (Admin/HR only)

### Employees
- `GET /api/employees` - Get all employees (Admin/HR) or own profile
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee profile

### Attendance
- `POST /api/attendance/checkin` - Check in (Employee)
- `POST /api/attendance/checkout` - Check out (Employee)
- `GET /api/attendance/today` - Get today's attendance (Employee)
- `GET /api/attendance/monthly` - Get monthly summary (Employee)
- `GET /api/attendance/admin` - Get all attendance (Admin/HR)

### Leaves
- `POST /api/leaves` - Apply for leave (Employee)
- `GET /api/leaves` - Get leaves
- `GET /api/leaves/balance` - Get leave balance (Employee)
- `PUT /api/leaves/:id/approve` - Approve leave (Admin/HR)
- `PUT /api/leaves/:id/reject` - Reject leave (Admin/HR)

### Salary
- `GET /api/salary` - Get salary information
- `GET /api/salary/:employeeId` - Get salary for employee
- `POST /api/salary` - Create/update salary (Admin/HR)
- `GET /api/salary/:employeeId/payroll` - Calculate payroll (Admin/HR)

## Usage

### Creating First Admin Account

You can create the first admin account using the provided script:

```bash
cd server
npm run create-admin [LOGIN_ID] [EMAIL] [PASSWORD]
```

Example:
```bash
npm run create-admin ADMIN001 admin@company.com Admin@123
```

If no arguments are provided, it will use default values:
- Login ID: ADMIN001
- Email: admin@company.com
- Password: Admin@123

**Note:** Make sure MongoDB is running before executing this script.

Alternatively, you can manually create an admin account in MongoDB:

```javascript
// In MongoDB shell or client
use hrms
db.users.insertOne({
  loginId: "ADMIN001",
  email: "admin@company.com",
  password: "$2a$10$...", // bcrypt hash of your password (use bcryptjs to hash)
  role: "admin",
  isFirstLogin: false
})
```

### Creating Employee Accounts

1. Login as Admin/HR
2. Navigate to Dashboard
3. Click "Create Employee" (if available) or go to `/create-employee`
4. Fill in employee details
5. System will auto-generate Login ID and temporary password
6. Share credentials with employee

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running Backend Only
```bash
npm run server
```

### Running Frontend Only
```bash
npm run client
```

## Production Deployment

1. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

2. Set production environment variables
3. Use a process manager like PM2 for Node.js
4. Configure reverse proxy (nginx) for serving static files and API

## License

This project is open source and available for use.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

