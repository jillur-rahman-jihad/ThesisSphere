import mongoose from "mongoose";

import PaperReview from "../models/PaperReview.js";
import ThesisGroup from "../models/ThesisGroup.js";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const isGroupMember = (group, userId) => {
  if (!group || !userId) {
    return false;
  }

  const userIdString =
    userId.toString();

  const isLeader =
    group.leaderId &&
    group.leaderId.toString() ===
      userIdString;

  const isMember =
    Array.isArray(group.members) &&
    group.members.some(
      (member) =>
        member.toString() ===
        userIdString
    );

  return isLeader || isMember;
};

const isGroupSupervisor = (
  group,
  userId
) => {
  if (
    !group ||
    !group.supervisorId ||
    !userId
  ) {
    return false;
  }

  return (
    group.supervisorId.toString() ===
    userId.toString()
  );
};

// ============================================================
// STATISTICS
// ============================================================

const getStatistics = async (filter) => {
  const [
    total,
    underReview,
    revisionRequired,
    accepted,
    draft,
  ] = await Promise.all([
    PaperReview.countDocuments(filter),

    PaperReview.countDocuments({
      ...filter,
      status: "under review",
    }),

    PaperReview.countDocuments({
      ...filter,
      status: "revision required",
    }),

    PaperReview.countDocuments({
      ...filter,
      status: "accepted",
    }),

    PaperReview.countDocuments({
      ...filter,
      status: "draft",
    }),
  ]);

  return {
    total,
    underReview,
    revisionRequired,
    accepted,
    draft,
  };
};

// ============================================================
// POPULATE PAPER
// ============================================================

const populatePaperReview = (query) => {
  return query
    .populate({
      path: "thesisGroupId",
      populate: [
        {
          path: "members",
          select:
            "fullName email department university",
        },
        {
          path: "leaderId",
          select:
            "fullName email department university",
        },
        {
          path: "supervisorId",
          select:
            "fullName email department university",
        },
        {
          path: "topicId",
          select:
            "title name description",
        },
      ],
    })
    .populate(
      "submittedBy",
      "fullName email department university"
    )
    .populate(
      "reviewedBy",
      "fullName email department university"
    );
};

// ============================================================
// CREATE PAPER REVIEW
// ============================================================

export const createPaperReview =
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // ROLE CHECK
      // --------------------------------------------------------

      if (req.user.role !== "student") {
        return res.status(403).json({
          success: false,
          message:
            "Only students can create paper reviews.",
        });
      }

      const {
        title,
        thesisGroupId,
        deadline,
      } = req.body;

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Paper title is required.",
        });
      }

      if (!thesisGroupId) {
        return res.status(400).json({
          success: false,
          message:
            "Thesis group is required.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(
        thesisGroupId
      )) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid thesis group ID.",
        });
      }

      if (!deadline) {
        return res.status(400).json({
          success: false,
          message:
            "Deadline is required.",
        });
      }

      // --------------------------------------------------------
      // PDF VALIDATION
      // --------------------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload the paper PDF.",
        });
      }

      if (
        req.file.mimetype !==
        "application/pdf"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only PDF files are allowed.",
        });
      }

      // --------------------------------------------------------
      // FIND THESIS GROUP
      // --------------------------------------------------------

      const group =
        await ThesisGroup.findById(
          thesisGroupId
        );

      if (!group) {
        return res.status(404).json({
          success: false,
          message:
            "Thesis group not found.",
        });
      }

      // --------------------------------------------------------
      // CHECK MEMBERSHIP
      // --------------------------------------------------------

      if (
        !isGroupMember(
          group,
          req.user._id
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this thesis group.",
        });
      }

      // --------------------------------------------------------
      // DEADLINE VALIDATION
      // --------------------------------------------------------

      const deadlineDate =
        new Date(deadline);

      if (
        Number.isNaN(
          deadlineDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid deadline.",
        });
      }

      // --------------------------------------------------------
      // CREATE PAPER
      // --------------------------------------------------------

      const paper =
        await PaperReview.create({
          title: title.trim(),

          thesisGroupId,

          submittedBy:
            req.user._id,

          deadline:
            deadlineDate,

          submittedDate:
            null,

          status: "draft",

          feedback: "",

          reviewedBy: null,

          reviewedAt: null,

          // ----------------------------------------------------
          // STORE PDF DIRECTLY IN MONGODB
          // ----------------------------------------------------

          paperFile: {
            data: req.file.buffer,

            contentType:
              req.file.mimetype,

            fileName:
              req.file.originalname,

            size:
              req.file.size,
          },
        });

      // --------------------------------------------------------
      // ADD GROUP ACTIVITY
      // --------------------------------------------------------

      group.recentActivity =
        group.recentActivity || [];

      group.recentActivity.unshift({
        description:
          `${req.user.fullName || "A student"} created paper review "${paper.title}".`,
      });

      // Keep only recent 20 activities
      group.recentActivity =
        group.recentActivity.slice(
          0,
          20
        );

      await group.save();

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      const populatedPaper =
        await populatePaperReview(
          PaperReview.findById(
            paper._id
          )
        );

      return res.status(201).json({
        success: true,
        message:
          "Paper review created successfully.",
        data: populatedPaper,
      });
    } catch (error) {
      console.error(
        "Create Paper Review Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to create paper review.",
      });
    }
  };

// ============================================================
// GET STUDENT PAPER REVIEWS
// ============================================================

export const getStudentPaperReviews =
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({
          success: false,
          message:
            "Only students can access their papers.",
        });
      }

      const papers =
        await populatePaperReview(
          PaperReview.find({
            submittedBy:
              req.user._id,
          }).sort({
            createdAt: -1,
          })
        );

      const statistics =
        await getStatistics({
          submittedBy:
            req.user._id,
        });

      return res.status(200).json({
        success: true,
        data: papers,
        statistics,
      });
    } catch (error) {
      console.error(
        "Get Student Papers Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch paper reviews.",
      });
    }
  };

// ============================================================
// GET PAPER BY ID
// ============================================================

export const getPaperReviewById =
  async (req, res) => {
    try {
      const { paperId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          paperId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paper ID.",
        });
      }

      const paper =
        await populatePaperReview(
          PaperReview.findById(
            paperId
          )
        );

      if (!paper) {
        return res.status(404).json({
          success: false,
          message:
            "Paper review not found.",
        });
      }

      const isStudent =
        paper.submittedBy &&
        paper.submittedBy._id.toString() ===
          req.user._id.toString();

      const isSupervisor =
        paper.thesisGroupId &&
        isGroupSupervisor(
          paper.thesisGroupId,
          req.user._id
        );

      if (
        !isStudent &&
        !isSupervisor
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this paper.",
        });
      }

      return res.status(200).json({
        success: true,
        data: paper,
      });
    } catch (error) {
      console.error(
        "Get Paper Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch paper review.",
      });
    }
  };

// ============================================================
// UPDATE PAPER REVIEW
// ============================================================

export const updatePaperReview =
  async (req, res) => {
    try {
      const { paperId } =
        req.params;

      const {
        title,
        deadline,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          paperId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paper ID.",
        });
      }

      const paper =
        await PaperReview.findById(
          paperId
        );

      if (!paper) {
        return res.status(404).json({
          success: false,
          message:
            "Paper review not found.",
        });
      }

      // --------------------------------------------------------
      // ONLY OWNER CAN UPDATE
      // --------------------------------------------------------

      if (
        paper.submittedBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to update this paper.",
        });
      }

      // --------------------------------------------------------
      // ONLY DRAFT / REVISION REQUIRED
      // --------------------------------------------------------

      if (
        ![
          "draft",
          "revision required",
        ].includes(paper.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This paper cannot be edited in its current status.",
        });
      }

      // --------------------------------------------------------
      // UPDATE FIELDS
      // --------------------------------------------------------

      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({
            success: false,
            message:
              "Paper title cannot be empty.",
          });
        }

        paper.title =
          title.trim();
      }

      if (deadline !== undefined) {
        const deadlineDate =
          new Date(deadline);

        if (
          Number.isNaN(
            deadlineDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid deadline.",
          });
        }

        paper.deadline =
          deadlineDate;
      }

      if (req.file) {
        paper.paperFile = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          fileName: req.file.originalname,
          size: req.file.size,
        };
      }

      await paper.save();

      const populatedPaper =
        await populatePaperReview(
          PaperReview.findById(
            paper._id
          )
        );

      return res.status(200).json({
        success: true,
        message:
          "Paper review updated successfully.",
        data: populatedPaper,
      });
    } catch (error) {
      console.error(
        "Update Paper Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update paper review.",
      });
    }
  };

// ============================================================
// SUBMIT PAPER FOR REVIEW
// ============================================================

export const submitPaperReview =
  async (req, res) => {
    try {
      const { paperId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          paperId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paper ID.",
        });
      }

      const paper =
        await PaperReview.findById(
          paperId
        );

      if (!paper) {
        return res.status(404).json({
          success: false,
          message:
            "Paper review not found.",
        });
      }

      // --------------------------------------------------------
      // OWNER CHECK
      // --------------------------------------------------------

      if (
        paper.submittedBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to submit this paper.",
        });
      }

      // --------------------------------------------------------
      // STATUS CHECK
      // --------------------------------------------------------

      if (
        ![
          "draft",
          "revision required",
        ].includes(paper.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This paper cannot be submitted in its current status.",
        });
      }

      // --------------------------------------------------------
      // PDF CHECK
      // --------------------------------------------------------

      if (
        !paper.paperFile ||
        !paper.paperFile.data
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload the paper PDF before submitting.",
        });
      }

      // --------------------------------------------------------
      // SUBMIT
      // --------------------------------------------------------

      paper.status =
        "under review";

      paper.submittedDate =
        new Date();

      paper.reviewedBy =
        null;

      paper.reviewedAt =
        null;

      await paper.save();

      // --------------------------------------------------------
      // GROUP ACTIVITY
      // --------------------------------------------------------

      const group =
        await ThesisGroup.findById(
          paper.thesisGroupId
        );

      if (group) {
        group.recentActivity =
          group.recentActivity || [];

        group.recentActivity.unshift({
          description:
            `${req.user.fullName || "A student"} submitted paper "${paper.title}" for review.`,
        });

        group.recentActivity =
          group.recentActivity.slice(
            0,
            20
          );

        await group.save();
      }

      const populatedPaper =
        await populatePaperReview(
          PaperReview.findById(
            paper._id
          )
        );

      return res.status(200).json({
        success: true,
        message:
          "Paper submitted for review successfully.",
        data: populatedPaper,
      });
    } catch (error) {
      console.error(
        "Submit Paper Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to submit paper.",
      });
    }
  };

// ============================================================
// GET SUPERVISOR PAPER REVIEWS
// ============================================================

export const getSupervisorPaperReviews =
  async (req, res) => {
    try {
      if (req.user.role !== "faculty") {
        return res.status(403).json({
          success: false,
          message:
            "Only faculty can access supervisor papers.",
        });
      }

      // --------------------------------------------------------
      // FIND GROUPS SUPERVISED BY FACULTY
      // --------------------------------------------------------

      const groups =
        await ThesisGroup.find({
          supervisorId:
            req.user._id,
        }).select("_id");

      const groupIds =
        groups.map(
          (group) => group._id
        );

      // --------------------------------------------------------
      // FIND PAPERS
      // --------------------------------------------------------

      const papers =
        await populatePaperReview(
          PaperReview.find({
            thesisGroupId: {
              $in: groupIds,
            },
          }).sort({
            createdAt: -1,
          })
        );

      const statistics =
        await getStatistics({
          thesisGroupId: {
            $in: groupIds,
          },
        });

      return res.status(200).json({
        success: true,
        data: papers,
        statistics,
      });
    } catch (error) {
      console.error(
        "Get Supervisor Papers Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch supervisor papers.",
      });
    }
  };

// ============================================================
// GET SUPERVISOR PAPER BY ID
// ============================================================

export const getSupervisorPaperReviewById =
  async (req, res) => {
    try {
      const { paperId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          paperId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paper ID.",
        });
      }

      const paper =
        await populatePaperReview(
          PaperReview.findById(
            paperId
          )
        );

      if (!paper) {
        return res.status(404).json({
          success: false,
          message:
            "Paper review not found.",
        });
      }

      if (
        req.user.role !==
        "faculty"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only faculty can access this paper.",
        });
      }

      if (
        !isGroupSupervisor(
          paper.thesisGroupId,
          req.user._id
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not the supervisor of this thesis group.",
        });
      }

      return res.status(200).json({
        success: true,
        data: paper,
      });
    } catch (error) {
      console.error(
        "Get Supervisor Paper Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch paper.",
      });
    }
  };

// ============================================================
// REVIEW PAPER
// ============================================================

export const reviewPaper =
  async (req, res) => {
    try {
      const { paperId } =
        req.params;

      const {
        status,
        feedback,
      } = req.body;

      if (
        req.user.role !==
        "faculty"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only faculty can review papers.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          paperId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paper ID.",
        });
      }

      const allowedStatuses = [
        "draft",
        "under review",
        "revision required",
        "accepted",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paper status.",
        });
      }

      const paper =
        await PaperReview.findById(
          paperId
        );

      if (!paper) {
        return res.status(404).json({
          success: false,
          message:
            "Paper review not found.",
        });
      }

      const group =
        await ThesisGroup.findById(
          paper.thesisGroupId
        );

      if (!group) {
        return res.status(404).json({
          success: false,
          message:
            "Thesis group not found.",
        });
      }

      // --------------------------------------------------------
      // SUPERVISOR CHECK
      // --------------------------------------------------------

      if (
        !isGroupSupervisor(
          group,
          req.user._id
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not the supervisor of this thesis group.",
        });
      }

      // --------------------------------------------------------
      // UPDATE REVIEW
      // --------------------------------------------------------

      paper.status =
        status;

      paper.feedback =
        feedback?.trim() || "";

      paper.reviewedBy =
        req.user._id;

      paper.reviewedAt =
        new Date();

      await paper.save();

      // --------------------------------------------------------
      // GROUP ACTIVITY
      // --------------------------------------------------------

      group.recentActivity =
        group.recentActivity || [];

      group.recentActivity.unshift({
        description:
          `Supervisor updated paper "${paper.title}" to "${status}".`,
      });

      group.recentActivity =
        group.recentActivity.slice(
          0,
          20
        );

      await group.save();

      const populatedPaper =
        await populatePaperReview(
          PaperReview.findById(
            paper._id
          )
        );

      return res.status(200).json({
        success: true,
        message:
          "Paper review updated successfully.",
        data: populatedPaper,
      });
    } catch (error) {
      console.error(
        "Review Paper Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to review paper.",
      });
    }
  };

// ============================================================
// GET MY THESIS GROUPS
// ============================================================

export const getMyThesisGroups =
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({
          success: false,
          message:
            "Only students can access their thesis groups.",
        });
      }

      const userId =
        req.user._id;

      const groups =
        await ThesisGroup.find({
          $and: [
            {
              $or: [
                {
                  members: userId,
                },
                {
                  leaderId: userId,
                },
              ],
            },

            {
              $or: [
                {
                  status: "active",
                },
                {
                  status: {
                    $exists: false,
                  },
                },
              ],
            },
          ],
        })
          .populate(
            "members",
            "fullName email department university"
          )
          .populate(
            "leaderId",
            "fullName email department university"
          )
          .populate(
            "supervisorId",
            "fullName email department university"
          )
          .populate(
            "topicId",
            "title name description"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        data: groups,
      });
    } catch (error) {
      console.error(
        "Get My Thesis Groups Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch thesis groups.",
      });
    }
  };

// ============================================================
// STUDENT STATISTICS
// ============================================================

export const getStudentPaperStatistics =
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({
          success: false,
          message:
            "Only students can access these statistics.",
        });
      }

      const statistics =
        await getStatistics({
          submittedBy:
            req.user._id,
        });

      return res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error(
        "Student Statistics Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch statistics.",
      });
    }
  };

// ============================================================
// SUPERVISOR STATISTICS
// ============================================================

export const getSupervisorPaperStatistics =
  async (req, res) => {
    try {
      if (req.user.role !== "faculty") {
        return res.status(403).json({
          success: false,
          message:
            "Only faculty can access these statistics.",
        });
      }

      const groups =
        await ThesisGroup.find({
          supervisorId:
            req.user._id,
        }).select("_id");

      const groupIds =
        groups.map(
          (group) => group._id
        );

      const statistics =
        await getStatistics({
          thesisGroupId: {
            $in: groupIds,
          },
        });

      return res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error(
        "Supervisor Statistics Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch statistics.",
      });
    }
  };

// ============================================================
// GET PAPER PDF
// ============================================================

export const getPaperFile =
  async (req, res) => {
    try {
      const { paperId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          paperId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paper ID.",
        });
      }

      // --------------------------------------------------------
      // FIND PAPER
      // --------------------------------------------------------

      const paper =
        await PaperReview.findById(
          paperId
        ).select(
          "paperFile thesisGroupId submittedBy"
        );

      if (!paper) {
        return res.status(404).json({
          success: false,
          message:
            "Paper review not found.",
        });
      }

      if (
        !paper.paperFile ||
        !paper.paperFile.data
      ) {
        return res.status(404).json({
          success: false,
          message:
            "PDF file not found.",
        });
      }

      // --------------------------------------------------------
      // CHECK AUTHORIZATION
      // --------------------------------------------------------

      const isStudent =
        paper.submittedBy.toString() ===
        req.user._id.toString();

      let isSupervisor = false;

      if (paper.thesisGroupId) {
        const group =
          await ThesisGroup.findById(
            paper.thesisGroupId
          ).select(
            "supervisorId members leaderId"
          );

        if (group) {
          isSupervisor =
            isGroupSupervisor(
              group,
              req.user._id
            );
        }
      }

      if (
        !isStudent &&
        !isSupervisor
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to access this PDF.",
        });
      }

      // --------------------------------------------------------
      // SEND PDF
      // --------------------------------------------------------

      res.setHeader(
        "Content-Type",
        paper.paperFile.contentType ||
          "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${paper.paperFile.fileName || "paper.pdf"}"`
      );

      res.setHeader(
        "Content-Length",
        paper.paperFile.data.length
      );

      return res.send(
        paper.paperFile.data
      );
    } catch (error) {
      console.error(
        "Get Paper File Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to retrieve PDF.",
      });
    }
  };