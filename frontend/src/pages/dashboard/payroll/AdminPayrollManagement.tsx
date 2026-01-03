import React, { useEffect, useState } from 'react';
import { payrollService } from '../../../services/payroll.service';
import { employeeService } from '../../../services/employee.service';
import { Payroll } from '../../../types/payroll';
import { Employee } from '../../../types/employee';
import { Button } from '../../../components/ui/Button';
import { attendanceService } from '../../../services/attendance.service';

interface EmployeePayroll extends Payroll {
  employee?: Employee | any;
}

export const AdminPayrollManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<EmployeePayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingPayroll, setEditingPayroll] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ baseSalary: number; bonus: number; allowances: number; deductions: number } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayroll | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);
      const [employeesData, payrollsData] = await Promise.all([
        employeeService.getAllEmployees(),
        payrollService.getAllPayrolls(selectedMonth, selectedYear),
      ]);
      
      setEmployees(employeesData.filter(e => e.status === 'active'));
      
      // Create a map of employee payrolls
      const payrollMap = new Map<string, Payroll>();
      payrollsData.forEach(p => {
        const empId = typeof p.employeeId === 'string' ? p.employeeId : (p.employeeId as any)?._id || (p.employeeId as any);
        payrollMap.set(empId, p);
      });

      // Create payroll entries for all employees
      const employeePayrolls: EmployeePayroll[] = await Promise.all(
        employeesData
          .filter(e => e.status === 'active')
          .map(async (employee) => {
            const existingPayroll = payrollMap.get(employee._id!);
            if (existingPayroll) {
              return { ...existingPayroll, employee };
            }
            // Calculate payroll based on attendance if doesn't exist
            try {
              const attendanceData = await attendanceService.getMonthlyAttendance(
                employee._id!,
                selectedMonth,
                selectedYear
              );
              const monthlySalary = employee.salary / 12;
              const totalDays = attendanceData.summary.totalDays || 30;
              const payableDays = attendanceData.summary.payableDays || 0;
              const dailyRate = monthlySalary / totalDays;
              const baseSalary = dailyRate * payableDays;
              const absentDays = attendanceData.summary.absentDays || 0;
              const absentDeduction = dailyRate * absentDays;
              
              return {
                _id: undefined,
                employeeId: employee._id!,
                month: selectedMonth,
                year: selectedYear,
                baseSalary: Math.round(baseSalary * 100) / 100,
                allowances: 0,
                deductions: Math.round(absentDeduction * 100) / 100,
                bonus: 0,
                totalSalary: Math.round((baseSalary - absentDeduction) * 100) / 100,
                status: 'pending',
                employee,
              } as EmployeePayroll;
            } catch (err) {
              // If attendance data not available, use default
              return {
                _id: undefined,
                employeeId: employee._id!,
                month: selectedMonth,
                year: selectedYear,
                baseSalary: employee.salary / 12,
                allowances: 0,
                deductions: 0,
                bonus: 0,
                totalSalary: employee.salary / 12,
                status: 'pending',
                employee,
              } as EmployeePayroll;
            }
          })
      );

      setPayrolls(employeePayrolls);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdatePayroll = async (payroll: EmployeePayroll) => {
    try {
      setError('');
      // Get attendance data to calculate deductions for absent days
      let absentDaysDeduction = 0;
      try {
        const attendanceData = await attendanceService.getMonthlyAttendance(
          payroll.employeeId,
          selectedMonth,
          selectedYear
        );
        const absentDays = attendanceData.summary.absentDays || 0;
        const monthlySalary = payroll.employee?.salary ? payroll.employee.salary / 12 : editData!.baseSalary;
        const totalDays = attendanceData.summary.totalDays || 30;
        const dailyRate = monthlySalary / totalDays;
        absentDaysDeduction = dailyRate * absentDays;
      } catch (err) {
        console.error('Error fetching attendance:', err);
      }

      const totalDeductions = editData!.deductions + absentDaysDeduction;
      const totalSalary = editData!.baseSalary + editData!.allowances + editData!.bonus - totalDeductions;

      if (payroll._id) {
        await payrollService.updatePayroll(payroll._id, {
          baseSalary: editData!.baseSalary,
          bonus: editData!.bonus,
          allowances: editData!.allowances,
          deductions: totalDeductions,
          totalSalary: Math.max(0, totalSalary),
        });
      } else {
        await payrollService.createPayroll({
          employeeId: payroll.employeeId,
          month: selectedMonth,
          year: selectedYear,
          allowances: editData!.allowances,
          deductions: totalDeductions,
          bonus: editData!.bonus,
        });
      }
      setSuccess('Payroll updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setEditingPayroll(null);
      setEditData(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update payroll');
    }
  };

  const handleMarkAsPaid = async (payrollId: string) => {
    try {
      setError('');
      await payrollService.markAsPaid(payrollId);
      setSuccess('Salary marked as paid! Employee will be notified.');
      setTimeout(() => setSuccess(''), 3000);
      
      // Store notification for employee
      const payroll = payrolls.find(p => p._id === payrollId);
      if (payroll) {
        const notificationKey = `salary_paid_${payroll.employeeId}_${selectedMonth}_${selectedYear}`;
        localStorage.setItem(notificationKey, JSON.stringify({
          message: 'yayy,salary received!!',
          timestamp: new Date().toISOString(),
        }));
      }
      
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark as paid');
    }
  };

  const handleViewDetails = async (payroll: EmployeePayroll) => {
    try {
      // Get attendance data for the month
      const attendanceData = await attendanceService.getMonthlyAttendance(
        payroll.employeeId,
        selectedMonth,
        selectedYear
      );
      setSelectedEmployee({ ...payroll, attendanceData });
    } catch (err: any) {
      setError('Failed to load attendance details');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const totalSalaryGiven = payrolls
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.totalSalary || 0), 0);
  const paidCount = payrolls.filter(p => p.status === 'paid').length;
  const pendingCount = payrolls.filter(p => p.status === 'pending' || !p._id).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-gray-600 mt-1">Manage employee salaries and payments</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Salary Given</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ₹{totalSalaryGiven.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Employees Paid</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{paidCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Salary</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Employee Payroll - {monthNames[selectedMonth - 1]} {selectedYear}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls.map((payroll) => {
                const employee = payroll.employee;
                const employeeName = employee
                  ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
                  : 'N/A';

                const isEditing = editingPayroll === payroll.employeeId;
                const currentEditData = editData || {
                  baseSalary: payroll.baseSalary || 0,
                  allowances: payroll.allowances || 0,
                  deductions: payroll.deductions || 0,
                  bonus: payroll.bonus || 0,
                };

                return (
                  <tr key={payroll.employeeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                          {employee?.employeeId && (
                            <div className="text-sm text-gray-500">{employee.employeeId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={currentEditData.baseSalary}
                          onChange={(e) => setEditData({ ...currentEditData, baseSalary: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          ₹{payroll.baseSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={currentEditData.allowances}
                          onChange={(e) => setEditData({ ...currentEditData, allowances: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="text-sm text-green-600">
                          +₹{payroll.allowances?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={currentEditData.deductions}
                          onChange={(e) => setEditData({ ...currentEditData, deductions: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="text-sm text-red-600">
                          -₹{payroll.deductions?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={currentEditData.bonus}
                          onChange={(e) => setEditData({ ...currentEditData, bonus: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <div className="text-sm text-green-600">
                          +₹{(payroll.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{isEditing 
                          ? (currentEditData.baseSalary + currentEditData.allowances + currentEditData.bonus - currentEditData.deductions).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : (payroll.totalSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payroll.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : payroll.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payroll.status?.charAt(0).toUpperCase() + payroll.status?.slice(1) || 'Pending'}
                      </span>
                      {payroll.paymentDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(payroll.paymentDate).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              onClick={() => handleCreateOrUpdatePayroll(payroll)}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingPayroll(null);
                                setEditData(null);
                              }}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs px-3 py-1"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                setEditingPayroll(payroll.employeeId);
                                setEditData({
                                  baseSalary: payroll.baseSalary || 0,
                                  allowances: payroll.allowances || 0,
                                  deductions: payroll.deductions || 0,
                                  bonus: payroll.bonus || 0,
                                });
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleViewDetails(payroll)}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
                            >
                              Details
                            </Button>
                            {payroll.status !== 'paid' && payroll._id && (
                              <Button
                                onClick={() => handleMarkAsPaid(payroll._id!)}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                              >
                                Mark Paid
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (selectedEmployee as any).attendanceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedEmployee.employee?.firstName} {selectedEmployee.employee?.lastName} - Attendance & Salary Details
              </h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EmployeePayrollDetails 
                payroll={selectedEmployee} 
                attendanceData={(selectedEmployee as any).attendanceData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmployeePayrollDetails: React.FC<{ payroll: EmployeePayroll; attendanceData: any }> = ({ payroll, attendanceData }) => {
  const summary = attendanceData?.summary || {};
  const attendances = attendanceData?.attendances || [];
  const absentDaysWithoutLeave = summary.absentDays || 0;
  const presentDays = summary.presentDays || 0;
  const leaveDays = summary.leaveDays || 0;
  const totalDays = summary.totalDays || 0;
  const payableDays = summary.payableDays || 0;
  const totalHours = summary.totalHours || 0;

  return (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Attendance Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Present Days</p>
            <p className="text-2xl font-bold text-green-900">{presentDays}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Absent (No Leave)</p>
            <p className="text-2xl font-bold text-red-900">{absentDaysWithoutLeave}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Leave Days</p>
            <p className="text-2xl font-bold text-blue-900">{leaveDays}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Payable Days</p>
            <p className="text-2xl font-bold text-purple-900">
              {payableDays} / {totalDays}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">Total Hours</p>
            <p className="text-2xl font-bold text-orange-900">
              {Math.floor(totalHours)}h {Math.round((totalHours % 1) * 60)}m
            </p>
          </div>
        </div>
      </div>

      {/* Day-wise Attendance */}
      {attendances.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Day-wise Attendance</h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {attendances.map((attendance: any) => (
                <div key={attendance._id} className="flex justify-between items-center p-2 bg-white rounded">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(attendance.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                      attendance.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      attendance.status === 'absent' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {attendance.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {attendance.checkIn && (
                      <span>In: {new Date(attendance.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {attendance.checkOut && (
                      <span className="ml-2">Out: {new Date(attendance.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {attendance.hoursWorked && attendance.checkOut && (
                      <span className="ml-2 font-medium text-green-600">
                        ({(() => {
                          const hours = Math.floor(attendance.hoursWorked);
                          const minutes = Math.round((attendance.hoursWorked % 1) * 60);
                          if (hours > 0 && minutes > 0) {
                            return `${hours}h ${minutes}m`;
                          } else if (hours > 0) {
                            return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
                          } else if (minutes > 0) {
                            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
                          }
                          return '0 hours';
                        })()})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Salary Breakdown */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Salary Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-900">Base Salary</p>
            <p className="font-semibold text-gray-900">₹{payroll.baseSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-900">Allowances</p>
            <p className="font-semibold text-green-600">+₹{payroll.allowances?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-900">Deductions (Absent Days: {absentDaysWithoutLeave})</p>
            <p className="font-semibold text-red-600">-₹{payroll.deductions?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
          </div>
          {payroll.bonus && payroll.bonus > 0 && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-900">Bonus</p>
              <p className="font-semibold text-green-600">+₹{payroll.bonus.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <p className="text-lg font-semibold">Total Salary</p>
          <p className="text-3xl font-bold">₹{payroll.totalSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
        </div>
      </div>
    </div>
  );
};

