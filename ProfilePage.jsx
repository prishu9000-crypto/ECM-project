import React from 'react';
import { User, Mail, Hash, BookOpen, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../app/providers';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile Details</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized academic identity and enrollment information registered with the college.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 font-bold text-2xl flex items-center justify-center border border-primary-200">
            {(user?.fullName || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.fullName || 'Aditya Verma'}</h3>
            <p className="text-xs text-slate-500">{user?.email || 'aditya.21cs@apex.edu.in'}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="success">Active Enrollment</Badge>
              <Badge variant="primary">Verified Student</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Student Roll Number:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {user?.rollNumber || '21CS042'}
              </span>
              <Lock className="w-3.5 h-3.5 text-slate-400" title="Immutable" />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Department / Branch:</span>
            <span className="font-semibold text-slate-900">
              {user?.department || 'Computer Science & Engineering'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Academic Year:</span>
            <span className="font-semibold text-slate-900">
              {user?.academicYear || 'Final Year (4th)'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Class Section:</span>
            <span className="font-semibold text-slate-900">
              Section {user?.section || 'A'}
            </span>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Academic Integrity & Identity Protection
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            In compliance with college data rules, your student roll number, college email domain, and role privileges are locked. Contact your academic department head or IT coordinator to request official profile corrections.
          </p>
        </div>
      </Card>
    </div>
  );
}
