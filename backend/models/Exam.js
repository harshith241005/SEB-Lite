const mongoose = require("mongoose");

// These are suggested categories but not strictly enforced
const ALLOWED_CATEGORIES = ["Java", "DSA", "DBMS", "OS", "SQL", "Computer Networks", "Python", "JavaScript", "General", "Math", "Science", "Geography", "History", "Literature", "Chemistry", "Physics", "Computer Science"];
const ALLOWED_DIFFICULTIES = ["Easy", "Medium", "Hard", "easy", "medium", "hard"];

const questionSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2 && value.length <= 6;
        },
        message: "Each question must define 2-6 options.",
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    difficulty: {
      type: String,
      default: "Medium",
      trim: true,
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: "General",
      trim: true,
    },
    type: {
      type: String,
      enum: ["PLACEMENT_QUIZ", "PRACTICE_TEST"],
      default: "PLACEMENT_QUIZ",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    maxViolations: {
      type: Number,
      default: 5,
      min: 1,
    },
    passingPercentage: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    instructions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "An exam must contain at least one question.",
      },
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

examSchema.index({ title: 1, company: 1 });
examSchema.index({ instructor: 1 });

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
module.exports.ALLOWED_CATEGORIES = ALLOWED_CATEGORIES;
module.exports.ALLOWED_DIFFICULTIES = ALLOWED_DIFFICULTIES;
