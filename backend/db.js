// Database Abstraction Layer
// Supports both MongoDB and in-memory mock database

const User = require('./models/User');
const Exam = require('./models/Exam');
const Answer = require('./models/Answer');
const Violation = require('./models/Violation');
const mockDB = require('./mock-db');

class Database {
  constructor() {
    this.isMock = global.useMockDB || false;
  }

  // User operations
  async createUser(userData) {
    if (this.isMock) {
      return await mockDB.createUser(userData);
    }
    const user = new User(userData);
    return await user.save();
  }

  async findUser(query) {
    if (this.isMock) {
      return await mockDB.findUser(query);
    }
    return await User.findOne(query);
  }

  async findUsers(query = {}) {
    if (this.isMock) {
      return await mockDB.findUsers(query);
    }
    return await User.find(query);
  }

  // Exam operations
  async createExam(examData) {
    if (this.isMock) {
      return await mockDB.createExam(examData);
    }
    const exam = new Exam(examData);
    return await exam.save();
  }

  async findExam(query) {
    if (this.isMock) {
      return await mockDB.findExam(query);
    }
    return await Exam.findOne(query);
  }

  async findExams(query = {}) {
    if (this.isMock) {
      return await mockDB.findExams(query);
    }
    return await Exam.find(query).populate('instructor', 'name email');
  }

  async updateExam(id, updateData) {
    if (this.isMock) {
      return await mockDB.updateExam(id, updateData);
    }
    return await Exam.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteExam(id) {
    if (this.isMock) {
      return await mockDB.deleteExam(id);
    }
    return await Exam.findByIdAndDelete(id);
  }

  // Answer operations
  async createAnswer(answerData) {
    if (this.isMock) {
      return await mockDB.createAnswer(answerData);
    }
    const answer = new Answer(answerData);
    return await answer.save();
  }

  async findAnswer(query) {
    if (this.isMock) {
      return await mockDB.findAnswer(query);
    }
    return await Answer.findOne(query);
  }

  async findAnswers(query = {}) {
    if (this.isMock) {
      return await mockDB.findAnswers(query);
    }
    return await Answer.find(query).populate('studentId', 'name email').populate('examId', 'title');
  }

  // Violation operations
  async createViolation(violationData) {
    if (this.isMock) {
      return await mockDB.createViolation(violationData);
    }
    const violation = new Violation(violationData);
    return await violation.save();
  }

  async findViolations(query = {}) {
    if (this.isMock) {
      return await mockDB.findViolations(query);
    }
    return await Violation.find(query).populate('studentId', 'name email').populate('examId', 'title');
  }

  // Statistics
  async getStats() {
    if (this.isMock) {
      return mockDB.getStats();
    }
    const [userCount, examCount, answerCount, violationCount] = await Promise.all([
      User.countDocuments(),
      Exam.countDocuments(),
      Answer.countDocuments(),
      Violation.countDocuments()
    ]);

    return {
      users: userCount,
      exams: examCount,
      answers: answerCount,
      violations: violationCount
    };
  }
}

module.exports = new Database();