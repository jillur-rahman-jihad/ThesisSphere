import jwt from 'jsonwebtoken';
import Contribution from '../models/Contribution.js';
import ThesisGroup from '../models/ThesisGroup.js';
import User from '../models/userModel.js';
import StudentProfile from '../models/StudentProfileModel.js';
import ProgressReport from '../models/ProgressReport.js';
import PaperReview from '../models/PaperReview.js';
import Meeting from '../models/Meeting.js';

/**
 * Helper to extract user from Authorization header if present
 */
const getUserFromHeader = async (req) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      if (decoded && decoded.id) {
        return await User.findById(decoded.id).select('-password');
      }
    }
  } catch (e) {
    // Ignore invalid token
  }
  return null;
};

/**
 * Helper to calculate activity status (Active, Moderate, Inactive) based on latest contribution
 */
const calculateGroupActivityStatus = (contributions) => {
  if (!contributions || contributions.length === 0) {
    return {
      status: 'Inactive',
      badge: '🔴 Inactive (No Work Logged)',
      daysAgo: 999,
      lastActiveDate: null,
    };
  }

  const latestDate = new Date(
    Math.max(...contributions.map((c) => new Date(c.logDate || c.createdAt).getTime()))
  );
  const daysAgo = Math.floor((new Date() - latestDate) / (1000 * 60 * 60 * 24));

  if (daysAgo <= 3) {
    return {
      status: 'Active',
      badge: '🟢 Highly Active (Work Logged < 3d)',
      daysAgo,
      lastActiveDate: latestDate,
    };
  } else if (daysAgo <= 7) {
    return {
      status: 'Moderate',
      badge: '🟡 Moderate Activity (Work Logged < 7d)',
      daysAgo,
      lastActiveDate: latestDate,
    };
  } else {
    return {
      status: 'Inactive',
      badge: `🔴 Low Activity (${daysAgo}d since last work)`,
      daysAgo,
      lastActiveDate: latestDate,
    };
  }
};

/**
 * @desc    Get complete contribution tracker analytics and logs for a group
 *          Includes Faculty Monitoring overview across all supervised groups & Activity Status
 * @route   GET /api/contribution-tracker/group/:groupId
 * @access  Public / Protected
 */
export const getGroupContributions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const activeUser = (await getUserFromHeader(req)) || req.user;

    let group = null;
    let availableGroups = [];

    const isStudent = activeUser && activeUser.role === 'student';
    const isFaculty = activeUser && (activeUser.role === 'faculty' || activeUser.role === 'admin');

    // -------------------------------------------------------------
    // ROLE 1: STUDENT ACCESS CONTROL (Strict Single-Group Scope)
    // -------------------------------------------------------------
    if (isStudent) {
      const studentProf = await StudentProfile.findOne({ userId: activeUser._id });
      if (studentProf && studentProf.thesisGroupId) {
        group = await ThesisGroup.findById(studentProf.thesisGroupId);
      }
      if (!group) {
        group = await ThesisGroup.findOne({
          $or: [{ members: activeUser._id }, { leaderId: activeUser._id }],
        });
      }

      if (
        groupId &&
        groupId !== 'default' &&
        groupId !== 'undefined' &&
        group &&
        groupId !== group._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Students are only permitted to view their own thesis group contributions.',
        });
      }

      if (group) {
        availableGroups = [{ _id: group._id, groupName: group.groupName }];
      }
    }
    // -------------------------------------------------------------
    // ROLE 2: FACULTY / ADMIN ACCESS CONTROL (Multi-Group Overview)
    // -------------------------------------------------------------
    else if (isFaculty) {
      let supervisedGroups = await ThesisGroup.find({ supervisorId: activeUser._id })
        .select('groupName progress topicId members')
        .populate('topicId', 'title');

      if (!supervisedGroups || supervisedGroups.length === 0) {
        supervisedGroups = await ThesisGroup.find()
          .select('groupName progress topicId members')
          .populate('topicId', 'title');
      }

      availableGroups = supervisedGroups;

      if (groupId && groupId !== 'default' && groupId !== 'undefined' && groupId.match(/^[0-9a-fA-F]{24}$/)) {
        group = await ThesisGroup.findById(groupId);
      }

      if (!group && availableGroups.length > 0) {
        group = await ThesisGroup.findById(availableGroups[0]._id);
      }
    }

    if (!group) {
      if (groupId && groupId !== 'default' && groupId !== 'undefined' && groupId.match(/^[0-9a-fA-F]{24}$/)) {
        group = await ThesisGroup.findById(groupId);
      }
      if (!group) {
        group = await ThesisGroup.findOne();
      }
      if (group && availableGroups.length === 0) {
        availableGroups = await ThesisGroup.find().select('groupName progress topicId members').populate('topicId', 'title');
      }
    }

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'No thesis group found in system.',
      });
    }

    // Auto-Sync Members
    const linkedProfiles = await StudentProfile.find({ thesisGroupId: group._id });
    const profileUserIds = linkedProfiles.map((p) => p.userId.toString());
    const existingMemberIds = (group.members || []).map((m) => m.toString());

    let needsSave = false;
    profileUserIds.forEach((uId) => {
      if (!existingMemberIds.includes(uId)) {
        group.members.push(uId);
        existingMemberIds.push(uId);
        needsSave = true;
      }
    });

    if (activeUser && activeUser.role === 'student') {
      const uIdStr = activeUser._id.toString();
      if (!existingMemberIds.includes(uIdStr)) {
        const p = await StudentProfile.findOne({ userId: activeUser._id });
        if (p && p.thesisGroupId && p.thesisGroupId.toString() === group._id.toString()) {
          group.members.push(activeUser._id);
          existingMemberIds.push(uIdStr);
          needsSave = true;
        }
      }
    }

    if (needsSave) {
      await group.save();
    }

    // Re-populate group
    group = await ThesisGroup.findById(group._id)
      .populate('members', 'fullName email role profilePicture department skills')
      .populate('leaderId', 'fullName email')
      .populate('supervisorId', 'fullName email')
      .populate('topicId', 'title category');

    const memberIds = group.members.map((m) => m._id);
    const studentProfiles = await StudentProfile.find({ userId: { $in: memberIds } });
    const profileMap = {};
    studentProfiles.forEach((p) => {
      profileMap[p.userId.toString()] = p;
    });

    // Fetch manual contribution logs
    let manualContributions = await Contribution.find({ thesisGroupId: group._id })
      .populate('studentId', 'fullName email profilePicture department skills')
      .sort({ logDate: -1, createdAt: -1 });

    // Fetch System Activities automatically
    const [progressReports, paperReviews, meetings] = await Promise.all([
      ProgressReport.find({ thesisGroupId: group._id }).populate('submittedBy', 'fullName email profilePicture department'),
      PaperReview.find({ thesisGroupId: group._id }).populate('reviewer', 'fullName email profilePicture department'),
      Meeting.find({ thesisGroupId: group._id }).populate('supervisorId', 'fullName email profilePicture department'),
    ]);

    const autoSystemContributions = [];

    progressReports.forEach((rep) => {
      if (rep.submittedBy) {
        autoSystemContributions.push({
          _id: `auto_report_${rep._id}`,
          isAutomated: true,
          thesisGroupId: group._id,
          studentId: rep.submittedBy,
          task: `[Auto-Tracked] Submitted Progress Report - Week ${rep.weekNo} (${rep.progressPercentage}% Progress)`,
          hoursSpent: 12,
          category: 'Documentation',
          status: 'Completed',
          milestone: `Week ${rep.weekNo} Report`,
          proofLink: '',
          logDate: rep.createdAt || rep.updatedAt || new Date(),
          createdAt: rep.createdAt || new Date(),
        });
      }
    });

    paperReviews.forEach((rev) => {
      if (rev.reviewer) {
        autoSystemContributions.push({
          _id: `auto_review_${rev._id}`,
          isAutomated: true,
          thesisGroupId: group._id,
          studentId: rev.reviewer,
          task: `[Auto-Tracked] Paper Review: ${rev.paperTitle}`,
          hoursSpent: 8,
          category: 'Research',
          status: rev.status === 'approved' ? 'Completed' : 'In Progress',
          milestone: 'Paper Review',
          proofLink: '',
          logDate: rev.createdAt || new Date(),
          createdAt: rev.createdAt || new Date(),
        });
      }
    });

    meetings.forEach((meet) => {
      if (meet.supervisorId) {
        autoSystemContributions.push({
          _id: `auto_meeting_${meet._id}`,
          isAutomated: true,
          thesisGroupId: group._id,
          studentId: meet.supervisorId,
          task: `[Auto-Tracked] Scheduled & Conducted Meeting: ${meet.title}`,
          hoursSpent: 4,
          category: 'Presentation',
          status: meet.status === 'completed' ? 'Completed' : 'In Progress',
          milestone: 'Meeting',
          proofLink: meet.meetingLink || '',
          logDate: meet.meetingDate || meet.createdAt || new Date(),
          createdAt: meet.createdAt || new Date(),
        });
      }
    });

    const allContributions = [...manualContributions, ...autoSystemContributions].sort((a, b) => {
      const dateA = new Date(a.logDate || a.createdAt);
      const dateB = new Date(b.logDate || b.createdAt);
      return dateB - dateA;
    });

    let totalHours = 0;
    const memberStatsMap = {};
    const categoryStats = {
      Research: 0,
      Frontend: 0,
      Backend: 0,
      Documentation: 0,
      Testing: 0,
      'Data Analysis': 0,
      Presentation: 0,
      Other: 0,
    };

    group.members.forEach((member) => {
      const memId = member._id.toString();
      const prof = profileMap[memId] || {};
      memberStatsMap[memId] = {
        studentId: memId,
        fullName: member.fullName,
        email: member.email,
        profilePicture: member.profilePicture,
        department: member.department,
        skills: member.skills || [],
        universityId: prof.studentId || 'N/A',
        cgpa: prof.cgpa || 0,
        semester: prof.semester || 'N/A',
        totalHours: 0,
        taskCount: 0,
        completedTasksCount: 0,
        contributionPercentage: 0,
        tasks: [],
      };
    });

    allContributions.forEach((item) => {
      const hours = Number(item.hoursSpent) || 0;
      totalHours += hours;

      if (categoryStats[item.category] !== undefined) {
        categoryStats[item.category] += hours;
      } else {
        categoryStats.Other += hours;
      }

      const sId = item.studentId?._id?.toString() || item.studentId?.toString();
      if (sId && memberStatsMap[sId]) {
        memberStatsMap[sId].totalHours += hours;
        memberStatsMap[sId].taskCount += 1;
        if (item.status === 'Completed') {
          memberStatsMap[sId].completedTasksCount += 1;
        }
        memberStatsMap[sId].tasks.push(item);
      }
    });

    const memberStats = Object.values(memberStatsMap).map((m) => {
      const pct = totalHours > 0 ? ((m.totalHours / totalHours) * 100).toFixed(1) : 0;
      return {
        ...m,
        contributionPercentage: Number(pct),
      };
    });

    let topContributor = null;
    if (memberStats.length > 0) {
      topContributor = [...memberStats].sort((a, b) => b.totalHours - a.totalHours)[0];
    }

    const weeklyTimeline = getWeeklyBreakdown(allContributions);
    const activityInfo = calculateGroupActivityStatus(allContributions);

    // Compute Supervised Groups Activity Summary for Faculty Monitoring Overview
    let facultyGroupSummaries = [];
    if (isFaculty && availableGroups.length > 0) {
      for (const g of availableGroups) {
        const gLogs = await Contribution.find({ thesisGroupId: g._id });
        let gHours = 0;
        gLogs.forEach((l) => (gHours += l.hoursSpent || 0));
        const gActivity = calculateGroupActivityStatus(gLogs);

        facultyGroupSummaries.push({
          _id: g._id,
          groupName: g.groupName,
          progress: g.progress || 0,
          topicTitle: g.topicId?.title || 'Thesis Project',
          memberCount: g.members ? g.members.length : 0,
          totalHours: gHours,
          activityStatus: gActivity.status,
          activityBadge: gActivity.badge,
        });
      }
    }

    res.status(200).json({
      success: true,
      userRole: activeUser ? activeUser.role : 'guest',
      isFacultyReadOnly: isFaculty,
      group: {
        _id: group._id,
        groupName: group.groupName,
        leaderId: group.leaderId,
        supervisorId: group.supervisorId,
        topic: group.topicId,
        progress: group.progress || 0,
        activityInfo,
      },
      allGroups: availableGroups,
      facultyGroupSummaries,
      summary: {
        totalHours,
        totalTasks: allContributions.length,
        memberCount: group.members.length,
        topContributor: topContributor ? topContributor.fullName : 'N/A',
        activityStatus: activityInfo.status,
        activityBadge: activityInfo.badge,
      },
      categoryStats,
      weeklyTimeline,
      memberStats,
      contributions: allContributions,
    });
  } catch (error) {
    console.error('Error fetching group contributions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contribution tracker data',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a new contribution log (Students only - Faculty read-only)
 * @route   POST /api/contribution-tracker
 * @access  Public / Protected
 */
export const addContribution = async (req, res) => {
  try {
    const activeUser = (await getUserFromHeader(req)) || req.user;

    // Faculty Read-Only Enforcement
    if (activeUser && activeUser.role === 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Faculty members have view-only monitoring access. Only student members can log their work.',
      });
    }

    let { thesisGroupId, studentId, task, hoursSpent, category, status, milestone, proofLink, logDate } = req.body;

    if (activeUser && activeUser._id) {
      studentId = activeUser._id;
    }

    if (!thesisGroupId || !studentId || !task) {
      return res.status(400).json({
        success: false,
        message: 'Thesis Group ID, Student ID, and Task description are required.',
      });
    }

    const hours = Number(hoursSpent) || 0;

    const newContribution = await Contribution.create({
      thesisGroupId,
      studentId,
      task,
      hoursSpent: hours,
      category: category || 'Research',
      status: status || 'Completed',
      milestone: milestone || 'General Progress',
      proofLink: proofLink || '',
      logDate: logDate ? new Date(logDate) : new Date(),
    });

    const group = await ThesisGroup.findById(thesisGroupId);
    if (group) {
      const mStrs = (group.members || []).map((m) => m.toString());
      if (!mStrs.includes(studentId.toString())) {
        group.members.push(studentId);
        await group.save();
      }
    }

    const populated = await Contribution.findById(newContribution._id).populate(
      'studentId',
      'fullName email profilePicture department'
    );

    res.status(201).json({
      success: true,
      message: 'Contribution logged successfully under your profile',
      contribution: populated,
    });
  } catch (error) {
    console.error('Error adding contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add contribution log',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing contribution log (Students only - Faculty read-only)
 * @route   PUT /api/contribution-tracker/:id
 * @access  Public / Protected
 */
export const updateContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { task, hoursSpent, category, status, milestone, proofLink, logDate, requestingUserId } = req.body;

    const activeUser = (await getUserFromHeader(req)) || req.user;

    // Faculty Read-Only Enforcement
    if (activeUser && activeUser.role === 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Faculty accounts have read-only monitoring access and cannot modify student contribution records.',
      });
    }

    const contribution = await Contribution.findById(id);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution log not found',
      });
    }

    const activeUserId = activeUser?._id?.toString() || requestingUserId;

    if (activeUserId && contribution.studentId.toString() !== activeUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only modify your own work contributions.',
      });
    }

    if (task !== undefined) contribution.task = task;
    if (hoursSpent !== undefined) contribution.hoursSpent = Number(hoursSpent);
    if (category !== undefined) contribution.category = category;
    if (status !== undefined) contribution.status = status;
    if (milestone !== undefined) contribution.milestone = milestone;
    if (proofLink !== undefined) contribution.proofLink = proofLink;
    if (logDate !== undefined) contribution.logDate = new Date(logDate);

    await contribution.save();

    const updated = await Contribution.findById(id).populate(
      'studentId',
      'fullName email profilePicture department'
    );

    res.status(200).json({
      success: true,
      message: 'Contribution log updated successfully',
      contribution: updated,
    });
  } catch (error) {
    console.error('Error updating contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contribution log',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a contribution log (Students only - Faculty read-only)
 * @route   DELETE /api/contribution-tracker/:id
 * @access  Public / Protected
 */
export const deleteContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.query.requestingUserId || req.body?.requestingUserId;

    const activeUser = (await getUserFromHeader(req)) || req.user;

    // Faculty Read-Only Enforcement
    if (activeUser && activeUser.role === 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Faculty accounts have read-only monitoring access and cannot delete student contribution records.',
      });
    }

    const contribution = await Contribution.findById(id);

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution log not found',
      });
    }

    const activeUserId = activeUser?._id?.toString() || requestingUserId;

    if (activeUserId && contribution.studentId.toString() !== activeUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own work contributions.',
      });
    }

    await contribution.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Contribution log deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contribution log',
      error: error.message,
    });
  }
};

/**
 * @desc    Seed mock test contributions for a group across all student profiles
 * @route   POST /api/contribution-tracker/seed/:groupId
 * @access  Public / Protected
 */
export const seedGroupContributions = async (req, res) => {
  try {
    const { groupId } = req.params;

    let group = await ThesisGroup.findById(groupId);
    if (!group) {
      group = await ThesisGroup.findOne();
    }

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'No Thesis Group found to seed test contributions.',
      });
    }

    await Contribution.deleteMany({ thesisGroupId: group._id });

    const members = group.members;
    if (!members || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected thesis group has no members to seed.',
      });
    }

    const sampleTasks = [
      { task: 'Literature Review & Paper Extraction', cat: 'Research', hours: 14, miles: 'Phase 1 - Proposal' },
      { task: 'Dataset Preprocessing & Cleaning Pipeline', cat: 'Data Analysis', hours: 18, miles: 'Phase 1 - Proposal' },
      { task: 'Frontend Dashboard Component Architecture', cat: 'Frontend', hours: 22, miles: 'Phase 2 - Development' },
      { task: 'REST API & MongoDB Schema Design', cat: 'Backend', hours: 20, miles: 'Phase 2 - Development' },
      { task: 'Model Training & Hyperparameter Tuning', cat: 'Research', hours: 26, miles: 'Phase 2 - Development' },
      { task: 'Unit Testing & Integration Benchmark', cat: 'Testing', hours: 12, miles: 'Phase 3 - Validation' },
      { task: 'Drafting Methodology Chapter & Citations', cat: 'Documentation', hours: 16, miles: 'Phase 3 - Validation' },
      { task: 'Mid-term Defense Presentation Slides', cat: 'Presentation', hours: 10, miles: 'Phase 3 - Validation' },
      { task: 'Bug fixes in authentication & state management', cat: 'Frontend', hours: 9, miles: 'Phase 2 - Development' },
      { task: 'Performance Optimization & Query Indexing', cat: 'Backend', hours: 11, miles: 'Phase 3 - Validation' },
    ];

    const seeded = [];
    const now = new Date();

    for (let i = 0; i < members.length; i++) {
      const studentId = members[i];
      const taskCount = 3 + (i % 2);
      for (let t = 0; t < taskCount; t++) {
        const item = sampleTasks[(i * 3 + t) % sampleTasks.length];
        const daysAgo = (t + 1) * 4 + i * 2;
        const logDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const doc = await Contribution.create({
          thesisGroupId: group._id,
          studentId,
          task: `${item.task} - Part ${t + 1}`,
          category: item.cat,
          hoursSpent: item.hours + (t % 3) * 2,
          status: t === 0 ? 'In Progress' : 'Completed',
          milestone: item.miles,
          proofLink: 'https://github.com/ThesisSphere/project/commits',
          logDate,
        });
        seeded.push(doc);
      }
    }

    res.status(200).json({
      success: true,
      message: `Seeded ${seeded.length} sample contribution records across ${members.length} student profiles.`,
      count: seeded.length,
    });
  } catch (error) {
    console.error('Error seeding contribution tracker data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed sample contributions',
      error: error.message,
    });
  }
};

function getWeeklyBreakdown(contributions) {
  const weeks = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);

    const weekLabel = `Wk ${6 - i}`;
    let hours = 0;

    contributions.forEach((c) => {
      const date = new Date(c.logDate || c.createdAt);
      if (date >= weekStart && date < weekEnd) {
        hours += Number(c.hoursSpent) || 0;
      }
    });

    weeks.push({
      week: weekLabel,
      hours,
    });
  }

  return weeks;
}
