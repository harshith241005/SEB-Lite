const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const Violation = require("../models/Violation");
const Exam = require("../models/Exam");
const Answer = require("../models/Answer");
const { finalizeSubmission } = require("../services/submissionService");

const router = express.Router();

const VALID_TYPES = ["WINDOW_BLUR", "SHORTCUT_ATTEMPT"];
const TYPE_SEVERITY = {
  WINDOW_BLUR: "medium",
  SHORTCUT_ATTEMPT: "high",
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { examId, type, description, metadata, timeRemaining } = req.body;

    if (!isValidObjectId(examId)) {
      return res.status(400).json({ error: "Invalid exam id." });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: "Unsupported violation type." });
    }

    const exam = await Exam.findById(examId)
      .select("maxViolations questions passingPercentage duration isActive")
      .lean();

    if (!exam) {
      return res.status(404).json({ error: "Exam not found." });
    }

    const violation = await Violation.create({
      studentId: req.userId,
      examId,
      violationType: type,
      severity: TYPE_SEVERITY[type] || "medium",
      description: description || "",
      metadata: {
        userAgent: req.get("User-Agent"),
        ...(metadata || {}),
      },
      ipAddress: req.ip,
      sessionId: req.headers["x-session-id"] || null,
    });

    const violationCount = await Violation.countDocuments({
      studentId: req.userId,
      examId,
    });

    let autoSubmitted = false;
    let submissionSummary = null;

    if (violationCount >= exam.maxViolations) {
      const attempt = await Answer.findOne({ examId, studentId: req.userId });
      if (attempt && attempt.status === "in-progress") {
        const result = await finalizeSubmission({
          exam,
          attempt,
          answers: attempt.answers,
          timeRemaining,
          violationsCount: violationCount,
          autoSubmitted: true,
          autoSubmitReason: "VIOLATION_LIMIT",
        });

        autoSubmitted = true;
        submissionSummary = {
          score: result.percentage,
          correctAnswers: result.correctAnswers,
          totalQuestions: exam.questions.length,
          passed: result.percentage >= exam.passingPercentage,
        };
      }
    }

    res.status(201).json({
      message: "Violation logged",
      violation: {
        id: violation._id,
        type: violation.violationType,
        severity: violation.severity,
        createdAt: violation.createdAt,
      },
      violationCount,
      maxViolations: exam.maxViolations,
      autoSubmitted,
      submission: submissionSummary,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to log violation." });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { examId, limit = 25 } = req.query;
    const parsedLimit = Math.min(Number(limit) || 25, 100);

    const filter = {};
    if (req.role === "student") {
      filter.studentId = req.userId;
    }

    if (examId && isValidObjectId(examId)) {
      filter.examId = examId;
    } else if (req.role === "instructor") {
      const instructorExams = await Exam.find({ instructor: req.userId })
        .select("_id")
        .lean();
      filter.examId = {
        $in: instructorExams.map((exam) => exam._id),
      };
    }

    const violations = await Violation.find(filter)
      .populate("studentId", "name email")
      .populate("examId", "title")
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    res.json(
      violations.map((violation) => ({
        id: violation._id,
        exam: violation.examId
          ? { id: violation.examId._id, title: violation.examId.title }
          : null,
        student: violation.studentId
          ? {
              id: violation.studentId._id,
              name: violation.studentId.name,
              email: violation.studentId.email,
            }
          : null,
        violationType: violation.violationType,
        severity: violation.severity,
        description: violation.description,
        createdAt: violation.createdAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch violations." });
  }
});

router.get(
  "/stats",
  authMiddleware,
  requireRole("instructor", "admin"),
  async (req, res) => {
    try {
      const { examId } = req.query;
      const match = {};

      if (examId) {
        if (!isValidObjectId(examId)) {
          return res.status(400).json({ error: "Invalid exam id." });
        }
        match.examId = new mongoose.Types.ObjectId(examId);
      }

      if (req.role === "instructor") {
        const instructorExams = await Exam.find({ instructor: req.userId })
          .select("_id")
          .lean();
        const ids = instructorExams.map((exam) => exam._id);
        if (match.examId && !ids.some((id) => String(id) === String(match.examId))) {
          return res.status(403).json({ error: "Not authorized for this exam." });
        }
        if (!match.examId) {
          match.examId = { $in: ids };
        }
      }

      const breakdown = await Violation.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              type: "$violationType",
              severity: "$severity",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const totals = breakdown.reduce(
        (acc, item) => {
          acc.total += item.count;
          acc.byType[item._id.type] = (acc.byType[item._id.type] || 0) + item.count;
          acc.bySeverity[item._id.severity] =
            (acc.bySeverity[item._id.severity] || 0) + item.count;
          return acc;
        },
        { total: 0, byType: {}, bySeverity: {} }
      );

      res.json(totals);
    } catch (error) {
      res.status(500).json({ error: "Failed to compute violation stats." });
    }
  }
);

module.exports = router;
