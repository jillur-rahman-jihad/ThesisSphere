import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  GraduationCap,
  School,
  BookOpen,
  Award,
  User,
  Pencil,
} from "lucide-react";

import { getProfile } from "../services/profileService";
import EditProfileModal from "../components/profile/EditProfileModal";

const Profile = () => {
  const { currentUser } = useOutletContext() || {};

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const isStudent = currentUser?.role === "student";

  // ==========================================
  // LOAD STUDENT PROFILE
  // ==========================================

  const loadProfile = async () => {
    try {
      const response = await getProfile();

      console.log("STUDENT PROFILE RESPONSE:", response);

      setProfileData(response.data);
    } catch (err) {
      console.error("Failed to load student profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStudent) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [isStudent]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold">
          Loading profile...
        </p>
      </div>
    );
  }

  // ==========================================
  // STUDENT CHECK
  // ==========================================

  if (!isStudent) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <p className="text-slate-700 font-semibold">
            This page is for student profiles.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PROFILE DATA
  // ==========================================

  const user = profileData?.user || {};
  const profile = profileData?.profile || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ================= HEADER ================= */}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div className="flex items-center gap-6">

            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <User size={45} />
            </div>

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                {user.fullName || "Student Name"}
              </h1>

              <p className="text-slate-700 text-lg mt-1 font-medium">
                {user.department || "Department"}
              </p>

              <p className="text-slate-600">
                {user.university || "University"}
              </p>

            </div>

          </div>

          {/* EDIT BUTTON */}

          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            <Pencil size={18} />
            Edit Profile
          </button>

        </div>

      </div>


      {/* ================= ACADEMIC + THESIS ================= */}

      <div className="grid md:grid-cols-2 gap-6">

        {/* ================= ACADEMIC ================= */}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <GraduationCap size={22} />
            Academic Information
          </h2>

          <div className="space-y-4">
            
            <InfoRow
              icon={<School size={18} />}
              label="Student ID"
              value={profile.studentId || "-"}
            />
            
            <InfoRow
              icon={<School size={18} />}
              label="Email"
              value={user.email || "-"}
            />

            <InfoRow
              icon={<School size={18} />}
              label="Program"
              value={profile.program || "-"}
            />

            <InfoRow
              icon={<BookOpen size={18} />}
              label="Semester"
              value={profile.semester || "-"}
            />

            <InfoRow
              icon={<Award size={18} />}
              label="CGPA"
              value={profile.cgpa || "-"}
            />

            <InfoRow
              icon={<Award size={18} />}
              label="Publications"
              value={profile.publications || "0"}
            />

          </div>

        </div>


        {/* ================= THESIS ================= */}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-slate-900 mb-5">
            Thesis Information
          </h2>

          <div className="space-y-5">

            <div>

              <p className="text-slate-800 dark:text-slate-100 font-semibold mb-2">
                Thesis Title
              </p>

              <p className="text-slate-700 dark:text-slate-200">
                {profile.thesisTitle || "Not Added"}
              </p>

            </div>

            <div>

              <p className="text-slate-800 dark:text-slate-100 font-semibold mb-2">
                Supervisor
              </p>

              <p className="text-slate-700 dark:text-slate-200">
                {profile.supervisorId || "Not Assigned"}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ================= RESEARCH INTERESTS ================= */}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
          Research Interests
        </h2>

        <div className="flex flex-wrap gap-3">

          {profile.researchInterests?.length ? (

            profile.researchInterests.map((item, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 font-medium px-4 py-2 rounded-full"
              >
                {item}
              </span>
            ))

          ) : (

            <p className="text-slate-600">
              No research interests added.
            </p>

          )}

        </div>

      </div>


      {/* ================= TECHNICAL SKILLS ================= */}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
          Technical Skills
        </h2>

        <div className="flex flex-wrap gap-3">

          {profile.skills?.length ? (

            profile.skills.map((item, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-800 font-medium px-4 py-2 rounded-full"
              >
                {item}
              </span>
            ))

          ) : (

            <p className="text-slate-600">
              No skills added.
            </p>

          )}

        </div>

      </div>


      {/* ================= EDIT PROFILE MODAL ================= */}

      {showEditModal && (
        <EditProfileModal
          profileData={{
            ...user,
            profile: profile,
            researchInterests: profile.researchInterests || [],
            skills: profile.skills || [],
          }}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={async () => {
            await loadProfile();
            setShowEditModal(false);
          }}
        />
      )}

    </div>
  );
};


// ==========================================
// INFO ROW
// ==========================================

const InfoRow = ({ icon, label, value }) => (
  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">

    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold">

      {icon}

      <span>{label}</span>

    </div>

    <span className="text-slate-700 dark:text-slate-200 font-medium">
      {value}
    </span>

  </div>
);


export default Profile;
