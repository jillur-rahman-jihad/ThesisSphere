import StudentProfile from "../models/StudentProfileModel.js";
import User from "../models/userModel.js";

// ==========================================
// GET CURRENT STUDENT PROFILE
// GET /api/student-profile
// ==========================================

export const getStudentProfile = async (req, res, next) => {
  try {
    // Find logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Make sure only students can access this
    if (user.role !== "student") {
      res.status(403);
      throw new Error("Only students can access student profile");
    }

    // Find student profile
    let studentProfile = await StudentProfile.findOne({
      userId: user._id,
    });

    // If profile doesn't exist, create one
    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        userId: user._id,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          department: user.department,
          university: user.university,
        },
        profile: studentProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE CURRENT STUDENT PROFILE
// PUT /api/student-profile
// ==========================================

export const updateStudentProfile = async (req, res, next) => {
  try {
    // Find logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Only students
    if (user.role !== "student") {
      res.status(403);
      throw new Error("Only students can update student profile");
    }

    // ==========================================
    // UPDATE USER BASIC INFORMATION
    // ==========================================

    if (req.body.fullName !== undefined) {
      user.fullName = req.body.fullName;
      await user.save();
    }


    // ==========================================
    // FIND OR CREATE STUDENT PROFILE
    // ==========================================

    let studentProfile = await StudentProfile.findOne({
      userId: user._id,
    });

    if (!studentProfile) {
      studentProfile = new StudentProfile({
        userId: user._id,
      });
    }


    // ==========================================
    // UPDATE STUDENT PROFILE FIELDS
    // ==========================================

    if (req.body.studentId !== undefined) {
      studentProfile.studentId = req.body.studentId;
    }

    // Semester is intentionally NOT updated here.
    // It is managed from registration/profile data.

    if (req.body.program !== undefined) {
      studentProfile.program = req.body.program;
    }

    if (req.body.cgpa !== undefined) {
      studentProfile.cgpa = req.body.cgpa;
    }

    if (req.body.publications !== undefined) {
      studentProfile.publications = req.body.publications;
    }

    if (req.body.thesisTitle !== undefined) {
      studentProfile.thesisTitle = req.body.thesisTitle;
    }

    if (req.body.thesisGroupId !== undefined) {
      studentProfile.thesisGroupId = req.body.thesisGroupId;
    }

    if (req.body.supervisorId !== undefined) {
      studentProfile.supervisorId = req.body.supervisorId;
    }

    if (req.body.researchInterests !== undefined) {
      studentProfile.researchInterests =
        req.body.researchInterests;
    }

    if (req.body.skills !== undefined) {
      studentProfile.skills = req.body.skills;
    }


    await studentProfile.save();


    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(200).json({
      success: true,
      message: "Student profile updated successfully",
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          department: user.department,
          university: user.university,
        },
        profile: studentProfile,
      },
    });

  } catch (error) {
    next(error);
  }
};