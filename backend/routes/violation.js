const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Violation = require('../models/Violation');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT token (simplified version)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    const user = await User.findById(decoded.userId);

    if (!user || (user.isActive === false)) {
      return res.status(401).json({ error: 'Invalid token or user deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is instructor or admin
const requireInstructor = (req, res, next) => {
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Instructor or admin access required' });
  }
  next();
};

// @route   POST /api/violation
// @desc    Log a security violation
// @access  Private
router.post('/', [
  authenticateToken,
  body('examId')
    .optional()
    .isMongoId()
    .withMessage('Invalid exam ID'),
  body('violationType')
    .isIn(['window_switch', 'tab_switch', 'copy_paste', 'right_click', 'dev_tools', 'fullscreen_exit', 'multiple_monitors', 'suspicious_process', 'network_block', 'time_manipulation'])
    .withMessage('Invalid violation type'),
  body('description')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  body('evidence')
    .optional()
    .isObject()
    .withMessage('Evidence must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { examId, violationType, description, evidence, timestamp } = req.body;

    // Create violation record
    const violation = new Violation({
      studentId: req.user._id,
      examId: examId || null,
      violationType: violationType,
      description: description,
      evidence: evidence || {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      sessionId: req.headers['x-session-id'] || 'unknown',
      metadata: {
        userAgent: req.get('User-Agent'),
        ...evidence
      }
    });

    await violation.save();

    // Check for auto-submit if max violations exceeded
    if (examId) {
      const Exam = require('../models/Exam');
      const Answer = require('../models/Answer');
      
      const exam = await Exam.findById(examId);
      if (exam && exam.maxViolations) {
        const violationCount = await Violation.countDocuments({
          studentId: req.user._id,
          examId: examId
        });

        if (violationCount >= exam.maxViolations) {
          // Check if already submitted
          const existingSubmission = await Answer.findOne({
            studentId: req.user._id,
            examId: examId
          });

          if (!existingSubmission) {
            // Auto-submit with zero score
            const autoSubmission = new Answer({
              studentId: req.user._id,
              examId: examId,
              answers: [], // No answers provided
              score: 0,
              totalQuestions: exam.questions.length,
              correctAnswers: 0,
              submittedAt: new Date(),
              autoSubmitted: true,
              reason: 'Max violations exceeded'
            });

            await autoSubmission.save();
            console.log(`Auto-submitted exam ${examId} for student ${req.user._id} due to max violations`);
          }
        }
      }
    }

    // Check if student should be flagged for review
    const recentViolations = await Violation.countDocuments({
      studentId: req.user._id,
      examId: examId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (recentViolations >= 5) {
      // Flag student for review
      await User.findByIdAndUpdate(req.user._id, {
        flaggedForReview: true,
        lastFlaggedAt: new Date()
      });
    }

    res.status(201).json({
      message: 'Violation logged successfully',
      violation: {
        id: violation._id,
        type: violation.violationType,
        severity: violation.severity,
        timestamp: violation.timestamp
      }
    });

  } catch (error) {
    console.error('Log violation error:', error);
    res.status(500).json({ error: 'Server error logging violation' });
  }
});

// @route   GET /api/violation
// @desc    Get violations (filtered by user role)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { examId, studentId, violationType, severity, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      // Students can only see their own violations
      filter.studentId = req.user._id;
    } else if (req.user.role === 'instructor') {
      // Instructors can see violations for exams they created
      if (examId) {
        filter.examId = examId;
      } else {
        // Get exams created by this instructor
        const Exam = require('../models/Exam');
        const instructorExams = await Exam.find({ instructor: req.user._id }).select('_id');
        filter.examId = { $in: instructorExams.map(exam => exam._id) };
      }
    }
    // Admins can see all violations

    // Additional filters
    if (examId && req.user.role !== 'student') {
      filter.examId = examId;
    }
    if (studentId && req.user.role !== 'student') {
      filter.studentId = studentId;
    }
    if (violationType) {
      filter.violationType = violationType;
    }
    if (severity) {
      filter.severity = severity;
    }

    const violations = await Violation.find(filter)
      .populate('studentId', 'name email rollNumber')
      .populate('examId', 'title')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Violation.countDocuments(filter);

    res.json({
      violations: violations.map(v => ({
        id: v._id,
        student: v.studentId,
        exam: v.examId,
        violationType: v.violationType,
        description: v.description,
        severity: v.severity,
        evidence: v.evidence,
        timestamp: v.timestamp,
        reviewed: v.reviewed,
        reviewedBy: v.reviewedBy,
        reviewNotes: v.reviewNotes,
        ipAddress: v.ipAddress,
        sessionId: v.sessionId
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get violations error:', error);
    res.status(500).json({ error: 'Server error fetching violations' });
  }
});

// @route   GET /api/violation/stats
// @desc    Get violation statistics
// @access  Private (Instructor/Admin only)
router.get('/stats', [authenticateToken, requireInstructor], async (req, res) => {
  try {
    const { examId, timeframe = '24h' } = req.query;

    // Calculate time range
    let startDate;
    switch (timeframe) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    let matchFilter = { timestamp: { $gte: startDate } };

    if (examId) {
      matchFilter.examId = require('mongoose').Types.ObjectId(examId);
    } else if (req.user.role === 'instructor') {
      // Filter by instructor's exams
      const Exam = require('../models/Exam');
      const instructorExams = await Exam.find({ instructor: req.user._id }).select('_id');
      matchFilter.examId = { $in: instructorExams.map(exam => exam._id) };
    }

    const stats = await Violation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            violationType: '$violationType',
            severity: '$severity'
          },
          count: { $sum: 1 },
          students: { $addToSet: '$studentId' }
        }
      },
      {
        $group: {
          _id: '$_id.severity',
          violations: {
            $push: {
              type: '$_id.violationType',
              count: '$count',
              uniqueStudents: { $size: '$students' }
            }
          },
          totalCount: { $sum: '$count' },
          totalStudents: { $addToSet: '$students' }
        }
      },
      {
        $project: {
          severity: '$_id',
          violations: 1,
          totalCount: 1,
          totalStudents: { $size: { $reduce: { input: '$totalStudents', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } } }
        }
      }
    ]);

    // Get top violating students
    const topViolators = await Violation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$studentId',
          violationCount: { $sum: 1 },
          lastViolation: { $max: '$timestamp' },
          violationTypes: { $addToSet: '$violationType' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: '$_id',
          name: '$student.name',
          email: '$student.email',
          rollNumber: '$student.rollNumber',
          violationCount: 1,
          lastViolation: 1,
          violationTypes: 1
        }
      },
      { $sort: { violationCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      timeframe,
      stats,
      topViolators
    });

  } catch (error) {
    console.error('Get violation stats error:', error);
    res.status(500).json({ error: 'Server error fetching violation statistics' });
  }
});

// @route   PUT /api/violation/:id/review
// @desc    Review and update violation status
// @access  Private (Instructor/Admin only)
router.put('/:id/review', [
  authenticateToken,
  requireInstructor,
  param('id').isMongoId().withMessage('Invalid violation ID'),
  body('reviewed')
    .isBoolean()
    .withMessage('Reviewed status must be boolean'),
  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { reviewed, reviewNotes } = req.body;

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    // Check if instructor can review this violation
    if (req.user.role === 'instructor') {
      const Exam = require('../models/Exam');
      const exam = await Exam.findById(violation.examId);
      if (!exam || exam.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to review this violation' });
      }
    }

    violation.reviewed = reviewed;
    violation.reviewedBy = req.user._id;
    violation.reviewNotes = reviewNotes;
    violation.reviewedAt = new Date();

    await violation.save();

    res.json({
      message: 'Violation review updated successfully',
      violation: {
        id: violation._id,
        reviewed: violation.reviewed,
        reviewedBy: violation.reviewedBy,
        reviewNotes: violation.reviewNotes,
        reviewedAt: violation.reviewedAt
      }
    });

  } catch (error) {
    console.error('Review violation error:', error);
    res.status(500).json({ error: 'Server error updating violation review' });
  }
});

// @route   DELETE /api/violation/:id
// @desc    Delete violation (Admin only)
// @access  Private (Admin only)
router.delete('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid violation ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid violation ID' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const violation = await Violation.findByIdAndDelete(req.params.id);

    if (!violation) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    res.json({ message: 'Violation deleted successfully' });

  } catch (error) {
    console.error('Delete violation error:', error);
    res.status(500).json({ error: 'Server error deleting violation' });
  }
});

module.exports = router;
