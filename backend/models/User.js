const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function() {
        // Password is required only if not using OAuth
        return !this.googleId;
      },
    },
    // Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values without unique constraint violation
    },
    avatar: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    department: String,
    enrolledExams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
    lastFlaggedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Skip if password is not modified or if using OAuth (no password)
  if (!this.isModified("password") || !this.password) return next();
  
  // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Find or create user from Google OAuth
userSchema.statics.findOrCreateGoogleUser = async function (profile) {
  let user = await this.findOne({ googleId: profile.id });
  
  if (user) {
    // Update user info from Google
    user.name = profile.displayName || user.name;
    user.avatar = profile.photos?.[0]?.value || user.avatar;
    await user.save();
    return user;
  }
  
  // Check if user with same email exists
  user = await this.findOne({ email: profile.emails[0].value.toLowerCase() });
  
  if (user) {
    // Link Google account to existing user
    user.googleId = profile.id;
    user.avatar = profile.photos?.[0]?.value || user.avatar;
    user.authProvider = "google";
    await user.save();
    return user;
  }
  
  // Create new user
  user = await this.create({
    googleId: profile.id,
    email: profile.emails[0].value.toLowerCase(),
    name: profile.displayName,
    avatar: profile.photos?.[0]?.value,
    authProvider: "google",
    role: "student", // Default role for new Google users
  });
  
  return user;
};

module.exports = mongoose.model("User", userSchema);
