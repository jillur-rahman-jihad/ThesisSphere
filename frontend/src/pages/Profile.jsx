import React, { useEffect, useState } from "react";
import { useOutletContext, Navigate } from "react-router-dom";
import {
  GraduationCap,
  School,
  BookOpen,
  Award,
  User,
  Pencil,
  Sparkles,
  Code2,
  FileText,
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
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <p className="text-slate-200 text-lg font-semibold">
          Loading profile...
        </p>
      </div>
    );
  }

  // ==========================================
  // STUDENT CHECK (REDIRECT FACULTY AUTOMATICALLY)
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-2">

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ================= HEADER ================= */}

        <div className="relative overflow-hidden rounded-[28px] border border-indigo-400/20 shadow-2xl">

          {/* Gradient Background */}

          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-violet-700 to-sky-600" />

          {/* Soft Overlay */}

          <div className="absolute inset-0 bg-black/10" />

          <div className="relative p-8 md:p-10">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-7">

              {/* PROFILE INFO */}

              <div className="flex items-center gap-6">

                {/* Avatar */}

                <div className="w-24 h-24 md:w-28 md:h-28 rounded-[26px] bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xl">

                  <User size={48} strokeWidth={1.8} />

                </div>

                {/* Name + Details */}

                <div>

                  <p className="text-xs md:text-sm tracking-[0.35em] uppercase text-white/70 font-semibold mb-2">
                    Student Profile
                  </p>

                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {user.fullName || "Student Name"}
                  </h1>

                  <p className="text-white/90 text-base md:text-lg mt-2 font-medium">
                    {user.department || "Department"}
                  </p>

                  <p className="text-white/70 text-sm md:text-base mt-1">
                    {user.university || "University"}
                  </p>

                </div>

              </div>

              {/* EDIT BUTTON */}

              <button
                onClick={() => setShowEditModal(true)}
                className="self-start md:self-center flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white font-semibold transition-all duration-200 shadow-lg"
              >
                <Pencil size={17} />
                Edit Profile
              </button>

            </div>

          </div>

        </div>


        {/* ================= ACADEMIC + THESIS ================= */}

        <div className="grid md:grid-cols-2 gap-6">

          {/* ================= ACADEMIC ================= */}

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-[24px] shadow-xl p-6 md:p-7">

            {/* Section Header */}

            <div className="flex items-center gap-3 mb-7">

              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
                <GraduationCap
                  size={22}
                  className="text-indigo-300"
                />
              </div>

              <div>
                <p className="text-xs tracking-[0.25em] uppercase text-slate-500 font-semibold">
                  Education
                </p>

                <h2 className="text-xl font-bold text-white">
                  Academic Information
                </h2>
              </div>

            </div>

            <div className="space-y-1">

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

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-[24px] shadow-xl p-6 md:p-7">

            {/* Section Header */}

            <div className="flex items-center gap-3 mb-7">

              <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center">
                <FileText
                  size={21}
                  className="text-sky-300"
                />
              </div>

              <div>
                <p className="text-xs tracking-[0.25em] uppercase text-slate-500 font-semibold">
                  Research
                </p>

                <h2 className="text-xl font-bold text-white">
                  Thesis Information
                </h2>
              </div>

            </div>

            <div className="space-y-6">

              {/* Thesis Title */}

              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">

                <p className="text-xs tracking-[0.2em] uppercase text-slate-500 font-semibold mb-2">
                  Thesis Title
                </p>

                <p className="text-slate-100 font-medium leading-relaxed">
                  {thesisTitle}
                </p>

              </div>


              {/* Supervisor */}

              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">

                <p className="text-xs tracking-[0.2em] uppercase text-slate-500 font-semibold mb-2">
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

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-[24px] shadow-xl p-6 md:p-7">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
              <Sparkles
                size={21}
                className="text-violet-300"
              />
            </div>

            <div>

              <p className="text-xs tracking-[0.25em] uppercase text-slate-500 font-semibold">
                Interests
              </p>

              <h2 className="text-xl font-bold text-white">
                Research Interests
              </h2>

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            {profile.researchInterests?.length ? (

              profile.researchInterests.map((item, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-200 font-medium text-sm hover:bg-indigo-500/20 transition"
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

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-[24px] shadow-xl p-6 md:p-7">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
              <Code2
                size={21}
                className="text-emerald-300"
              />
            </div>

            <div>

              <p className="text-xs tracking-[0.25em] uppercase text-slate-500 font-semibold">
                Expertise
              </p>

              <h2 className="text-xl font-bold text-white">
                Technical Skills
              </h2>

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            {profile.skills?.length ? (

              profile.skills.map((item, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 font-medium text-sm hover:bg-emerald-500/20 transition"
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

    </div>
  );
};


// ==========================================
// INFO ROW
// ==========================================

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-800 last:border-b-0">

    <div className="flex items-center gap-3 min-w-0">

      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400">
        {icon}
      </div>

      <span className="text-slate-400 font-medium">
        {label}
      </span>

    </div>

    <span className="text-slate-100 font-semibold text-right">
      {value}
    </span>

  </div>
);


export default Profile;