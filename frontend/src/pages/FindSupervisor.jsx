import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Sparkles, BookOpen, GraduationCap, ChevronRight, UserCircle2, Cpu, Clock, Target, X, Mail, MapPin, Briefcase } from 'lucide-react';

const FindSupervisor = () => {
  const { currentUser } = useOutletContext();
  const navigate = useNavigate();
  const [supervisors, setSupervisors] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [aiError, setAiError] = useState('');
  
  // New States for UI Enhancements
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all supervisors
        const supRes = await fetch('/api/faculty/supervisors', {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        const supData = await supRes.json();
        
        if (supData.success) {
          setSupervisors(supData.data);
        }

        // Fetch recommendations if student
        if (currentUser.role === 'student') {
          const recRes = await fetch('/api/recommendations', {
            headers: { Authorization: `Bearer ${currentUser.token}` }
          });
          const recData = await recRes.json();
          if (recData.success) {
            setRecommendations(recData.data);
          } else {
            setAiError(recData.message || 'Failed to load AI recommendations.');
          }
        } else {
          setAiError('AI Recommendations are only available for student accounts.');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setAiError('Network error connecting to AI engine. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const filteredSupervisors = supervisors.filter(sup => {
    const matchesSearch = sup.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sup.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sup.expertise && sup.expertise.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesDept = filterDept === '' || sup.department === filterDept;
    const matchesCapacity = !filterAvailableOnly || (sup.currentStudents < sup.maxStudents);
    
    return matchesSearch && matchesDept && matchesCapacity;
  });

  // Get unique departments for the filter dropdown
  const uniqueDepartments = [...new Set(supervisors.map(s => s.department).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Find Supervisor</h1>
        <p className="text-slate-500 mt-2">Discover faculty members, explore their research interests, and find the perfect match for your thesis.</p>
        
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, department, or expertise..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-2xl transition-colors ${
              showFilters ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}>
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
        
        {/* Advanced Filters Drawer */}
        {showFilters && (
          <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-2 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
              <select 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={filterAvailableOnly}
                    onChange={(e) => setFilterAvailableOnly(e.target.checked)}
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${filterAvailableOnly ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${filterAvailableOnly ? 'transform translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-medium text-slate-700">Only show available slots</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {aiError && !recommendations && (
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-200 text-rose-700">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-rose-500" />
            <h2 className="text-xl font-bold">AI Recommendations Unavailable</h2>
          </div>
          <p>{aiError}</p>
        </div>
      )}

      {recommendations && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 px-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-slate-900">AI-Recommended for You</h2>
            </div>
            
            {recommendations.metadata && (
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-slate-50 border border-slate-200 p-3 rounded-xl w-fit">
                <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                  <Cpu className="w-4 h-4" />
                  <span>Model: {recommendations.metadata.modelUsed}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <Clock className="w-4 h-4" />
                  <span>Time: {recommendations.metadata.processingTimeMs}ms</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  <Target className="w-4 h-4" />
                  <span>Parsed Input: {recommendations.metadata.input?.length > 0 ? recommendations.metadata.input.join(', ') : 'None'}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommended Supervisors */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" /> Top Supervisor Matches
              </h3>
              <div className="space-y-4">
                {recommendations.recommendedSupervisors.length > 0 ? (
                  recommendations.recommendedSupervisors.map((sup, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => navigate(`/faculty-profile/${sup._id}`)}
                      className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                        {sup.fullName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{sup.fullName}</h4>
                        <p className="text-xs text-slate-500">{sup.department} • {sup.matchPercentage}% Match</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No strong matches found based on your profile.</p>
                )}
              </div>
            </div>

            {/* Recommended Topics */}
            <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
              <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Top Topic Matches
              </h3>
              <div className="space-y-4">
                {recommendations.recommendedTopics.length > 0 ? (
                  recommendations.recommendedTopics.map((topic, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => topic.supervisorId ? navigate(`/faculty-profile/${topic.supervisorId}`) : navigate('/topics')}
                      className="bg-white p-4 rounded-2xl border border-emerald-50 shadow-sm hover:shadow-md transition cursor-pointer"
                    >
                      <h4 className="font-semibold text-slate-900 line-clamp-1">{topic.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500">By {topic.supervisor}</p>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                          {topic.matchPercentage}% Match
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No strong topic matches found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900 px-2 mb-6">All Supervisors Directory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupervisors.map((sup, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {sup.profilePicture ? (
                    <img src={sup.profilePicture} alt={sup.fullName} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <UserCircle2 className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{sup.fullName}</h3>
                    <p className="text-sm text-indigo-600 font-medium">{sup.designation || 'Faculty Member'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">Dept:</span> {sup.department}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">Capacity:</span> 
                  <span className={`${sup.currentStudents >= sup.maxStudents ? 'text-rose-500' : 'text-emerald-600'} font-semibold`}>
                    {sup.currentStudents}/{sup.maxStudents}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {sup.expertise && sup.expertise.length > 0 ? (
                    sup.expertise.slice(0, 3).map((exp, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200">
                        {exp}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400 italic">Not specified</span>
                  )}
                  {sup.expertise && sup.expertise.length > 3 && (
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs rounded-lg border border-slate-200">
                      +{sup.expertise.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => navigate(`/faculty-profile/${sup._id}`)}
                className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors">
                View Profile
              </button>
            </div>
          ))}
          {filteredSupervisors.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200">
              <UserCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No supervisors found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindSupervisor;
