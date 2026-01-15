require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const examRoutes = require("./routes/exam");
const violationRoutes = require("./routes/violation");
const answerRoutes = require("./routes/answer");
const adminRoutes = require("./routes/admin");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// Global database mode flag
// global.useMockDB = true; // Force mock DB for testing - commented out to use real MongoDB

// Connect to database
connectDB();

// Middleware
app.use(cors());
console.log("✅ CORS middleware added");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("✅ Body parsing middleware added");

// Rate limiting for API surface
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
console.log("✅ Auth routes mounted");

app.use("/api/exam", examRoutes);
console.log("✅ Exam routes mounted");

app.use("/api/violation", violationRoutes);
console.log("✅ Violation routes mounted");

app.use("/api/answer", answerRoutes);
console.log("✅ Answer routes mounted");

app.use("/api/admin", adminRoutes);
console.log("✅ Admin routes mounted");

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});
console.log("✅ Health check endpoint added");

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5001;
console.log(`🔍 Attempting to listen on port: ${PORT}`);

app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error(`❌ Failed to start server on port ${PORT}:`, err);
});

module.exports = app;
