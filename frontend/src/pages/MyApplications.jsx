import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, AlertCircle, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getMyApplications } from '../services/thesisApplicationService';

const MyApplications = () => {
  const { currentUser } = useOutletContext();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await getMyApplications(currentUser);
        setApplications(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
    // eslint-disable-next-line
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted': 
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Accepted</span>;
      case 'rejected': 
        return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Rejected</span>;
      default: 
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Pending Review</span>;
    }
  };

  if (currentUser?.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 font-medium">This page is only available to students.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">Track the status of the thesis topics you have applied for.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No applications yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            You haven't applied for any thesis topics. Go to Browse Topics to find one that interests you.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(app.status)}
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">
                      {app.topicId?.title || 'Unknown Topic'}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <p>
                      <span className="font-medium">Supervisor:</span> {app.topicId?.supervisorId?.fullName || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Applied on:</span> {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {app.message && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                      <span className="font-semibold text-xs uppercase tracking-wider text-slate-400 block mb-1">Your Message:</span>
                      {app.message}
                    </div>
                  )}
                </div>

                <div className="flex items-center md:flex-col md:items-end gap-2 md:gap-3 shrink-0">
                  {getStatusBadge(app.status)}
                </div>
                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
