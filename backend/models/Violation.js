const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        "WINDOW_BLUR",
        "SHORTCUT",
        "TAB_SWITCH",
        "COPY_PASTE",
        "RIGHT_CLICK",
        "DEV_TOOLS",
        "FULLSCREEN_EXIT",
        "MULTIPLE_MONITORS",
        "SUSPICIOUS_PROCESS",
        "NETWORK_BLOCK",
        "TIME_MANIPULATION",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    screenshot: String, // URL to screenshot
    metadata: mongoose.Schema.Types.Mixed,
    evidence: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    sessionId: String,
    reviewed: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: String,
    reviewedAt: Date,
  },
  { timestamps: true }
);

// Indexes for performance
violationSchema.index({ studentId: 1, examId: 1 }); // For violations by student per exam
violationSchema.index({ examId: 1, timestamp: 1 }); // For violations during exam timeline
violationSchema.index({ violationType: 1 }); // For filtering by violation type
violationSchema.index({ timestamp: -1 }); // For recent violations

module.exports = mongoose.model("Violation", violationSchema);
