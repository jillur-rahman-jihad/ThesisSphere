import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Video,
  FileText,
  X,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  AlertCircle,
  ExternalLink,
  Users,
  ChevronRight
} from 'lucide-react';
import {
  getMeetings,
  getGroups,
  createMeeting,
  updateMeeting,
  deleteMeeting
} from '../services/meetingService';

const Meetings = () => {
  const { currentUser } = useOutletContext();
  const isFaculty = currentUser?.role === 'faculty';

  // State Variables
  const [meetings, setMeetings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notification Banners
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [agenda, setAgenda] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupNameInput, setGroupNameInput] = useState(''); // typed group name
  const [meetingStatus, setMeetingStatus] = useState('scheduled');

  // Filter Tabs
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'

  // Fetch initial data
  useEffect(() => {
    fetchMeetingsAndGroups();
  }, []);

  // Success message auto-dismiss
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchMeetingsAndGroups = async () => {
    try {
      setLoading(true);
      setError('');

      const meetingsResponse = await getMeetings();
      setMeetings(meetingsResponse.data || []);

      const groupsResponse = await getGroups();
      setGroups(groupsResponse.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load page data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setTitle('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const pad = (num) => String(num).padStart(2, '0');
    const localDateTime = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
    setMeetingDate(localDateTime);
    setMeetingLink('');
    setAgenda('');
    setMeetingStatus('scheduled');
    setGroupNameInput('');
    setSelectedGroupId('');
    setSelectedMeetingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (meeting) => {
    setModalMode('edit');
    setSelectedMeetingId(meeting._id);
    setTitle(meeting.title);
    const d = new Date(meeting.meetingDate);
    const pad = (num) => String(num).padStart(2, '0');
    const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setMeetingDate(formattedDate);
    setMeetingLink(meeting.meetingLink || '');
    setAgenda(meeting.agenda || '');
    setMeetingStatus(meeting.status || 'scheduled');
    // Pre-fill group name from loaded groups or the populated field
    const groupId = meeting.thesisGroupId?._id || meeting.thesisGroupId || '';
    setSelectedGroupId(groupId);
    const matchedGroup = groups.find(g => g._id === groupId);
    setGroupNameInput(matchedGroup?.groupName || meeting.thesisGroupId?.groupName || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setErrorMessage('Meeting title is required.');
      return;
    }
    if (!meetingDate) {
      setErrorMessage('Meeting date and time is required.');
      return;
    }

    // Resolve typed group name to a group ID
    const resolvedGroup = groups.find(
      g => g.groupName.toLowerCase().trim() === groupNameInput.toLowerCase().trim()
    );
    const resolvedGroupId = resolvedGroup?._id || selectedGroupId || undefined;

    const payload = {
      title,
      meetingDate: new Date(meetingDate).toISOString(),
      meetingLink,
      agenda,
      thesisGroupId: resolvedGroupId
    };

    try {
      if (modalMode === 'create') {
        const response = await createMeeting(payload);
        setSuccessMessage('Meeting scheduled successfully!');
        setMeetings(prev => [...prev, response.data].sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate)));
      } else {
        // Include status during update
        const updatedPayload = { ...payload, status: meetingStatus };
        const response = await updateMeeting(selectedMeetingId, updatedPayload);
        setSuccessMessage('Meeting updated successfully!');
        setMeetings(prev => prev.map(m => m._id === selectedMeetingId ? response.data : m).sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate)));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Action failed. Please try again.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this meeting? This will notify all participants.')) {
      return;
    }

    try {
      await deleteMeeting(meetingId);
      setSuccessMessage('Meeting cancelled and deleted successfully!');
      setMeetings(prev => prev.filter(m => m._id !== meetingId));
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to cancel the meeting.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleStatusChange = async (meetingId, newStatus) => {
    try {
      const response = await updateMeeting(meetingId, { status: newStatus });
      setSuccessMessage(`Meeting marked as ${newStatus} successfully!`);
      setMeetings(prev => prev.map(m => m._id === meetingId ? response.data : m));
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to update meeting status.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Helper date formatter
  const formatMeetingDate = (dateString) => {
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Filter meetings for the active tab
  const filteredMeetings = meetings.filter(meeting => {
    const now = new Date();
    const mDate = new Date(meeting.meetingDate);

    if (activeTab === 'upcoming') {
      return meeting.status === 'scheduled' && mDate >= now;
    } else if (activeTab === 'completed') {
      return meeting.status === 'completed' || (meeting.status === 'scheduled' && mDate < now);
    } else if (activeTab === 'cancelled') {
      return meeting.status === 'cancelled';
    }
    return true;
  });

  return (
    <>
      {/* Toast Success / Error Alerts */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl shadow-lg animate-message-slide">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Success</p>
            <p className="text-xs text-emerald-700">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage('')} className="ml-4 text-emerald-400 hover:text-emerald-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl shadow-lg animate-message-slide">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Error</p>
            <p className="text-xs text-rose-700">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage('')} className="ml-4 text-rose-400 hover:text-rose-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-6 max-w-6xl mx-auto pb-12 font-['Inter',sans-serif] animate-fade-slide-in">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Meeting Scheduler</h1>
            <p className="text-slate-500 text-sm mt-1">
              Organize, log, and update your research consultations and group discussions.
            </p>
          </div>
          <div>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
          </div>
        </div>

        {/* Tabs Menu */}
        <div className="flex border-b border-slate-200/80">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${activeTab === 'upcoming'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            Upcoming Meetings ({meetings.filter(m => m.status === 'scheduled' && new Date(m.meetingDate) >= new Date()).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${activeTab === 'completed'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            Completed & Past ({meetings.filter(m => m.status === 'completed' || (m.status === 'scheduled' && new Date(m.meetingDate) < new Date())).length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${activeTab === 'cancelled'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            Cancelled ({meetings.filter(m => m.status === 'cancelled').length})
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
            <p className="text-slate-400 font-medium text-sm mt-4">Retrieving meetings list...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base">Unable to Load Data</h3>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchMeetingsAndGroups}
                className="mt-3 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-bold text-lg">No meetings found</h3>
            <p className="text-slate-400 text-sm max-w-md mt-1">
              {activeTab === 'upcoming'
                ? 'You have no scheduled upcoming meetings. Feel free to set one up with your group or supervisor.'
                : `There are no meetings in the "${activeTab}" archive.`}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
              >
                <span>Schedule one now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMeetings.map((meeting) => {
              const isMeetingUpcoming = new Date(meeting.meetingDate) >= new Date();
              return (
                <div
                  key={meeting._id}
                  className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Top Banner / Badges */}
                  <div className="p-6 pb-4 border-b border-slate-50">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${meeting.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : meeting.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : isMeetingUpcoming
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                        <Clock className="w-3 h-3" />
                        <span>
                          {meeting.status === 'cancelled'
                            ? 'Cancelled'
                            : meeting.status === 'completed'
                              ? 'Completed'
                              : isMeetingUpcoming
                                ? 'Scheduled'
                                : 'Needs Review'}
                        </span>
                      </span>

                      {/* Faculty quick action to mark completed/cancelled directly on card */}
                      {isFaculty && meeting.status === 'scheduled' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStatusChange(meeting._id, 'completed')}
                            className="text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition-colors"
                            title="Mark completed"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(meeting._id, 'cancelled')}
                            className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded border border-rose-200 transition-colors"
                            title="Mark cancelled"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 leading-snug hover:text-amber-600 transition-colors">
                      {meeting.title}
                    </h3>

                    {/* Supervisor/Group tags */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Group: <strong className="text-slate-700">{meeting.thesisGroupId?.groupName || 'My Research Group'}</strong>
                        </span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">
                        Supervisor: <strong className="text-slate-700">{meeting.supervisorId?.fullName || 'Not assigned'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 pt-4 pb-5 flex-1 space-y-4">
                    {/* Date & Time */}
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                      <Calendar className="w-4.5 h-4.5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Date</p>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {formatMeetingDate(meeting.meetingDate)}
                        </p>
                      </div>
                    </div>

                    {/* Agenda */}
                    {meeting.agenda && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Meeting Agenda</span>
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-dashed border-slate-100 max-h-24 overflow-y-auto">
                          {meeting.agenda}
                        </p>
                      </div>
                    )}

                    {/* Participants list */}
                    {meeting.participants && meeting.participants.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Participants</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {meeting.participants.map((participant, index) => (
                            <span
                              key={index}
                              className="bg-slate-100/80 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200/30"
                              title={participant.email}
                            >
                              {participant.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {meeting.meetingLink ? (
                        <a
                          href={meeting.meetingLink.startsWith('http') ? meeting.meetingLink : `https://${meeting.meetingLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-lg border border-amber-200/50 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">No video link provided</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Allow editing/deleting if scheduled */}
                      {meeting.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(meeting)}
                            className="flex items-center justify-center p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors"
                            title="Edit details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMeeting(meeting._id)}
                            className="flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                            title="Delete meeting"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Dialog Modal — rendered via Portal to escape parent CSS clipping */}
        {isModalOpen && ReactDOM.createPortal(
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden animate-container-entry" style={{ maxHeight: '90vh', overflowY: 'auto' }}>

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-7 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">
                    {modalMode === 'create' ? '📅 Schedule a New Meeting' : '✏️ Edit Scheduled Meeting'}
                  </h3>
                  <p className="text-amber-100 text-sm mt-1.5">
                    {modalMode === 'create'
                      ? 'Fill in the details below. All participants will be notified automatically.'
                      : 'Update meeting details. Changes will be reflected for all participants.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} className="p-8">

                {/* Group Name Input (Faculty only) */}
                <div className="mb-6">
                  {isFaculty && modalMode === 'create' ? (
                    <div className="space-y-2">
                      <label htmlFor="group-name-input" className="text-sm font-bold text-slate-700 block uppercase tracking-wider">
                        🎓 Thesis Group Name *
                      </label>
                      <input
                        id="group-name-input"
                        type="text"
                        list="groups-datalist"
                        placeholder="Type or search group name..."
                        value={groupNameInput}
                        onChange={(e) => setGroupNameInput(e.target.value)}
                        required
                        autoComplete="off"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400 text-slate-800"
                      />
                      <datalist id="groups-datalist">
                        {groups.map((group) => (
                          <option key={group._id} value={group.groupName} />
                        ))}
                      </datalist>
                      <p className="text-xs text-slate-400 mt-1">Suggestions will appear as you type.</p>
                    </div>
                  ) : isFaculty ? (
                    <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Context</p>
                      <p className="text-base font-bold text-slate-700 mt-1">
                        {groupNameInput || groups.find(g => g._id === selectedGroupId)?.groupName || 'Supervised Group'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 font-medium">
                        This meeting will be automatically linked to your assigned supervisor and group participants.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2-Column Grid for fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Title — full width */}
                  <div className="md:col-span-2 space-y-2">
                    <label htmlFor="meeting-title" className="text-sm font-bold text-slate-700 block uppercase tracking-wider">
                      Meeting Title *
                    </label>
                    <input
                      id="meeting-title"
                      type="text"
                      placeholder="e.g. Thesis Progress Discussion & Code Review"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400 text-slate-800"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-2">
                    <label htmlFor="meeting-date" className="text-sm font-bold text-slate-700 block uppercase tracking-wider">
                      📅 Date & Time *
                    </label>
                    <input
                      id="meeting-date"
                      type="datetime-local"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-slate-800"
                    />
                  </div>

                  {/* Video Link */}
                  <div className="space-y-2">
                    <label htmlFor="meeting-link" className="text-sm font-bold text-slate-700 block uppercase tracking-wider">
                      🎥 Any link (include https://..)
                    </label>
                    <input
                      id="meeting-link"
                      type="url"
                      placeholder="e.g. Any URL or Source if you would like to share"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400 text-slate-800"
                    />
                  </div>

                  {/* Agenda */}
                  <div className={`space-y-2 ${modalMode === 'edit' ? '' : 'md:col-span-2'}`}>
                    <label htmlFor="meeting-agenda" className="text-sm font-bold text-slate-700 block uppercase tracking-wider">
                      📋 Meeting Agenda (Optional)
                    </label>
                    <textarea
                      id="meeting-agenda"
                      rows="5"
                      placeholder="Specify key discussion targets, documents to review, deliverables to present, questions to resolve, etc."
                      value={agenda}
                      onChange={(e) => setAgenda(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400 resize-none text-slate-800 leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Status (edit mode only) */}
                  {modalMode === 'edit' && (
                    <div className="space-y-2">
                      <label htmlFor="meeting-status-select" className="text-sm font-bold text-slate-700 block uppercase tracking-wider">
                        🔄 Meeting Status
                      </label>
                      <select
                        id="meeting-status-select"
                        value={meetingStatus}
                        onChange={(e) => setMeetingStatus(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-slate-800 font-semibold"
                      >
                        <option value="scheduled">🕐 Scheduled</option>
                        <option value="completed">✅ Completed</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="pt-6 mt-6 border-t-2 border-slate-100 flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-400">* Required fields</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-7 py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-2xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {modalMode === 'create' ? '📅 Schedule Meeting' : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      </div>
    </>
  );
};

export default Meetings;
