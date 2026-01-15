const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const Exam = require("../models/Exam");

const { ALLOWED_CATEGORIES, ALLOWED_DIFFICULTIES } = Exam;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

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
  isActive: exam.isActive,
  questionCount: exam.questions.length,
  createdAt: exam.createdAt,
  updatedAt: exam.updatedAt,
});

const normaliseQuestion = (rawQuestion, index) => {
  const prompt =
    rawQuestion.prompt ||
    rawQuestion.question ||
    rawQuestion.questionText ||
    rawQuestion.text;

  if (!prompt || typeof prompt !== "string") {
    throw new Error(`Question ${index + 1} is missing a prompt.`);
  }

  const options = Array.isArray(rawQuestion.options)
    ? rawQuestion.options.map((option) => String(option))
    : [];

  if (options.length !== 4) {
    throw new Error(`Question ${index + 1} must contain exactly 4 options.`);
  }

  let correctOptionIndex = -1;
  if (typeof rawQuestion.correctOptionIndex === "number") {
    correctOptionIndex = rawQuestion.correctOptionIndex;
  } else if (typeof rawQuestion.correct === "number") {
    correctOptionIndex = rawQuestion.correct;
  } else if (typeof rawQuestion.correctAnswer === "string") {
    correctOptionIndex = options.findIndex(
      (option) =>
        option.trim().toLowerCase() === rawQuestion.correctAnswer.trim().toLowerCase()
    );
  }

  if (correctOptionIndex < 0 || correctOptionIndex > 3) {
    throw new Error(`Question ${index + 1} has an invalid correct answer index.`);
  }

  const category = rawQuestion.category || rawQuestion.topic;
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error(
      `Question ${index + 1} has invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}.`
    );
  }

  const difficulty = rawQuestion.difficulty || "Medium";
  if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
    throw new Error(
      `Question ${index + 1} has invalid difficulty. Allowed: ${ALLOWED_DIFFICULTIES.join(", ")}.`
    );
  }

  return {
    prompt: prompt.trim(),
    options: options.map((option) => option.trim()),
    correctOptionIndex,
    category,
    difficulty,
    explanation: rawQuestion.explanation ? String(rawQuestion.explanation) : "",
  };
};

const parseExamPayload = (payload, instructorId) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid exam payload supplied.");
  }

  const {
    title,
    company,
    type = "PLACEMENT_QUIZ",
    description = "",
    duration,
    maxViolations = 3,
    passingPercentage = 60,
    instructions,
    questions,
  } = payload;

  if (!title || !duration || !questions) {
    throw new Error("Exam payload must include title, duration, and questions.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Exam must contain at least one question.");
  }

  if (Number(duration) <= 0) {
    throw new Error("Exam duration must be greater than zero.");
  }

  if (Number(maxViolations) < 1) {
    throw new Error("Max violations must be at least 1.");
  }

  const parsedQuestions = questions.map((question, index) =>
    normaliseQuestion(question, index)
  );

  const derivedInstructions = Array.isArray(instructions)
    ? instructions
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
    : [
        "Do not switch windows or tabs during the exam.",
        "All activity is monitored and logged.",
        "The exam will auto-submit when time expires or violations exceed the limit.",
      ];

  return {
    title: String(title).trim(),
    company: company ? String(company).trim() : "Placement Ready",
    type,
    description: String(description),
    duration: Number(duration),
    maxViolations: Number(maxViolations) || 3,
    passingPercentage: Number(passingPercentage) || 60,
    instructions: derivedInstructions,
    questions: parsedQuestions,
    instructor: instructorId,
  };
};

router.post(
  "/upload-exam",
  authMiddleware,
  requireRole("admin"),
  upload.single("examFile"),
  async (req, res) => {
    try {
      let payload;

      if (req.file) {
        payload = JSON.parse(req.file.buffer.toString("utf8"));
      } else if (req.body && Object.keys(req.body).length) {
        payload = typeof req.body.exam === "string" ? JSON.parse(req.body.exam) : req.body;
      } else {
        return res.status(400).json({ error: "No exam data provided." });
      }

      const examData = parseExamPayload(payload, req.userId);
      const exam = await Exam.create(examData);

      res.status(201).json({
        message: "Exam uploaded successfully",
        exam: sanitizeExamMeta(exam),
      });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to upload exam." });
    }
  }
);

router.patch(
  "/toggle-exam",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { examId, isActive, maxViolations } = req.body;

      if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
        return res.status(400).json({ error: "Invalid exam id." });
      }

      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ error: "Exam not found." });
      }

      if (typeof isActive === "boolean") {
        exam.isActive = isActive;
      } else {
        exam.isActive = !exam.isActive;
      }

      if (maxViolations !== undefined) {
        exam.maxViolations = Number(maxViolations) || exam.maxViolations;
      }

      await exam.save();

      res.json({
        message: "Exam status updated",
        exam: sanitizeExamMeta(exam),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update exam status." });
    }
  }
);

module.exports = router;
