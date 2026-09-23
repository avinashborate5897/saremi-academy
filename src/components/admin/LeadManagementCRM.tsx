import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronRight,
  MessageSquare,
  FileText,
  UserCheck,
  X,
  Send,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { Lead, LeadStatus, LeadNote } from '../../types';
import {
  subscribeToLeads,
  updateLeadStatus,
  addLeadNote,
  subscribeToLeadNotes,
  createLeadInFirestore
} from '../../lib/courseCrmService';
import { COURSES_DATA } from '../../data/coursesData';

const ALL_LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Trial Scheduled',
  'Trial Completed',
  'Interested',
  'Enrolled',
  'Follow-up',
  'Lost'
];

export const LeadManagementCRM: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState<LeadNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [showNewLeadModal, setShowNewLeadModal] = useState<boolean>(false);

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    student_name: '',
    parent_name: '',
    phone: '',
    email: '',
    age: 'Adults (18+)',
    course: COURSES_DATA[0].name,
    level: 'Foundation',
    teacher: 'Assigned Guru',
    preferred_date: new Date().toISOString().split('T')[0],
    preferred_time: '6:00 PM',
    timezone: 'IST',
    learning_goal: '',
    notes: '',
    source: 'Phone Inquiry / Walk-in'
  });

  // Real-time leads subscription
  useEffect(() => {
    const unsub = subscribeToLeads((fetched) => {
      setLeads(fetched);
    });
    return () => unsub();
  }, []);

  // Real-time notes subscription for selected lead
  useEffect(() => {
    if (!selectedLead) {
      setLeadNotes([]);
      return;
    }
    const unsubNotes = subscribeToLeadNotes(selectedLead.id, (notes) => {
      setLeadNotes(notes);
    });
    return () => unsubNotes();
  }, [selectedLead?.id]);

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lead.student_name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.course.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await updateLeadStatus(leadId, newStatus);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNoteContent.trim()) return;

    setIsAddingNote(true);
    try {
      await addLeadNote(selectedLead.id, newNoteContent.trim());
      setNewNoteContent('');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.student_name || !newLeadForm.email || !newLeadForm.phone) {
      alert('Please fill out student name, email, and phone.');
      return;
    }

    const leadId = `lead-${Date.now()}`;
    await createLeadInFirestore({
      id: leadId,
      student_name: newLeadForm.student_name,
      parent_name: newLeadForm.parent_name,
      phone: newLeadForm.phone,
      email: newLeadForm.email,
      age: newLeadForm.age,
      course: newLeadForm.course,
      level: newLeadForm.level,
      teacher: newLeadForm.teacher,
      preferred_date: newLeadForm.preferred_date,
      preferred_time: newLeadForm.preferred_time,
      timezone: newLeadForm.timezone,
      learning_goal: newLeadForm.learning_goal,
      status: 'New',
      notes: newLeadForm.notes,
      source: newLeadForm.source
    });

    setShowNewLeadModal(false);
    setNewLeadForm({
      student_name: '',
      parent_name: '',
      phone: '',
      email: '',
      age: 'Adults (18+)',
      course: COURSES_DATA[0].name,
      level: 'Foundation',
      teacher: 'Assigned Guru',
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time: '6:00 PM',
      timezone: 'IST',
      learning_goal: '',
      notes: '',
      source: 'Phone Inquiry / Walk-in'
    });
  };

  const getStatusBadgeVariant = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Trial Scheduled':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Trial Completed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Interested':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Enrolled':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Follow-up':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Lost':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#121829]">
            Admissions CRM & Lead Pipeline
          </h2>
          <p className="text-xs text-gray-500">
            Track inquiries, diagnostic bookings, follow-ups, and student enrollments in real time.
          </p>
        </div>

        <Button
          variant="brass"
          size="sm"
          className="text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
          onClick={() => setShowNewLeadModal(true)}
        >
          <Plus className="w-4 h-4" /> Add Manual Inquiry
        </Button>
      </div>

      {/* STATUS TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-[#121829] text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Inquiries ({leads.length})
        </button>

        {ALL_LEAD_STATUSES.map((st) => {
          const count = leads.filter((l) => l.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#121829] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{st}</span>
              {count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-800 text-[10px] font-mono">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by student name, email, phone, or course..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-[#121829] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D49A3D]"
        />
      </div>

      {/* LEADS TABLE / LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${selectedLead ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs space-y-2">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto" />
              <p>No inquiries found in this view.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#D49A3D] ring-2 ring-[#D49A3D]/40 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-[#121829]">{lead.student_name}</strong>
                      {lead.parent_name && (
                        <span className="text-[11px] text-gray-500 font-mono">(Parent: {lead.parent_name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${getStatusBadgeVariant(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                      <select
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className="text-[10px] p-1 rounded-md border border-gray-300 bg-gray-50 text-gray-800 font-medium"
                      >
                        {ALL_LEAD_STATUSES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs text-gray-600">
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono block">Course / Discipline</span>
                      <span className="font-semibold text-gray-900">{lead.course}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono block">Preferred Slot</span>
                      <span>{lead.preferred_date || 'TBD'} • {lead.preferred_time || ''}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono block">Contact</span>
                      <span className="font-mono text-[11px]">{lead.phone}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* LEAD DETAILS DRAWER / INSPECTOR (When selected) */}
        {selectedLead && (
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#EAE5DB] shadow-md space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-mono text-[#8C6428] uppercase font-bold block">
                  Lead Dossier
                </span>
                <h3 className="font-serif text-lg font-bold text-[#121829]">
                  {selectedLead.student_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Contact Chips */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-[#8C6428] shrink-0" />
                <a href={`mailto:${selectedLead.email}`} className="hover:underline font-mono">
                  {selectedLead.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-[#8C6428] shrink-0" />
                <a href={`tel:${selectedLead.phone}`} className="hover:underline font-mono">
                  {selectedLead.phone}
                </a>
              </div>
              {selectedLead.parent_name && (
                <div className="text-gray-600 font-mono text-[11px]">
                  Guardian: <strong>{selectedLead.parent_name}</strong>
                </div>
              )}
            </div>

            {/* Program Specs */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DB] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-mono">Program</span>
                <strong>{selectedLead.course}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-mono">Level</span>
                <span>{selectedLead.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-mono">Teacher</span>
                <span>{selectedLead.teacher || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-mono">Source</span>
                <span className="font-mono text-[10px]">{selectedLead.source || 'Website'}</span>
              </div>
            </div>

            {/* Learning Goal */}
            {selectedLead.learning_goal && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Student Learning Goal
                </span>
                <p className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 italic">
                  "{selectedLead.learning_goal}"
                </p>
              </div>
            )}

            {/* Status Transition Row */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                Update Status
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_LEAD_STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedLead.id, st)}
                    className={`p-1.5 rounded-lg text-[11px] font-medium border text-center transition-all cursor-pointer ${
                      selectedLead.status === st
                        ? 'bg-[#121829] text-white border-[#121829]'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Counselor Activity Notes */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-mono uppercase text-[#8C6428] font-bold block">
                Admissions Notes & Timeline ({leadNotes.length})
              </span>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {leadNotes.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No notes logged yet.</p>
                ) : (
                  leadNotes.map((n) => (
                    <div key={n.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                        <strong className="text-gray-700">{n.authorName}</strong>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-800 text-[11px]">{n.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add note on phone conversation, goal..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="flex-1 p-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#D49A3D]"
                />
                <Button
                  type="submit"
                  variant="brass"
                  size="sm"
                  disabled={isAddingNote || !newNoteContent.trim()}
                  className="px-3"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MANUAL INQUIRY CREATION MODAL */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-gray-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif text-lg font-bold text-[#121829]">
                Register Walk-in / Phone Inquiry
              </h3>
              <button
                onClick={() => setShowNewLeadModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualLead} className="space-y-4 text-xs">
              <div>
                <label className="font-mono uppercase text-gray-500 font-bold block mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={newLeadForm.student_name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, student_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="font-mono uppercase text-gray-500 font-bold block mb-1">
                  Parent / Guardian (If minor)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suman Verma"
                  value={newLeadForm.parent_name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, parent_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono uppercase text-gray-500 font-bold block mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91..."
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-mono uppercase text-gray-500 font-bold block mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono uppercase text-gray-500 font-bold block mb-1">
                    Course Discipline
                  </label>
                  <select
                    value={newLeadForm.course}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, course: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white"
                  >
                    {COURSES_DATA.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono uppercase text-gray-500 font-bold block mb-1">
                    Source
                  </label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white"
                  >
                    <option value="Phone Inquiry">Phone Inquiry</option>
                    <option value="Walk-in Admissions">Walk-in Admissions</option>
                    <option value="WhatsApp Direct">WhatsApp Direct</option>
                    <option value="Referral by Student">Referral by Student</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono uppercase text-gray-500 font-bold block mb-1">
                  Counselor Initial Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes from initial conversation..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewLeadModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="brass" size="sm" className="font-bold">
                  Save Lead Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
