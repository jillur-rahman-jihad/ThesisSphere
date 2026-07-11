import React, { useState } from "react";
import { X } from "lucide-react";
import { updateFacultyProfile } from "../../services/profileService";

const RESEARCH_OPTIONS = [
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Data Mining",
  "Cyber Security",
  "Software Engineering",
  "Cloud Computing",
  "Internet of Things",
  "Blockchain",
];

const TECHNICAL_SKILLS = [
  "C",
  "C++",
  "Java",
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "MongoDB",
  "Git",
  "TensorFlow",
];

const EditProfileModal = ({ profileData, onClose,  onProfileUpdated, }) => {
  const [formData, setFormData] = useState({
    fullName: profileData.fullName || "",
    program: profileData.profile?.program || "",
    semester: profileData.profile?.semester || "",
    cgpa: profileData.profile?.cgpa || "",
    publications: profileData.profile?.publications || 0,
    thesisTitle: profileData.profile?.thesisTitle || "",
    bio: profileData.bio || "",
    supervisor: profileData.profile?.supervisorName || "Not Assigned",
    researchInterests: profileData.researchInterests || [],
    skills: profileData.skills || [],
    designation: profileData.profile?.designation || "",
    officeRoom: profileData.profile?.officeRoom || "",
    expertise: profileData.profile?.expertise || [],
    consultationHours: profileData.profile?.consultationHours || "",
    consultationMode: profileData.profile?.consultationMode || "campus",
    website: profileData.profile?.website || "",
  });
  const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  });
  };
  const toggleResearch = (interest) => {
  setFormData((prev) => ({
    ...prev,
    researchInterests: prev.researchInterests.includes(interest)
      ? prev.researchInterests.filter((i) => i !== interest)
      : [...prev.researchInterests, interest],
  }));
  };
  const toggleSkill = (skill) => {
  setFormData((prev) => ({
    ...prev,
    skills: prev.skills.includes(skill)
      ? prev.skills.filter((s) => s !== skill)
      : [...prev.skills, skill],
  }));
  };
  
  const [saving, setSaving] = useState(false);
 
  const handleSave = async () => {
    try {
      setSaving(true);

      await updateFacultyProfile(formData);

      await onProfileUpdated();

      onClose();

      alert("✅ Faculty profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update faculty profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-6">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

        {/* Header */}

        <div className="flex justify-between items-center border-b border-slate-200 px-8 py-6">

          <h2 className="text-3xl font-bold text-slate-900">
            Edit Profile
          </h2>

          <button
            onClick={onClose}
            className="text-slate-600 hover:text-red-500 transition"
          >
            <X size={28} />
          </button>

        </div>

        {/* Body */}

        <div className="p-8 space-y-8">

          {/* Personal Information */}

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">

              {/* Full Name */}

              <div>

                <label className="block text-slate-900 font-semibold mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

              </div>

              {/* Department */}

              <div>

                <label className="block text-slate-900 font-semibold mb-2">
                  Department
                </label>

                <input
                  type="text"
                  value={profileData.department}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 font-medium cursor-not-allowed"
                />

              </div>

              {/* University */}

              <div>

                <label className="block text-slate-900 font-semibold mb-2">
                  University
                </label>

                <input
                  type="text"
                  value={profileData.university}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 font-medium cursor-not-allowed"
                />

              </div>

            </div>

          </div>

        </div>

        {/* Academic Information */}

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

     <h3 className="text-2xl font-bold text-slate-900 mb-6">
        Academic Information
     </h3>

    <div className="grid md:grid-cols-2 gap-6">

        {/* Program */}

        <div>

            <label className="block text-slate-900 font-semibold mb-2">
                Program
            </label>

            <select
                name="program"
                value={formData.program}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900"
            >
                <option value="">Select Program</option>
                <option value="Bachelors">Bachelors</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
            </select>

        </div>

        {/* Semester */}

        <div>

            <label className="block text-slate-900 font-semibold mb-2">
                Semester
            </label>

            <input
                type="text"
                value={formData.semester}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 font-medium cursor-not-allowed"
            />

        </div>

        {/* CGPA */}

        <div>

            <label className="block text-slate-900 font-semibold mb-2">
                CGPA
            </label>

            <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                name="cgpa"
                value={formData.cgpa}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900"
            />

        </div>

        {/* Publications */}

        <div>

            <label className="block text-slate-900 font-semibold mb-2">
                Number of Publications
            </label>

            <input
                type="number"
                min="0"
                name="publications"
                value={formData.publications}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900"
            />

        </div>

    </div>
    {/* ================= Thesis Information ================= */}

    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

    <h3 className="text-2xl font-bold text-slate-900 mb-6">
        Thesis Information
    </h3>

    <div className="space-y-6">

        {/* Thesis Title */}

        <div>

            <label className="block text-slate-900 font-semibold mb-2">
                Thesis Title
            </label>

            <input
                type="text"
                name="thesisTitle"
                value={formData.thesisTitle}
                onChange={handleChange}
                placeholder="Enter your thesis title"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

        </div>

        {/* Supervisor */}

        <div>

            <label className="block text-slate-900 font-semibold mb-2">
                Supervisor
            </label>

            <input
                type="text"
                value={formData.supervisor}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 font-medium cursor-not-allowed"
            />

        </div>

        {/* Bio */}

    </div>

    </div>
    </div>
    {/* ================= Research Interests ================= */}

  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

  <h3 className="text-2xl font-bold text-slate-900 mb-6">
    Research Interests
  </h3>

  <div className="flex flex-wrap gap-3">

    {RESEARCH_OPTIONS.map((item) => {

      const selected =
        formData.researchInterests.includes(item);

      return (

        <button
          key={item}
          type="button"
          onClick={() => toggleResearch(item)}
          className={`px-4 py-2 rounded-full border font-semibold transition-all

            ${
              selected
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
            }
          `}
        >

          {item}

        </button>

      );

    })}

  </div>

   </div>

    {/* ================= Technical Skills ================= */}

  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">

    <h3 className="text-2xl font-bold text-slate-900 mb-6">
        Technical Skills
    </h3>

    <div className="flex flex-wrap gap-3">

        {TECHNICAL_SKILLS.map((skill) => {

            const selected =
                formData.skills.includes(skill);

            return (

                <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-4 py-2 rounded-full border font-semibold transition-all

                    ${
                        selected
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
                    }
                    `}
                >

                    {skill}

                </button>

            );

        })}

    </div>

   </div>
        {/* Footer */}

        <div className="border-t border-slate-200 px-8 py-5 flex justify-end gap-4">

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition"
          >
            Cancel
          </button>
 
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
>
           {saving ? "Saving..." : "Save Changes"}
          </button>        
        

        </div>

      </div>

    </div>
  );

};

export default EditProfileModal;