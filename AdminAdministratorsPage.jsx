import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Search,
  Trash2,
  Power,
  Edit,
  Mail,
  Building,
  Lock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getUsersByRole, addUser, updateUser, deleteUser, toggleUserStatus } from '../../services/userService';
import { useAuth } from '../../app/providers';
import { validateCollegeEmail, validatePassword } from '../../lib/validation';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

export default function AdminAdministratorsPage() {
  const { user: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deleteConfirmAdmin, setDeleteConfirmAdmin] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: 'Computer Science & Engineering',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Dean of Student Affairs',
    'Dean of Academics',
    'Electronics & Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering'
  ];

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await getUsersByRole('admin');
      setAdmins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = admins.filter(a =>
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setFormData({
      fullName: '',
      email: '',
      department: 'Computer Science & Engineering',
      password: 'AdminPassword123!'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      fullName: admin.fullName || '',
      email: admin.email || '',
      department: admin.department || 'Computer Science & Engineering',
      password: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    const errors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = 'Full Name is required (minimum 2 characters).';
    }

    const emailCheck = validateCollegeEmail(formData.email);
    if (!emailCheck.valid) {
      errors.email = emailCheck.message;
    }

    if (!editingAdmin) {
      const pwdCheck = validatePassword(formData.password);
      if (!pwdCheck.valid) {
        errors.password = pwdCheck.message;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAdmin) {
        await updateUser(editingAdmin.uid, 'admin', {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          department: formData.department
        });
        setActionMessage({ type: 'success', text: `Administrator ${formData.fullName} updated.` });
      } else {
        await addUser({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          department: formData.department,
          role: 'admin',
          accountStatus: 'active'
        });
        setActionMessage({ type: 'success', text: `New Administrator ${formData.fullName} successfully added.` });
      }
      setIsModalOpen(false);
      loadAdmins();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    if (admin.uid === currentAdmin?.uid) {
      setActionMessage({ type: 'error', text: 'You cannot deactivate your own administrative account.' });
      return;
    }
    try {
      await toggleUserStatus(admin.uid, 'admin', admin.accountStatus);
      setActionMessage({
        type: 'success',
        text: `Administrator status changed to ${admin.accountStatus === 'active' ? 'Suspended' : 'Active'}.`
      });
      loadAdmins();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmAdmin) return;
    if (deleteConfirmAdmin.uid === currentAdmin?.uid) {
      setActionMessage({ type: 'error', text: 'You cannot remove your own active administrative account.' });
      setDeleteConfirmAdmin(null);
      return;
    }
    try {
      await deleteUser(deleteConfirmAdmin.uid, 'admin');
      setActionMessage({ type: 'success', text: `Administrator ${deleteConfirmAdmin.fullName} removed successfully.` });
      setDeleteConfirmAdmin(null);
      loadAdmins();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administrators</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage authorized system administrators, provision new privileged users, or revoke administrative access.
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add Administrator
        </Button>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs font-semibold hover:opacity-75">Dismiss</button>
        </div>
      )}

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by administrator name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Administrators Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Administrator Name</th>
                <th className="py-3 px-4">College Email</th>
                <th className="py-3 px-4">Department / Office</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((adm) => (
                <tr key={adm.uid} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {adm.fullName?.charAt(0) || 'A'}
                    </div>
                    <span>{adm.fullName}</span>
                    {adm.uid === currentAdmin?.uid && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">You</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{adm.email}</td>
                  <td className="py-3.5 px-4">{adm.department || 'General Administration'}</td>
                  <td className="py-3.5 px-4 text-slate-400">{formatDateTime(adm.createdAt)}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={adm.accountStatus === 'active' ? 'success' : 'danger'}>
                      {adm.accountStatus || 'active'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(adm)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100"
                        title="Edit Administrator Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(adm)}
                        disabled={adm.uid === currentAdmin?.uid}
                        className={`p-1.5 rounded-lg transition-colors ${
                          adm.accountStatus === 'active'
                            ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                        title={adm.accountStatus === 'active' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmAdmin(adm)}
                        disabled={adm.uid === currentAdmin?.uid}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove Administrator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Admin Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? "Edit Administrator Details" : "Add System Administrator"}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button size="sm" variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
              {editingAdmin ? "Save Changes" : "Create Administrator"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <Input
            label="Full Name & Title"
            icon={Shield}
            placeholder="e.g. Dr. Rajesh Sharma"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={formErrors.fullName}
            required
          />

          <Input
            label="College Email"
            type="email"
            icon={Mail}
            placeholder="e.g. rajesh.sharma@apex.edu.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            required
          />

          <Select
            label="Department / Administrative Office"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={departments}
            required
          />

          {!editingAdmin && (
            <Input
              label="Initial Password"
              type="password"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              helperText="The administrator will use these credentials to sign in."
              required
            />
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={Boolean(deleteConfirmAdmin)}
        onClose={() => setDeleteConfirmAdmin(null)}
        title="Confirm Administrator Removal"
        maxWidth="max-w-md"
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setDeleteConfirmAdmin(null)}>Cancel</Button>
            <Button size="sm" variant="danger" icon={Trash2} onClick={handleDelete}>
              Confirm & Remove Admin
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to remove administrator <strong>{deleteConfirmAdmin?.fullName}</strong> ({deleteConfirmAdmin?.email})?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <strong>Warning:</strong> This will revoke all administrative privileges, preventing this user from managing events, coordinators, or university reports.
          </div>
        </div>
      </Modal>
    </div>
  );
}
