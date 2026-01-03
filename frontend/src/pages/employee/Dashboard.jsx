import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import * as attendanceService from '../../services/attendanceService'
import * as leaveService from '../../services/leaveService'
import * as payrollService from '../../services/payrollService'

const EmployeeDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [leaveStats, setLeaveStats] = useState(null)
  const [recentPayroll, setRecentPayroll] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const month = new Date().toISOString().slice(0, 7)
      
      const [attendanceData, leaveData, payrollData] = await Promise.all([
        attendanceService.getAttendanceStats({ month }),
        leaveService.getLeaveStats(),
        payrollService.getPayroll({ month }),
      ])

      setAttendanceStats(attendanceData.stats)
      setLeaveStats(leaveData.stats)
      if (payrollData.payroll && payrollData.payroll.length > 0) {
        setRecentPayroll(payrollData.payroll[0])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <h2 className="text-2xl font-semibold mb-2">Welcome back, {user?.name}!</h2>
        <p className="text-primary-100">{user?.department} Department</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Attendance</h3>
            <div className="text-4xl">📅</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Present:</span>
              <span className="font-semibold text-green-600">
                {attendanceStats?.present || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Absent:</span>
              <span className="font-semibold text-red-600">
                {attendanceStats?.absent || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Half-day:</span>
              <span className="font-semibold text-yellow-600">
                {attendanceStats?.halfDay || 0}
              </span>
            </div>
          </div>
          <Link
            to="/employee/attendance"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Leaves</h3>
            <div className="text-4xl">🏖️</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-semibold text-yellow-600">
                {leaveStats?.pending || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Approved:</span>
              <span className="font-semibold text-green-600">
                {leaveStats?.approved || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rejected:</span>
              <span className="font-semibold text-red-600">
                {leaveStats?.rejected || 0}
              </span>
            </div>
          </div>
          <Link
            to="/employee/leaves"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Salary</h3>
            <div className="text-4xl">💰</div>
          </div>
          {recentPayroll ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                ₹{recentPayroll.netSalary.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">
                {new Date(recentPayroll.month + '-01').toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No payroll data available</p>
          )}
          <Link
            to="/employee/salary"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/employee/attendance"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-semibold text-gray-900">Mark Attendance</h3>
            <p className="text-sm text-gray-600">Record your attendance for today</p>
          </Link>
          <Link
            to="/employee/leaves"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">🏖️</div>
            <h3 className="font-semibold text-gray-900">Apply for Leave</h3>
            <p className="text-sm text-gray-600">Submit a new leave request</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard

