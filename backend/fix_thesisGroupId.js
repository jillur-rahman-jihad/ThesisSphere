import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ThesisGroup from './models/ThesisGroup.js';
import StudentProfile from './models/StudentProfileModel.js';

dotenv.config();

const fixThesisGroupIds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const groups = await ThesisGroup.find({});
    for (const group of groups) {
      const memberIds = group.members;
      const res = await StudentProfile.updateMany(
        { userId: { $in: memberIds } },
        { $set: { thesisGroupId: group._id } }
      );
      console.log(`Updated ${res.modifiedCount} student profiles for group ${group.groupName}`);
    }

    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

fixThesisGroupIds();
