import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  UserPlus,
  Search,
} from "lucide-react";

import {
  getAllGroups,
  requestToJoinGroup,
} from "../../services/thesisGroupService";

const BrowseGroups = () => {
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requestingGroupId, setRequestingGroupId] =
    useState(null);

  // ================= GET CURRENT USER =================

  const getCurrentUser = () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("thesisSphereUser")
      );

      return user;
    } catch (error) {
      console.error(
        "Failed to get current user:",
        error
      );

      return null;
    }
  };

  // ================= LOAD GROUPS =================

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllGroups();

      console.log(
        "BROWSE GROUPS RESPONSE:",
        response.data
      );

      setGroups(response.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // ================= SEARCH =================

  const filteredGroups = groups.filter((group) => {
    const topicTitle =
      group.topicId?.title?.toLowerCase() || "";

    const groupName =
      group.groupName?.toLowerCase() || "";

    const search =
      searchTerm.toLowerCase().trim();

    return (
      topicTitle.includes(search) ||
      groupName.includes(search)
    );
  });

  // ================= REQUEST TO JOIN =================

  const handleRequestToJoin = async (groupId) => {
    try {
      setRequestingGroupId(groupId);

      await requestToJoinGroup(groupId);

      /*
       * Reload groups from backend.
       *
       * This is important because joinRequests
       * are stored in MongoDB.
       */
      await loadGroups();

      alert("Join request sent successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setRequestingGroupId(null);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="text-slate-600">
        Loading groups...
      </div>
    );
  }

  // ================= ERROR =================

  if (error) {
    return (
      <div
        className="bg-red-50
                   border border-red-200
                   text-red-700
                   rounded-xl
                   p-4"
      >
        {error}
      </div>
    );
  }

  // ================= CURRENT USER =================

  const currentUser = getCurrentUser();

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Browse Thesis Groups
        </h2>

        <p className="text-slate-600 mt-1">
          Search for groups by thesis topic or group name.
        </p>
      </div>

      {/* ================= SEARCH ================= */}

      <div className="relative">

        <Search
          size={20}
          className="absolute left-4 top-1/2
                     -translate-y-1/2
                     text-slate-400"
        />

        <input
          type="text"
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          placeholder="Search by thesis topic..."
          className="w-full bg-white
                     border border-slate-300
                     rounded-xl
                     pl-12 pr-4 py-3
                     text-slate-900
                     placeholder:text-slate-400
                     focus:outline-none
                     focus:ring-2
                     focus:ring-blue-500
                     focus:border-blue-500"
        />

      </div>

      {/* ================= NO GROUPS ================= */}

      {groups.length === 0 && (
        <div
          className="bg-white
                     border border-slate-200
                     rounded-2xl
                     p-8
                     text-center"
        >

          <Users
            size={35}
            className="mx-auto text-slate-400"
          />

          <h3
            className="text-lg
                       font-bold
                       text-slate-900
                       mt-4"
          >
            No thesis groups available
          </h3>

          <p className="text-slate-600 mt-1">
            There are currently no groups to browse.
          </p>

        </div>
      )}

      {/* ================= NO SEARCH RESULTS ================= */}

      {groups.length > 0 &&
        filteredGroups.length === 0 && (
          <div
            className="bg-white
                       border border-slate-200
                       rounded-2xl
                       p-8
                       text-center"
          >

            <Search
              size={35}
              className="mx-auto text-slate-400"
            />

            <h3
              className="text-lg
                         font-bold
                         text-slate-900
                         mt-4"
            >
              No matching groups found
            </h3>

            <p className="text-slate-600 mt-1">
              Try searching for a different thesis topic
              or group name.
            </p>

          </div>
        )}

      {/* ================= GROUP CARDS ================= */}

      {filteredGroups.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5">

          {filteredGroups.map((group) => {

            const memberCount =
              group.members?.length || 0;

            const isFull =
              memberCount >= 5;

            // ==========================================
            // CHECK SAVED JOIN REQUEST
            // ==========================================

            const requestSent =
              group.joinRequests?.some((request) => {

                const requestStudentId =
                  request.studentId?._id ||
                  request.studentId;

                return (
                  requestStudentId?.toString() ===
                    currentUser?._id?.toString() &&
                  request.status === "pending"
                );
              }) || false;

            const isRequesting =
              requestingGroupId === group._id;

            return (
              <div
                key={group._id}
                className="bg-white
                           border border-slate-200
                           rounded-2xl
                           shadow-sm
                           p-6"
              >

                {/* ================= GROUP NAME ================= */}

                <h3
                  className="text-xl
                             font-bold
                             text-slate-900"
                >
                  {group.groupName}
                </h3>

                {/* ================= THESIS TOPIC ================= */}

                <div
                  className="flex
                             items-start
                             gap-2
                             mt-4"
                >

                  <BookOpen
                    size={18}
                    className="text-blue-600
                               mt-1
                               shrink-0"
                  />

                  <div>

                    <p
                      className="text-sm
                                 font-semibold
                                 text-slate-500"
                    >
                      Thesis Topic
                    </p>

                    <p
                      className="text-slate-800
                                 font-medium"
                    >
                      {group.topicId?.title ||
                        "Topic not available"}
                    </p>

                    {/* Topic description */}

                    {group.topicId?.description && (
                      <p
                        className="text-sm
                                   text-slate-600
                                   mt-2"
                      >
                        {group.topicId.description}
                      </p>
                    )}

                  </div>

                </div>

                {/* ================= MEMBERS ================= */}

                <div
                  className="flex
                             items-center
                             gap-2
                             mt-4"
                >

                  <Users
                    size={18}
                    className="text-slate-500"
                  />

                  <span
                    className="text-slate-700
                               font-medium"
                  >
                    {memberCount} / 5 members
                  </span>

                </div>

                {/* ================= STATUS ================= */}

                <div className="mt-4">

                  <span
                    className={`inline-flex
                                px-3
                                py-1
                                rounded-full
                                text-sm
                                font-semibold
                                ${
                                  group.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                  >
                  </span>

                </div>

                {/* ================= JOIN BUTTON ================= */}

                <div className="mt-6">

                  {isFull ? (

                    // GROUP FULL

                    <button
                      disabled
                      className="w-full
                                 px-4
                                 py-3
                                 rounded-xl
                                 bg-slate-100
                                 text-slate-500
                                 font-semibold
                                 cursor-not-allowed"
                    >
                      Group Full
                    </button>

                  ) : requestSent ? (

                    // REQUEST ALREADY SENT

                    <button
                      disabled
                      className="w-full
                                 px-4
                                 py-3
                                 rounded-xl
                                 bg-green-100
                                 text-green-700
                                 font-semibold
                                 cursor-not-allowed"
                    >
                      Request Sent
                    </button>

                  ) : (

                    // REQUEST TO JOIN

                    <button
                      onClick={() =>
                        handleRequestToJoin(
                          group._id
                        )
                      }
                      disabled={isRequesting}
                      className="w-full
                                 flex
                                 items-center
                                 justify-center
                                 gap-2
                                 px-4
                                 py-3
                                 rounded-xl
                                 bg-blue-600
                                 hover:bg-blue-700
                                 text-white
                                 font-semibold
                                 transition
                                 disabled:opacity-60
                                 disabled:cursor-not-allowed"
                    >

                      <UserPlus size={18} />

                      {isRequesting
                        ? "Sending..."
                        : "Request to Join"}

                    </button>

                  )}

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
};

export default BrowseGroups;