import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/userModel.js';
import StudentProfile from './models/StudentProfile.js';
import SupervisorProfile from './models/SupervisorProfile.js';
import ThesisTopic from './models/ThesisTopic.js';
import ThesisGroup from './models/ThesisGroup.js';
import Meeting from './models/Meeting.js';
import Deadline from './models/Deadline.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';
import ProgressReport from './models/ProgressReport.js';
import Contribution from './models/Contribution.js';
import PaperReview from './models/PaperReview.js';
import Recommendation from './models/Recommendation.js';
import ForumPost from './models/ForumPost.js';

dotenv.config();

const frankEmail = 'Frank_Schmitt@hotmail.com';
const frankName = 'Frank Schmitt';

const removeExistingDashboardData = async (userId, groupId) => {
  await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
  await Notification.deleteMany({ userId });
  await ProgressReport.deleteMany({ thesisGroupId: groupId });
  await Contribution.deleteMany({ thesisGroupId: groupId, studentId: userId });
  await PaperReview.deleteMany({ thesisGroupId: groupId });
  await Deadline.deleteMany({ thesisGroupId: groupId });
  await Meeting.deleteMany({ thesisGroupId: groupId });
  await Recommendation.deleteMany({ userId });
  await ForumPost.deleteMany({ author: userId });
};

const seedFrankDashboard = async () => {
  await connectDB();

  const supervisorEmail = 'dr.aina.rahman@thesissphere.com';

  let frank = await User.findOne({ email: frankEmail });
  if (!frank) {
    frank = new User({
      role: 'student',
      fullName: frankName,
      email: frankEmail,
      password: 'password123',
      department: 'Computer Science and Engineering',
      university: 'BRAC University',
      bio: 'Final year student working on a thesis project.',
      skills: ['Research', 'Python', 'Data Analysis'],
    });
  } else {
    frank.fullName = frankName;
    frank.role = 'student';
    frank.password = 'password123';
    frank.department = 'Computer Science and Engineering';
    frank.university = 'BRAC University';
    frank.bio = 'Final year student working on a thesis project.';
    frank.skills = ['Research', 'Python', 'Data Analysis'];
  }
  await frank.save();

  let supervisor = await User.findOne({ email: supervisorEmail });
  if (!supervisor) {
    supervisor = await User.create({
      role: 'faculty',
      fullName: 'Dr. Aina Rahman',
      email: supervisorEmail,
      password: 'password123',
      department: 'Computer Science and Engineering',
      university: 'BRAC University',
      bio: 'Faculty supervisor for thesis guidance.',
      researchInterests: ['Machine Learning', 'NLP', 'Education Technology'],
    });
  }

  await SupervisorProfile.findOneAndUpdate(
    { userId: supervisor._id },
    {
      userId: supervisor._id,
      designation: 'Associate Professor',
      officeRoom: 'UB1204',
      expertise: ['Machine Learning', 'NLP'],
      publications: ['Adaptive Learning Systems for Higher Education'],
      maxStudents: 8,
      currentStudents: 4,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const topic = await ThesisTopic.findOneAndUpdate(
    { title: 'AI-Powered Thesis Progress Tracker' },
    {
      title: 'AI-Powered Thesis Progress Tracker',
      description: 'A dashboard-driven platform for tracking thesis milestones, deadlines, and collaboration.',
      category: 'Software Engineering',
      keywords: ['dashboard', 'thesis', 'productivity', 'collaboration'],
      supervisorId: supervisor._id,
      status: 'assigned',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const group = await ThesisGroup.findOneAndUpdate(
    { groupName: 'Frank Thesis Group' },
    {
      groupName: 'Frank Thesis Group',
      leaderId: frank._id,
      members: [frank._id],
      supervisorId: supervisor._id,
      topicId: topic._id,
      progress: 68,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await StudentProfile.findOneAndUpdate(
    { userId: frank._id },
    {
      userId: frank._id,
      studentId: '23101234',
      semester: 'Fall 2026',
      cgpa: 3.72,
      thesisGroupId: group._id,
      supervisorId: supervisor._id,
      researchInterests: ['Thesis management', 'Web development', 'Machine learning'],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await removeExistingDashboardData(frank._id, group._id);

  const now = Date.now();
  const futureDate = (days) => new Date(now + days * 24 * 60 * 60 * 1000);

  await Deadline.create([
    {
      title: 'Proposal draft submission',
      description: 'Submit the first complete proposal draft for review.',
      date: futureDate(3),
      type: 'proposal',
      thesisGroupId: group._id,
    },
    {
      title: 'Methodology chapter outline',
      description: 'Prepare a chapter outline before the next meeting.',
      date: futureDate(6),
      type: 'progress',
      thesisGroupId: group._id,
    },
    {
      title: 'Final progress update',
      description: 'Submit the weekly progress report to the supervisor.',
      date: futureDate(10),
      type: 'submission',
      thesisGroupId: group._id,
    },
  ]);

  await Meeting.create([
    {
      title: 'Proposal review meeting',
      thesisGroupId: group._id,
      supervisorId: supervisor._id,
      participants: [frank._id, supervisor._id],
      meetingDate: futureDate(2),
      meetingLink: 'https://meet.google.com/frank-dashboard',
      agenda: 'Review proposal scope, research questions, and milestones.',
      status: 'scheduled',
    },
    {
      title: 'Chapter planning discussion',
      thesisGroupId: group._id,
      supervisorId: supervisor._id,
      participants: [frank._id, supervisor._id],
      meetingDate: futureDate(7),
      meetingLink: 'https://meet.google.com/frank-chapter',
      agenda: 'Discuss outline for the literature review and methodology.',
      status: 'scheduled',
    },
  ]);

  await Message.create([
    {
      sender: supervisor._id,
      receiver: frank._id,
      message: 'I reviewed your proposal outline. Please tighten the problem statement before our meeting.',
      attachments: [],
      isRead: false,
    },
    {
      sender: frank._id,
      receiver: supervisor._id,
      message: 'I have prepared the updated outline and will share it before tomorrow.',
      attachments: [],
      isRead: true,
    },
  ]);

  await Notification.create([
    {
      userId: frank._id,
      title: 'Proposal review scheduled',
      message: 'Your proposal review meeting has been scheduled for this week.',
      type: 'meeting',
      isRead: false,
    },
    {
      userId: frank._id,
      title: 'New deadline added',
      message: 'A new proposal deadline is due in 3 days.',
      type: 'deadline',
      isRead: false,
    },
  ]);

  await ProgressReport.create({
    thesisGroupId: group._id,
    submittedBy: frank._id,
    weekNo: 12,
    summary: 'Completed proposal outline and started the literature review framework.',
    progressPercentage: 68,
    generatedPdf: '',
  });

  await Contribution.create({
    thesisGroupId: group._id,
    studentId: frank._id,
    task: 'Prepared proposal outline and meeting notes',
    hoursSpent: 14,
    contributionPercentage: 42,
  });

  await PaperReview.create({
    thesisGroupId: group._id,
    paperTitle: 'Related Work Review Draft',
    paperFile: '',
    reviewer: supervisor._id,
    comments: 'Strong start; add more recent papers and clarify the comparison table.',
    score: 8,
    status: 'reviewed',
    reviewedAt: futureDate(-1),
  });

  await Recommendation.create({
    userId: frank._id,
    recommendedSupervisors: [supervisor._id],
    recommendedTopics: [topic._id],
    recommendedPapers: [
      {
        title: 'A Survey of Thesis Management Systems',
        authors: ['R. Hasan', 'M. Rahman'],
        link: 'https://example.com/thesis-management-survey',
      },
    ],
  });

  await ForumPost.create({
    author: frank._id,
    title: 'Looking for feedback on thesis structure',
    content: 'I am organizing my thesis chapters and would appreciate feedback on the structure.',
    tags: ['thesis', 'feedback', 'structure'],
    comments: [
      {
        userId: supervisor._id,
        comment: 'Keep the introduction concise and move the detailed analysis to the methodology chapter.',
      },
    ],
  });

  console.log('Frank dashboard data seeded successfully.');
  process.exit(0);
};

seedFrankDashboard().catch((error) => {
  console.error(error);
  process.exit(1);
});