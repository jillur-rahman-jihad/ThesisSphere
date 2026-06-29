import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: [true, 'Please specify a role'],
    },
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default in queries
    },
    profilePicture: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    university: {
      type: String,
      default: '',
    },
    researchInterests: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    achievements: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: '',
    },
    availability: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
