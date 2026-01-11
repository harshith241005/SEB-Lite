const { verifyAccessToken } = require("../utils/tokenUtils");
const Token = require("../models/Token");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Check if token is blacklisted
    const blacklistedToken = await Token.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    // Verify token
    const verified = verifyAccessToken(token);
    
    // Check token type
    if (verified.type !== "access") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    req.userId = verified.userId;
    req.email = verified.email;
    req.role = verified.role;
    req.user = { id: verified.userId, email: verified.email, role: verified.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired. Please refresh your token." });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token." });
    } else {
      return res.status(401).json({ error: "Token verification failed." });
    }
  }
};

module.exports = authMiddleware;
