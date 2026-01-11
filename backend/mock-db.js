// Mock Database for Demo Purposes
// This provides in-memory storage when MongoDB is not available

class MockDB {
  constructor() {
    this.users = [];
    this.exams = [];
    this.answers = [];
    this.violations = [];
    this.nextId = 1;
  }

  // User operations
  async createUser(userData) {
    const user = {
      _id: this.nextId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async findUser(query) {
    return this.users.find(user =>
      Object.keys(query).every(key => user[key] === query[key])
    );
  }

  async findUsers(query = {}) {
    return this.users.filter(user =>
      Object.keys(query).every(key => user[key] === query[key])
    );
  }

  // Exam operations
  async createExam(examData) {
    const exam = {
      _id: this.nextId++,
      ...examData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.exams.push(exam);
    return exam;
  }

  async findExam(query) {
    return this.exams.find(exam =>
      Object.keys(query).every(key => exam[key] === query[key])
    );
  }

  async findExams(query = {}) {
    return this.exams.filter(exam =>
      Object.keys(query).every(key => exam[key] === query[key])
    );
  }

  async updateExam(id, updateData) {
    const exam = this.exams.find(e => e._id === id);
    if (exam) {
      Object.assign(exam, updateData, { updatedAt: new Date() });
      return exam;
    }
    return null;
  }

  async deleteExam(id) {
    const index = this.exams.findIndex(e => e._id === id);
    if (index > -1) {
      return this.exams.splice(index, 1)[0];
    }
    return null;
  }

  // Answer operations
  async createAnswer(answerData) {
    const answer = {
      _id: this.nextId++,
      ...answerData,
      submittedAt: new Date()
    };
    this.answers.push(answer);
    return answer;
  }

  async findAnswer(query) {
    return this.answers.find(answer =>
      Object.keys(query).every(key => answer[key] === query[key])
    );
  }

  async findAnswers(query = {}) {
    return this.answers.filter(answer =>
      Object.keys(query).every(key => answer[key] === query[key])
    );
  }

  // Violation operations
  async createViolation(violationData) {
    const violation = {
      _id: this.nextId++,
      ...violationData,
      timestamp: new Date()
    };
    this.violations.push(violation);
    return violation;
  }

  async findViolations(query = {}) {
    return this.violations.filter(violation =>
      Object.keys(query).every(key => violation[key] === query[key])
    );
  }

  // Statistics
  getStats() {
    return {
      users: this.users.length,
      exams: this.exams.length,
      answers: this.answers.length,
      violations: this.violations.length
    };
  }
}

// Export singleton instance
const mockDB = new MockDB();
module.exports = mockDB;