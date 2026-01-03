import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './redux/slices/authSlice'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminEmployees from './pages/admin/Employees'
import AdminAttendance from './pages/admin/Attendance'
import AdminLeaves from './pages/admin/Leaves'
import AdminPayroll from './pages/admin/Payroll'
import EmployeeDashboard from './pages/employee/Dashboard'
import EmployeeAttendance from './pages/employee/Attendance'
import EmployeeLeaves from './pages/employee/Leaves'
import EmployeeSalary from './pages/employee/Salary'
import EmployeeProfile from './pages/employee/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="employees" element={<AdminEmployees />} />
                <Route path="attendance" element={<AdminAttendance />} />
                <Route path="leaves" element={<AdminLeaves />} />
                <Route path="payroll" element={<AdminPayroll />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute requiredRole="employee">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="attendance" element={<EmployeeAttendance />} />
                <Route path="leaves" element={<EmployeeLeaves />} />
                <Route path="salary" element={<EmployeeSalary />} />
                <Route path="profile" element={<EmployeeProfile />} />
                <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

