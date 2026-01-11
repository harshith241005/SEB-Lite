# 🔒 SEB-Lite: Secure Exam Browser

**A comprehensive desktop-based secure examination system with real-time proctoring and violation monitoring.**

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Security Features](#security-features)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

SEB-Lite is a secure exam browser application designed to prevent cheating during online examinations. It combines:

- **Desktop Security**: Electron-based kiosk mode with OS-level restrictions
- **Real-time Monitoring**: Violation detection and logging
- **Full-Stack Architecture**: React frontend, Node.js backend, MongoDB database
- **Comprehensive Proctoring**: Multiple security layers and violation tracking

### Key Capabilities

✅ **Desktop Lockdown**: Fullscreen kiosk mode, no window controls, single instance  
✅ **Keyboard Restrictions**: Blocks Alt+Tab, Ctrl+C/V, F12, PrintScreen, etc.  
✅ **Browser Security**: Navigation restrictions, tab blocking, context menu disabled  
✅ **Violation Monitoring**: Real-time detection with severity levels  
✅ **Auto-Submit**: Automatic submission on timeout or violation threshold  
✅ **Role-Based Access**: Student, Instructor, and Admin dashboards  

---

## ✨ Features

### 🔐 Security Features

#### Desktop-Level Security
- **Kiosk Mode**: Fullscreen with no window controls
- **Single Instance Lock**: Prevents multiple app instances
- **Always-On-Top**: Exam window stays focused
- **Window Restrictions**: No minimize, resize, or close during exam
- **Global Shortcut Blocking**: Alt+Tab, Ctrl+Alt+Del, Windows key, etc.

#### Keyboard & Mouse Control
- **Blocked Shortcuts**: Ctrl+C/V/X/A, Alt+Tab/F4, F5/F12, PrintScreen
- **Right-Click Disabled**: Context menu prevention
- **Text Selection Disabled**: Prevents copying
- **Drag & Drop Disabled**: Prevents file dropping

#### Browser Restrictions
- **Navigation Control**: Only exam URL allowed
- **Tab/Window Blocking**: No new tabs or windows
- **Back/Forward Disabled**: Prevents navigation history
- **Address Bar Hidden**: Kiosk mode removes browser UI

#### Violation Monitoring
- **Real-Time Detection**: Window blur, tab switch, shortcuts
- **Severity Levels**: Low, Medium, High classification
- **Auto-Submit**: Triggers after violation threshold
- **Comprehensive Logging**: Backend and local storage
- **Evidence Collection**: Timestamps, descriptions, metadata

### 📚 Exam Management

- **Multiple Question Types**: MCQ, Short Answer, Essay
- **Timer Management**: Configurable duration with countdown
- **Auto-Save**: Answers saved to localStorage
- **Auto-Grading**: Automatic scoring for objective questions
- **Results Analytics**: Performance tracking and statistics
- **Exam Instructions**: Pre-exam briefing with countdown

### 👥 User Management

- **JWT Authentication**: Secure token-based login
- **Role System**: Student, Instructor, Admin roles
- **Password Security**: Bcrypt hashing
- **Account Management**: Profile, enrollment tracking

### 📊 Admin Dashboard

- **Exam Creation**: Comprehensive exam builder
- **Violation Monitoring**: Real-time violation tracking
- **Statistics**: Analytics and reporting
- **Student Management**: View attempts and results

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **MongoDB** 4.4+ ([Download](https://www.mongodb.com/try/download/community)) or MongoDB Atlas account
- **npm** or **yarn** package manager

### 5-Minute Setup

```bash
# 1. Clone or navigate to project
cd SEB-Lite

# 2. Install all dependencies
npm run install-all

# 3. Configure environment (see Configuration section)
cp .env.example .env
# Edit .env with your MongoDB URI

# 4. Start MongoDB (if using local)
mongod

# 5. Start the application
npm start
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm run install-all

# Or install individually:
npm install                    # Root dependencies
npm --prefix backend install   # Backend dependencies
npm --prefix frontend install  # Frontend dependencies
```

### Step 2: Database Setup

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Add to `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seb-lite
   ```

#### Option B: Local MongoDB

**Windows:**
```bash
# Download and install from mongodb.com
# Or use the setup script:
setup-mongodb.bat
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

### Step 3: Environment Configuration

Create `.env` file in project root:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/seb-lite
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/seb-lite

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend API URL
REACT_APP_API_URL=http://localhost:5001/api
```

### Step 4: Start Application

```bash
# Start everything (backend + frontend + electron)
npm start

# Or start individually:
npm run backend   # Backend only (port 5001)
npm run frontend  # Frontend only (port 3000)
npm run electron  # Electron app
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/seb-lite` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `NODE_ENV` | Environment mode | `development` |
| `REACT_APP_API_URL` | Frontend API base URL | `http://localhost:5001/api` |

### Security Configuration

**For Production:**
1. Change `JWT_SECRET` to a strong random string
2. Use MongoDB Atlas with authentication
3. Enable HTTPS
4. Set `NODE_ENV=production`
5. Configure CORS for specific domains
6. Enable rate limiting

---

## 📖 Usage

### For Students

1. **Register/Login**
   - Navigate to http://localhost:3000
   - Register with email and password
   - Select "Student" role

2. **View Available Exams**
   - Access Student Dashboard
   - See list of available exams

3. **Take Exam**
   - Click "Start Exam" on an exam
   - Read instructions and confirm
   - 5-second countdown begins
   - Exam starts in secure mode
   - Answer questions (auto-saved)
   - Submit manually or wait for auto-submit

4. **View Results**
   - See score and pass/fail status
   - View detailed results

### For Instructors

1. **Register/Login**
   - Register with "Instructor" role
   - Access Instructor Dashboard

2. **Create Exam**
   - Click "Create Exam"
   - Fill exam details (title, duration, questions)
   - Add questions (MCQ, Short Answer, Essay)
   - Set passing percentage
   - Publish exam

3. **Monitor Exams**
   - View exam list
   - Check violations
   - View student attempts
   - Review statistics

---

## 🔒 Security Features

### Desktop Security (Electron)

```javascript
// Kiosk mode with fullscreen
BrowserWindow({
  kiosk: true,
  fullscreen: true,
  alwaysOnTop: true,
  resizable: false,
  minimizable: false,
  closable: false
})
```

**Blocked Shortcuts:**
- `Alt+Tab` - Window switching
- `Alt+F4` - Window close
- `Ctrl+C/V/X` - Copy/Paste/Cut
- `Ctrl+Shift+I` - DevTools
- `F5/Ctrl+R` - Refresh
- `F12` - Developer tools
- `PrintScreen` - Screenshot
- `Windows Key` - Start menu
- `Ctrl+Alt+Del` - Task manager

### Browser Security

- **Navigation Restrictions**: Only exam domain allowed
- **Tab Switching**: Detected and logged
- **Context Menu**: Disabled
- **Text Selection**: Disabled
- **Copy/Paste**: Prevented via event listeners

### Violation Types

| Type | Severity | Description |
|------|----------|-------------|
| `window_blur` | High | Window lost focus |
| `tab_switch` | High | Tab switching detected |
| `keyboard_shortcut` | Medium | Blocked shortcut used |
| `right_click` | Low | Right-click attempted |
| `fullscreen_exit` | High | Fullscreen exit attempt |
| `multiple_monitors` | High | Multiple displays detected |
| `copy_paste` | Medium | Copy/paste attempt |
| `navigation_attempt` | High | External navigation blocked |

### Auto-Submit Triggers

- **Time Expiry**: Exam auto-submits when timer reaches 0
- **Violation Threshold**: Auto-submits after N violations (default: 5)
- **Severe Violations**: Auto-submits after 3 high-severity violations

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

### Exam Endpoints

#### Get All Exams
```http
GET /api/exam
Authorization: Bearer {token}
```

#### Get Exam by ID
```http
GET /api/exam/:id
Authorization: Bearer {token}
```

#### Create Exam (Instructor Only)
```http
POST /api/exam
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Math Final Exam",
  "description": "Comprehensive math assessment",
  "duration": 60,
  "totalQuestions": 10,
  "passingPercentage": 60,
  "questions": [
    {
      "questionId": "q1",
      "questionText": "What is 2+2?",
      "questionType": "mcq",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4",
      "marks": 1
    }
  ],
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

#### Submit Exam
```http
POST /api/exam/:examId/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "q1",
      "answer": "4"
    }
  ]
}
```

#### Get Results
```http
GET /api/exam/:examId/results
Authorization: Bearer {token}
```

### Violation Endpoints

#### Log Violation
```http
POST /api/violation
Authorization: Bearer {token}
Content-Type: application/json

{
  "examId": "exam_id",
  "violationType": "tab_switch",
  "severity": "high",
  "description": "Student switched tabs"
}
```

#### Get Violations
```http
GET /api/violation?examId={examId}&limit=50&page=1
Authorization: Bearer {token}
```

#### Get Violation Statistics
```http
GET /api/violation/stats?timeframe=24h
Authorization: Bearer {token}
```

---

## 🏗️ Architecture

### Project Structure

```
SEB-Lite/
├── electron/              # Desktop security layer
│   ├── main.js           # Electron main process
│   └── preload.js        # Secure IPC bridge
├── frontend/             # React application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   └── utils/        # Utilities
│   └── public/           # Static assets
├── backend/              # Express API server
│   ├── models/           # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   └── server.js          # Server entry point
└── Readme/               # Documentation
```

### Technology Stack

**Desktop:**
- Electron.js 25.0.0

**Frontend:**
- React 18.2.0
- React Router 6.14.2
- Tailwind CSS 3.3.0
- Axios 1.4.0

**Backend:**
- Node.js
- Express.js 4.18.2
- MongoDB with Mongoose 7.5.3
- JWT Authentication
- Bcrypt 5.1.1

### Database Schema

**Users Collection:**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['student', 'instructor', 'admin'],
  isActive: Boolean,
  flaggedForReview: Boolean,
  enrolledExams: [ObjectId]
}
```

**Exams Collection:**
```javascript
{
  title: String,
  description: String,
  duration: Number (minutes),
  totalQuestions: Number,
  passingPercentage: Number,
  questions: [{
    questionId: String,
    questionText: String,
    questionType: Enum ['mcq', 'short_answer', 'essay'],
    options: [String],
    correctAnswer: String,
    marks: Number
  }],
  instructor: ObjectId (ref: User),
  startDate: Date,
  endDate: Date,
  isActive: Boolean
}
```

**Answers Collection:**
```javascript
{
  studentId: ObjectId (ref: User),
  examId: ObjectId (ref: Exam),
  answers: [{
    questionId: String,
    answer: String,
    timeSpent: Number
  }],
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  submittedAt: Date
}
```

**Violations Collection:**
```javascript
{
  studentId: ObjectId (ref: User),
  examId: ObjectId (ref: Exam),
  violationType: String,
  severity: Enum ['low', 'medium', 'high'],
  description: String,
  timestamp: Date,
  evidence: Object,
  reviewed: Boolean,
  reviewedBy: ObjectId (ref: User)
}
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solutions:**
1. Ensure MongoDB is running: `mongod`
2. Check connection string in `.env`
3. Verify MongoDB port (default: 27017)
4. Check firewall settings

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5001`

**Solutions:**
1. Kill process: `lsof -ti:5001 | xargs kill -9` (macOS/Linux)
2. Change PORT in `.env`
3. Use Task Manager (Windows) to kill Node process

### Electron Won't Launch

**Solutions:**
1. Ensure frontend is running on port 3000
2. Check `electron/main.js` path configuration
3. Verify Electron dependencies: `npm --prefix frontend install electron`

### Frontend Build Errors

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf frontend/node_modules frontend/package-lock.json
npm --prefix frontend install
```

### JWT Token Errors

**Solutions:**
1. Check `JWT_SECRET` in `.env`
2. Verify token expiration (default: 24 hours)
3. Clear localStorage and re-login

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Write tests for new functionality
- Ensure all tests pass before submitting

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or contributions:

- Create an issue in the repository
- Check existing documentation in `Readme/` folder
- Review API documentation above

---

## 🎓 Acknowledgments

- Built for educational institutions
- Inspired by Secure Exam Browser (SEB) project
- Designed for SIH (Smart India Hackathon) style projects

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 2024
