import React, { useEffect, useState } from 'react';
import { payrollService } from '../../../services/payroll.service';
import { Payroll } from '../../../types/payroll';
import { formatDate } from '../../../utils/formatDate';

export const EmployeeSalaryView: React.FC = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchPayrolls();
    checkForNotifications();
    
    // Check for new paid payrolls and show notification
    const checkInterval = setInterval(() => {
      checkForNewPayments();
      checkForNotifications();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, []);

  const fetchPayrolls = async () => {
    try {
      setError('');
      const data = await payrollService.getMyPayrolls();
      setPayrolls(data.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load salary data');
      console.error('Error fetching payrolls:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewPayments = async () => {
    try {
      const data = await payrollService.getMyPayrolls();
      const newPaidPayrolls = data.filter(p => 
        p.status === 'paid' && 
        p.paymentDate &&
        !payrolls.find(existing => existing._id === p._id && existing.status === 'paid')
      );
      
      if (newPaidPayrolls.length > 0) {
        setNotification('yayy,salary received!!');
        setTimeout(() => setNotification(null), 10000);
        fetchPayrolls();
      }
    } catch (err) {
      console.error('Error checking for new payments:', err);
    }
  };

  const checkForNotifications = () => {
    // Check localStorage for salary notifications
    const keys = Object.keys(localStorage);
    const salaryKeys = keys.filter(k => k.startsWith('salary_paid_'));
    
    salaryKeys.forEach(key => {
      try {
        const notification = JSON.parse(localStorage.getItem(key) || '{}');
        if (notification.message && !notification.shown) {
          setNotification(notification.message);
          setTimeout(() => setNotification(null), 10000);
          // Mark as shown
          localStorage.setItem(key, JSON.stringify({ ...notification, shown: true }));
        }
      } catch (err) {
        console.error('Error parsing notification:', err);
      }
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Salary</h1>
        <p className="text-gray-600 mt-1">View your salary history month-wise</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-semibold text-lg">{notification}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {payrolls.length > 0 ? (
        <div className="space-y-4">
          {payrolls.map((payroll) => (
            <div
              key={payroll._id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                payroll.status === 'paid'
                  ? 'border-green-500'
                  : payroll.status === 'processing'
                  ? 'border-yellow-500'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {monthNames[payroll.month - 1]} {payroll.year}
                  </h3>
                  {payroll.paymentDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Received on {formatDate(payroll.paymentDate)}
                    </p>
                  )}
                </div>
                <span
                  className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                    payroll.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : payroll.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {payroll.status?.charAt(0).toUpperCase() + payroll.status?.slice(1) || 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Base Salary</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{payroll.baseSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Allowances</p>
                  <p className="text-lg font-semibold text-green-600">
                    +₹{payroll.allowances.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deductions</p>
                  <p className="text-lg font-semibold text-red-600">
                    -₹{payroll.deductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {payroll.bonus && payroll.bonus > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Bonus</p>
                    <p className="text-lg font-semibold text-green-600">
                      +₹{payroll.bonus.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900">Total Salary</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{payroll.totalSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No salary records found</p>
          <p className="text-gray-400 text-sm mt-2">Your salary records will appear here once processed</p>
        </div>
      )}
    </div>
  );
};

