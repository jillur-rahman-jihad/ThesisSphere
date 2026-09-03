import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  PROGRAMS,
  RESEARCH_INTERESTS,
  TECHNICAL_SKILLS,
} from "../../constants/profileOptions";

import { updateProfile } from "../../services/profileService";

const EditProfileModal = ({
  profileData,
  onClose,
  onProfileUpdated,
}) => {
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    university: "",

    program: "",
    semester: "",
    cgpa: "",
    publications: 0,

    researchInterests: [],
    skills: [],
  });

  // ==========================================
  // LOAD EXISTING PROFILE DATA
  // ==========================================

  useEffect(() => {
    if (!profileData) return;

    const user = profileData.user || profileData;
    const profile = profileData.profile || {};

    setFormData({
      fullName: user.fullName || "",
      department: user.department || "",
      university: user.university || "",

      program: profile.program || "",
      semester: profile.semester || "",
      cgpa: profile.cgpa ?? "",
      publications: profile.publications ?? 0,

      researchInterests: profile.researchInterests || [],
      skills: profile.skills || [],
    });
  }, [profileData]);

  // ==========================================
  // HANDLE TEXT / INPUT CHANGES
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // TOGGLE RESEARCH INTEREST
  // ==========================================

  const toggleResearchInterest = (interest) => {
    setFormData((prev) => ({
      ...prev,

      researchInterests: prev.researchInterests.includes(interest)
        ? prev.researchInterests.filter(
            (item) => item !== interest
          )
        : [...prev.researchInterests, interest],
    }));
  };

  // ==========================================
  // TOGGLE TECHNICAL SKILL
  // ==========================================

  const toggleSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,

      skills: prev.skills.includes(skill)
        ? prev.skills.filter(
            (item) => item !== skill
          )
        : [...prev.skills, skill],
    }));
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const profileToUpdate = {
        fullName: formData.fullName,
        department: formData.department,
        university: formData.university,

        program: formData.program,

        cgpa:
          formData.cgpa === ""
            ? 0
            : Number(formData.cgpa),

        publications:
          formData.publications === ""
            ? 0
            : Number(formData.publications),

        researchInterests:
          formData.researchInterests,

        skills:
          formData.skills,
      };

      console.log(
        "UPDATING STUDENT PROFILE:",
        profileToUpdate
      );

      await updateProfile(profileToUpdate);

      // Reload profile in Profile.jsx
      if (onProfileUpdated) {
        await onProfileUpdated();
      }

      // Close modal
      onClose();

      // Simple success popup
      alert("Profile updated successfully!");

    } catch (error) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to update profile."
      );

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // MODAL
  // ==========================================

  if (!profileData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">

      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl dark:shadow-black/40">

        {/* ================= HEADER ================= */}

        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">

          <div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Edit Student Profile
            </h2>

            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Update your profile information
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X size={24} />
          </button>

        </div>


        {/* ================= FORM ================= */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >

          {/* ================= BASIC INFORMATION ================= */}

          <div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Basic Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

              {/* Full Name */}

              <div>

                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>


              {/* Department */}

              <div>

                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Department
                </label>

                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  disabled
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed"
                />

              </div>


              {/* University */}

              <div>

                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  University
                </label>

                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  disabled
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed"
                />

              </div>

            </div>

          </div>


          {/* ================= ACADEMIC INFORMATION ================= */}

          <div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Academic Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

              {/* Program */}

              <div>

                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Program
                </label>

                <select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option
                    value=""
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    Select Program
                  </option>

                  {PROGRAMS.map((program) => (
                    <option
                      key={program}
                      value={program}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {program}
                    </option>
                  ))}

                </select>

              </div>


              {/* Semester */}

              <div>

                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Semester
                </label>

                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  disabled
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed"
                />

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Semester cannot be edited here.
                </p>

              </div>


              {/* CGPA */}

              <div>

                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  CGPA
                </label>

                <input
                  type="number"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleChange}
                  min="0"
                  max="4"
                  step="0.01"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>


              {/* Publications */}

              <div>

                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Number of Publications
                </label>

                <input
                  type="number"
                  name="publications"
                  value={formData.publications}
                  onChange={handleChange}
                  min="0"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

          </div>


          {/* ================= RESEARCH INTERESTS ================= */}

          <div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Research Interests
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Select your research interests.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

              {RESEARCH_INTERESTS.map((interest) => {

                const selected =
                  formData.researchInterests.includes(
                    interest
                  );

                return (

                  <button
                    type="button"
                    key={interest}
                    onClick={() =>
                      toggleResearchInterest(
                        interest
                      )
                    }
                    className={`px-3 py-3 rounded-lg border text-sm font-semibold transition ${
                      selected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {interest}
                  </button>

                );

              })}

            </div>

          </div>


          {/* ================= TECHNICAL SKILLS ================= */}

          <div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Technical Skills
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Select your technical skills.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

              {TECHNICAL_SKILLS.map((skill) => {

                const selected =
                  formData.skills.includes(skill);

                return (

                  <button
                    type="button"
                    key={skill}
                    onClick={() =>
                      toggleSkill(skill)
                    }
                    className={`px-3 py-3 rounded-lg border text-sm font-semibold transition ${
                      selected
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {skill}
                  </button>

                );

              })}

            </div>

          </div>


          {/* ================= BUTTONS ================= */}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default EditProfileModal;