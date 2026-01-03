import React, { useEffect, useState, useRef } from 'react';
import { employeeService } from '../../../services/employee.service';
import { Employee } from '../../../types/employee';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../hooks/useAuth';
import { useRole } from '../../../hooks/useRole';
import { formatDate } from '../../../utils/formatDate';
import { StatusDot } from '../../../components/ui/StatusDot';
import { ChangePasswordForm } from '../../../components/forms/ChangePasswordForm';
import { authService } from '../../../services/auth.service';

type TabType = 'resume' | 'private' | 'salary' | 'security';

export const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('resume');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');

  // Salary Info State
  const [salaryData, setSalaryData] = useState({
    monthlyWage: 50000,
    yearlyWage: 600000,
    workingDaysPerWeek: 5,
    breakTimeHours: 1,
    salaryComponents: [
      { name: 'Basic Salary', type: 'percentage' as const, value: 50, amount: 25000, description: 'Define Basic salary from company cost compute it based on monthly Wages' },
      { name: 'House Rent Allowance (HRA)', type: 'percentage' as const, value: 50, amount: 12500, description: 'HRA provided to employees 50% of the basic salary' },
      { name: 'Standard Allowance', type: 'fixed' as const, value: 4167, amount: 4167, description: 'A standard allowance is a predetermined, fixed amount provided to employee as part of their salary' },
      { name: 'Performance Bonus', type: 'percentage' as const, value: 8.33, amount: 2082.5, description: 'Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary' },
      { name: 'Leave Travel Allowance (LTA)', type: 'percentage' as const, value: 8.33, amount: 2082.5, description: 'LTA is paid by the company to employees to cover their travel expenses. and calculated as a % of the basic salary' },
      { name: 'Fixed Allowance', type: 'fixed' as const, value: 0, amount: 4168, description: 'fixed allowance portion of wages is determined after calculating all salary components' },
    ],
    pfEmployeeRate: 12,
    pfEmployerRate: 12,
    professionalTax: 200,
    bankAccountNumber: '',
    bankName: '',
    ifscCode: '',
    panNumber: '',
    uanNumber: '',
  });

  // Private Info State
  const [privateInfo, setPrivateInfo] = useState({
    dateOfBirth: '',
    residingAddress: '',
    nationality: '',
    personalEmail: '',
    gender: '',
    maritalStatus: '',
    dateOfJoining: '',
  });

  // Additional Info State
  const [additionalInfo, setAdditionalInfo] = useState({
    about: '',
    whatILoveAboutJob: '',
    interests: '',
    skills: [] as string[],
    certifications: [] as string[],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await employeeService.getMyProfile();
        setEmployee(data);
        if (data.monthlyWage) setSalaryData(prev => ({ ...prev, monthlyWage: data.monthlyWage! }));
        if (data.yearlyWage) setSalaryData(prev => ({ ...prev, yearlyWage: data.yearlyWage! }));
        if (data.profilePicture) setProfilePicture(data.profilePicture);
        if (data.about) setAdditionalInfo(prev => ({ ...prev, about: data.about! }));
        if (data.whatILoveAboutJob) setAdditionalInfo(prev => ({ ...prev, whatILoveAboutJob: data.whatILoveAboutJob! }));
        if (data.interests) setAdditionalInfo(prev => ({ ...prev, interests: data.interests! }));
        if (data.skills) setAdditionalInfo(prev => ({ ...prev, skills: data.skills! }));
        if (data.certifications) setAdditionalInfo(prev => ({ ...prev, certifications: data.certifications! }));
        setError('');
      } catch (err: any) {
        if (err.response?.status === 404) {
          setEmployee(null);
          setError('');
        } else {
          setError('Failed to load profile');
          console.error('Error fetching profile:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Calculate salary components when wage changes
  useEffect(() => {
    calculateSalaryComponents();
  }, [salaryData.monthlyWage]);

  const calculateSalaryComponents = () => {
    const wage = salaryData.monthlyWage;
    const components = [...salaryData.salaryComponents];
    let totalCalculated = 0;

    // Calculate each component
    components.forEach((comp) => {
      if (comp.name === 'Basic Salary') {
        comp.amount = (wage * comp.value) / 100;
        totalCalculated += comp.amount;
      } else if (comp.name === 'House Rent Allowance (HRA)') {
        const basic = components.find(c => c.name === 'Basic Salary')?.amount || 0;
        comp.amount = (basic * comp.value) / 100;
        totalCalculated += comp.amount;
      } else if (comp.type === 'percentage') {
        const basic = components.find(c => c.name === 'Basic Salary')?.amount || 0;
        comp.amount = (basic * comp.value) / 100;
        totalCalculated += comp.amount;
      } else if (comp.type === 'fixed' && comp.name !== 'Fixed Allowance') {
        comp.amount = comp.value;
        totalCalculated += comp.amount;
      }
    });

    // Calculate Fixed Allowance (remaining amount)
    const fixedAllowanceIndex = components.findIndex(c => c.name === 'Fixed Allowance');
    if (fixedAllowanceIndex !== -1) {
      components[fixedAllowanceIndex].amount = wage - totalCalculated;
      components[fixedAllowanceIndex].value = components[fixedAllowanceIndex].amount;
    }

    setSalaryData(prev => ({ ...prev, salaryComponents: components }));
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        handleUpdate({ profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (data: Partial<Employee>) => {
    try {
      const updated = await employeeService.updateMyProfile({
        ...data,
        monthlyWage: salaryData.monthlyWage,
        yearlyWage: salaryData.yearlyWage,
        salaryComponents: salaryData.salaryComponents,
        pfEmployeeRate: salaryData.pfEmployeeRate,
        pfEmployerRate: salaryData.pfEmployerRate,
        professionalTax: salaryData.professionalTax,
        bankAccountNumber: salaryData.bankAccountNumber,
        bankName: salaryData.bankName,
        ifscCode: salaryData.ifscCode,
        panNumber: salaryData.panNumber,
        uanNumber: salaryData.uanNumber,
        ...privateInfo,
        ...additionalInfo,
      });
      setEmployee(updated);
      setError('');
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      setShowPasswordModal(false);
      setError('');
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
      throw err;
    }
  };

  const addSkill = () => {
    const skill = prompt('Enter a skill:');
    if (skill) {
      setAdditionalInfo(prev => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
      handleUpdate({ skills: [...additionalInfo.skills, skill] });
    }
  };

  const addCertification = () => {
    const cert = prompt('Enter a certification:');
    if (cert) {
      setAdditionalInfo(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert],
      }));
      handleUpdate({ certifications: [...additionalInfo.certifications, cert] });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">
                You need to create your employee profile to access all features.
              </p>
            </div>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const totalComponents = salaryData.salaryComponents.reduce((sum, comp) => sum + comp.amount, 0);
  const basicAmount = salaryData.salaryComponents.find(c => c.name === 'Basic Salary')?.amount || 0;
  const pfEmployee = (basicAmount * salaryData.pfEmployeeRate) / 100;
  const pfEmployer = (basicAmount * salaryData.pfEmployerRate) / 100;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </Button>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-6 pb-6 border-b">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-gray-300">
              {profilePicture ? (
                <img src={profilePicture} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl text-gray-400 font-semibold">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </span>
                </div>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">{fullName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Job Position</p>
                <p className="text-lg text-gray-900">{employee.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg text-gray-900">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mobile</p>
                <p className="text-lg text-gray-900">{employee.phone}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="text-lg text-gray-900">{employee.department}</p>
                </div>
                {employee.company && (
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="text-lg text-gray-900">{employee.company}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusDot status={employee.status} label={employee.status} />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <nav className="flex space-x-8">
            {(['resume', 'private', 'salary', 'security'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Info
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'resume' && (
          <div className="space-y-6">
            {/* About Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">About</h3>
                {isEditing && (
                  <button className="text-blue-600 hover:text-blue-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={additionalInfo.about}
                  onChange={(e) => setAdditionalInfo(prev => ({ ...prev, about: e.target.value }))}
                  onBlur={() => handleUpdate({ about: additionalInfo.about })}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-700">{additionalInfo.about || 'No information provided.'}</p>
              )}
            </div>

            {/* What I love about my job */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">What I love about my job</h3>
                {isEditing && (
                  <button className="text-blue-600 hover:text-blue-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={additionalInfo.whatILoveAboutJob}
                  onChange={(e) => setAdditionalInfo(prev => ({ ...prev, whatILoveAboutJob: e.target.value }))}
                  onBlur={() => handleUpdate({ whatILoveAboutJob: additionalInfo.whatILoveAboutJob })}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="What do you love about your job?"
                />
              ) : (
                <p className="text-gray-700">{additionalInfo.whatILoveAboutJob || 'No information provided.'}</p>
              )}
            </div>

            {/* Interests */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">My interests and hobbies</h3>
                {isEditing && (
                  <button className="text-blue-600 hover:text-blue-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={additionalInfo.interests}
                  onChange={(e) => setAdditionalInfo(prev => ({ ...prev, interests: e.target.value }))}
                  onBlur={() => handleUpdate({ interests: additionalInfo.interests })}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="What are your interests and hobbies?"
                />
              ) : (
                <p className="text-gray-700">{additionalInfo.interests || 'No information provided.'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={addSkill}>
                      + Add Skills
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                {additionalInfo.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
                  {additionalInfo.skills.length === 0 && (
                    <p className="text-gray-500 text-sm">No skills added yet.</p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Certification</h3>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={addCertification}>
                      + Add Certification
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {additionalInfo.certifications.map((cert) => (
                    <span key={cert} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {cert}
                    </span>
                  ))}
                  {additionalInfo.certifications.length === 0 && (
                    <p className="text-gray-500 text-sm">No certifications added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'private' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={privateInfo.dateOfBirth}
                  onChange={(e) => setPrivateInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  onBlur={() => handleUpdate({ dateOfBirth: privateInfo.dateOfBirth })}
                  className="w-full p-2 border rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{privateInfo.dateOfBirth || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
              {isEditing ? (
                <input
                  type="date"
                  value={privateInfo.dateOfJoining || employee.hireDate.split('T')[0]}
                  onChange={(e) => setPrivateInfo(prev => ({ ...prev, dateOfJoining: e.target.value }))}
                  onBlur={() => handleUpdate({ hireDate: privateInfo.dateOfJoining || employee.hireDate })}
                  className="w-full p-2 border rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{formatDate(employee.hireDate)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Residing Address</label>
              {isEditing ? (
                <textarea
                  value={privateInfo.residingAddress || employee.address || ''}
                  onChange={(e) => setPrivateInfo(prev => ({ ...prev, residingAddress: e.target.value }))}
                  onBlur={() => handleUpdate({ address: privateInfo.residingAddress })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              ) : (
                <p className="text-gray-900">{privateInfo.residingAddress || employee.address || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              {isEditing ? (
                <input
                  type="text"
                  value={privateInfo.nationality}
                  onChange={(e) => setPrivateInfo(prev => ({ ...prev, nationality: e.target.value }))}
                  onBlur={() => handleUpdate({ nationality: privateInfo.nationality })}
                  className="w-full p-2 border rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{privateInfo.nationality || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={privateInfo.personalEmail}
                  onChange={(e) => setPrivateInfo(prev => ({ ...prev, personalEmail: e.target.value }))}
                  onBlur={() => handleUpdate({ personalEmail: privateInfo.personalEmail })}
                  className="w-full p-2 border rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{privateInfo.personalEmail || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              {isEditing ? (
                <select
                  value={privateInfo.gender}
                  onChange={(e) => setPrivateInfo(prev => ({ ...prev, gender: e.target.value }))}
                  onBlur={() => handleUpdate({ gender: privateInfo.gender })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900">{privateInfo.gender || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
              {isEditing ? (
                <select
                  value={privateInfo.maritalStatus}
                  onChange={(e) => setPrivateInfo(prev => ({ ...prev, maritalStatus: e.target.value }))}
                  onBlur={() => handleUpdate({ maritalStatus: privateInfo.maritalStatus })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              ) : (
                <p className="text-gray-900">{privateInfo.maritalStatus || 'Not provided'}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'salary' && (isAdmin || employee.userId === user?.id) && (
          <div className="space-y-6">
            {/* Wage Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month Wage</label>
                {isEditing ? (
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={salaryData.monthlyWage}
                      onChange={(e) => {
                        const wage = parseFloat(e.target.value) || 0;
                        setSalaryData(prev => ({ ...prev, monthlyWage: wage, yearlyWage: wage * 12 }));
                      }}
                      className="w-full p-2 border rounded-lg"
                    />
                    <span className="ml-2 text-gray-600">/ Month</span>
                  </div>
                ) : (
                  <p className="text-gray-900">₹{salaryData.monthlyWage.toLocaleString()} / Month</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Wage</label>
                {isEditing ? (
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={salaryData.yearlyWage}
                      onChange={(e) => {
                        const wage = parseFloat(e.target.value) || 0;
                        setSalaryData(prev => ({ ...prev, yearlyWage: wage, monthlyWage: wage / 12 }));
                      }}
                      className="w-full p-2 border rounded-lg"
                    />
                    <span className="ml-2 text-gray-600">/ Yearly</span>
                  </div>
                ) : (
                  <p className="text-gray-900">₹{salaryData.yearlyWage.toLocaleString()} / Yearly</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No of working days in a week</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={salaryData.workingDaysPerWeek}
                    onChange={(e) => setSalaryData(prev => ({ ...prev, workingDaysPerWeek: parseInt(e.target.value) || 5 }))}
                    onBlur={() => handleUpdate({ workingDaysPerWeek: salaryData.workingDaysPerWeek })}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{salaryData.workingDaysPerWeek}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Break Time</label>
                {isEditing ? (
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={salaryData.breakTimeHours}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, breakTimeHours: parseFloat(e.target.value) || 1 }))}
                      onBlur={() => handleUpdate({ breakTimeHours: salaryData.breakTimeHours })}
                      className="w-full p-2 border rounded-lg"
                    />
                    <span className="ml-2 text-gray-600">/hrs</span>
                  </div>
                ) : (
                  <p className="text-gray-900">{salaryData.breakTimeHours} /hrs</p>
                )}
              </div>
            </div>

            {/* Salary Components */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Components</h3>
              <div className="space-y-4">
                {salaryData.salaryComponents.map((component, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{component.name}</label>
                        {isEditing ? (
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={component.type === 'percentage' ? component.value : component.amount}
                              onChange={(e) => {
                                const components = [...salaryData.salaryComponents];
                                const val = parseFloat(e.target.value) || 0;
                                if (component.type === 'percentage') {
                                  components[index].value = val;
                                } else {
                                  components[index].value = val;
                                  components[index].amount = val;
                                }
                                setSalaryData(prev => ({ ...prev, salaryComponents: components }));
                                setTimeout(calculateSalaryComponents, 100);
                              }}
                              className="w-full p-2 border rounded-lg"
                              step="0.01"
                            />
                            <span className="ml-2 text-gray-600">{component.type === 'percentage' ? '%' : '₹'}</span>
                          </div>
                        ) : (
                          <p className="text-gray-900">
                            {component.type === 'percentage' ? `${component.value}%` : `₹${component.value.toLocaleString()}`}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <p className="text-gray-900">₹{component.amount.toFixed(2).toLocaleString()} / month</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                        <p className="text-gray-900">
                          {salaryData.monthlyWage > 0 ? ((component.amount / salaryData.monthlyWage) * 100).toFixed(2) : 0}%
                        </p>
                      </div>
                    </div>
                    {component.description && (
                      <p className="text-sm text-gray-600 mt-2">{component.description}</p>
                    )}
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₹{totalComponents.toFixed(2).toLocaleString()} / month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Provident Fund (PF) Contribution</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    {isEditing ? (
                      <div>
                        <div className="flex items-center mb-2">
                          <input
                            type="number"
                            value={salaryData.pfEmployeeRate}
                            onChange={(e) => setSalaryData(prev => ({ ...prev, pfEmployeeRate: parseFloat(e.target.value) || 12 }))}
                            onBlur={() => handleUpdate({ pfEmployeeRate: salaryData.pfEmployeeRate })}
                            className="w-full p-2 border rounded-lg"
                            step="0.01"
                          />
                          <span className="ml-2 text-gray-600">%</span>
                        </div>
                        <p className="text-sm text-gray-600">Amount: ₹{pfEmployee.toFixed(2).toLocaleString()} / month</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-900">{salaryData.pfEmployeeRate}%</p>
                        <p className="text-sm text-gray-600">Amount: ₹{pfEmployee.toFixed(2).toLocaleString()} / month</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-1">PF is calculated based on the basic salary</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                    {isEditing ? (
                      <div>
                        <div className="flex items-center mb-2">
                          <input
                            type="number"
                            value={salaryData.pfEmployerRate}
                            onChange={(e) => setSalaryData(prev => ({ ...prev, pfEmployerRate: parseFloat(e.target.value) || 12 }))}
                            onBlur={() => handleUpdate({ pfEmployerRate: salaryData.pfEmployerRate })}
                            className="w-full p-2 border rounded-lg"
                            step="0.01"
                          />
                          <span className="ml-2 text-gray-600">%</span>
                        </div>
                        <p className="text-sm text-gray-600">Amount: ₹{pfEmployer.toFixed(2).toLocaleString()} / month</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-900">{salaryData.pfEmployerRate}%</p>
                        <p className="text-sm text-gray-600">Amount: ₹{pfEmployer.toFixed(2).toLocaleString()} / month</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-1">PF is calculated based on the basic salary</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Deductions</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="number"
                        value={salaryData.professionalTax}
                        onChange={(e) => setSalaryData(prev => ({ ...prev, professionalTax: parseFloat(e.target.value) || 200 }))}
                        onBlur={() => handleUpdate({ professionalTax: salaryData.professionalTax })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <p className="text-sm text-gray-600 mt-1">Professional Tax deducted from the Gross salary</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-900">₹{salaryData.professionalTax.toLocaleString()} / month</p>
                      <p className="text-sm text-gray-600 mt-1">Professional Tax deducted from the Gross salary</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={salaryData.bankAccountNumber}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      onBlur={() => handleUpdate({ bankAccountNumber: salaryData.bankAccountNumber })}
                      className="w-full p-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{salaryData.bankAccountNumber || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={salaryData.bankName}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, bankName: e.target.value }))}
                      onBlur={() => handleUpdate({ bankName: salaryData.bankName })}
                      className="w-full p-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{salaryData.bankName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={salaryData.ifscCode}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                      onBlur={() => handleUpdate({ ifscCode: salaryData.ifscCode })}
                      className="w-full p-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{salaryData.ifscCode || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={salaryData.panNumber}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                      onBlur={() => handleUpdate({ panNumber: salaryData.panNumber })}
                      className="w-full p-2 border rounded-lg"
                      maxLength={10}
                    />
                  ) : (
                    <p className="text-gray-900">{salaryData.panNumber || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UAN NO</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={salaryData.uanNumber}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, uanNumber: e.target.value }))}
                      onBlur={() => handleUpdate({ uanNumber: salaryData.uanNumber })}
                      className="w-full p-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{salaryData.uanNumber || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emp Code</label>
                  <p className="text-gray-900">{employee.employeeId}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <Button onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setError('');
        }}
        title="Change Password"
      >
        <ChangePasswordForm
          onSubmit={handleChangePassword}
          onCancel={() => {
            setShowPasswordModal(false);
            setError('');
          }}
        />
      </Modal>
    </div>
  );
};
