import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, RefreshCw, AlertCircle, CheckCircle2, Bookmark, Users, Check, XCircle } from 'lucide-react';
import { getThesisTopics, createThesisTopic, updateThesisTopic, deleteThesisTopic } from '../services/thesisTopicService';
import { getTopicApplications, updateApplicationStatus } from '../services/thesisApplicationService';

const PostTopics = () => {
  const { currentUser } = useOutletContext();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Topic Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  
  // Topic Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    keywords: '',
    status: 'available'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  // Applications Modal State
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);
  const [viewingAppsForTopic, setViewingAppsForTopic] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState(null);

  const fetchTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getThesisTopics(currentUser, { mine: true });
      setTopics(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line
  }, []);

  // --- Topic Management ---

  const handleOpenTopicModal = (topic = null) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        title: topic.title,
        description: topic.description,
        category: topic.category,
        keywords: topic.keywords.join(', '),
        status: topic.status
      });
    } else {
      setEditingTopic(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        keywords: '',
        status: 'available'
      });
    }
    setFormMessage(null);
    setIsTopicModalOpen(true);
  };

  const handleCloseTopicModal = () => {
    setIsTopicModalOpen(false);
    setEditingTopic(null);
  };

  const handleTopicChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage(null);

    try {
      if (editingTopic) {
        await updateThesisTopic(editingTopic._id, formData, currentUser);
        setFormMessage({ type: 'success', text: 'Topic updated successfully!' });
      } else {
        await createThesisTopic(formData, currentUser);
        setFormMessage({ type: 'success', text: 'Topic posted successfully!' });
      }
      fetchTopics();
      setTimeout(handleCloseTopicModal, 1500);
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleTopicDelete = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    
    try {
      await deleteThesisTopic(topicId, currentUser);
      setTopics(topics.filter(t => t._id !== topicId));
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Applications Management ---

  const handleOpenAppsModal = async (topic) => {
    setViewingAppsForTopic(topic);
    setIsAppsModalOpen(true);
    setAppsLoading(true);
    setAppsError(null);
    
    try {
      const res = await getTopicApplications(topic._id, currentUser);
      setApplications(res.data || []);
    } catch (err) {
      setAppsError(err.message);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleCloseAppsModal = () => {
    setIsAppsModalOpen(false);
    setViewingAppsForTopic(null);
    setApplications([]);
  };

  const handleUpdateAppStatus = async (appId, status) => {
    if (!window.confirm(`Are you sure you want to mark this application as ${status}?`)) return;

    try {
      await updateApplicationStatus(appId, status, currentUser);
      // Refresh applications list
      const res = await getTopicApplications(viewingAppsForTopic._id, currentUser);
      setApplications(res.data || []);
      // Also refresh topics to update the status tag if assigned
      fetchTopics();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Thesis Topics</h1>
          <p className="text-slate-500 text-sm mt-1">Manage the thesis topics you have posted for students.</p>
        </div>
        <button
          onClick={() => handleOpenTopicModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Post New Topic
        </button>
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
          <h3 className="text-lg font-bold text-slate-700 mb-2">No topics posted yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            You haven't posted any thesis topics. Post your first topic to attract prospective students.
          </p>
          <button
            onClick={() => handleOpenTopicModal()}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post First Topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map(topic => (
            <div key={topic._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                  topic.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {topic.status}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenTopicModal(topic)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Topic">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleTopicDelete(topic._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Topic">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2" title={topic.title}>{topic.title}</h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-3 flex-1">{topic.description}</p>
              
              <div className="mt-auto">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</div>
                <div className="text-sm font-medium text-slate-700 mb-4">{topic.category || 'General'}</div>
                
                <button 
                  onClick={() => handleOpenAppsModal(topic)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Users className="w-4 h-4" />
                  View Applications
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topic Create/Edit Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingTopic ? 'Edit Thesis Topic' : 'Post New Topic'}
              </h3>
              <button onClick={handleCloseTopicModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {formMessage && (
                <div className={`mb-6 p-3 rounded-xl flex items-center gap-2 text-sm ${
                  formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {formMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {formMessage.text}
                </div>
              )}

              <form onSubmit={handleTopicSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Topic Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleTopicChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="Enter an engaging title"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleTopicChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Describe the research objectives and scope..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleTopicChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. Machine Learning"
                    />
                  </div>
                  
                  {editingTopic && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleTopicChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                      >
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keywords</label>
                  <input
                    type="text"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleTopicChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="Comma separated (e.g. AI, NLP, Healthcare)"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseTopicModal}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {formLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {editingTopic ? 'Save Changes' : 'Post Topic'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Applications View Modal */}
      {isAppsModalOpen && viewingAppsForTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Student Applications</h3>
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{viewingAppsForTopic.title}</p>
              </div>
              <button onClick={handleCloseAppsModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {appsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : appsError ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <p>{appsError}</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-slate-700 font-semibold">No applications yet</h4>
                  <p className="text-slate-500 text-sm mt-1">Students have not applied for this topic.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app._id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                            {app.studentId?.fullName?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{app.studentId?.fullName || 'Unknown Student'}</h4>
                            <p className="text-xs text-slate-500">{app.studentId?.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {app.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleUpdateAppStatus(app._id, 'accepted')}
                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors border border-emerald-200 hover:border-emerald-500"
                                title="Accept Student"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleUpdateAppStatus(app._id, 'rejected')}
                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border border-rose-200 hover:border-rose-500"
                                title="Reject Application"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : app.status === 'accepted' ? (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {app.message && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Application Message</p>
                          <p className="text-sm text-slate-700">{app.message}</p>
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-400 mt-3 text-right">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostTopics;
