const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenUtils");
const Token = require("../models/Token");
const Session = require("../models/Session");
const User = require("../models/User");
const router = express.Router();

// Helper function to get device info
const getDeviceInfo = (req) => {
  return {
    userAgent: req.get("user-agent") || "Unknown",
    ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
    platform: req.get("sec-ch-ua-platform") || "Unknown",
  };
};

// Helper function to create session and return tokens
const createSessionAndTokens = async (user, req) => {
  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Create session
  const deviceInfo = getDeviceInfo(req);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for refresh token

  await Session.create({
    userId: user._id,
    refreshToken,
    deviceInfo,
    expiresAt,
    isActive: true,
  });

  return { accessToken, refreshToken };
};

// Register
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await db.findUser({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create user - User model's pre-save hook will hash the password
    const user = await db.createUser({
      name,
      email: email.toLowerCase(),
      password: password,
      role: role || "student",
      authProvider: "local",
    });

    // Generate tokens and create session
    const { accessToken, refreshToken } = await createSessionAndTokens(user, req);

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await db.findUser({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // Check if user signed up with Google (no password)
    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({ 
        error: "This account uses Google Sign-In. Please use the Google login button." 
      });
    }

    // Compare password using the model method or bcrypt directly
    let isPasswordCorrect = false;
    if (user.comparePassword) {
      isPasswordCorrect = await user.comparePassword(password);
    } else {
      isPasswordCorrect = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordCorrect) {
      console.log("Password comparison failed for user:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Deactivate all other active sessions for this user
    await Session.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    // Generate tokens and create session
    const { accessToken, refreshToken } = await createSessionAndTokens(user, req);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

// Google OAuth - Exchange Google token for app tokens
router.post("/google", async (req, res) => {
  try {
    const { credential, clientId } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: "Google credential is required" });
    }

    // Decode the Google JWT token (the credential from Google One Tap)
    const { OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error("Google token verification failed:", verifyError);
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // Check if user with same email exists
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        if (!user.authProvider || user.authProvider === "local") {
          user.authProvider = "google";
        }
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          googleId,
          email: email.toLowerCase(),
          name,
          avatar: picture,
          authProvider: "google",
          role: "student",
        });
      }
    } else {
      // Update user info from Google
      user.name = name || user.name;
      user.avatar = picture || user.avatar;
      await user.save();
    }

    // Deactivate all other active sessions
    await Session.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    // Generate tokens and create session
    const { accessToken, refreshToken } = await createSessionAndTokens(user, req);

    res.json({
      message: "Google login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token is blacklisted
    const blacklistedToken = await Token.findOne({ token: refreshToken });
    if (blacklistedToken) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    // Check if session exists and is active
    const session = await Session.findOne({
      refreshToken,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Get user
    const user = await db.findUser({ _id: decoded.userId });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Blacklist old refresh token and update session
    const expiresAt = new Date(decoded.exp * 1000);
    await Token.create({
      token: refreshToken,
      userId: user._id,
      type: "refresh",
      expiresAt,
      reason: "refresh",
    });

    // Update session with new refresh token
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    session.refreshToken = newRefreshToken;
    session.expiresAt = newExpiresAt;
    session.lastActivity = new Date();
    await session.save();

    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// Logout endpoint
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const { refreshToken } = req.body;

    // Blacklist tokens and deactivate session
    if (token) {
      // Blacklist access token
      const decoded = require("../utils/tokenUtils").decodeToken(token);
      if (decoded) {
        const expiresAt = new Date(decoded.exp * 1000);
        await Token.create({
          token,
          userId: req.userId,
          type: "access",
          expiresAt,
          reason: "logout",
        });
      }
    }

    if (refreshToken) {
      // Blacklist refresh token
      const decoded = require("../utils/tokenUtils").decodeToken(refreshToken);
      if (decoded) {
        const expiresAt = new Date(decoded.exp * 1000);
        await Token.create({
          token: refreshToken,
          userId: req.userId,
          type: "refresh",
          expiresAt,
          reason: "logout",
        });

        // Deactivate session
        await Session.updateOne(
          { refreshToken },
          { isActive: false }
        );
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get User Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await db.findUser({ _id: req.userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrolledExams: user.enrolledExams || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active sessions for current user
router.get("/sessions", authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.userId,
      isActive: true,
    })
      .select("-refreshToken")
      .sort({ lastActivity: -1 })
      .limit(10);

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revoke a specific session
router.delete("/sessions/:sessionId", authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      userId: req.userId,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Blacklist refresh token
    const decoded = require("../utils/tokenUtils").decodeToken(session.refreshToken);
    if (decoded) {
      const expiresAt = new Date(decoded.exp * 1000);
      await Token.create({
        token: session.refreshToken,
        userId: req.userId,
        type: "refresh",
        expiresAt,
        reason: "security",
      });
    }

    // Deactivate session
    session.isActive = false;
    await session.save();

    res.json({ message: "Session revoked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
