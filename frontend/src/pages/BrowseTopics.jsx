import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, AlertCircle, Bookmark, Search, Filter, X, Send } from 'lucide-react';
import { getThesisTopics } from '../services/thesisTopicService';
import { applyForTopic, getMyApplications } from '../services/thesisApplicationService';

const BrowseTopics = () => {
  const { currentUser } = useOutletContext();
  const [topics, setTopics] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applyingTopic, setApplyingTopic] = useState(null);
  const [message, setMessage] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const topicsRes = await getThesisTopics(currentUser, { status: 'available' });
      setTopics(topicsRes.data || []);
      
      if (currentUser?.role === 'student') {
        const appsRes = await getMyApplications(currentUser);
        setMyApplications(appsRes.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const hasApplied = (topicId) => {
    return myApplications.some(app => 
      (app.topicId?._id === topicId) || (app.topicId === topicId)
    );
  };

  const handleOpenModal = (topic) => {
    if (hasApplied(topic._id) || currentUser?.role !== 'student') return;
    setApplyingTopic(topic);
    setMessage('');
    setApplyError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setApplyingTopic(null);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplyError(null);

    try {
      await applyForTopic(applyingTopic._id, message, currentUser);
      await fetchData(); // Refresh data to update button states
      handleCloseModal();
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setApplyLoading(false);
    }
  };

  const filteredTopics = topics.filter(topic => 
    topic.title.toLowerCase().includes(search.toLowerCase()) || 
    topic.category?.toLowerCase().includes(search.toLowerCase()) ||
    topic.keywords?.some(kw => kw.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Browse Thesis Topics</h1>
          <p className="text-slate-500 text-sm mt-1">Explore and find the perfect research topic for your thesis.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search topics..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full md:w-64 transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
        </div>
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
      ) : topics.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No available topics</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Check back later. Faculty members will post new topics here when they are available.
          </p>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No topics match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map(topic => (
            <div key={topic._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col h-full group">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                   {topic.supervisorId?.fullName?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || 'FA'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{topic.supervisorId?.fullName || 'Unknown Faculty'}</h4>
                  <p className="text-[11px] text-slate-500">{topic.supervisorId?.department || 'Department'}</p>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2" title={topic.title}>{topic.title}</h3>
              <p className="text-slate-500 text-sm mb-5 line-clamp-3 flex-1">{topic.description}</p>
              
              <div className="mt-auto">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100">
                    {topic.category || 'General'}
                  </span>
                  {topic.keywords?.slice(0, 2).map((kw, i) => (
                    <span key={i} className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                      {kw}
                    </span>
                  ))}
                  {topic.keywords?.length > 2 && (
                    <span className="text-[11px] font-medium text-slate-400 px-1 py-1">
                      +{topic.keywords.length - 2} more
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={() => handleOpenModal(topic)}
                  disabled={hasApplied(topic._id) || currentUser?.role !== 'student'}
                  className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    currentUser?.role !== 'student' 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : hasApplied(topic._id) 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {currentUser?.role !== 'student' 
                    ? 'Students Only' 
                    : hasApplied(topic._id) 
                      ? 'Application Submitted' 
                      : 'Apply for Topic'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Modal Overlay */}
      {isModalOpen && applyingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Submit Application</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl mb-6 text-sm">
                You are applying for <strong>{applyingTopic.title}</strong> supervised by <strong>{applyingTopic.supervisorId?.fullName}</strong>.
              </div>

              {applyError && (
                <div className="mb-6 p-3 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {applyError}
                </div>
              )}

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message to Supervisor (Optional)</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Briefly explain why you are interested in this topic and your relevant background..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyLoading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {applyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseTopics;
