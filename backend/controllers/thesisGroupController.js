import mongoose from "mongoose";
import ThesisGroup from "../models/ThesisGroup.js";
import ThesisTopic from "../models/ThesisTopic.js";
import StudentProfile from "../models/StudentProfileModel.js";
import User from "../models/userModel.js";

// ==========================================
// GET MY THESIS GROUP
// GET /api/thesis-groups/my-group
// Protected
// ==========================================
export const getMyGroup = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({
      userId: req.user._id,
    });

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Student has no group
    if (!studentProfile.thesisGroupId) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "You are not currently in a thesis group",
      });
    }

    const group = await ThesisGroup.findById(
      studentProfile.thesisGroupId
    )
      .populate(
        "members",
        "fullName email department university role"
      )
      .populate(
        "leaderId",
        "fullName email department university role"
      )
      .populate(
        "supervisorId",
        "fullName email department university role"
      )
      .populate("topicId", "title description")
      .populate(
        "memberDetails.userId",
        "fullName email role"
      )
      .populate(
        "joinRequests.studentId",
        "fullName email"
      );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Thesis group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BROWSE ALL THESIS GROUPS
// GET /api/thesis-groups
// Protected
// ==========================================
export const getAllGroups = async (req, res, next) => {
  try {
    const groups = await ThesisGroup.find({})
      .populate(
        "members",
        "fullName role"
      )
      .populate("leaderId", "fullName")
      .populate(
        "topicId",
        "title description"
      )
      .populate(
        "joinRequests.studentId",
        "fullName email"
      );

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REQUEST TO JOIN A THESIS GROUP
// POST /api/thesis-groups/:id/request
// Protected
// ==========================================
export const requestToJoinGroup = async (req, res, next) => {
  try {
    const group = await ThesisGroup.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error("Thesis group not found");
    }

    // Check group status
    if (group.status !== "active") {
      res.status(400);
      throw new Error("This thesis group is inactive");
    }

    // Check maximum members
    if (group.members.length >= 5) {
      res.status(400);
      throw new Error(
        "This thesis group already has 5 members"
      );
    }

    const studentId = req.user._id;

    // Check whether student is already a member
    const alreadyMember = group.members.some(
      (memberId) =>
        memberId.toString() === studentId.toString()
    );

    if (alreadyMember) {
      res.status(400);
      throw new Error(
        "You are already a member of this group"
      );
    }

    // Check existing pending request
    const existingRequest =
      group.joinRequests.find(
        (request) =>
          request.studentId.toString() ===
            studentId.toString() &&
          request.status === "pending"
      );

    if (existingRequest) {
      res.status(400);
      throw new Error(
        "You already have a pending request"
      );
    }

    // Add request
    group.joinRequests.push({
      studentId,
      status: "pending",
      requestedAt: new Date(),
    });

    // Add activity
    group.recentActivity.push({
      description:
        "A student requested to join the group",
      createdAt: new Date(),
    });

    await group.save();

    res.status(201).json({
      success: true,
      message: "Join request sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ACCEPT JOIN REQUEST
// POST /api/thesis-groups/:id/requests/:requestId/accept
// Protected
// ==========================================
export const acceptJoinRequest = async (req, res, next) => {
  try {
    const group = await ThesisGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Thesis group not found",
      });
    }

    // ONLY GROUP LEADER CAN ACCEPT
    if (
      group.leaderId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the group leader can accept requests",
      });
    }

    // CHECK MAXIMUM MEMBERS
    if (group.members.length >= 5) {
      return res.status(400).json({
        success: false,
        message:
          "This thesis group is already full",
      });
    }

    // GET ROLE AND CHAPTER FROM REQUEST
    const { role, chapter } = req.body;

    // Validate role
    if (!role || !role.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Role is required when accepting a member",
      });
    }

    // Validate chapter
    if (!chapter || !chapter.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Chapter is required when accepting a member",
      });
    }

    // FIND JOIN REQUEST
    const request = group.joinRequests.id(
      req.params.requestId
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Join request not found",
      });
    }

    // CHECK REQUEST STATUS
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "This request has already been processed",
      });
    }

    const studentId = request.studentId;

    // CHECK WHETHER STUDENT IS ALREADY MEMBER
    const alreadyMember = group.members.some(
      (memberId) =>
        memberId.toString() ===
        studentId.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message:
          "This student is already a group member",
      });
    }

    // CHECK WHETHER STUDENT IS IN ANOTHER GROUP
    const studentProfile =
      await StudentProfile.findOne({
        userId: studentId,
      });

    if (studentProfile?.thesisGroupId) {
      return res.status(400).json({
        success: false,
        message:
          "This student already belongs to another thesis group",
      });
    }

    // GET STUDENT INFORMATION
    const student = await User.findById(
      studentId
    ).select("fullName");

    // ADD STUDENT TO GROUP
    group.members.push(studentId);

    // ADD MEMBER ROLE + CHAPTER
    group.memberDetails.push({
      userId: studentId,
      role: role.trim(),
      chapter: chapter.trim(),
    });

    // MARK REQUEST AS ACCEPTED
    request.status = "accepted";

    // ADD RECENT ACTIVITY
    group.recentActivity.push({
      description: `${student?.fullName || "A student"} joined the thesis group as ${role.trim()} and was assigned to ${chapter.trim()}`,
      createdAt: new Date(),
    });

    // SAVE GROUP
    await group.save();

    // UPDATE STUDENT PROFILE
    if (studentProfile) {
      studentProfile.thesisGroupId = group._id;

      await studentProfile.save();
    }

    // RETURN UPDATED GROUP
    const populatedGroup =
      await ThesisGroup.findById(group._id)
        .populate(
          "members",
          "fullName email department university role"
        )
        .populate(
          "leaderId",
          "fullName email department university role"
        )
        .populate(
          "supervisorId",
          "fullName email department university role"
        )
        .populate(
          "topicId",
          "title description"
        )
        .populate(
          "memberDetails.userId",
          "fullName email"
        )
        .populate(
          "joinRequests.studentId",
          "fullName email"
        );

    return res.status(200).json({
      success: true,
      message:
        "Join request accepted successfully",
      data: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REJECT JOIN REQUEST
// POST /api/thesis-groups/:id/requests/:requestId/reject
// Protected
// ==========================================
export const rejectJoinRequest = async (req, res, next) => {
  try {
    const group = await ThesisGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Thesis group not found",
      });
    }

    // Only group leader can reject requests
    if (
      group.leaderId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the group leader can reject requests",
      });
    }

    const request = group.joinRequests.id(
      req.params.requestId
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Join request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "This request has already been processed",
      });
    }

    const student = await User.findById(
      request.studentId
    ).select("fullName");

    // Mark request as rejected
    request.status = "rejected";

    // Add recent activity
    group.recentActivity.push({
      description: `${student?.fullName || "A student"}'s join request was rejected`,
      createdAt: new Date(),
    });

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Join request rejected successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CREATE THESIS GROUP
// POST /api/thesis-groups
// Protected
// ==========================================
export const createThesisGroup = async (req, res, next) => {
  try {
    const {
      groupName,
      topicId,
      members,
      memberDetails,
      supervisorId,
    } = req.body;

    // ==========================================
    // 1. Validate group name
    // ==========================================

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    // ==========================================
    // 2. Validate topic ID
    // ==========================================

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: "Thesis topic is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid thesis topic ID",
      });
    }

    // ==========================================
    // 3. Check whether topic exists
    // ==========================================

    const topic = await ThesisTopic.findById(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Thesis topic not found",
      });
    }

    // ==========================================
    // 4. Check topic availability
    // ==========================================

    if (topic.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "This thesis topic is not available",
      });
    }

    // ==========================================
    // 5. Validate members
    // ==========================================

    if (!Array.isArray(members)) {
      return res.status(400).json({
        success: false,
        message: "Members must be provided as an array",
      });
    }

    // Minimum 2
    if (members.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "A thesis group must have at least 2 members",
      });
    }

    // Maximum 5
    if (members.length > 5) {
      return res.status(400).json({
        success: false,
        message:
          "A thesis group can have a maximum of 5 members",
      });
    }

    // ==========================================
    // 6. Validate member IDs
    // ==========================================

    for (const memberId of members) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid member ID: ${memberId}`,
        });
      }
    }

    // ==========================================
    // 7. Remove duplicate members
    // ==========================================

    const uniqueMemberIds = [
      ...new Set(
        members.map((id) => id.toString())
      ),
    ];

    if (uniqueMemberIds.length !== members.length) {
      return res.status(400).json({
        success: false,
        message:
          "A student cannot be added more than once",
      });
    }

    // ==========================================
    // 8. Creator must be included
    // ==========================================

    const creatorIncluded = uniqueMemberIds.includes(
      req.user._id.toString()
    );

    if (!creatorIncluded) {
      return res.status(400).json({
        success: false,
        message:
          "The group creator must be included as a member",
      });
    }

    // ==========================================
    // 9. Verify all users exist
    // ==========================================

    const users = await User.find({
      _id: { $in: uniqueMemberIds },
    }).select("_id fullName role");

    if (users.length !== uniqueMemberIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected users do not exist",
      });
    }

    // ==========================================
    // 10. Make sure all members are students
    // ==========================================

    const nonStudents = users.filter(
      (user) => user.role !== "student"
    );

    if (nonStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Only students can be members of a thesis group",
      });
    }

    // ==========================================
    // 11. Check whether members already
    //     belong to another group
    // ==========================================

    const existingProfiles =
      await StudentProfile.find({
        userId: { $in: uniqueMemberIds },
        thesisGroupId: { $ne: null },
      });

    if (existingProfiles.length > 0) {
      const alreadyInGroupIds =
        existingProfiles.map((profile) =>
          profile.userId.toString()
        );

      const alreadyInGroupUsers = users
        .filter((user) =>
          alreadyInGroupIds.includes(
            user._id.toString()
          )
        )
        .map((user) => user.fullName);

      return res.status(400).json({
        success: false,
        message: `These students already belong to a thesis group: ${alreadyInGroupUsers.join(
          ", "
        )}`,
      });
    }

    // ==========================================
    // 12. Validate memberDetails
    // ==========================================

    if (!Array.isArray(memberDetails)) {
      return res.status(400).json({
        success: false,
        message:
          "Member roles and chapters are required",
      });
    }

    if (memberDetails.length !== uniqueMemberIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "Every member must have a role and chapter",
      });
    }

    // ==========================================
    // 13. Validate each member detail
    // ==========================================

    const detailUserIds = [];

    for (const detail of memberDetails) {
      if (!detail.userId) {
        return res.status(400).json({
          success: false,
          message: "Member user ID is required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          detail.userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member detail user ID",
        });
      }

      if (!detail.role || !detail.role.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Every member must have a role",
        });
      }

      if (
        !detail.chapter ||
        !detail.chapter.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Every member must have a thesis chapter",
        });
      }

      detailUserIds.push(
        detail.userId.toString()
      );
    }

    // ==========================================
    // 14. Make sure memberDetails match members
    // ==========================================

    const missingDetails = uniqueMemberIds.filter(
      (memberId) =>
        !detailUserIds.includes(memberId)
    );

    if (missingDetails.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Member details must be provided for every group member",
      });
    }

    // ==========================================
    // 15. Prevent duplicate member details
    // ==========================================

    const uniqueDetailUserIds = [
      ...new Set(detailUserIds),
    ];

    if (
      uniqueDetailUserIds.length !==
      detailUserIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Member details cannot contain duplicate students",
      });
    }

    // ==========================================
    // 16. VALIDATE SUPERVISOR
    // ==========================================

    // Supervisor is required
    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        message:
          "Supervisor is required when creating a thesis group",
      });
    }

    // Validate supervisor ID
    if (
      !mongoose.Types.ObjectId.isValid(
        supervisorId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid supervisor ID",
      });
    }

    // Find supervisor
    const supervisor = await User.findById(
      supervisorId
    ).select(
      "_id fullName email role department university"
    );

    // Supervisor must exist
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found",
      });
    }

    // Supervisor must be faculty
    if (supervisor.role !== "faculty") {
      return res.status(400).json({
        success: false,
        message:
          "The selected supervisor must be a faculty member",
      });
    }

    // ==========================================
    // 17. Create the thesis group
    // ==========================================

    const group = await ThesisGroup.create({
      groupName: groupName.trim(),

      leaderId: req.user._id,

      members: uniqueMemberIds,

      supervisorId: supervisorId,

      topicId: topic._id,

      progress: 0,

      status: "active",

      memberDetails: memberDetails.map(
        (detail) => ({
          userId: detail.userId,
          role: detail.role.trim(),
          chapter: detail.chapter.trim(),
        })
      ),

      recentActivity: [
        {
          description:
            "Thesis group created",
          createdAt: new Date(),
        },
      ],
    });

    // ==========================================
    // 18. Update StudentProfile
    // ==========================================

    await StudentProfile.updateMany(
      {
        userId: {
          $in: uniqueMemberIds,
        },
      },
      {
        $set: {
          thesisGroupId: group._id,
        },
      }
    );

    // ==========================================
    // 19. Mark topic as assigned
    // ==========================================

    topic.status = "assigned";
    await topic.save();

    // ==========================================
    // 20. Return populated group
    // ==========================================

    const populatedGroup =
      await ThesisGroup.findById(group._id)
        .populate(
          "members",
          "fullName email department university role"
        )
        .populate(
          "leaderId",
          "fullName email department university role"
        )
        .populate(
          "supervisorId",
          "fullName email department university role"
        )
        .populate(
          "topicId",
          "title description category keywords supervisorId status"
        );

    return res.status(201).json({
      success: true,
      message:
        "Thesis group created successfully",
      data: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};
