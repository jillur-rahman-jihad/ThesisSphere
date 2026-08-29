import ThesisGroup from "../models/ThesisGroup.js";
import User from "../models/userModel.js";

// ============================================================
// GET ALL GROUPS ASSIGNED TO LOGGED-IN SUPERVISOR
// GET /api/supervisor-group-manager/groups
// ============================================================

export const getSupervisorGroups = async (req, res, next) => {
  try {
    if (req.user.role !== "faculty") {
      res.status(403);
      throw new Error("Only faculty members can access Group Manager");
    }

    const groups = await ThesisGroup.find({
      supervisorId: req.user._id,
      status: "active",
    })
      .populate("leaderId", "fullName email department profilePicture")
      .populate(
        "members",
        "fullName email department profilePicture"
      )
      .populate(
        "topicId",
        "title description category keywords status"
      )
      .lean();

    const formattedGroups = groups.map((group) => ({
      ...group,

      memberCount: group.members?.length || 0,

      maxMembers: 5,

      progress: group.progress || 0,

      statistics: {
        totalMembers: group.members?.length || 0,
        maxMembers: 5,
        progress: group.progress || 0,
        pendingRequests:
          group.joinRequests?.filter(
            (request) => request.status === "pending"
          ).length || 0,
        activities: group.recentActivity?.length || 0,
      },
    }));

    res.status(200).json({
      success: true,
      count: formattedGroups.length,
      data: formattedGroups,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET ONE GROUP DETAILS
// GET /api/supervisor-group-manager/groups/:groupId
// ============================================================

export const getSupervisorGroupDetails = async (
  req,
  res,
  next
) => {
  try {
    if (req.user.role !== "faculty") {
      res.status(403);
      throw new Error("Only faculty members can access Group Manager");
    }

    const group = await ThesisGroup.findOne({
      _id: req.params.groupId,
      supervisorId: req.user._id,
    })
      .populate(
        "leaderId",
        "fullName email department profilePicture"
      )
      .populate(
        "members",
        "fullName email department profilePicture"
      )
      .populate(
        "topicId",
        "title description category keywords status"
      )
      .lean();

    if (!group) {
      res.status(404);
      throw new Error(
        "Group not found or this group is not assigned to you"
      );
    }

    const membersWithDetails = (group.members || []).map(
      (member) => {
        const details = (group.memberDetails || []).find(
          (detail) =>
            detail.userId?.toString() ===
            member._id?.toString()
        );

        return {
          ...member,
          role: details?.role || "Not assigned",
          chapter: details?.chapter || "Not assigned",
          memberDetailId: details?._id || null,
        };
      }
    );

    const statistics = {
      totalMembers: group.members?.length || 0,
      maxMembers: 5,
      availableSlots:
        5 - (group.members?.length || 0),
      progress: group.progress || 0,

      assignedResponsibilities:
        membersWithDetails.filter(
          (member) =>
            member.role !== "Not assigned" &&
            member.chapter !== "Not assigned"
        ).length,

      unassignedResponsibilities:
        membersWithDetails.filter(
          (member) =>
            member.role === "Not assigned" ||
            member.chapter === "Not assigned"
        ).length,

      pendingJoinRequests:
        group.joinRequests?.filter(
          (request) => request.status === "pending"
        ).length || 0,

      recentActivities:
        group.recentActivity?.length || 0,
    };

    res.status(200).json({
      success: true,
      data: {
        ...group,
        members: membersWithDetails,
        statistics,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// UPDATE GROUP PROGRESS
// PUT /api/supervisor-group-manager/groups/:groupId/progress
// ============================================================

export const updateGroupProgress = async (
  req,
  res,
  next
) => {
  try {
    if (req.user.role !== "faculty") {
      res.status(403);
      throw new Error("Only faculty members can update group progress");
    }

    const progress = Number(req.body.progress);

    if (
      Number.isNaN(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      res.status(400);
      throw new Error(
        "Progress must be a number between 0 and 100"
      );
    }

    const group = await ThesisGroup.findOne({
      _id: req.params.groupId,
      supervisorId: req.user._id,
    });

    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    group.progress = progress;

    group.recentActivity.unshift({
      description: `Supervisor updated group progress to ${progress}%`,
    });

    // Keep only latest 10 activities
    group.recentActivity =
      group.recentActivity.slice(0, 10);

    await group.save();

    res.status(200).json({
      success: true,
      message: "Group progress updated successfully",
      data: {
        groupId: group._id,
        progress: group.progress,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// UPDATE MEMBER RESPONSIBILITY
// PUT /api/supervisor-group-manager/groups/:groupId/members/:memberId
// ============================================================

export const updateMemberResponsibility = async (
  req,
  res,
  next
) => {
  try {
    if (req.user.role !== "faculty") {
      res.status(403);
      throw new Error(
        "Only faculty members can modify member responsibilities"
      );
    }

    const { role, chapter } = req.body;

    if (!role?.trim()) {
      res.status(400);
      throw new Error("Member role is required");
    }

    if (!chapter?.trim()) {
      res.status(400);
      throw new Error("Thesis chapter is required");
    }

    const group = await ThesisGroup.findOne({
      _id: req.params.groupId,
      supervisorId: req.user._id,
    });

    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    const memberExists = group.members.some(
      (memberId) =>
        memberId.toString() ===
        req.params.memberId.toString()
    );

    if (!memberExists) {
      res.status(404);
      throw new Error("Student is not a member of this group");
    }

    const existingDetails =
      group.memberDetails.find(
        (detail) =>
          detail.userId.toString() ===
          req.params.memberId.toString()
      );

    if (existingDetails) {
      existingDetails.role = role.trim();
      existingDetails.chapter = chapter.trim();
    } else {
      group.memberDetails.push({
        userId: req.params.memberId,
        role: role.trim(),
        chapter: chapter.trim(),
      });
    }

    group.recentActivity.unshift({
      description: `Supervisor updated a member's responsibility to "${role.trim()}" - ${chapter.trim()}`,
    });

    group.recentActivity =
      group.recentActivity.slice(0, 10);

    await group.save();

    res.status(200).json({
      success: true,
      message: "Member responsibility updated successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// REMOVE MEMBER FROM GROUP
// DELETE /api/supervisor-group-manager/groups/:groupId/members/:memberId
// ============================================================

export const removeMemberFromGroup = async (
  req,
  res,
  next
) => {
  try {
    if (req.user.role !== "faculty") {
      res.status(403);
      throw new Error(
        "Only faculty members can remove group members"
      );
    }

    const group = await ThesisGroup.findOne({
      _id: req.params.groupId,
      supervisorId: req.user._id,
    });

    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    const memberId =
      req.params.memberId.toString();

    // Do not allow supervisor to remove group leader
    if (
      group.leaderId.toString() === memberId
    ) {
      res.status(400);
      throw new Error(
        "The group leader cannot be removed. Change the leader first."
      );
    }

    const memberExists = group.members.some(
      (id) => id.toString() === memberId
    );

    if (!memberExists) {
      res.status(404);
      throw new Error(
        "Student is not a member of this group"
      );
    }

    group.members = group.members.filter(
      (id) => id.toString() !== memberId
    );

    group.memberDetails =
      group.memberDetails.filter(
        (detail) =>
          detail.userId.toString() !== memberId
      );

    group.recentActivity.unshift({
      description:
        "Supervisor removed a member from the group",
    });

    group.recentActivity =
      group.recentActivity.slice(0, 10);

    await group.save();

    res.status(200).json({
      success: true,
      message: "Member removed from group successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// ASSIGN EXISTING STUDENT TO GROUP
// POST /api/supervisor-group-manager/groups/:groupId/members
// ============================================================

export const assignStudentToGroup = async (
  req,
  res,
  next
) => {
  try {
    if (req.user.role !== "faculty") {
      res.status(403);
      throw new Error(
        "Only faculty members can assign students"
      );
    }

    const { studentId, role, chapter } =
      req.body;

    if (!studentId) {
      res.status(400);
      throw new Error("Student ID is required");
    }

    const group = await ThesisGroup.findOne({
      _id: req.params.groupId,
      supervisorId: req.user._id,
    });

    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    if (group.members.length >= 5) {
      res.status(400);
      throw new Error(
        "This group has already reached the maximum of 5 members"
      );
    }

    const student = await User.findById(studentId);

    if (!student || student.role !== "student") {
      res.status(404);
      throw new Error("Student not found");
    }

    const alreadyMember =
      group.members.some(
        (id) =>
          id.toString() ===
          studentId.toString()
      );

    if (alreadyMember) {
      res.status(400);
      throw new Error(
        "Student is already a member of this group"
      );
    }

    // Check whether student belongs to another group
    const existingGroup =
      await ThesisGroup.findOne({
        members: studentId,
        status: "active",
      });

    if (existingGroup) {
      res.status(400);
      throw new Error(
        "This student is already a member of another active thesis group"
      );
    }

    group.members.push(studentId);

    group.memberDetails.push({
      userId: studentId,
      role: role?.trim() || "Group Member",
      chapter:
        chapter?.trim() || "Not assigned",
    });

    group.recentActivity.unshift({
      description: `Supervisor assigned ${student.fullName} to the group`,
    });

    group.recentActivity =
      group.recentActivity.slice(0, 10);

    await group.save();

    res.status(200).json({
      success: true,
      message: "Student assigned to group successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET AVAILABLE STUDENTS
// GET /api/supervisor-group-manager/students
// ============================================================

export const getAvailableStudents = async (
  req,
  res,
  next
) => {
  try {
    if (req.user.role !== "faculty") {
      res.status(403);
      throw new Error("Only faculty members can access students");
    }

    const students = await User.find({
      role: "student",
    })
      .select(
        "fullName email department university profilePicture"
      )
      .lean();

    const groups = await ThesisGroup.find({
      status: "active",
    })
      .select("members")
      .lean();

    const assignedStudentIds = new Set();

    groups.forEach((group) => {
      group.members?.forEach((memberId) => {
        assignedStudentIds.add(
          memberId.toString()
        );
      });
    });

    const availableStudents =
      students.filter(
        (student) =>
          !assignedStudentIds.has(
            student._id.toString()
          )
      );

    res.status(200).json({
      success: true,
      count: availableStudents.length,
      data: availableStudents,
    });
  } catch (error) {
    next(error);
  }
};
