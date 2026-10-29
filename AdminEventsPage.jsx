import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Archive,
  CheckCircle,
  XCircle,
  Users,
  MapPin,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { getEvents, createEvent, updateEvent, setEventStatus } from '../../services/eventService';
import { useAuth } from '../../app/providers';
import { validateEventInput } from '../../lib/validation';
import { formatDateTime } from '../../lib/dateUtils';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical Workshop',
    venue: '',
    startAt: '',
    endAt: '',
    registrationDeadline: '',
    maxParticipants: 100,
    status: 'published',
    coordinatorUids: ['demo_coord_01'],
    requireCheckout: true,
    minAttendancePercent: 75
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Technical Workshop',
    'Hackathon',
    'College Cultural Fest',
    'NSS Community Service',
    'Career Guidance Seminar',
    'Sports Tournament',
    'Academic Symposium'
  ];

  const statuses = ['draft', 'published', 'ongoing', 'completed', 'cancelled', 'archived'];

  useEffect(() => {
    loadEvents();
  }, [statusFilter, categoryFilter]);

  // Open modal if URL parameter action=new or edit=id
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreate();
    } else if (searchParams.get('edit')) {
      const targetId = searchParams.get('edit');
      const found = events.find(e => e.eventId === targetId);
      if (found) handleOpenEdit(found);
    }
  }, [searchParams, events]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents({
        status: statusFilter,
        category: categoryFilter,
        search
      });
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const dayAfter = new Date(now.getTime() + 28 * 3600 * 1000);

    setFormData({
      title: '',
      description: '',
      category: 'Technical Workshop',
      venue: '',
      startAt: tomorrow.toISOString().slice(0, 16),
      endAt: dayAfter.toISOString().slice(0, 16),
      registrationDeadline: tomorrow.toISOString().slice(0, 16),
      maxParticipants: 100,
      status: 'published',
      coordinatorUids: ['demo_coord_01'],
      requireCheckout: true,
      minAttendancePercent: 75
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title || '',
      description: evt.description || '',
      category: evt.category || 'Technical Workshop',
      venue: evt.venue || '',
      startAt: evt.startAt ? new Date(evt.startAt).toISOString().slice(0, 16) : '',
      endAt: evt.endAt ? new Date(evt.endAt).toISOString().slice(0, 16) : '',
      registrationDeadline: evt.registrationDeadline ? new Date(evt.registrationDeadline).toISOString().slice(0, 16) : '',
      maxParticipants: evt.maxParticipants || 100,
      status: evt.status || 'published',
      coordinatorUids: evt.coordinatorUids || ['demo_coord_01'],
      requireCheckout: evt.attendancePolicy?.requireCheckout ?? true,
      minAttendancePercent: evt.attendancePolicy?.minAttendancePercent ?? 75
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateEventInput(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        venue: formData.venue.trim(),
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
        maxParticipants: parseInt(formData.maxParticipants, 10),
        status: formData.status,
        coordinatorUids: formData.coordinatorUids,
        attendancePolicy: {
          requireCheckout: formData.requireCheckout,
          minAttendancePercent: parseInt(formData.minAttendancePercent, 10)
        }
      };

      if (editingEvent) {
        await updateEvent(editingEvent.eventId, payload);
      } else {
        await createEvent(payload, user?.uid || 'admin');
      }

      setIsModalOpen(false);
      setSearchParams({});
      loadEvents();
    } catch (err) {
      console.error(err);
      setFormErrors({ general: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await setEventStatus(eventId, newStatus);
      loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Event Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, schedule, publish, and manage college events and coordinator allocations.
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Create New Event
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events by title, venue, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEvents()}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white capitalize"
            >
              <option value="all">All Statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      {events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="There are currently no events matching your query."
          actionLabel="Create First Event"
          onAction={handleOpenCreate}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Venue & Schedule</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <tr key={evt.eventId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{evt.title}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{evt.description}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{evt.category}</td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <p className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {evt.venue}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatDateTime(evt.startAt)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{evt.registeredCount || 0} / {evt.maxParticipants}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{evt.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100"
                          title="Edit Event"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {evt.status !== 'cancelled' ? (
                          <button
                            onClick={() => handleStatusChange(evt.eventId, 'cancelled')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                            title="Cancel Event"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(evt.eventId, 'published')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100"
                            title="Re-Publish Event"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(evt.eventId, 'archived')}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Archive Event"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSearchParams({}); }}
        title={editingEvent ? "Edit College Event" : "Create New College Event"}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleSubmit}>
              {editingEvent ? "Save Changes" : "Publish Event"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <Input
            label="Event Title"
            placeholder="e.g. Cloud Native DevOps & Kubernetes Workshop"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={formErrors.title}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Event Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categories}
              required
            />

            <Input
              label="Campus Venue"
              placeholder="e.g. APJ Abdul Kalam Seminar Hall"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              error={formErrors.venue}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              error={formErrors.startAt}
              required
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              error={formErrors.endAt}
              required
            />

            <Input
              label="Registration Deadline"
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
              error={formErrors.registrationDeadline}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Max Participant Capacity"
              type="number"
              min="1"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              error={formErrors.maxParticipants}
              required
            />

            <Select
              label="Initial Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={statuses}
              required
            />

            <Input
              label="Min Attendance % for Credit"
              type="number"
              min="1"
              max="100"
              value={formData.minAttendancePercent}
              onChange={(e) => setFormData({ ...formData, minAttendancePercent: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Event Description</label>
            <textarea
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Detailed description of topics, speaker credentials, and prerequisites..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
