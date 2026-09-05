import React, { useState, useEffect } from 'react';
import { X, Users, User, CheckCircle2, AlertCircle, Search, Loader2 } from 'lucide-react';

export default function SupervisionRequestModal({ isOpen, onClose, onSubmit, loading, supervisorName }) {
  const [activeTab, setActiveTab] = useState('solo');
  const [groupMembers, setGroupMembers] = useState([{ studentId: '', data: null, error: '', loading: false }]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('solo');
      setGroupMembers([{ studentId: '', data: null, error: '', loading: false }]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookup = async (index, studentId) => {
    const updated = [...groupMembers];
    updated[index].studentId = studentId;
    updated[index].data = null;
    updated[index].error = '';

    if (studentId.length >= 4) { // arbitrary length to trigger search
      updated[index].loading = true;
      setGroupMembers([...updated]);

      try {
        const token = JSON.parse(localStorage.getItem('thesisSphereUser'))?.token;
        const res = await fetch(`/api/users/student-lookup?studentId=${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          updated[index].data = data.data;
        } else {
          updated[index].error = data.message || 'Student not found';
        }
      } catch (err) {
        updated[index].error = 'Lookup failed';
      }
      updated[index].loading = false;
      setGroupMembers([...updated]);
    } else {
      updated[index].loading = false;
      setGroupMembers(updated);
    }
  };

  const addMemberRow = () => {
    setGroupMembers([...groupMembers, { studentId: '', data: null, error: '', loading: false }]);
  };

  const removeMemberRow = (index) => {
    const updated = groupMembers.filter((_, i) => i !== index);
    setGroupMembers(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'solo') {
      onSubmit({ applicationType: 'solo' });
    } else {
      // Filter out invalid or incomplete lookups
      const validMembers = groupMembers.filter(m => m.data && m.data._id);
      if (validMembers.length === 0) {
        alert("Please add at least one valid student to the group");
        return;
      }
      const memberIds = validMembers.map(m => m.data._id);
      onSubmit({ applicationType: 'group', groupMembers: memberIds });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Supervision</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            You are requesting to be supervised by <strong>{supervisorName}</strong>. 
            Will you be working solo or as a group?
          </p>

          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('solo')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition font-semibold ${
                activeTab === 'solo' 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <User size={18} /> Solo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('group')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition font-semibold ${
                activeTab === 'group' 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <Users size={18} /> Group
            </button>
          </div>

          <form id="requestForm" onSubmit={handleSubmit}>
            {activeTab === 'solo' ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You will apply as an individual. A new thesis group will be created for you automatically if the supervisor accepts your request.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Add Group Members
                </label>
                
                {groupMembers.map((member, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Enter Student ID"
                          value={member.studentId}
                          onChange={(e) => handleLookup(index, e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                      {groupMembers.length > 1 && (
                        <button type="button" onClick={() => removeMemberRow(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                          <X size={18} />
                        </button>
                      )}
                    </div>
                    
                    {/* Validation Feedback */}
                    <div className="min-h-[20px] px-1 text-xs">
                      {member.loading ? (
                        <span className="flex items-center gap-1 text-indigo-500"><Loader2 size={12} className="animate-spin" /> Looking up...</span>
                      ) : member.data ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 size={12} /> {member.data.fullName} ({member.data.email})
                        </span>
                      ) : member.error ? (
                        <span className="flex items-center gap-1 text-rose-500">
                          <AlertCircle size={12} /> {member.error}
                        </span>
                      ) : (
                        <span className="text-slate-400">Type ID to lookup student</span>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMemberRow}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  + Add another member
                </button>
              </div>
            )}
          </form>

        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="requestForm"
            disabled={loading || (activeTab === 'group' && !groupMembers.some(m => m.data))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Submit Request
          </button>
        </div>

      </div>
    </div>
  );
}
