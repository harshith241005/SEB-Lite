const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length >= 2;
      },
      message: 'Options must have at least 2 choices'
    }
  },
  correct: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v < this.options.length;
      },
      message: 'Correct answer index must be valid for options'
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['Java', 'DSA', 'DBMS', 'OS', 'SQL']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['PLACEMENT_QUIZ', 'PRACTICE_TEST']
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  maxViolations: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Questions array must not be empty'
    }
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Exam", examSchema);
