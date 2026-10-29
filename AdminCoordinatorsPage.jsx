import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  Search,
  Trash2,
  Power,
  Edit,
  Mail,
  Building,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getUsersByRole, addUser, updateUser, deleteUser, toggleUserStatus } from '../../services/userService';
import { validateCollegeEmail, validatePassword } from '../../lib/validation';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

export default function AdminCoordinatorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState(null);
  const [deleteConfirmCoord, setDeleteConfirmCoord] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: 'Computer Science & Engineering',
    temporaryPassword: 'TempPassword123!'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical & Electronics Engineering'
  ];

  useEffect(() => {
    loadCoordinators();
    if (searchParams.get('action') === 'new') {
      handleOpenAdd();
    }
  }, [searchParams]);

  const loadCoordinators = async () => {
    setLoading(true);
    try {
      const data = await getUsersByRole('coordinator');
      setCoordinators(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = coordinators.filter(c =>
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCoordinator(null);
    setFormData({
      fullName: '',
      email: '',
      department: 'Computer Science & Engineering',
      temporaryPassword: 'TempPassword123!'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coord) => {
    setEditingCoordinator(coord);
    setFormData({
      fullName: coord.fullName || '',
      email: coord.email || '',
      department: coord.department || 'Computer Science & Engineering',
      temporaryPassword: ''
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

    if (!editingCoordinator) {
      const pwdCheck = validatePassword(formData.temporaryPassword);
      if (!pwdCheck.valid) {
        errors.temporaryPassword = pwdCheck.message;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCoordinator) {
        await updateUser(editingCoordinator.uid, 'coordinator', {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          department: formData.department
        });
        setActionMessage({ type: 'success', text: `Coordinator ${formData.fullName} updated.` });
      } else {
        await addUser({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          department: formData.department,
          role: 'coordinator',
          accountStatus: 'active'
        });
        setActionMessage({ type: 'success', text: `Coordinator ${formData.fullName} successfully added.` });
      }
      setIsModalOpen(false);
      loadCoordinators();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (coord) => {
    try {
      await toggleUserStatus(coord.uid, 'coordinator', coord.accountStatus);
      setActionMessage({
        type: 'success',
        text: `Coordinator status changed to ${coord.accountStatus === 'active' ? 'Suspended' : 'Active'}.`
      });
      loadCoordinators();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCoord) return;
    try {
      await deleteUser(deleteConfirmCoord.uid, 'coordinator');
      setActionMessage({ type: 'success', text: `Coordinator ${deleteConfirmCoord.fullName} removed successfully.` });
      setDeleteConfirmCoord(null);
      loadCoordinators();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Coordinators</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage authorized faculty event coordinators, issue credentials, and assign sessions.
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add Coordinator
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
            placeholder="Search by coordinator name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Coordinator Name</th>
                <th className="py-3 px-4">College Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Events</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.uid} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                      {c.fullName?.charAt(0) || 'C'}
                    </div>
                    <span>{c.fullName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{c.email}</td>
                  <td className="py-3.5 px-4">{c.department}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{c.assignedEventsCount || 0} events</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={c.accountStatus === 'active' ? 'success' : 'danger'}>
                      {c.accountStatus || 'active'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100"
                        title="Edit Coordinator Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          c.accountStatus === 'active'
                            ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={c.accountStatus === 'active' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmCoord(c)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Remove Coordinator"
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

      {/* Add / Edit Coordinator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoordinator ? "Edit Coordinator Details" : "Provision Faculty Coordinator Account"}
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button size="sm" variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
              {editingCoordinator ? "Save Changes" : "Create Coordinator"}
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
            icon={UserCheck}
            placeholder="e.g. Prof. Rajesh Mehra"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={formErrors.fullName}
            required
          />

          <Input
            label="Official College Email"
            type="email"
            icon={Mail}
            placeholder="e.g. rajesh.mehra@apex.edu.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            required
          />

          <Select
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={departments}
            required
          />

          {!editingCoordinator && (
            <Input
              label="Temporary Password"
              value={formData.temporaryPassword}
              onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
              error={formErrors.temporaryPassword}
              helperText="The coordinator will be prompted to reset their password upon initial login."
              required
            />
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={Boolean(deleteConfirmCoord)}
        onClose={() => setDeleteConfirmCoord(null)}
        title="Confirm Coordinator Removal"
        maxWidth="max-w-md"
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setDeleteConfirmCoord(null)}>Cancel</Button>
            <Button size="sm" variant="danger" icon={Trash2} onClick={handleDelete}>
              Confirm & Remove Coordinator
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to remove coordinator <strong>{deleteConfirmCoord?.fullName}</strong> ({deleteConfirmCoord?.email})?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <strong>Warning:</strong> The coordinator will lose access to launch live QR attendance sessions or view event participant telemetry.
          </div>
        </div>
      </Modal>
    </div>
  );
}
