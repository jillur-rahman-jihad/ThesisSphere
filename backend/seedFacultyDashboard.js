import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/userModel.js';
import SupervisorProfile from './models/SupervisorProfile.js';
import StudentProfile from './models/StudentProfileModel.js';
import ThesisGroup from './models/ThesisGroup.js';
import Meeting from './models/Meeting.js';
import PaperReview from './models/PaperReview.js';
import ProgressReport from './models/ProgressReport.js';
import SupervisionRequest from './models/SupervisionRequest.js';

dotenv.config();

const seedFacultyDashboard = async () => {
  await connectDB();

  // Test faculty account provided by user
  const facultyEmail = 'z@gmail.com';
  
  let faculty = await User.findOne({ email: facultyEmail });
  if (!faculty) {
    faculty = await User.create({
      role: 'faculty',
      fullName: 'Prof. Dr. Emily Carter',
      email: facultyEmail,
      password: 'password123',
      department: 'Computer Science',
      university: 'MIT',
      bio: 'Associate Professor specializing in AI and Machine Learning.',
    });
  }

  // Ensure Supervisor Profile exists
  await SupervisorProfile.findOneAndUpdate(
    { userId: faculty._id },
    {
      userId: faculty._id,
      designation: 'Associate Professor',
      maxStudents: 5,
      currentStudents: 3,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Clear existing mock data for this faculty
  await ThesisGroup.deleteMany({ supervisorId: faculty._id });
  await Meeting.deleteMany({ supervisorId: faculty._id });
  await PaperReview.deleteMany({ reviewer: faculty._id });
  await SupervisionRequest.deleteMany({ supervisorId: faculty._id });

  // Create Mock Students
  const students = await User.insertMany([
    {
      role: 'student', fullName: 'Sarah Chen', email: 'sarah.c@test.com', password: 'pass', department: 'CS'
    },
    {
      role: 'student', fullName: 'Marcus Obinna', email: 'marcus.o@test.com', password: 'pass', department: 'CS'
    },
    {
      role: 'student', fullName: 'Ji-ho Park', email: 'jiho.p@test.com', password: 'pass', department: 'CS'
    },
    {
      role: 'student', fullName: 'Fatima Al-Rashidi', email: 'fatima.a@test.com', password: 'pass', department: 'Environmental CS'
    },
    {
      role: 'student', fullName: 'Kwame Asante', email: 'kwame.a@test.com', password: 'pass', department: 'Computer Engineering'
    }
  ]);

  // Create Thesis Groups for the first 3 students (Active Supervisees)
  const group1 = await ThesisGroup.create({
    groupName: 'Deep Learning for Medical Image Analysis',
    leaderId: students[0]._id,
    members: [students[0]._id],
    supervisorId: faculty._id,
    progress: 73
  });

  const group2 = await ThesisGroup.create({
    groupName: 'Federated Learning in Healthcare Networks',
    leaderId: students[1]._id,
    members: [students[1]._id],
    supervisorId: faculty._id,
    progress: 48
  });

  const group3 = await ThesisGroup.create({
    groupName: 'Vision Transformers for Histopathology',
    leaderId: students[2]._id,
    members: [students[2]._id],
    supervisorId: faculty._id,
    progress: 31
  });

  // Create Progress Reports
  await ProgressReport.create([
    { thesisGroupId: group1._id, submittedBy: students[0]._id, weekNo: 5, progressPercentage: 73 },
    { thesisGroupId: group2._id, submittedBy: students[1]._id, weekNo: 5, progressPercentage: 48 },
    { thesisGroupId: group3._id, submittedBy: students[2]._id, weekNo: 5, progressPercentage: 31 }
  ]);

  // Create Meetings (Some in current month, some in past months)
  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(now.getMonth() - 1);
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  await Meeting.create([
    { title: 'Project kick-off', thesisGroupId: group1._id, supervisorId: faculty._id, meetingDate: lastMonth, status: 'completed' },
    { title: 'Mid-term Review', thesisGroupId: group1._id, supervisorId: faculty._id, meetingDate: now, status: 'completed' },
    { title: 'Chapter 3 Discussion', thesisGroupId: group2._id, supervisorId: faculty._id, meetingDate: nextWeek, status: 'scheduled' },
    { title: 'Literature Review Check', thesisGroupId: group3._id, supervisorId: faculty._id, meetingDate: nextWeek, status: 'scheduled' },
    { title: 'Monthly Check-in', thesisGroupId: group1._id, supervisorId: faculty._id, meetingDate: nextWeek, status: 'scheduled' }
  ]);

  // Create Paper Reviews
  await PaperReview.create([
    { thesisGroupId: group1._id, paperTitle: 'Literature Review Draft', reviewer: faculty._id, status: 'submitted' },
    { thesisGroupId: group2._id, paperTitle: 'Methodology Outline', reviewer: faculty._id, status: 'submitted' },
    { thesisGroupId: group3._id, paperTitle: 'Introduction Chapter', reviewer: faculty._id, status: 'submitted' },
    { thesisGroupId: group1._id, paperTitle: 'Abstract Draft', reviewer: faculty._id, status: 'submitted' }
  ]);

  // Create Pending Supervision Requests
  await SupervisionRequest.create([
    {
      studentId: students[3]._id,
      supervisorId: faculty._id,
      status: 'pending',
      topicTitle: 'AI in Environmental Monitoring',
      compatibilityScore: 82
    },
    {
      studentId: students[4]._id,
      supervisorId: faculty._id,
      status: 'pending',
      topicTitle: 'Federated Learning for IoT',
      compatibilityScore: 74
    }
  ]);

  console.log('Faculty Dashboard seeded successfully for z@gmail.com!');
  process.exit(0);
};

seedFacultyDashboard().catch((error) => {
  console.error(error);
  process.exit(1);
});
