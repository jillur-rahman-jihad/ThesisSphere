import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import User from './models/userModel.js';
import StudentProfile from './models/StudentProfileModel.js';
import SupervisorProfile from './models/SupervisorProfile.js';
import ThesisTopic from './models/ThesisTopic.js';
import ThesisGroup from './models/ThesisGroup.js';
import Meeting from './models/Meeting.js';
import ForumPost from './models/ForumPost.js';
import Message from './models/Message.js';
import Deadline from './models/Deadline.js';
import ProgressReport from './models/ProgressReport.js';
import PaperReview from './models/PaperReview.js';
import Contribution from './models/Contribution.js';
import Notification from './models/Notification.js';
import Recommendation from './models/Recommendation.js';
import Citation from './models/Citation.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await StudentProfile.deleteMany();
    await SupervisorProfile.deleteMany();
    await ThesisTopic.deleteMany();
    await ThesisGroup.deleteMany();
    await Meeting.deleteMany();
    await ForumPost.deleteMany();
    await Message.deleteMany();
    await Deadline.deleteMany();
    await ProgressReport.deleteMany();
    await PaperReview.deleteMany();
    await Contribution.deleteMany();
    await Notification.deleteMany();
    await Recommendation.deleteMany();
    await Citation.deleteMany();

    const createdUsers = [];
    const students = [];
    const faculties = [];

    // Create Admin
    const adminUser = await User.create({
      role: 'admin',
      fullName: 'Admin User',
      email: 'admin@thesissphere.com',
      password: 'password123', // Will be hashed by pre-save hook
      department: 'Admin',
      university: 'ThesisSphere University',
    });
    createdUsers.push(adminUser);

    // Create Faculties (Supervisors)
    for (let i = 0; i < 5; i++) {
      const user = await User.create({
        role: 'faculty',
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'password123',
        department: 'Computer Science and Engineering',
        university: 'BRAC University',
        bio: faker.lorem.paragraph(),
        researchInterests: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
      });
      createdUsers.push(user);
      faculties.push(user);

      await SupervisorProfile.create({
        userId: user._id,
        designation: faker.person.jobTitle(),
        officeRoom: `UB${faker.number.int({ min: 1, max: 8 })}${faker.number.int({ min: 100, max: 999 })}`,
        expertise: [faker.lorem.word(), faker.lorem.word()],
        maxStudents: faker.number.int({ min: 5, max: 10 }),
        currentStudents: 0,
      });
    }

    // Create Students
    for (let i = 0; i < 20; i++) {
      const user = await User.create({
        role: 'student',
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'password123',
        department: 'Computer Science and Engineering',
        university: 'BRAC University',
        bio: faker.lorem.paragraph(),
        skills: [faker.lorem.word(), faker.lorem.word()],
      });
      createdUsers.push(user);
      students.push(user);

      await StudentProfile.create({
        userId: user._id,
        studentId: `${faker.number.int({ min: 10, max: 24 })}${faker.number.int({ min: 100000, max: 999999 })}`,
        semester: 'Fall 2024',
        cgpa: faker.number.float({ min: 2.5, max: 4.0, multipleOf: 0.01 }),
      });
    }

    // Create Thesis Topics
    const topics = [];
    for (let i = 0; i < 10; i++) {
      const supervisor = faculties[Math.floor(Math.random() * faculties.length)];
      const topic = await ThesisTopic.create({
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        category: faker.helpers.arrayElement(['Machine Learning', 'Software Engineering', 'Networking', 'Cybersecurity', 'Data Science']),
        keywords: [faker.lorem.word(), faker.lorem.word()],
        supervisorId: supervisor._id,
        status: faker.helpers.arrayElement(['available', 'assigned']),
      });
      topics.push(topic);
    }

    // Create Thesis Groups
    const groups = [];
    let studentIndex = 0;
    for (let i = 0; i < 5; i++) {
      const supervisor = faculties[Math.floor(Math.random() * faculties.length)];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      const groupMembers = [];
      for(let j = 0; j < 3; j++) {
          if (studentIndex < students.length) {
              groupMembers.push(students[studentIndex]);
              studentIndex++;
          }
      }

      if (groupMembers.length > 0) {
        const group = await ThesisGroup.create({
          groupName: `Group ${i + 1}`,
          leaderId: groupMembers[0]._id,
          members: groupMembers.map(m => m._id),
          supervisorId: supervisor._id,
          topicId: topic._id,
          progress: faker.number.int({ min: 0, max: 100 }),
        });
        groups.push(group);

        // Update Student Profiles with Group ID and Supervisor ID
        for (const member of groupMembers) {
            await StudentProfile.findOneAndUpdate({ userId: member._id }, { thesisGroupId: group._id, supervisorId: supervisor._id });
        }
      }
    }

    // Create Meetings
    for (let i = 0; i < 15; i++) {
      const group = groups[Math.floor(Math.random() * groups.length)];
      await Meeting.create({
        title: faker.company.catchPhrase(),
        thesisGroupId: group._id,
        supervisorId: group.supervisorId,
        participants: group.members,
        meetingDate: faker.date.future(),
        meetingLink: 'https://meet.google.com/xyz',
        agenda: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['scheduled', 'completed', 'cancelled']),
      });
    }

    // Create Forum Posts
    for (let i = 0; i < 10; i++) {
      const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      await ForumPost.create({
        author: author._id,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(),
        tags: [faker.lorem.word(), faker.lorem.word()],
        comments: [
          {
            userId: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
            comment: faker.lorem.sentence(),
          }
        ]
      });
    }

    // Create Deadlines
    for (let i = 0; i < 5; i++) {
       const group = groups[Math.floor(Math.random() * groups.length)];
       await Deadline.create({
          title: `Deadline ${i+1}`,
          description: faker.lorem.sentence(),
          date: faker.date.future(),
          type: faker.helpers.arrayElement(['proposal', 'progress', 'meeting', 'submission', 'defense']),
          thesisGroupId: group._id
       })
    }

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await StudentProfile.deleteMany();
    await SupervisorProfile.deleteMany();
    await ThesisTopic.deleteMany();
    await ThesisGroup.deleteMany();
    await Meeting.deleteMany();
    await ForumPost.deleteMany();
    await Message.deleteMany();
    await Deadline.deleteMany();
    await ProgressReport.deleteMany();
    await PaperReview.deleteMany();
    await Contribution.deleteMany();
    await Notification.deleteMany();
    await Recommendation.deleteMany();
    await Citation.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
