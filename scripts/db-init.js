#!/usr/bin/env node
/**
 * Database Connection Test & Initialization
 * This script tests MongoDB connection and initializes sample data
 */

const mongoose = require("mongoose");
const User = require("../backend/models/User");
const Exam = require("../backend/models/Exam");
const Answer = require("../backend/models/Answer");
const Violation = require("../backend/models/Violation");

require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/seb-lite";

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║   🗄️  DATABASE CONNECTION TEST & INITIALIZATION             ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

async function testDatabaseConnection() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    console.log(`   URI: ${MONGODB_URI}\n`);

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected successfully!\n");

    // Test database access
    await testDatabase();
    
    // Initialize sample data
    await initializeSampleData();

    console.log("\n✅ Database setup complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(`   Error: ${error.message}\n`);
    console.error("📝 Troubleshooting:");
    console.error("   1. Ensure MongoDB is running (mongod in separate terminal)");
    console.error("   2. Check MongoDB URI in .env file");
    console.error("   3. Verify port 27017 is accessible\n");
    process.exit(1);
  }
}

async function testDatabase() {
  try {
    console.log("📋 Testing database collections...\n");

    // Get database stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections in database: ${collections.length}`);
    collections.forEach((col) => console.log(`   • ${col.name}`));

    // Count documents in each collection
    console.log("\n📊 Document counts:");
    const userCount = await User.countDocuments();
    const examCount = await Exam.countDocuments();
    const answerCount = await Answer.countDocuments();
    const violationCount = await Violation.countDocuments();

    console.log(`   Users: ${userCount}`);
    console.log(`   Exams: ${examCount}`);
    console.log(`   Answers: ${answerCount}`);
    console.log(`   Violations: ${violationCount}\n`);
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
  }
}

async function initializeSampleData() {
  try {
    console.log("🌱 Initializing sample data...\n");

    // Check if sample data exists
    const existingUser = await User.findOne({ email: "instructor@seb-lite.com" });
    if (existingUser) {
      console.log("   ℹ️  Sample data already exists. Skipping initialization.\n");
      return;
    }

    // Create sample instructor
    console.log("   Creating sample instructor...");
    const instructor = await User.create({
      name: "Prof. Sarah Johnson",
      email: "instructor@seb-lite.com",
      password: "instructor123", // Will be hashed by model
      role: "instructor",
    });
    console.log(`   ✓ Instructor created: ${instructor.email}`);

    // Create sample exam
    console.log("   Creating sample exam...");
    const exam = await Exam.create({
      title: "Mathematics 101 Midterm",
      description: "First midterm exam for Mathematics 101",
      duration: 60, // 60 minutes
      totalQuestions: 4,
      instructor: instructor._id,
      passingPercentage: 60,
      questions: [
        {
          questionId: "q1",
          questionText: "What is 2 + 2?",
          questionType: "mcq",
          options: ["3", "4", "5", "6"],
          correctAnswer: "4",
          marks: 25,
        },
        {
          questionId: "q2",
          questionText: "What is the capital of France?",
          questionType: "mcq",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correctAnswer: "Paris",
          marks: 25,
        },
        {
          questionId: "q3",
          questionText: "Explain photosynthesis in 100 words.",
          questionType: "short_answer",
          correctAnswer: "Process by which plants convert light into chemical energy",
          marks: 25,
        },
        {
          questionId: "q4",
          questionText: "Discuss the impact of artificial intelligence on society.",
          questionType: "essay",
          correctAnswer: "AI has transformed industries and society in many ways",
          marks: 25,
        },
      ],
      isActive: true,
    });
    console.log(`   ✓ Exam created: ${exam.title}`);

    // Create sample student
    console.log("   Creating sample student...");
    const student = await User.create({
      name: "John Doe",
      email: "student@seb-lite.com",
      password: "student123", // Will be hashed by model
      role: "student",
      enrolledExams: [exam._id],
    });
    console.log(`   ✓ Student created: ${student.email}`);

    // Create sample answer submission
    console.log("   Creating sample answer submission...");
    const answer = await Answer.create({
      studentId: student._id,
      examId: exam._id,
      answers: [
        { questionId: "q1", answer: "4" },
        { questionId: "q2", answer: "Paris" },
        { questionId: "q3", answer: "Photosynthesis is the process..." },
        { questionId: "q4", answer: "AI has transformed many aspects..." },
      ],
      score: 85,
      correctAnswers: 3,
      totalQuestions: 4,
      submittedAt: new Date(),
    });
    console.log(`   ✓ Answer submission created: ${answer.score}% score`);

    // Create sample violation
    console.log("   Creating sample violation...");
    const violation = await Violation.create({
      studentId: student._id,
      examId: exam._id,
      violationType: "tab_switch",
      severity: "high",
      description: "Student switched to another tab",
      timestamp: new Date(),
      metadata: { tabName: "Google Chrome" },
    });
    console.log(`   ✓ Violation logged: ${violation.violationType}`);

    console.log("\n✅ Sample data created successfully!");
    console.log("\nTest Credentials:");
    console.log(`   Instructor: ${instructor.email} / instructor123`);
    console.log(`   Student: ${student.email} / student123\n`);
  } catch (error) {
    console.error("❌ Sample data initialization failed:", error.message);
  }
}

// Run the test
testDatabaseConnection();
