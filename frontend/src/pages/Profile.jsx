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

  const loadProfile = async () => {
      try {
        const response = await getProfile();
        console.log("PROFILE RESPONSE:", response.data);
        setProfileData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
      loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-800 text-lg font-semibold">
          Loading profile...
        </p>
      </div>
    );
  }

  const profile = profileData?.profile || {};

  if (!isStudent) {
    return <div className="min-h-full bg-[#f8f9fa]" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ================= HEADER ================= */}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div className="flex items-center gap-6">

            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white">

              <User size={45} />

            </div>

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                {profileData?.fullName || "Student Name"}
              </h1>

              <p className="text-slate-700 text-lg mt-1">
                {profileData?.department || "Department"}
              </p>

              <p className="text-slate-600">
                {profileData?.university || "University"}
              </p>

            </div>

          </div>
          {isStudent ? (
            <button
              onClick={() => {
                console.log("Edit clicked");
                setShowEditModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              <Pencil size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              Faculty profile editing will be added later.
            </div>
          )}

        </div>

      </div>

      {/* ================= ACADEMIC + THESIS ================= */}

      <div className="grid md:grid-cols-2 gap-6">

        {/* Academic */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">

            <GraduationCap size={22} />

            Academic Information

          </h2>

          <div className="space-y-4">

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

        {/* Thesis */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-slate-900 mb-5">

            Thesis Information

          </h2>

          <div className="space-y-5">

            <div>

              <p className="text-slate-800 font-semibold mb-2">
                Thesis Title
              </p>

              <p className="text-slate-700">
                {profile.thesisTitle || "Not Added"}
              </p>

            </div>

            <div>

              <p className="text-slate-800 font-semibold mb-2">
                Supervisor
              </p>

              <p className="text-slate-700">
                {profile.supervisorId || "Not Assigned"}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ================= RESEARCH ================= */}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

        <h2 className="text-xl font-bold text-slate-900 mb-5">
          Research Interests
        </h2>

        <div className="flex flex-wrap gap-3">

          {profileData?.researchInterests?.length ? (
            profileData.researchInterests.map((item, index) => (
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

      {/* ================= SKILLS ================= */}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

        <h2 className="text-xl font-bold text-slate-900 mb-5">
          Technical Skills
        </h2>

        <div className="flex flex-wrap gap-3">

          {profileData?.skills?.length ? (
            profileData.skills.map((item, index) => (
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
  {isStudent && showEditModal && (
    <EditProfileModal
        profileData={profileData}
        onClose={() => setShowEditModal(false)}
        onProfileUpdated={loadProfile}
    />
   )}
  </div>

    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex justify-between items-center border-b border-slate-200 pb-2">

    <div className="flex items-center gap-2 text-slate-800 font-semibold">

      {icon}

      {label}

    </div>

    <span className="text-slate-700 font-medium">
      {value}
    </span>
    
  </div>
);

export default Profile;