import React, { useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
} from "lucide-react";

import {
  createThesisGroup,
} from "../../services/thesisGroupService";

import {
  getThesisTopics,
} from "../../services/thesisTopicService";

const CreateThesisGroup = ({
  onClose,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState("");
  const [topicId, setTopicId] = useState("");

  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);

  const [members, setMembers] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // GET CURRENT USER
  // ==========================================

  const getCurrentUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("thesisSphereUser")
      );
    } catch (error) {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  // ==========================================
  // LOAD TOPICS + STUDENTS
  // ==========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setError("");

        // --------------------------------------
        // Load thesis topics
        // --------------------------------------

        const topicResponse =
          await getThesisTopics(currentUser);

        const topicData =
          topicResponse.data || [];

        // Only show available topics
        const availableTopics =
          topicData.filter(
            (topic) =>
              topic.status === "available"
          );

        setTopics(availableTopics);

        // --------------------------------------
        // Load users
        // --------------------------------------

        const userResponse = await fetch(
          "/api/users"
        );

        const userData =
          await userResponse.json();

        if (!userResponse.ok) {
          throw new Error(
            userData.message ||
              "Failed to load students"
          );
        }

        const allUsers =
          userData.data || [];

        // Only students
        const studentUsers =
          allUsers.filter(
            (user) =>
              user.role === "student"
          );

        setStudents(studentUsers);

        // --------------------------------------
        // Automatically add logged-in student
        // as Member 1
        // --------------------------------------

        if (currentUser?._id) {
          const loggedInStudent =
            studentUsers.find(
              (student) =>
                student._id.toString() ===
                currentUser._id.toString()
            );

          if (loggedInStudent) {
            setMembers([
              {
                userId:
                  loggedInStudent._id,
                role: "",
                chapter: "",
                isCreator: true,
              },
            ]);
          } else {
            // Fallback in case current user
            // is not returned by /api/users
            setMembers([
              {
                userId:
                  currentUser._id,
                role: "",
                chapter: "",
                isCreator: true,
              },
            ]);
          }
        }

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // ==========================================
  // ADD MEMBER
  // ==========================================

  const addMember = () => {
    if (members.length >= 5) {
      setError(
        "A thesis group can have a maximum of 5 members."
      );
      return;
    }

    setError("");

    setMembers([
      ...members,
      {
        userId: "",
        role: "",
        chapter: "",
        isCreator: false,
      },
    ]);
  };

  // ==========================================
  // REMOVE MEMBER
  // ==========================================

  const removeMember = (index) => {
    // Never allow creator to be removed
    if (members[index]?.isCreator) {
      setError(
        "The group creator cannot be removed."
      );
      return;
    }

    const updatedMembers = [
      ...members,
    ];

    updatedMembers.splice(index, 1);

    setMembers(updatedMembers);
    setError("");
  };

  // ==========================================
  // UPDATE MEMBER
  // ==========================================

  const updateMember = (
    index,
    field,
    value
  ) => {
    const updatedMembers = [
      ...members,
    ];

    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value,
    };

    setMembers(updatedMembers);
    setError("");
  };

  // ==========================================
  // GET AVAILABLE STUDENTS
  // ==========================================

  const getAvailableStudents = (
    currentIndex
  ) => {
    const selectedIds = members
      .map((member, index) => {
        if (index === currentIndex) {
          return null;
        }

        return member.userId;
      })
      .filter(Boolean)
      .map((id) => id.toString());

    return students.filter(
      (student) =>
        !selectedIds.includes(
          student._id.toString()
        )
    );
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ------------------------------------------
    // Group name
    // ------------------------------------------

    if (!groupName.trim()) {
      setError(
        "Group name is required."
      );
      return;
    }

    // ------------------------------------------
    // Topic
    // ------------------------------------------

    if (!topicId) {
      setError(
        "Please select a thesis topic."
      );
      return;
    }

    // ------------------------------------------
    // Minimum 2 members
    // ------------------------------------------

    if (members.length < 2) {
      setError(
        "A thesis group must have at least 2 members. Add at least one more student."
      );
      return;
    }

    // ------------------------------------------
    // Maximum 5 members
    // ------------------------------------------

    if (members.length > 5) {
      setError(
        "A thesis group can have a maximum of 5 members."
      );
      return;
    }

    // ------------------------------------------
    // Validate members
    // ------------------------------------------

    for (const member of members) {
      if (!member.userId) {
        setError(
          "Please select a student for every member."
        );
        return;
      }

      if (!member.role.trim()) {
        setError(
          "Please provide a role for every member."
        );
        return;
      }

      if (!member.chapter.trim()) {
        setError(
          "Please provide a thesis chapter for every member."
        );
        return;
      }
    }

    // ------------------------------------------
    // Check duplicate students
    // ------------------------------------------

    const memberIds = members.map(
      (member) =>
        member.userId.toString()
    );

    const uniqueMemberIds = [
      ...new Set(memberIds),
    ];

    if (
      uniqueMemberIds.length !==
      memberIds.length
    ) {
      setError(
        "A student cannot be added more than once."
      );
      return;
    }

    // ------------------------------------------
    // Make sure creator is included
    // ------------------------------------------

    if (!currentUser?._id) {
      setError(
        "Unable to identify the logged-in student."
      );
      return;
    }

    const creatorIncluded =
      memberIds.includes(
        currentUser._id.toString()
      );

    if (!creatorIncluded) {
      setError(
        "The group creator must be included as a member."
      );
      return;
    }

    // ==========================================
    // CREATE GROUP
    // ==========================================

    try {
      setLoading(true);

      const response =
        await createThesisGroup({
          groupName:
            groupName.trim(),

          topicId,

          members: memberIds,

          memberDetails:
            members.map(
              (member) => ({
                userId:
                  member.userId,

                role:
                  member.role.trim(),

                chapter:
                  member.chapter.trim(),
              })
            ),

          // Backend will use the
          // topic's supervisor
          supervisorId: null,
        });

      alert(
        response.message ||
          "Thesis group created successfully!"
      );

      if (onGroupCreated) {
        onGroupCreated(
          response.data
        );
      }

      onClose();

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to create thesis group."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loadingData) {
    return (
      <div
        className="fixed inset-0 z-50
                   bg-black/40
                   flex items-center
                   justify-center p-4"
      >
        <div
          className="bg-white
                     rounded-2xl
                     p-8
                     shadow-xl"
        >
          <p
            className="text-slate-700
                       font-medium"
          >
            Loading thesis topics and students...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50
                 bg-black/40
                 flex items-center
                 justify-center
                 p-4"
    >
      <div
        className="bg-white
                   w-full
                   max-w-3xl
                   max-h-[90vh]
                   overflow-y-auto
                   rounded-2xl
                   shadow-xl"
      >

        {/* ======================================
            HEADER
        ====================================== */}

        <div
          className="flex
                     items-center
                     justify-between
                     p-6
                     border-b
                     border-slate-200"
        >
          <div>
            <h2
              className="text-2xl
                         font-bold
                         text-slate-900"
            >
              Create Thesis Group
            </h2>

            <p
              className="text-slate-600
                         mt-1"
            >
              Create a group with 2 to 5 students.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2
                       rounded-lg
                       hover:bg-slate-100
                       text-slate-500"
          >
            <X size={22} />
          </button>
        </div>


        {/* ======================================
            FORM
        ====================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >

          {/* ERROR */}

          {error && (
            <div
              className="bg-red-50
                         border
                         border-red-200
                         text-red-700
                         rounded-xl
                         p-4"
            >
              {error}
            </div>
          )}


          {/* ====================================
              GROUP NAME
          ==================================== */}

          <div>
            <label
              className="block
                         text-sm
                         font-semibold
                         text-slate-800
                         mb-2"
            >
              Group Name
            </label>

            <input
              type="text"
              value={groupName}
              onChange={(e) =>
                setGroupName(
                  e.target.value
                )
              }
              placeholder="Enter thesis group name"
              className="w-full
                         border
                         border-slate-300
                         rounded-xl
                         px-4
                         py-3
                         text-slate-900
                         focus:outline-none
                         focus:ring-2
                         focus:ring-blue-500"
            />
          </div>


          {/* ====================================
              THESIS TOPIC
          ==================================== */}

          <div>
            <label
              className="block
                         text-sm
                         font-semibold
                         text-slate-800
                         mb-2"
            >
              Thesis Topic
            </label>

            <select
              value={topicId}
              onChange={(e) =>
                setTopicId(
                  e.target.value
                )
              }
              className="w-full
                         border
                         border-slate-300
                         rounded-xl
                         px-4
                         py-3
                         bg-white
                         text-slate-900
                         focus:outline-none
                         focus:ring-2
                         focus:ring-blue-500"
            >
              <option value="">
                Select a thesis topic
              </option>

              {topics.map(
                (topic) => (
                  <option
                    key={topic._id}
                    value={topic._id}
                  >
                    {topic.title}
                  </option>
                )
              )}
            </select>

            {topics.length === 0 && (
              <p
                className="text-sm
                           text-amber-600
                           mt-2"
              >
                No available thesis topics found.
              </p>
            )}
          </div>


          {/* ====================================
              GROUP MEMBERS
          ==================================== */}

          <div>

            <div
              className="flex
                         items-center
                         justify-between
                         mb-3"
            >
              <div>
                <h3
                  className="text-lg
                             font-bold
                             text-slate-900"
                >
                  Group Members
                </h3>

                <p
                  className="text-sm
                             text-slate-600"
                >
                  {members.length} / 5 members
                </p>
              </div>

              <button
                type="button"
                onClick={addMember}
                disabled={
                  members.length >= 5
                }
                className="flex
                           items-center
                           gap-2
                           px-4
                           py-2
                           rounded-xl
                           bg-blue-600
                           hover:bg-blue-700
                           text-white
                           font-semibold
                           disabled:opacity-50
                           disabled:cursor-not-allowed"
              >
                <Plus size={17} />
                Add Member
              </button>
            </div>


            {/* MEMBER LIST */}

            <div className="space-y-4">

              {members.map(
                (member, index) => {

                  const availableStudents =
                    getAvailableStudents(
                      index
                    );

                  return (
                    <div
                      key={index}
                      className={`border
                                 rounded-xl
                                 p-4
                                 ${
                                   member.isCreator
                                     ? "border-blue-300 bg-blue-50"
                                     : "border-slate-200 bg-slate-50"
                                 }`}
                    >

                      {/* MEMBER HEADER */}

                      <div
                        className="flex
                                   items-center
                                   justify-between
                                   mb-4"
                      >
                        <div>

                          <h4
                            className="font-semibold
                                       text-slate-800"
                          >
                            Member {index + 1}

                            {member.isCreator && (
                              <span
                                className="ml-2
                                           text-xs
                                           bg-blue-600
                                           text-white
                                           px-2
                                           py-1
                                           rounded-full"
                              >
                                You
                              </span>
                            )}
                          </h4>

                        </div>

                        {!member.isCreator && (
                          <button
                            type="button"
                            onClick={() =>
                              removeMember(
                                index
                              )
                            }
                            className="p-2
                                       rounded-lg
                                       text-red-500
                                       hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>


                      {/* STUDENT */}

                      <div className="mb-4">

                        <label
                          className="block
                                     text-sm
                                     font-semibold
                                     text-slate-700
                                     mb-2"
                        >
                          Student
                        </label>

                        <select
                          value={
                            member.userId
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              "userId",
                              e.target.value
                            )
                          }
                          disabled={
                            member.isCreator
                          }
                          className={`w-full
                                     border
                                     border-slate-300
                                     rounded-xl
                                     px-4
                                     py-3
                                     text-slate-900
                                     ${
                                       member.isCreator
                                         ? "bg-slate-200 cursor-not-allowed"
                                         : "bg-white"
                                     }`}
                        >

                          {member.isCreator ? (
                            <option
                              value={
                                member.userId
                              }
                            >
                              {currentUser?.fullName ||
                                currentUser?.name ||
                                currentUser?.email ||
                                "You"}
                            </option>
                          ) : (
                            <>
                              <option value="">
                                Select student
                              </option>

                              {availableStudents.map(
                                (student) => (
                                  <option
                                    key={
                                      student._id
                                    }
                                    value={
                                      student._id
                                    }
                                  >
                                    {student.fullName ||
                                      student.name ||
                                      student.email}
                                  </option>
                                )
                              )}
                            </>
                          )}

                        </select>

                        {member.isCreator && (
                          <p
                            className="text-xs
                                       text-blue-700
                                       mt-2"
                          >
                            You are automatically included as the group creator.
                          </p>
                        )}

                      </div>


                      {/* ROLE + CHAPTER */}

                      <div
                        className="grid
                                   md:grid-cols-2
                                   gap-4"
                      >

                        {/* ROLE */}

                        <div>

                          <label
                            className="block
                                       text-sm
                                       font-semibold
                                       text-slate-700
                                       mb-2"
                          >
                            Role
                          </label>

                          <input
                            type="text"
                            value={
                              member.role
                            }
                            onChange={(e) =>
                              updateMember(
                                index,
                                "role",
                                e.target.value
                              )
                            }
                            placeholder="e.g. ML Developer"
                            className="w-full
                                       border
                                       border-slate-300
                                       rounded-xl
                                       px-4
                                       py-3
                                       bg-white
                                       text-slate-900
                                       focus:outline-none
                                       focus:ring-2
                                       focus:ring-blue-500"
                          />

                        </div>


                        {/* CHAPTER */}

                        <div>

                          <label
                            className="block
                                       text-sm
                                       font-semibold
                                       text-slate-700
                                       mb-2"
                          >
                            Thesis Chapter / Part
                          </label>

                          <input
                            type="text"
                            value={
                              member.chapter
                            }
                            onChange={(e) =>
                              updateMember(
                                index,
                                "chapter",
                                e.target.value
                              )
                            }
                            placeholder="e.g. Methodology"
                            className="w-full
                                       border
                                       border-slate-300
                                       rounded-xl
                                       px-4
                                       py-3
                                       bg-white
                                       text-slate-900
                                       focus:outline-none
                                       focus:ring-2
                                       focus:ring-blue-500"
                          />

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>


            {/* Minimum member information */}

            {members.length === 1 && (
              <p
                className="text-sm
                           text-amber-600
                           mt-3"
              >
                You are already included. Add at least one more student to create the group.
              </p>
            )}

          </div>


          {/* ====================================
              BUTTONS
          ==================================== */}

          <div
            className="flex
                       justify-end
                       gap-3
                       pt-4
                       border-t
                       border-slate-200"
          >

            <button
              type="button"
              onClick={onClose}
              className="px-5
                         py-3
                         rounded-xl
                         border
                         border-slate-300
                         text-slate-700
                         font-semibold
                         hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                loadingData ||
                topics.length === 0 ||
                members.length < 2
              }
              className="px-5
                         py-3
                         rounded-xl
                         bg-blue-600
                         hover:bg-blue-700
                         text-white
                         font-semibold
                         disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
              {loading
                ? "Creating..."
                : "Create Group"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default CreateThesisGroup;