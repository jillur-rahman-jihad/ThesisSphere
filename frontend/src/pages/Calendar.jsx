import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import calendarService from '../services/calendarService';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, Users, BookOpen } from 'lucide-react';

const Calendar = () => {
  const { currentUser } = useOutletContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [supervisedGroups, setSupervisedGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'submission',
    thesisGroupId: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await calendarService.getEvents();
      if (res.success) {
        setEvents(res.data.events);
        setSupervisedGroups(res.data.supervisedGroups || []);
      }
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (day) => {
    return events.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getDate() === day && eDate.getMonth() === currentDate.getMonth() && eDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const handleCreateDeadline = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);
    try {
      await calendarService.createDeadline(formData);
      setShowModal(false);
      setFormData({ title: '', description: '', date: '', type: 'submission', thesisGroupId: '' });
      fetchEvents();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create deadline');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12">
      {/* Main Calendar Grid */}
      <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Academic Deadlines & Meetings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={today} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors">
              Today
            </button>
            <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/50 dark:bg-slate-900/50 min-h-[120px]"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div key={day} className={`min-h-[120px] bg-white dark:bg-slate-800 p-2 transition-colors hover:bg-slate-50 dark:bg-slate-900/50 ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/30/30' : ''}`}>
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                  {day}
                </div>
                <div className="space-y-1 mt-2">
                  {dayEvents.map(e => (
                    <div 
                      key={e._id} 
                      className={`text-[10px] p-1.5 rounded-lg border font-medium truncate ${
                        e.type === 'meeting' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}
                      title={e.title}
                    >
                      {new Date(e.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {e.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        {currentUser.role === 'faculty' && (
          <button 
            onClick={() => setShowModal(true)}
            className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white font-semibold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Add Deadline
          </button>
        )}

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Upcoming Events
          </h3>
          <div className="space-y-4">
            {events.filter(e => new Date(e.date) >= new Date()).slice(0, 5).map(e => (
              <div key={e._id} className="flex gap-4 group">
                <div className="flex flex-col items-center min-w-[3rem]">
                  <span className="text-xs font-bold text-slate-400 uppercase">{monthNames[new Date(e.date).getMonth()].slice(0,3)}</span>
                  <span className={`text-xl font-bold ${e.type === 'meeting' ? 'text-blue-600' : 'text-rose-600'}`}>
                    {new Date(e.date).getDate()}
                  </span>
                </div>
                <div className={`flex-1 p-3 rounded-xl border ${e.type === 'meeting' ? 'bg-blue-50/50 border-blue-100' : 'bg-rose-50/50 border-rose-100'}`}>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{e.title}</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{e.groupName}</p>
                </div>
              </div>
            ))}
            {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No upcoming events found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Deadline Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Schedule New Deadline</h2>
              <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDeadline} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl font-medium">{submitError}</div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Thesis Group</label>
                <select 
                  required
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.thesisGroupId}
                  onChange={(e) => setFormData({...formData, thesisGroupId: e.target.value})}
                >
                  <option value="">Select a group...</option>
                  {supervisedGroups.map(g => (
                    <option key={g._id} value={g._id}>{g.groupName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Deadline Title</label>
                <input 
                  type="text" required
                  placeholder="e.g. Final Chapter 1 Submission"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Date & Time</label>
                  <input 
                    type="datetime-local" required
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Type</label>
                  <select 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="proposal">Proposal</option>
                    <option value="progress">Progress Report</option>
                    <option value="submission">Document Submission</option>
                    <option value="defense">Defense</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Description (Optional)</label>
                <textarea 
                  rows="3"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  {submitLoading ? 'Creating...' : 'Create Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
