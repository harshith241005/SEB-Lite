const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const Exam = require("../models/Exam");
const Answer = require("../models/Answer");
const multer = require('multer');
const router = express.Router();

// Configure multer for file uploads (JSON import)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

// Get all exams
router.get("/", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    let exams = await db.findExams({ isActive: true });

    // If user is logged in, check if they've completed exams
    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        const Answer = require("../models/Answer");
        
        // Get all answers for this user
        const userAnswers = await Answer.find({ studentId: decoded.userId });
        const completedExamIds = new Set(userAnswers.map(a => a.examId.toString()));

        // Enrich exams with completion status
        exams = exams.map(exam => {
          const examObj = exam.toObject ? exam.toObject() : exam;
          return {
            ...examObj,
            hasCompleted: completedExamIds.has(examObj._id.toString()),
            canTake: !completedExamIds.has(examObj._id.toString()) && 
                     (!examObj.startDate || new Date(examObj.startDate) <= new Date()) &&
                     (!examObj.endDate || new Date(examObj.endDate) >= new Date())
          };
        });
      } catch (err) {
        // If token is invalid, just return exams without completion status
      }
    }

    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active exam (first active exam found)
router.get("/active", async (req, res) => {
  try {
    const exam = await db.findExam({ isActive: true });
    if (!exam) {
      return res.status(404).json({ message: "No active exam found" });
    }
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available exams (simplified version for dashboard)
router.get("/available", async (req, res) => {
  try {
    const exams = await Exam.find({ isActive: true }).select(
      "_id title company type duration"
    );
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single exam
router.get("/:id", async (req, res) => {
  try {
    const exam = await db.findExam({ _id: req.params.id });
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Quiz by ID (Start Exam)
router.get("/:id/start", authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Check if exam is active
    if (!exam.isActive) {
      return res.status(403).json({ error: "This exam is not currently available" });
    }

    // Check if user has already submitted this exam (prevent re-attempts)
    const existingSubmission = await Answer.findOne({
      studentId: req.userId,
      examId: req.params.id
    });

    if (existingSubmission) {
      return res.status(403).json({ error: "You have already attempted this exam" });
    }

    // Remove correct answers from questions before sending to frontend
    const examObj = exam.toObject();
    examObj.questions = examObj.questions.map((q, index) => ({
      questionId: index,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty,
      questionType: 'mcq'
    }));

    // Return exam data for starting (without correct answers)
    res.json(examObj);
  } catch (error) {
    console.error("Start exam error:", error);
    res.status(500).json({ error: "Failed to start exam. Please try again." });
  }
});

// Import exam from JSON (instructor only)
router.post("/import", authMiddleware, upload.single('examFile'), async (req, res) => {
  try {
    if (req.role !== "instructor" && req.role !== "admin") {
      return res.status(403).json({ error: "Only instructors can import exams" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let examData;
    try {
      examData = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid JSON file format" });
    }

    // Validate exam data structure
    if (!examData.title || !examData.duration || !examData.questions || !Array.isArray(examData.questions)) {
      return res.status(400).json({ error: "Invalid exam format. Required: title, duration, questions array" });
    }

    // Format questions to match schema
    const formattedQuestions = examData.questions.map((q, index) => {
      // Support both formats: {question, options, correct} and {questionText, options, correctAnswer}
      const questionText = q.question || q.questionText || q.text;
      const options = q.options || [];
      const correctAnswer = q.correct !== undefined 
        ? options[q.correct] 
        : (q.correctAnswer || q.correct);

      return {
        questionId: q.questionId || `q${index + 1}`,
        questionText: questionText,
        questionType: q.questionType || "mcq",
        options: options,
        correctAnswer: correctAnswer,
        marks: q.marks || 1,
        explanation: q.explanation || ""
      };
    });

    const exam = await db.createExam({
      title: examData.title,
      description: examData.description || "",
      duration: parseInt(examData.duration),
      totalQuestions: formattedQuestions.length,
      passingPercentage: examData.passingPercentage || 60,
      questions: formattedQuestions,
      instructor: req.userId,
      startDate: examData.startDate ? new Date(examData.startDate) : new Date(),
      endDate: examData.endDate ? new Date(examData.endDate) : null,
      isActive: examData.isActive !== undefined ? examData.isActive : true,
      proctoring: {
        enabled: examData.proctoring?.enabled !== undefined ? examData.proctoring.enabled : true,
        recordWebcam: examData.proctoring?.recordWebcam || false,
        allowTabSwitch: examData.proctoring?.allowTabSwitch || false,
        maxAttempts: examData.proctoring?.maxAttempts || 1,
        maxViolations: examData.proctoring?.maxViolations || 5
      }
    });

    res.status(201).json({
      message: "Exam imported successfully",
      exam: exam
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create exam (instructor only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.role !== "instructor" && req.role !== "admin") {
      return res.status(403).json({ error: "Only instructors can create exams" });
    }

    const {
      title,
      description,
      duration,
      passingPercentage,
      questions,
      startTime,
      endTime,
      instructions,
      course,
      subject,
      maxViolations
    } = req.body;

    // Validate required fields
    if (!title || !duration || !questions || questions.length === 0) {
      return res.status(400).json({ error: "Title, duration, and at least one question are required" });
    }

    // Map questions to match schema
    const formattedQuestions = questions.map((q, index) => ({
      questionId: q.questionId || `q${index + 1}`,
      questionText: q.questionText,
      questionType: q.questionType || "mcq",
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      marks: q.marks || 1,
      explanation: q.explanation || ""
    }));

    const examData = {
      title,
      description: description || "",
      duration: parseInt(duration),
      totalQuestions: questions.length,
      passingPercentage: passingPercentage || 60,
      questions: formattedQuestions,
      instructor: req.userId,
      startDate: startTime ? new Date(startTime) : new Date(),
      endDate: endTime ? new Date(endTime) : null,
      isActive: true,
      proctoring: {
        enabled: true,
        recordWebcam: false,
        allowTabSwitch: false,
        maxAttempts: 1,
        maxViolations: maxViolations || 5
      }
    };

    const exam = await db.createExam(examData);
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update exam (instructor only) - for activation/deactivation
router.patch("/:id/toggle", authMiddleware, async (req, res) => {
  try {
    if (req.role !== "instructor" && req.role !== "admin") {
      return res.status(403).json({ error: "Only instructors or admins can update exams" });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Check if instructor owns this exam or is admin
    if (exam.instructor.toString() !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this exam" });
    }

    // Toggle isActive status
    exam.isActive = !exam.isActive;
    await exam.save();

    res.json({
      message: `Exam ${exam.isActive ? 'activated' : 'deactivated'} successfully`,
      exam: {
        id: exam._id,
        title: exam.title,
        isActive: exam.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update exam (instructor only) - for activation/deactivation
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.role !== "instructor" && req.role !== "admin") {
      return res.status(403).json({ error: "Only instructors can update exams" });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Check if instructor owns this exam
    if (exam.instructor.toString() !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this exam" });
    }

    const { isActive, maxViolations, duration, passingPercentage } = req.body;

    if (isActive !== undefined) exam.isActive = isActive;
    if (maxViolations !== undefined) exam.proctoring.maxViolations = maxViolations;
    if (duration !== undefined) exam.duration = duration;
    if (passingPercentage !== undefined) exam.passingPercentage = passingPercentage;

    await exam.save();

    res.json({
      message: "Exam updated successfully",
      exam: exam
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin upload exam endpoint (supports both JSON file and JSON body)
router.post("/admin/upload", authMiddleware, upload.single('examFile'), async (req, res) => {
  try {
    if (req.role !== "instructor" && req.role !== "admin") {
      return res.status(403).json({ error: "Only instructors or admins can upload exams" });
    }

    let examData;

    // Check if file was uploaded
    if (req.file) {
      try {
        examData = JSON.parse(req.file.buffer.toString('utf8'));
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid JSON file format" });
      }
    } else if (req.body) {
      // If no file, check if JSON data was sent in the body
      examData = req.body;
    } else {
      return res.status(400).json({ error: "No exam data provided" });
    }

    // Validate exam data structure
    if (!examData.title || !examData.duration || !examData.questions || !Array.isArray(examData.questions)) {
      return res.status(400).json({ 
        error: "Invalid exam format. Required: title, duration, questions array" 
      });
    }

    // Create the exam
    const exam = new Exam({
      title: examData.title,
      company: examData.company || 'Unknown',
      type: examData.type || 'PLACEMENT_QUIZ',
      duration: parseInt(examData.duration),
      maxViolations: examData.maxViolations || 5,
      isActive: examData.isActive !== undefined ? examData.isActive : true,
      questions: examData.questions,
      instructor: req.userId
    });

    await exam.save();

    res.status(201).json({
      message: "Exam uploaded successfully",
      exam: {
        id: exam._id,
        title: exam.title,
        company: exam.company,
        type: exam.type,
        duration: exam.duration,
        questionCount: exam.questions.length,
        isActive: exam.isActive
      }
    });
  } catch (error) {
    console.error("Upload exam error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Submit exam answers
router.post("/:examId/submit", authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Check if exam is active
    if (!exam.isActive) {
      return res.status(400).json({ error: "This exam is not currently active" });
    }

    // Calculate score
    let correctAnswers = 0;
    const evaluatedAnswers = answers.map((ans) => {
      const questionIndex = parseInt(ans.questionId);
      const question = exam.questions[questionIndex];
      
      if (question) {
        // Compare the answer (option text) with the correct option
        const correctOption = question.options[question.correct];
        const isCorrect = ans.answer === correctOption;
        if (isCorrect) correctAnswers++;
      }
      
      return ans;
    });

    const score = (correctAnswers / exam.questions.length) * 100;

    // Check if student already submitted
    const existingSubmission = await Answer.findOne({
      studentId: req.userId,
      examId,
    });

    if (existingSubmission) {
      return res.status(400).json({ error: "Exam already submitted" });
    }

    const submission = new Answer({
      studentId: req.userId,
      examId,
      answers: evaluatedAnswers,
      score,
      totalQuestions: exam.questions.length,
      correctAnswers,
      submittedAt: new Date(),
    });

    await submission.save();

    res.status(201).json({
      message: "Exam submitted successfully",
      submission: {
        id: submission._id,
        score,
        totalQuestions: exam.questions.length,
        correctAnswers,
        submittedAt: submission.submittedAt,
      },
      score,
      passed: score >= exam.passingPercentage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get exam results
router.get("/:examId/results", authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;

    const result = await Answer.findOne({
      examId,
      studentId: req.userId,
    }).populate('examId', 'title passingPercentage');

    if (!result) {
      return res.status(404).json({ error: "No submission found for this exam" });
    }

    const exam = await Exam.findById(examId);
    const passed = result.score >= (exam?.passingPercentage || 60);

    res.json({
      ...result.toObject(),
      passed,
      grade: result.score >= 90 ? 'A' : 
             result.score >= 80 ? 'B' : 
             result.score >= 70 ? 'C' : 
             result.score >= 60 ? 'D' : 'F',
      timeTaken: result.submittedAt && result.createdAt ? 
                 Math.floor((new Date(result.submittedAt) - new Date(result.createdAt)) / 1000) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit exam answers
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { examId, answers } = req.body;

    if (!examId || !answers) {
      return res.status(400).json({ error: "Exam ID and answers are required" });
    }

    // Get the exam to calculate score
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = exam.questions.length;

    exam.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correct) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Save or update answer
    const existingAnswer = await Answer.findOne({
      examId,
      studentId: req.userId
    });

    if (existingAnswer) {
      // Update existing submission
      existingAnswer.answers = answers;
      existingAnswer.score = score;
      existingAnswer.submittedAt = new Date();
      await existingAnswer.save();
    } else {
      // Create new submission
      const answer = new Answer({
        examId,
        studentId: req.userId,
        answers,
        score,
        submittedAt: new Date()
      });
      await answer.save();
    }

    res.json({
      message: "Exam submitted successfully",
      score,
      correctAnswers,
      totalQuestions,
      passed: score >= (exam.passingPercentage || 60)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
