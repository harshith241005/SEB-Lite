const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    answers: [
      {
        questionId: String,
        answer: String,
        timeSpent: Number,
      },
    ],
    score: Number,
    totalQuestions: Number,
    correctAnswers: Number,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Answer", answerSchema);
