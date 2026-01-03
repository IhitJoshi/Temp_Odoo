import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import * as payrollService from '../../services/payrollService'

const EmployeeSalary = () => {
  const [payroll, setPayroll] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPayroll, setSelectedPayroll] = useState(null)

  useEffect(() => {
    fetchPayroll()
  }, [])

  const fetchPayroll = async () => {
    try {
      const data = await payrollService.getPayroll()
      setPayroll(data.payroll)
      if (data.payroll && data.payroll.length > 0) {
        setSelectedPayroll(data.payroll[0])
      }
    } catch (error) {
      console.error('Error fetching payroll:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Salary</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Payroll History</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {payroll.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No payroll records found</div>
              ) : (
                payroll.map((record) => (
                  <button
                    key={record._id}
                    onClick={() => setSelectedPayroll(record)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedPayroll?._id === record._id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {format(new Date(record.month + '-01'), 'MMM yyyy')}
                    </div>
                    <div className="text-sm text-gray-600">
                      ₹{record.netSalary.toLocaleString()}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          record.isLocked
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {record.isLocked ? 'Locked' : 'Draft'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Payroll Details */}
        <div className="lg:col-span-2">
          {selectedPayroll ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Salary Slip - {format(new Date(selectedPayroll.month + '-01'), 'MMMM yyyy')}
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Summary */}
                <div className="bg-primary-50 rounded-lg p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Net Salary</p>
                    <p className="text-4xl font-bold text-primary-600">
                      ₹{selectedPayroll.netSalary.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Salary Breakdown</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-700">Basic Salary</span>
                      <span className="font-semibold text-gray-900">
                        ₹{selectedPayroll.basic.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-700">Allowances</span>
                      <span className="font-semibold text-green-600">
                        + ₹{selectedPayroll.allowances.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-700">Deductions</span>
                      <span className="font-semibold text-red-600">
                        - ₹{selectedPayroll.deductions.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold text-gray-900">Net Salary</span>
                      <span className="text-lg font-bold text-primary-600">
                        ₹{selectedPayroll.netSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attendance Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Attendance Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Attendance Days:</span>
                      <span className="ml-2 font-semibold">{selectedPayroll.attendanceDays}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Leave Days:</span>
                      <span className="ml-2 font-semibold">{selectedPayroll.leaveDays}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Select a payroll record to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeSalary

