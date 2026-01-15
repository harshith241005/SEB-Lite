const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const Exam = require("../models/Exam");
const Answer = require("../models/Answer");
const Violation = require("../models/Violation");

const router = express.Router();

const sanitizeQuestion = (question, index) => ({
  questionIndex: index,
  prompt: question.prompt,
  options: question.options,
  category: question.category,
  difficulty: question.difficulty,
});

const sanitizeExamMeta = (exam) => ({
  id: exam._id,
  title: exam.title,
  company: exam.company,
  type: exam.type,
  description: exam.description,
  duration: exam.duration,
  maxViolations: exam.maxViolations,
  passingPercentage: exam.passingPercentage,
  instructions: exam.instructions,
  questionCount: exam.questions.length,
  isActive: exam.isActive,
  createdAt: exam.createdAt,
  updatedAt: exam.updatedAt,
});

const validateObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// Student dashboard view of available/completed exams
router.get("/available", authMiddleware, async (req, res) => {
  try {
    const [activeExams, attempts] = await Promise.all([
      Exam.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
      Answer.find({ studentId: req.userId }).lean(),
    ]);

    const attemptedMap = new Map();
    attempts.forEach((attempt) => {
      attemptedMap.set(String(attempt.examId), attempt);
    });

    const available = [];
    const completed = [];
    const examMetaById = new Map();

    activeExams.forEach((exam) => {
      const meta = sanitizeExamMeta(exam);
      examMetaById.set(String(exam._id), meta);

      const attempt = attemptedMap.get(String(exam._id));
      if (!attempt || attempt.status === "in-progress") {
        available.push({
          ...meta,
          hasCompleted: false,
          canTake: exam.isActive,
        });
      } else {
        completed.push({
          examId: exam._id,
          title: exam.title,
          submittedAt: attempt.submittedAt,
          score: attempt.percentage,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          passed: attempt.percentage >= exam.passingPercentage,
          status: attempt.status,
        });
      }
    });

    // Include completed exams that might no longer be active
    const completedIds = attempts
      .filter((attempt) => attempt.status !== "in-progress")
      .map((attempt) => attempt.examId);

    const missingExamIds = completedIds.filter(
      (id) => !examMetaById.has(String(id))
    );

    if (missingExamIds.length) {
      const pastExams = await Exam.find({ _id: { $in: missingExamIds } })
        .select("title passingPercentage questions")
        .lean();
      pastExams.forEach((exam) => {
        examMetaById.set(String(exam._id), sanitizeExamMeta(exam));
      });
    }

    const completedDetailed = attempts
      .filter((attempt) => attempt.status !== "in-progress")
      .map((attempt) => {
        const exam = examMetaById.get(String(attempt.examId));
        const passingPercentage = exam?.passingPercentage ?? 60;
        return {
          examId: attempt.examId,
          title: exam?.title ?? "Exam",
          submittedAt: attempt.submittedAt,
          score: attempt.percentage,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          passed: attempt.percentage >= passingPercentage,
          grade:
            attempt.percentage >= 90
              ? "A"
              : attempt.percentage >= 80
              ? "B"
              : attempt.percentage >= 70
              ? "C"
              : attempt.percentage >= 60
              ? "D"
              : "F",
        };
      });

    const avgScore = completedDetailed.length
      ? completedDetailed.reduce((sum, entry) => sum + entry.score, 0) /
        completedDetailed.length
      : 0;

    res.json({
      available,
      completed: completedDetailed,
      stats: {
        totalAvailable: available.length,
        totalCompleted: completedDetailed.length,
        averageScore: Number(avgScore.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load exam dashboard." });
  }
});

// Instructor/Admin list of exams
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!["instructor", "admin"].includes(req.role)) {
      return res.status(403).json({ error: "Instructor or admin access required." });
    }

    const match = req.role === "instructor" ? { instructor: req.userId } : {};
    const exams = await Exam.find(match).sort({ createdAt: -1 }).lean();
    const examIds = exams.map((exam) => exam._id);

    const analytics = await Answer.aggregate([
      { $match: { examId: { $in: examIds } } },
      {
        $group: {
          _id: "$examId",
          attempts: { $sum: 1 },
          submitted: {
            $sum: {
              $cond: [{ $in: ["$status", ["submitted", "auto-submitted"]] }, 1, 0],
            },
          },
          avgScore: { $avg: "$percentage" },
        },
      },
    ]);

    const analyticsMap = new Map();
    analytics.forEach((entry) => {
      analyticsMap.set(String(entry._id), entry);
    });

    const response = exams.map((exam) => {
      const meta = sanitizeExamMeta(exam);
      const examAnalytics = analyticsMap.get(String(exam._id)) || {
        attempts: 0,
        submitted: 0,
        avgScore: 0,
      };

      return {
        ...meta,
        totalQuestions: exam.questions.length,
        enrolledStudents: examAnalytics.attempts,
        submittedAttempts: examAnalytics.submitted,
        averageScore: Number((examAnalytics.avgScore || 0).toFixed(2)),
        status: exam.isActive ? "Active" : "Inactive",
      };
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to load exams." });
  }
});

// Start exam: return sanitized questions and ensure attempt exists
router.get("/:id/start", authMiddleware, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam id." });
    }

    const exam = await Exam.findById(req.params.id).lean();
    if (!exam) {
      return res.status(404).json({ error: "Exam not found." });
    }

    if (!exam.isActive) {
      return res.status(403).json({ error: "Exam is not currently active." });
    }

    const existingAttempt = await Answer.findOne({
      examId: req.params.id,
      studentId: req.userId,
    });

    if (existingAttempt && existingAttempt.status !== "in-progress") {
      return res
        .status(403)
        .json({ error: "You have already submitted this exam." });
    }

    let attempt = existingAttempt;
    if (!attempt) {
      attempt = await Answer.create({
        studentId: req.userId,
        examId: exam._id,
        totalQuestions: exam.questions.length,
        timeRemaining: exam.duration * 60,
      });
    }

    const sanitizedQuestions = exam.questions.map((question, index) =>
      sanitizeQuestion(question, index)
    );

    res.json({
      exam: sanitizeExamMeta(exam),
      questions: sanitizedQuestions,
      progress: {
        answers: (attempt.answers || []).map((item) => ({
          questionIndex: item.questionIndex,
          selectedOption: item.selectedOption,
          timeSpent: item.timeSpent,
        })),
        timeRemaining: attempt.timeRemaining ?? exam.duration * 60,
        startedAt: attempt.startedAt,
        lastSavedAt: attempt.lastSavedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to start exam." });
  }
});

// Student fetch results
router.get("/:examId/results", authMiddleware, async (req, res) => {
  try {
    if (!validateObjectId(req.params.examId)) {
      return res.status(400).json({ error: "Invalid exam id." });
    }

    const record = await Answer.findOne({
      examId: req.params.examId,
      studentId: req.userId,
    })
      .populate("examId", "title passingPercentage duration")
      .lean();

    if (!record || !["submitted", "auto-submitted"].includes(record.status)) {
      return res.status(404).json({ error: "No submitted attempt found." });
    }

    const exam = record.examId;
    const passed = record.percentage >= (exam?.passingPercentage ?? 60);

    res.json({
      exam: {
        id: exam?._id ?? req.params.examId,
        title: exam?.title ?? "Exam",
        passingPercentage: exam?.passingPercentage ?? 60,
      },
      score: record.percentage,
      correctAnswers: record.correctAnswers,
      totalQuestions: record.totalQuestions,
      submittedAt: record.submittedAt,
      passed,
      grade:
        record.percentage >= 90
          ? "A"
          : record.percentage >= 80
          ? "B"
          : record.percentage >= 70
          ? "C"
          : record.percentage >= 60
          ? "D"
          : "F",
      durationUsed: record.durationUsed,
      violationsCount: record.violationsCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch results." });
  }
});

// Instructor/Admin results summary per exam
router.get("/:examId/summary", authMiddleware, async (req, res) => {
  try {
    if (!validateObjectId(req.params.examId)) {
      return res.status(400).json({ error: "Invalid exam id." });
    }

    if (!["instructor", "admin"].includes(req.role)) {
      return res.status(403).json({ error: "Instructor or admin access required." });
    }

    const exam = await Exam.findById(req.params.examId).lean();
    if (!exam) {
      return res.status(404).json({ error: "Exam not found." });
    }

    if (req.role === "instructor" && String(exam.instructor) !== req.userId) {
      return res.status(403).json({ error: "Not authorized to view this exam." });
    }

    const attempts = await Answer.find({ examId: req.params.examId })
      .select(
        "studentId status percentage correctAnswers totalQuestions submittedAt autoSubmitted autoSubmitReason"
      )
      .populate("studentId", "name email")
      .lean();

    const violations = await Violation.countDocuments({ examId: req.params.examId });

    res.json({
      exam: sanitizeExamMeta(exam),
      attempts,
      violationCount: violations,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch summary." });
  }
});

// Exam summary for instruction screen
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid exam id." });
    }

    const exam = await Exam.findById(req.params.id).lean();
    if (!exam) {
      return res.status(404).json({ error: "Exam not found." });
    }

    if (!exam.isActive && req.role === "student") {
      return res.status(403).json({ error: "Exam is not active." });
    }

    const attempt = await Answer.findOne({
      examId: req.params.id,
      studentId: req.userId,
    })
      .select("status submittedAt timeRemaining")
      .lean();

    res.json({
      ...sanitizeExamMeta(exam),
      alreadyAttempted: attempt ? attempt.status !== "in-progress" : false,
      attemptStatus: attempt?.status ?? null,
      submittedAt: attempt?.submittedAt ?? null,
      timeRemaining: attempt?.timeRemaining ?? exam.duration * 60,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exam." });
  }
});

module.exports = router;
