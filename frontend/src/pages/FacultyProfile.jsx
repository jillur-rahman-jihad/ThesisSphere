import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  User,
  BookOpen,
  Briefcase,
  MapPin,
  Mail,
  Globe,
  ChevronRight,
  Users,
  Star,
  Activity,
  X,
} from "lucide-react";
import { getProfile, updateFacultyProfile } from "../services/profileService";

const FacultyProfile = () => {
  const { currentUser } = useOutletContext() || {};
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const loadProfile = async () => {
    if (currentUser?.role !== "faculty") {
      setLoading(false);
      return;
    }

    try {
      const response = await getProfile();
      setProfileData(response.data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (updatedData) => {
    try {
      setLoading(true);
      const response = await updateFacultyProfile(updatedData);
      if (response?.success) {
        alert('Local Host says : Information updated !');
      }
      await loadProfile();
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save profile updates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-800 text-lg font-semibold">Loading supervisor profile...</p>
      </div>
    );
  }

  if (currentUser?.role !== "faculty") {
    return (
      <div className="min-h-full bg-slate-50 py-16">
        <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center">
          <User className="mx-auto mb-4 text-slate-500" size={42} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Faculty profile not available</h2>
          <p className="text-slate-600">This page is reserved for users with the faculty role.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-slate-50 py-16">
        <div className="max-w-3xl mx-auto rounded-3xl border border-red-200 bg-red-50 p-10 shadow-sm text-center">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const profile = profileData?.profile || {};
  const displayName = profileData?.fullName || "Prof. Name";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  const isAccepting = profile.maxStudents ? profile.currentStudents < profile.maxStudents : true;
  const researchTags = profile.researchInterests?.length
    ? profile.researchInterests
    : profile.expertise?.length
    ? profile.expertise
    : profileData?.researchInterests || [];
  const publicationCount = profile.publications?.length ?? 0;
  const rating = profile.rating ?? 4.9;
  const reviewCount = profile.ratingCount ?? 24;
  const experienceYears = profile.experienceYears ?? 12;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="rounded-[32px] bg-gradient-to-r from-indigo-700 via-violet-700 to-sky-600 p-8 shadow-2xl shadow-slate-300/20 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-3xl font-bold text-white shadow-xl shadow-indigo-200/30">
              {initials || "EC"}
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">Supervisor Profile</p>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{displayName}</h1>
              <p className="mt-2 text-base text-slate-100">
                {profile.designation || "Associate Professor"} · {profileData?.department || "Computer Science"} · {profileData?.university || "MIT"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[28px] bg-white/10 px-4 py-3 text-white shadow-inner shadow-slate-900/10 sm:max-w-sm">
            {isAccepting && (
              <span className="rounded-full bg-emerald-100/90 px-3 py-1 text-sm font-semibold text-emerald-800">Accepting Students</span>
            )}
            <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
          >
              <ChevronRight size={16} />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="STUDENTS" value={`${profile.currentStudents || 0}/${profile.maxStudents || 0}`} subtext="supervising" />
          <StatCard icon={<Star className="w-5 h-5" />} label="RATING" value={`${rating.toFixed(1)}/5.0`} subtext={`${reviewCount} reviews`} />
          <StatCard icon={<BookOpen className="w-5 h-5" />} label="PUBLICATIONS" value={publicationCount.toString()} subtext="h-index: 32" />
          <StatCard icon={<Activity className="w-5 h-5" />} label="EXPERIENCE" value={`${experienceYears} yrs`} subtext="Supervising since 2014" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500">
              <Briefcase className="w-5 h-5" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em]">Biography</h2>
            </div>
            <p className="mt-4 text-slate-700 leading-7">
              {profileData?.bio ||
                "Leading researcher in AI applications for healthcare imaging. Lab focuses on deploying interpretable deep learning in clinical workflows. Active collaborations with top institutions and grant-funded projects."}
            </p>

            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Research Areas</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {researchTags.length ? (
                  researchTags.map((tag, index) => (
                    <span key={index} className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">No research areas added</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500">
              <MapPin className="w-5 h-5" />
              <div className="text-sm font-semibold uppercase tracking-[0.25em]">Contact</div>
            </div>
            <div className="mt-6 grid gap-4">
              <ContactCard icon={<Mail size={18} />} label={profileData?.email || "e.carter@mit.edu"} />
              <ContactCard icon={<MapPin size={18} />} label={profile.officeRoom ? `${profile.officeRoom}, ${profileData?.university || "MIT"}` : "Room 32-G428, MIT"} />
              <ContactCard icon={<Globe size={18} />} label={profile.website || "carter-lab.mit.edu"} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ContactCard icon={<Activity size={18} />} label={profile.consultationHours || "Consultation hours not set"} />
              <ContactCard icon={<Briefcase size={18} />} label={`Mode: ${profile.consultationMode ? profile.consultationMode.charAt(0).toUpperCase() + profile.consultationMode.slice(1) : 'Campus'}`} />
            </div>
          </div>
        </div>
      </div>
      {showEditModal && (
        <FacultyEditProfileModal
          profileData={profileData}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileSave}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, subtext }) => (
  <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-6 text-center shadow-sm">
    <div className="flex items-center justify-center gap-2 text-slate-500">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-[0.28em]">{label}</span>
    </div>
    <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
    <div className="mt-2 text-sm text-slate-500">{subtext}</div>
  </div>
);

const ContactCard = ({ icon, label }) => (
  <div className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">{icon}</div>
    <div className="text-sm font-medium">{label}</div>
  </div>
);

const consultationModes = [
  { value: 'campus', label: 'Campus Available' },
  { value: 'online', label: 'Online Only' },
  { value: 'offline', label: 'Offline Only' },
  { value: 'hybrid', label: 'Hybrid' },
];

const RESEARCH_OPTIONS = [
  'Machine Learning',
  'Deep Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Data Mining',
  'Cyber Security',
  'Software Engineering',
  'Cloud Computing',
  'Internet of Things',
  'Blockchain',
];

const FacultyEditProfileModal = ({ profileData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    designation: profileData.profile?.designation || '',
    officeRoom: profileData.profile?.officeRoom || '',
    expertise: profileData.profile?.expertise || [],
    researchInterests: profileData.profile?.researchInterests || profileData.researchInterests || [],
    consultationHours: profileData.profile?.consultationHours || '',
    consultationMode: profileData.profile?.consultationMode || 'campus',
    publications: profileData.profile?.publications || [],
    website: profileData.profile?.website || '',
    bio: profileData.bio || '',
  });

  const handleToggleArray = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Edit Faculty Profile</h2>
            <p className="text-sm text-slate-500">Update topics, consultation hours, and availability mode.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900">Designation</label>
              <input
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900">Office Room</label>
              <input
                name="officeRoom"
                value={formData.officeRoom}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900">Consultation Hours</label>
              <input
                name="consultationHours"
                value={formData.consultationHours}
                onChange={handleChange}
                placeholder="e.g. Mon 2-4pm, Fri 10-12pm"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900">Availability Mode</label>
              <select
                name="consultationMode"
                value={formData.consultationMode}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
              >
                {consultationModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900">Topics</label>
            <p className="text-xs text-slate-500">Select the main research topics you supervise.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {RESEARCH_OPTIONS.map((option) => {
                const selected = formData.researchInterests.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleToggleArray('researchInterests', option)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900">Expertise Keywords</label>
            <input
              name="expertise"
              value={formData.expertise.join(', ')}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                expertise: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              }))}
              placeholder="Add comma-separated expertise keywords"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900">Publications</label>
            <textarea
              name="publications"
              value={formData.publications.join(', ')}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                publications: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              }))}
              placeholder="List publications separated by commas"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 min-h-[120px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900">Profile Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Write a short bio or overview"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 min-h-[120px]"
            />
          </div>

        </div>

        <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfile;
