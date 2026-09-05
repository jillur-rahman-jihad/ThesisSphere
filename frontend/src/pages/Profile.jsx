import React, { useEffect, useState } from "react";
import { useOutletContext, Navigate } from "react-router-dom";
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
        <p className="text-slate-300 text-lg font-semibold">
          Loading profile...
        </p>
      </div>
    );
  }

  // ==========================================
  // STUDENT CHECK
  // ==========================================

  if (!isStudent) {
    return <Navigate to="/faculty-profile" replace />;
  }

  // ==========================================
  // PROFILE DATA
  // ==========================================

  const user = profileData?.user || {};
  const profile = profileData?.profile || {};
  const thesisTitle =
    profile.thesisTitle ||
    profile.thesisGroupId?.topicId?.title ||
    "Not Added";
  const supervisorName =
    profile.supervisorId?.fullName ||
    profile.thesisGroupId?.supervisorId?.fullName ||
    "Not Assigned";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">

      {/* ================= HEADER ================= */}

      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-indigo-700 via-purple-600 to-sky-600 p-8 shadow-2xl">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          {/* PROFILE INFO */}

          <div className="flex items-center gap-6">

            {/* PROFILE ICON */}

            <div className="w-24 h-24 shrink-0 rounded-[28px] border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
              <User size={45} strokeWidth={1.8} />
            </div>

            {/* NAME + DETAILS */}

            <div>

              <p className="text-sm tracking-[0.35em] uppercase text-indigo-100 font-semibold mb-2">
                Student Profile
              </p>

              <h1 className="text-3xl md:text-4xl font-bold text-white capitalize">
                {user.fullName || "Student Name"}
              </h1>

              <p className="text-white/90 text-lg mt-1 font-medium">
                {user.department || "Department"}
                <span className="mx-2 text-white/50">·</span>
                {user.university || "University"}
              </p>

            </div>

          </div>

          {/* EDIT BUTTON */}

          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center justify-center gap-2 self-start md:self-center bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all duration-200 backdrop-blur-sm shadow-lg"
          >
            <Pencil size={18} />
            Edit Profile
          </button>

        </div>

      </div>


      {/* ================= ACADEMIC + THESIS ================= */}

      <div className="grid md:grid-cols-2 gap-6">

        {/* ================= ACADEMIC ================= */}

        <div className="bg-slate-800/90 border border-slate-700 rounded-[26px] shadow-xl p-7">

          <h2 className="text-sm tracking-[0.28em] uppercase font-semibold text-slate-400 mb-6 flex items-center gap-3">

            <GraduationCap
              size={22}
              className="text-slate-400"
              strokeWidth={1.8}
            />

            Academic Information

          </h2>

          <div className="space-y-5">

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

        <div className="bg-slate-800/90 border border-slate-700 rounded-[26px] shadow-xl p-7">

          <h2 className="text-sm tracking-[0.28em] uppercase font-semibold text-slate-400 mb-6 flex items-center gap-3">

            <BookOpen
              size={22}
              className="text-slate-400"
              strokeWidth={1.8}
            />

            Thesis Information

          </h2>

          <div className="space-y-6">

            {/* THESIS TITLE */}

            <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-5">

              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">
                Thesis Title
              </p>

              <p className="text-slate-100 font-medium leading-7">
                {thesisTitle}
              </p>

            </div>

            {/* SUPERVISOR */}

            <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-5">

              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">
                Supervisor
              </p>

              <p className="text-slate-100 font-medium">
                {supervisorName}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ================= RESEARCH INTERESTS ================= */}

      <div className="bg-slate-800/90 border border-slate-700 rounded-[26px] shadow-xl p-7">

        <h2 className="text-sm tracking-[0.28em] uppercase font-semibold text-slate-400 mb-6">
          Research Interests
        </h2>

        <div className="flex flex-wrap gap-3">

          {profile.researchInterests?.length ? (

            profile.researchInterests.map((item, index) => (
              <span
                key={index}
                className="bg-indigo-500/15 border border-indigo-400/20 text-indigo-200 font-medium px-4 py-2 rounded-full"
              >
                {item}
              </span>
            ))

          ) : (

            <p className="text-slate-500">
              No research interests added.
            </p>

          )}

        </div>

      </div>


      {/* ================= TECHNICAL SKILLS ================= */}

      <div className="bg-slate-800/90 border border-slate-700 rounded-[26px] shadow-xl p-7">

        <h2 className="text-sm tracking-[0.28em] uppercase font-semibold text-slate-400 mb-6">
          Technical Skills
        </h2>

        <div className="flex flex-wrap gap-3">

          {profile.skills?.length ? (

            profile.skills.map((item, index) => (
              <span
                key={index}
                className="bg-sky-500/15 border border-sky-400/20 text-sky-200 font-medium px-4 py-2 rounded-full"
              >
                {item}
              </span>
            ))

          ) : (

            <p className="text-slate-500">
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
  <div className="flex justify-between items-center gap-4 border-b border-slate-700 pb-3">

    <div className="flex items-center gap-3 text-slate-400 font-medium">

      <span className="text-slate-400">
        {icon}
      </span>

      <span>{label}</span>

    </div>

    <span className="text-slate-100 font-medium text-right break-all">
      {value}
    </span>

  </div>
);


export default Profile;