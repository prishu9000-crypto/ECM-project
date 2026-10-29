import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Power,
  Edit,
  Download,
  Eye,
  Mail,
  Hash,
  BookOpen,
  Lock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getUsersByRole, addUser, updateUser, deleteUser, toggleUserStatus } from '../../services/userService';
import { DEMO_ATTENDANCE_RECORDS } from '../../services/demoSeedService';
import { exportStudentCertificatePDF } from '../../lib/pdfExport';
import { exportToCSV } from '../../lib/csvExport';
import { validateCollegeEmail, validateRollNumber, validatePassword } from '../../lib/validation';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

export default function AdminStudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    department: 'Computer Science & Engineering',
    academicYear: 'Final Year (4th)',
    section: 'A',
    password: 'StudentPassword123!'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
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

  useEffect(() => {
    loadStudents();
    if (searchParams.get('action') === 'new') {
      handleOpenAdd();
    }
  }, [searchParams]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await getUsersByRole('student');
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      fullName: '',
      email: '',
      rollNumber: '',
      department: 'Computer Science & Engineering',
      academicYear: 'Final Year (4th)',
      section: 'A',
      password: 'StudentPassword123!'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName || '',
      email: student.email || '',
      rollNumber: student.rollNumber || '',
      department: student.department || 'Computer Science & Engineering',
      academicYear: student.academicYear || 'Final Year (4th)',
      section: student.section || 'A',
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

    const rollCheck = validateRollNumber(formData.rollNumber);
    if (!rollCheck.valid) {
      errors.rollNumber = rollCheck.message;
    }

    if (!editingStudent) {
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
      if (editingStudent) {
        await updateUser(editingStudent.uid, 'student', {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          rollNumber: formData.rollNumber.trim().toUpperCase(),
          department: formData.department,
          academicYear: formData.academicYear,
          section: formData.section
        });
        setActionMessage({ type: 'success', text: `Student ${formData.fullName} updated.` });
      } else {
        await addUser({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          rollNumber: formData.rollNumber.trim().toUpperCase(),
          department: formData.department,
          academicYear: formData.academicYear,
          section: formData.section,
          role: 'student',
          accountStatus: 'active'
        });
        setActionMessage({ type: 'success', text: `Student ${formData.fullName} successfully added.` });
      }
      setIsModalOpen(false);
      loadStudents();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      await toggleUserStatus(student.uid, 'student', student.accountStatus);
      setActionMessage({
        type: 'success',
        text: `Student status changed to ${student.accountStatus === 'active' ? 'Suspended' : 'Active'}.`
      });
      loadStudents();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmStudent) return;
    try {
      await deleteUser(deleteConfirmStudent.uid, 'student');
      setActionMessage({ type: 'success', text: `Student ${deleteConfirmStudent.fullName} removed successfully.` });
      setDeleteConfirmStudent(null);
      loadStudents();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Roll Number', 'Full Name', 'Email', 'Department', 'Year', 'Section', 'Verified Hours', 'Status'];
    const rows = filtered.map(s => [
      s.rollNumber,
      s.fullName,
      s.email,
      s.department,
      s.academicYear,
      s.section,
      s.totalVerifiedHours || '0.00',
      s.accountStatus || 'active'
    ]);
    exportToCSV('Student_Roster', headers, rows);
  };

  const handleExportPDF = (student) => {
    exportStudentCertificatePDF({
      student,
      records: DEMO_ATTENDANCE_RECORDS
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Roster & Verification</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered students, verified participation hours, student administration, and accreditation certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add Student
          </Button>
        </div>
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
            placeholder="Search by student name, roll number (e.g. 21CS042), department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Student List Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department & Year</th>
                <th className="py-3 px-4">Verified Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((stu) => (
                <tr key={stu.uid} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary-700">{stu.rollNumber}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-800">{stu.fullName}</p>
                    <p className="text-[11px] text-slate-400">{stu.email}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-slate-700 font-medium">{stu.department}</p>
                    <p className="text-[11px] text-slate-400">{stu.academicYear} • Sec {stu.section || 'A'}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {stu.totalVerifiedHours || '0.00'} hrs
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={stu.accountStatus === 'active' ? 'success' : 'danger'}>
                      {stu.accountStatus || 'active'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="xs" variant="ghost" icon={Eye} onClick={() => setSelectedStudent(stu)}>
                        Details
                      </Button>

                      <button
                        onClick={() => handleOpenEdit(stu)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100"
                        title="Edit Student Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(stu)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          stu.accountStatus === 'active'
                            ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={stu.accountStatus === 'active' ? 'Deactivate Student' : 'Activate Student'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmStudent(stu)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Remove Student"
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? "Edit Student Details" : "Add Student Record"}
        maxWidth="max-w-xl"
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button size="sm" variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
              {editingStudent ? "Save Changes" : "Register Student"}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Aditya Verma"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              error={formErrors.fullName}
              required
            />

            <Input
              label="College Email"
              type="email"
              placeholder="e.g. aditya.21cs@apex.edu.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Roll Number"
              placeholder="e.g. 21CS042"
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              error={formErrors.rollNumber}
              required
            />

            <Select
              label="Academic Year"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              options={yearOptions}
              required
            />

            <Select
              label="Section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              options={sectionOptions}
              required
            />
          </div>

          <Select
            label="Department / Degree Program"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={departments}
            required
          />

          {!editingStudent && (
            <Input
              label="Initial Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              helperText="The student can sign in with this temporary password."
              required
            />
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={Boolean(deleteConfirmStudent)}
        onClose={() => setDeleteConfirmStudent(null)}
        title="Confirm Student Removal"
        maxWidth="max-w-md"
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setDeleteConfirmStudent(null)}>Cancel</Button>
            <Button size="sm" variant="danger" icon={Trash2} onClick={handleDelete}>
              Confirm & Remove Student
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to remove student <strong>{deleteConfirmStudent?.fullName}</strong> (Roll No: <strong>{deleteConfirmStudent?.rollNumber}</strong>)?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <strong>Warning:</strong> Deleting this student record will remove their profile and credentials.
          </div>
        </div>
      </Modal>

      {/* Student Profile & History Modal */}
      {selectedStudent && (
        <Modal
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          title={`Student Profile: ${selectedStudent.fullName}`}
          maxWidth="max-w-xl"
          footer={
            <>
              <Button size="sm" variant="outline" onClick={() => setSelectedStudent(null)}>Close</Button>
              <Button size="sm" variant="primary" icon={Download} onClick={() => handleExportPDF(selectedStudent)}>
                Download Certificate PDF
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Roll Number:</span>
                <span className="font-mono font-bold text-primary-700 text-sm">{selectedStudent.rollNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Department:</span>
                <span className="font-semibold text-slate-800">{selectedStudent.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Verified Hours:</span>
                <span className="font-bold text-emerald-700 text-sm">{selectedStudent.totalVerifiedHours || '0.00'} hrs</span>
              </div>
              <div>
                <span className="text-slate-400 block">Events Attended:</span>
                <span className="font-semibold text-slate-800">{selectedStudent.attendedEventsCount || 0} events</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Verified Attendance History</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5">Event</th>
                      <th className="p-2.5">Hours</th>
                      <th className="p-2.5">Attendance %</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DEMO_ATTENDANCE_RECORDS.map((rec) => (
                      <tr key={rec.recordId}>
                        <td className="p-2.5 font-medium text-slate-800">{rec.eventTitle}</td>
                        <td className="p-2.5 font-bold">{rec.verifiedHours} hrs</td>
                        <td className="p-2.5">{rec.attendancePercentage}%</td>
                        <td className="p-2.5"><Badge>{rec.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
