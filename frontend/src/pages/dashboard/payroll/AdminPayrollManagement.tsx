import React, { useEffect, useState } from 'react';
import { payrollService } from '../../../services/payroll.service';
import { employeeService } from '../../../services/employee.service';
import { Payroll } from '../../../types/payroll';
import { Employee } from '../../../types/employee';
import { attendanceService } from '../../../services/attendance.service';
import { Modal } from '../../../components/ui/Modal';

interface EmployeePayroll extends Payroll {
  employee?: Employee | any;
  attendanceData?: any;
}

export const AdminPayrollManagement: React.FC = () => {
  const [payrolls, setPayrolls] = useState<EmployeePayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingPayroll, setEditingPayroll] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ baseSalary: number; bonus: number; allowances: number; deductions: number } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPayroll, setSelectedPayroll] = useState<EmployeePayroll | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      setSuccess('Salary marked as paid successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark as paid');
    }
  };

  const handleViewDetails = async (payroll: EmployeePayroll) => {
    try {
      const attendanceData = await attendanceService.getMonthlyAttendance(
        payroll.employeeId,
        selectedMonth,
        selectedYear
      );
      setSelectedPayroll({ ...payroll, attendanceData });
      setShowDetailsModal(true);
    } catch (err: any) {
      setError('Failed to load attendance details');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const totalSalaryPaid = payrolls
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.totalSalary || 0), 0);
  const employeesPaid = payrolls.filter(p => p.status === 'paid').length;
  const pendingSalaries = payrolls.filter(p => p.status === 'pending' || !p._id).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Management</h1>
        <p className="text-gray-600">Manage employee salaries and payments</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Salary Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{totalSalaryPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Employees Paid</p>
              <p className="text-2xl font-bold text-gray-900">{employeesPaid}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Salaries</p>
              <p className="text-2xl font-bold text-gray-900">{pendingSalaries}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Base Salary
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bonus
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Salary
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-sm">No payroll records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => {
                  const employee = payroll.employee;
                  const employeeName = employee
                    ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
                    : 'N/A';
                  const employeeInitials = employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NA';

                  const isEditing = editingPayroll === payroll.employeeId;
                  const currentEditData = editData || {
                    baseSalary: payroll.baseSalary || 0,
                    allowances: payroll.allowances || 0,
                    deductions: payroll.deductions || 0,
                    bonus: payroll.bonus || 0,
                  };

                  return (
                    <tr 
                      key={payroll.employeeId} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {/* Employee Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {employee?.profilePicture ? (
                              <img 
                                src={employee.profilePicture} 
                                alt={employeeName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              employeeInitials
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                            {employee?.employeeId && (
                              <div className="text-xs text-gray-500">{employee.employeeId}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Base Salary */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={currentEditData.baseSalary}
                            onChange={(e) => setEditData({ ...currentEditData, baseSalary: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            ₹{payroll.baseSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </div>
                        )}
                      </td>

                      {/* Allowances */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={currentEditData.allowances}
                            onChange={(e) => setEditData({ ...currentEditData, allowances: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-green-600 font-medium">
                            +₹{payroll.allowances?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </div>
                        )}
                      </td>

                      {/* Deductions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={currentEditData.deductions}
                            onChange={(e) => setEditData({ ...currentEditData, deductions: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-red-600 font-medium">
                            -₹{payroll.deductions?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </div>
                        )}
                      </td>

                      {/* Bonus */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={currentEditData.bonus}
                            onChange={(e) => setEditData({ ...currentEditData, bonus: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-green-600 font-medium">
                            +₹{(payroll.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Total Salary */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{isEditing 
                            ? (currentEditData.baseSalary + currentEditData.allowances + currentEditData.bonus - currentEditData.deductions).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : (payroll.totalSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payroll.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : payroll.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {payroll.status?.charAt(0).toUpperCase() + payroll.status?.slice(1) || 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleCreateOrUpdatePayroll(payroll)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPayroll(null);
                                  setEditData(null);
                                }}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingPayroll(payroll.employeeId);
                                  setEditData({
                                    baseSalary: payroll.baseSalary || 0,
                                    allowances: payroll.allowances || 0,
                                    deductions: payroll.deductions || 0,
                                    bonus: payroll.bonus || 0,
                                  });
                                }}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleViewDetails(payroll)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {payroll.status !== 'paid' && payroll._id && (
                                <button
                                  onClick={() => handleMarkAsPaid(payroll._id!)}
                                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                                  title="Mark as Paid"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Details Modal */}
      {selectedPayroll && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPayroll(null);
          }}
          title={`${selectedPayroll.employee?.firstName} ${selectedPayroll.employee?.lastName} - Salary Details`}
        >
          <SalaryDetailsModal payroll={selectedPayroll} month={selectedMonth} year={selectedYear} />
        </Modal>
      )}
    </div>
  );
};

const SalaryDetailsModal: React.FC<{ payroll: EmployeePayroll; month: number; year: number }> = ({ payroll, month, year }) => {
  const attendanceData = payroll.attendanceData;
  const summary = attendanceData?.summary || {};
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Period Info */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <p className="text-sm text-gray-600">Period</p>
          <p className="text-lg font-semibold text-gray-900">{monthNames[month - 1]} {year}</p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            payroll.status === 'paid'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {payroll.status?.charAt(0).toUpperCase() + payroll.status?.slice(1) || 'Pending'}
        </span>
      </div>

      {/* Salary Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Base Salary</span>
            <span className="font-semibold text-gray-900">
              ₹{payroll.baseSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Allowances</span>
            <span className="font-semibold text-green-600">
              +₹{payroll.allowances?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Deductions</span>
            <span className="font-semibold text-red-600">
              -₹{payroll.deductions?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>
          {payroll.bonus && payroll.bonus > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Bonus</span>
              <span className="font-semibold text-green-600">
                +₹{payroll.bonus.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold text-gray-900">Total Salary</span>
            <span className="text-xl font-bold text-blue-600">
              ₹{payroll.totalSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Summary (if available) */}
      {attendanceData && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Present Days</p>
              <p className="text-xl font-bold text-gray-900">{summary.presentDays || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Absent Days</p>
              <p className="text-xl font-bold text-gray-900">{summary.absentDays || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Leave Days</p>
              <p className="text-xl font-bold text-gray-900">{summary.leaveDays || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total Hours</p>
              <p className="text-xl font-bold text-gray-900">{Math.floor(summary.totalHours || 0)}h</p>
            </div>
          </div>
        </div>
      )}

      {payroll.paymentDate && (
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">Payment Date</p>
          <p className="text-gray-900 font-medium">
            {new Date(payroll.paymentDate).toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      )}
    </div>
  );
};
