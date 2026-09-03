import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { RESEARCH_INTERESTS, TECHNICAL_SKILLS } from "../../constants/profileOptions";

const EditFacultyProfileModal = ({
  profileData,
  onClose,
  onProfileUpdated,
  onSave
}) => {
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    university: "",
    
    designation: "",
    officeRoom: "",
    consultationHours: "",
    consultationMode: "campus",
    website: "",
    maxStudents: 0,
    
    researchInterests: [],
    expertise: [],
  });

  useEffect(() => {
    if (!profileData) return;
    const user = profileData.user || profileData;
    const profile = profileData.profile || {};

    setFormData({
      fullName: user.fullName || "",
      department: user.department || "",
      university: user.university || "",
      
      designation: profile.designation || "",
      officeRoom: profile.officeRoom || "",
      consultationHours: profile.consultationHours || "",
      consultationMode: profile.consultationMode || "campus",
      website: profile.website || "",
      maxStudents: profile.maxStudents || 0,
      
      researchInterests: profile.researchInterests || [],
      expertise: profile.expertise || [],
    });
  }, [profileData]);

  const toggleInterest = (interest) => {
    setFormData((prev) => ({
      ...prev,
      researchInterests: prev.researchInterests.includes(interest)
        ? prev.researchInterests.filter((i) => i !== interest)
        : [...prev.researchInterests, interest],
    }));
  };

  const toggleExpertise = (skill) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(skill)
        ? prev.expertise.filter((s) => s !== skill)
        : [...prev.expertise, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Edit Faculty Profile
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Update your faculty profile information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="edit-faculty-profile-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Basic Info */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    University
                  </label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* 2. Professional Info */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    placeholder="e.g. Associate Professor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Office Room
                  </label>
                  <input
                    type="text"
                    value={formData.officeRoom}
                    onChange={(e) => setFormData({ ...formData, officeRoom: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Consultation Hours
                  </label>
                  <input
                    type="text"
                    value={formData.consultationHours}
                    onChange={(e) => setFormData({ ...formData, consultationHours: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    placeholder="e.g. Mon, Wed 10:00 AM - 12:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Consultation Mode
                  </label>
                  <select
                    value={formData.consultationMode}
                    onChange={(e) => setFormData({ ...formData, consultationMode: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="campus">Campus</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Website / Portfolio
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* 3. Research Interests */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Research Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {RESEARCH_INTERESTS.map((interest) => {
                  const isSelected = formData.researchInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={\`px-4 py-2 rounded-xl text-sm font-medium border transition \${
                        isSelected
                          ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      }\`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. Expertise */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {TECHNICAL_SKILLS.map((skill) => {
                  const isSelected = formData.expertise.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleExpertise(skill)}
                      className={\`px-4 py-2 rounded-xl text-sm font-medium border transition \${
                        isSelected
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      }\`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </section>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-faculty-profile-form"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm shadow-blue-500/30"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFacultyProfileModal;
