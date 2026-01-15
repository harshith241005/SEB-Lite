const mongoose = require("mongoose");

const answerDetailSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedOption: {
      type: Number,
      min: 0,
      max: 3,
      default: null,
    },
    timeSpent: {
      type: Number,
      min: 0,
      default: 0,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["in-progress", "submitted", "auto-submitted"],
      default: "in-progress",
      index: true,
    },
    answers: {
      type: [answerDetailSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: Date,
    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
    timeRemaining: {
      type: Number,
      default: null,
    },
    durationUsed: {
      type: Number,
      default: 0,
    },
    violationsCount: {
      type: Number,
      default: 0,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    autoSubmitReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

answerSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model("Answer", answerSchema);
