// SEB Lite Electron App - Renderer Process

class SEBLiteApp {
  constructor() {
    this.token = null;
    this.exam = null;
    this.answers = {};
    this.currentQuestion = 0;
    this.timeRemaining = 0;
    this.examStarted = false;
    this.timer = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.showLoginScreen();
  }

  bindEvents() {
    // Login form
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => this.handleLogin(e));

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => this.handleLogout());
  }

  showLoadingScreen() {
    this.hideAllScreens();
    document.getElementById('loading-screen').classList.remove('hidden');
  }

  showLoginScreen() {
    this.hideAllScreens();
    document.getElementById('login-screen').classList.remove('hidden');
  }

  showExamScreen() {
    this.hideAllScreens();
    document.getElementById('exam-screen').classList.remove('hidden');
    this.renderExam();
  }

  showResultsScreen(results) {
    this.hideAllScreens();
    document.getElementById('results-screen').classList.remove('hidden');
    this.renderResults(results);
  }

  hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.add('hidden'));
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    this.showLoadingScreen();

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        localStorage.setItem('token', this.token);
        await this.loadExam();
      } else {
        alert(data.error || 'Login failed');
        this.showLoginScreen();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please check your connection.');
      this.showLoginScreen();
    }
  }

  async loadExam() {
    try {
      const response = await fetch('http://localhost:5001/api/exam/active', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const exam = await response.json();

      if (response.ok) {
        this.exam = exam;
        this.timeRemaining = exam.duration * 60; // Convert to seconds
        this.showExamScreen();
      } else {
        alert(exam.message || 'No active exam found');
        this.showLoginScreen();
      }
    } catch (error) {
      console.error('Load exam error:', error);
      alert('Failed to load exam. Please try again.');
      this.showLoginScreen();
    }
  }

  renderExam() {
    const examContent = document.getElementById('exam-content');

    if (!this.examStarted) {
      // Show exam instructions
      examContent.innerHTML = `
        <div class="exam-instructions">
          <h1>${this.exam.title}</h1>
          <div class="exam-info">
            <p><strong>Duration:</strong> ${this.exam.duration} minutes</p>
            <p><strong>Questions:</strong> ${this.exam.questions.length}</p>
            <p><strong>Max Violations:</strong> ${this.exam.maxViolations || 3}</p>
          </div>
          <button id="start-exam-btn" class="btn-primary">Start Exam</button>
        </div>
      `;

      document.getElementById('start-exam-btn').addEventListener('click', () => {
        this.startExam();
      });
    } else {
      // Show exam questions
      this.renderExamQuestions();
    }
  }

  startExam() {
    this.examStarted = true;
    this.startTimer();
    this.renderExamQuestions();
  }

  renderExamQuestions() {
    const examContent = document.getElementById('exam-content');
    const question = this.exam.questions[this.currentQuestion];

    examContent.innerHTML = `
      <div class="exam-header">
        <h1>${this.exam.title}</h1>
        <div class="exam-timer">
          <span id="timer">Time: ${this.formatTime(this.timeRemaining)}</span>
          <button id="submit-exam-btn" class="btn-secondary">Submit Exam</button>
        </div>
      </div>

      <div class="exam-body">
        <div class="question-palette">
          <h3>Questions</h3>
          <div class="question-grid">
            ${this.exam.questions.map((_, index) => `
              <button
                class="question-btn ${this.currentQuestion === index ? 'active' : ''} ${this.answers[this.exam.questions[index].id] !== undefined ? 'answered' : ''}"
                data-index="${index}"
              >
                ${index + 1}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="question-content">
          <h2>Question ${this.currentQuestion + 1} of ${this.exam.questions.length}</h2>
          <p class="question-text">${question.question}</p>

          <div class="options">
            ${question.options.map((option, index) => `
              <button
                class="option-btn ${this.answers[question.id] === index ? 'selected' : ''}"
                data-option="${index}"
              >
                <span class="option-letter">${String.fromCharCode(65 + index)}.</span>
                ${option}
              </button>
            `).join('')}
          </div>

          <div class="question-navigation">
            <button id="prev-btn" class="btn-secondary" ${this.currentQuestion === 0 ? 'disabled' : ''}>Previous</button>
            <button id="next-btn" class="btn-secondary" ${this.currentQuestion === this.exam.questions.length - 1 ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>
    `;

    // Bind events
    this.bindExamEvents();
  }

  bindExamEvents() {
    // Question palette buttons
    const questionBtns = document.querySelectorAll('.question-btn');
    questionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentQuestion = parseInt(e.target.dataset.index);
        this.renderExamQuestions();
      });
    });

    // Option buttons
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const questionId = this.exam.questions[this.currentQuestion].id;
        const optionIndex = parseInt(e.target.dataset.option);
        this.answers[questionId] = optionIndex;
        this.renderExamQuestions();
      });
    });

    // Navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentQuestion > 0) {
          this.currentQuestion--;
          this.renderExamQuestions();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentQuestion < this.exam.questions.length - 1) {
          this.currentQuestion++;
          this.renderExamQuestions();
        }
      });
    }

    // Submit button
    const submitBtn = document.getElementById('submit-exam-btn');
    submitBtn.addEventListener('click', () => this.submitExam());
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeRemaining--;
      const timerElement = document.getElementById('timer');
      if (timerElement) {
        timerElement.textContent = `Time: ${this.formatTime(this.timeRemaining)}`;
      }

      if (this.timeRemaining <= 0) {
        this.submitExam();
      }
    }, 1000);
  }

  async submitExam() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    try {
      const response = await fetch('http://localhost:5001/api/exam/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          examId: this.exam._id,
          answers: this.answers,
        }),
      });

      const results = await response.json();

      if (response.ok) {
        this.showResultsScreen(results);
      } else {
        alert(results.error || 'Failed to submit exam');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Network error during submission');
    }
  }

  renderResults(results) {
    const resultsDetails = document.getElementById('results-details');

    resultsDetails.innerHTML = `
      <div class="result-item">
        <span class="result-label">Score:</span>
        <span class="result-value">${results.score}%</span>
      </div>
      <div class="result-item">
        <span class="result-label">Correct Answers:</span>
        <span class="result-value">${results.correctAnswers}/${results.totalQuestions}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Status:</span>
        <span class="result-value ${results.passed ? 'passed' : 'failed'}">${results.passed ? 'PASSED' : 'FAILED'}</span>
      </div>
    `;
  }

  handleLogout() {
    this.token = null;
    localStorage.removeItem('token');
    this.answers = {};
    this.exam = null;
    this.examStarted = false;
    this.currentQuestion = 0;
    this.timeRemaining = 0;
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.showLoginScreen();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SEBLiteApp();
});