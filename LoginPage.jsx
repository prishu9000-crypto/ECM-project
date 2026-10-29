import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldAlert, Sparkles, UserCheck, Shield, GraduationCap } from 'lucide-react';
import { useAuth } from '../../app/providers';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { DEMO_USERS } from '../../services/demoSeedService';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMessage('Invalid credentials. Please verify your email and password.');
      } else {
        setErrorMessage(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'coordinator') navigate('/coordinator');
    else navigate('/student');
  };

  const handleQuickDemoLogin = (roleKey) => {
    const demoUser = DEMO_USERS[roleKey];
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword('password123');
      // Trigger login automatically
      setIsLoading(true);
      login(demoUser.email, 'password123')
        .then((user) => redirectByRole(user.role))
        .catch((err) => setErrorMessage(err.message))
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ECM
          </div>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to Event Cloud</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your authorized college credentials to access your dashboard.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-slate-200/80">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="College Email Address"
              type="email"
              icon={Mail}
              placeholder="e.g. aditya.21cs@apex.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Account Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <span>Remember session</span>
              </label>
              <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              variant="primary"
              size="md"
              icon={LogIn}
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick 1-Click Role Logins for Demonstrations */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 1-Click Academic Evaluation Roles
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-center"
              >
                <Shield className="w-4 h-4 text-primary-600 mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Admin</span>
                <span className="text-[9px] text-slate-400">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('coordinator')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-center"
              >
                <UserCheck className="w-4 h-4 text-purple-600 mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Coordinator</span>
                <span className="text-[9px] text-slate-400">QR Sessions</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-center"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Student</span>
                <span className="text-[9px] text-slate-400">Scan & Hours</span>
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          Enrolled student without an account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:underline">
            Register your student profile
          </Link>
        </p>
      </div>
    </div>
  );
}
