const mongoose = require("mongoose");

// Token blacklist for revoked tokens
const tokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["access", "refresh"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired tokens
    },
    reason: {
      type: String,
      enum: ["logout", "refresh", "security", "expired"],
      default: "logout",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster lookups
tokenSchema.index({ token: 1, userId: 1 });

module.exports = mongoose.model("Token", tokenSchema);
