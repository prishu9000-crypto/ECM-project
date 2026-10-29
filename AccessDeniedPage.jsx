import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import Button from '../../components/common/Button';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Denied</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          You do not have the required role permissions (Administrator or Event Coordinator) to view this protected resource.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" icon={Home}>Home</Button>
          </Link>
          <Link to="/login">
            <Button variant="primary" size="sm" icon={ArrowLeft}>Sign In as Authorized User</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
