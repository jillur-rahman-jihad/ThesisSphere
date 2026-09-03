import React, { useState, useEffect } from 'react';
import { X, Users, User, Building2, School } from 'lucide-react';

const SupervisionRequestDetailsModal = ({ isOpen, onClose, requestId, currentUser, onAccept, onReject }) => {
  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchDetails();
    }
  }, [isOpen, requestId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/faculty/supervision-request/${requestId}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setRequestDetails(data.data);
      } else {
        setError(data.message || 'Failed to fetch details');
      }
    } catch (err) {
      setError('An error occurred while fetching details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Supervision Request Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center p-8">
              <p className="text-slate-500">Loading details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl">
              {error}
            </div>
          ) : requestDetails ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800">
                  {requestDetails.applicationType === 'group' ? 'Group Application' : 'Solo Application'}
                </span>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-sm font-medium border border-amber-100 dark:border-amber-800">
                  Status: {requestDetails.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  {requestDetails.applicationType === 'group' ? 'Group Members' : 'Student Details'}
                </h3>
                
                <div className="grid gap-4">
                  {requestDetails.groupMembers && requestDetails.groupMembers.length > 0 ? (
                    requestDetails.groupMembers.map((member) => (
                      <div key={member._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          {member.profilePicture ? (
                            <img src={member.profilePicture} alt={member.fullName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User size={24} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{member.fullName} {member._id === requestDetails.studentId._id ? '(Requester)' : ''}</h4>
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 space-y-1">
                            <div className="flex items-center gap-1.5"><School size={14} /> ID: {member.studentId || 'N/A'}</div>
                            <div className="flex items-center gap-1.5"><Building2 size={14} /> Dept: {member.department || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          {requestDetails.studentId.profilePicture ? (
                            <img src={requestDetails.studentId.profilePicture} alt={requestDetails.studentId.fullName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User size={24} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{requestDetails.studentId.fullName}</h4>
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 space-y-1">
                            <div className="flex items-center gap-1.5"><School size={14} /> ID: {requestDetails.studentId.studentId || 'N/A'}</div>
                            <div className="flex items-center gap-1.5"><Building2 size={14} /> Dept: {requestDetails.studentId.department || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {requestDetails && requestDetails.status === 'pending' && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button
              onClick={onReject}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-semibold transition"
            >
              Reject Request
            </button>
            <button
              onClick={onAccept}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition shadow-sm shadow-emerald-500/20"
            >
              Accept Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisionRequestDetailsModal;
