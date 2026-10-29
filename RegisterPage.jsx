import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Hash, BookOpen, Lock, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../app/providers';
import { validateCollegeEmail, validateRollNumber, validatePassword } from '../../lib/validation';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    department: 'Computer Science & Engineering',
    academicYear: 'Final Year (4th)',
    section: 'A',
    password: '',
    confirmPassword: '',
    acceptPrivacy: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const departmentOptions = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence & Data Science'
  ];

  const yearOptions = [
    'First Year (1st)',
    'Second Year (2nd)',
    'Third Year (3rd)',
    'Final Year (4th)'
  ];

  const sectionOptions = ['A', 'B', 'C', 'D'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const newErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name is required (minimum 2 characters).';
    }

    const emailCheck = validateCollegeEmail(formData.email);
    if (!emailCheck.valid) {
      newErrors.email = emailCheck.message;
    }

    const rollCheck = validateRollNumber(formData.rollNumber);
    if (!rollCheck.valid) {
      newErrors.rollNumber = rollCheck.message;
    }

    const pwdCheck = validatePassword(formData.password);
    if (!pwdCheck.valid) {
      newErrors.password = pwdCheck.message;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = 'You must accept the college privacy and attendance policy notice.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        department: formData.department,
        academicYear: formData.academicYear,
        section: formData.section,
        password: formData.password
      });

      navigate('/student');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setGeneralError('An account with this college email already exists. Please sign in instead.');
      } else {
        setGeneralError(err.message || 'Unable to register student. Please check your inputs.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ECM
          </div>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile Registration</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enrolled students must register using their official roll number and university email.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="shadow-lg border-slate-200/80">
          {generalError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="fullName"
                icon={User}
                placeholder="e.g. Aditya Verma"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                required
              />

              <Input
                label="College Email"
                name="email"
                type="email"
                icon={Mail}
                placeholder="e.g. aditya.21cs@apex.edu.in"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Roll Number"
                name="rollNumber"
                icon={Hash}
                placeholder="e.g. 21CS042"
                value={formData.rollNumber}
                onChange={handleChange}
                error={errors.rollNumber}
                required
              />

              <Select
                label="Academic Year"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                options={yearOptions}
                required
              />

              <Select
                label="Section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                options={sectionOptions}
                required
              />
            </div>

            <Select
              label="Department / Degree Program"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={departmentOptions}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Create Password"
                name="password"
                type="password"
                icon={Lock}
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                icon={Lock}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  name="acceptPrivacy"
                  checked={formData.acceptPrivacy}
                  onChange={handleChange}
                  className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>
                  I certify that my roll number and student details are accurate. I accept that attendance duration will be cryptographically calculated via QR check-in & check-out records in compliance with college academic policy.
                </span>
              </label>
              {errors.acceptPrivacy && (
                <p className="text-xs text-rose-600 mt-1">{errors.acceptPrivacy}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              variant="primary"
              size="md"
              icon={ArrowRight}
              isLoading={isLoading}
            >
              Complete Registration & Access Dashboard
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an authorized account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
