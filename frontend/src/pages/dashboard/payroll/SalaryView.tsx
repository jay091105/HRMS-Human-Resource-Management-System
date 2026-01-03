import React, { useEffect, useState } from 'react';
import { useRole } from '../../../hooks/useRole';
import { payrollService } from '../../../services/payroll.service';
import { Payroll } from '../../../types/payroll';
import { StatusDot } from '../../../components/ui/StatusDot';
import { Button } from '../../../components/ui/Button';

export const SalaryView: React.FC = () => {
  const { isAdmin } = useRole();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        setError('');
        const data = isAdmin
          ? await payrollService.getAllPayrolls()
          : await payrollService.getMyPayrolls();
        setPayrolls(data);
        setFilteredPayrolls(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load payroll data');
        console.error('Error fetching payrolls:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const filtered = payrolls.filter(
        p => p.month === selectedMonth && p.year === selectedYear
      );
      setFilteredPayrolls(filtered);
    } else {
      setFilteredPayrolls(payrolls);
    }
  }, [selectedMonth, selectedYear, payrolls]);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const totalEarnings = payrolls.reduce((sum, p) => sum + p.totalSalary, 0);
  const paidCount = payrolls.filter(p => p.status === 'paid').length;
  const pendingCount = payrolls.filter(p => p.status === 'pending').length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? 'View and manage employee payroll records' : 'View your salary and payment history'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600 uppercase">Total Earnings</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              ${totalEarnings.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600 uppercase">Paid</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{paidCount}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-600 uppercase">Pending</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{pendingCount}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Months</option>
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedMonth(new Date().getMonth() + 1);
                setSelectedYear(new Date().getFullYear());
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {filteredPayrolls.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month/Year
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
                  Payment Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayrolls.map((payroll) => (
                <tr key={payroll._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {monthNames[payroll.month - 1]} {payroll.year}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${payroll.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    +${payroll.allowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    -${payroll.deductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    +${(payroll.bonus || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${payroll.totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusDot status={payroll.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payroll.paymentDate
                      ? new Date(payroll.paymentDate).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No payroll records found</p>
          {selectedMonth || selectedYear ? (
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          ) : null}
        </div>
      )}
    </div>
  );
};
