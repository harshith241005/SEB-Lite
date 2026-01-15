const mongoose = require("mongoose");

const ALLOWED_CATEGORIES = ["Java", "DSA", "DBMS", "OS", "SQL"];
const ALLOWED_DIFFICULTIES = ["Easy", "Medium", "Hard"];

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
          return Array.isArray(value) && value.length === 4;
        },
        message: "Each question must define exactly 4 options.",
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    category: {
      type: String,
      enum: ALLOWED_CATEGORIES,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ALLOWED_DIFFICULTIES,
      required: true,
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
      required: true,
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
      required: true,
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
  },
  { timestamps: true }
);

examSchema.index({ title: 1, company: 1 });
examSchema.index({ instructor: 1 });

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
module.exports.ALLOWED_CATEGORIES = ALLOWED_CATEGORIES;
module.exports.ALLOWED_DIFFICULTIES = ALLOWED_DIFFICULTIES;
