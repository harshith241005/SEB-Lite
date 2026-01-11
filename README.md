# SEB-Lite: Secure Exam Browser

A comprehensive secure exam browser application built with React, Express.js, MongoDB, and Electron for desktop security.

## Features

### 🔒 Security Features
- **Desktop Lockdown**: Electron-based kiosk mode prevents window switching, shortcuts, and external access
- **Real-time Proctoring**: Monitors for tab switches, copy-paste attempts, right-clicks, and fullscreen exits
- **Violation Detection**: Automatic logging of suspicious activities with severity levels
- **Multi-monitor Detection**: Identifies and logs multiple display usage
- **Keyboard Restrictions**: Blocks dangerous shortcuts (Ctrl+C/V/X, F12, Alt+Tab, etc.)

### 📚 Exam Management
- **Role-based Access**: Separate dashboards for instructors and students
- **Exam Creation**: Comprehensive exam builder with multiple question types
- **Auto-grading**: Automatic scoring with configurable passing criteria
- **Time Management**: Configurable exam duration with countdown timers
- **Results Analytics**: Detailed performance tracking and statistics

### 👥 User Management
- **Authentication**: JWT-based secure login system
- **Role System**: Student, Instructor, and Admin roles
- **Account Security**: Password hashing, login attempt tracking, account locking

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Desktop**: Electron.js for security wrapper
- **Authentication**: JWT tokens with bcrypt
- **Validation**: Express-validator for input sanitization

## Project Structure

```
SEB-Lite/
├── backend/                 # Express.js API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Authentication & security
│   └── server.js           # Main server file
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main app component
│   └── package.json
├── electron/               # Desktop security wrapper
│   ├── main.js            # Electron main process
│   └── preload.js         # Secure API bridge
└── README.md
```

## ⚡ Quick Start (5 minutes)

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up database:**
   - **Option A (Recommended):** Create a free [MongoDB Atlas](https://mongodb.com/atlas) account and get connection string
   - **Option B:** Run `npm run setup-db` (Windows only - downloads local MongoDB)

3. **Update environment:**
   Edit `backend/.env` with your MongoDB connection string

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Test the application:**
   ```bash
   npm run test-full
   ```

That's it! Your secure exam browser is ready.

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas cloud account)
- npm or yarn package manager

### Database Setup

#### Option 1: MongoDB Atlas (Cloud - Recommended)
1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and cluster
   - Get your connection string

2. **Update Environment Variables:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seb-lite?retryWrites=true&w=majority
   ```

#### Option 2: Local MongoDB Installation
1. **Install MongoDB Community Edition:**
   ```bash
   # Windows (using winget)
   winget install MongoDB.MongoDB

   # Or download from: https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB Service:**
   ```bash
   # Windows
   net start MongoDB

   # Or run manually
   mongod
   ```

#### Quick Local Setup (Windows)
1. **Run the MongoDB setup script:**
   ```bash
   setup-mongodb.bat
   ```
   This will download and start MongoDB automatically.

2. **Use local connection string:**
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/seb-lite
   ```

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5001
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seb-lite?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```

### Desktop Application (Electron)

1. **Install Electron dependencies:**
   ```bash
   cd frontend
   npm install electron electron-builder concurrently wait-on
   ```

2. **Run in development mode:**
   ```bash
   npm run electron-dev
   ```

3. **Build for production:**
   ```bash
   npm run build-electron
   ```

## Usage

### First Time Setup

1. **Start the backend server** (as described above)
2. **Start the frontend** in development mode or build the Electron app
3. **Register an instructor account** through the login page
4. **Create exams** using the instructor dashboard
5. **Students can register** and take available exams

### User Roles

#### Instructor/Admin
- Create and manage exams
- View exam results and analytics
- Monitor security violations
- Review flagged student accounts

#### Student
- View available exams
- Take exams with security monitoring
- View personal results and performance

### Exam Creation

1. **Access Instructor Dashboard**
2. **Click "Create Exam"**
3. **Fill Basic Information:**
   - Title, description, duration, passing percentage
   - Schedule start/end times
4. **Add Questions:**
   - Multiple choice, short answer, or essay questions
   - Set marks and correct answers
   - Add explanations for review
5. **Configure Security Settings** (automatically enabled)
6. **Publish Exam**

### Taking Exams

1. **Student logs in** and sees available exams
2. **Click "Start Exam"** on available exams
3. **Application enters fullscreen kiosk mode**
4. **Security monitoring activates automatically**
5. **Answer questions** within time limit
6. **Auto-submit** when time expires or manually submit

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Exam Management
- `GET /api/exam` - List exams (role-based)
- `GET /api/exam/:id` - Get exam details
- `POST /api/exam` - Create exam (instructor only)
- `PUT /api/exam/:id` - Update exam (instructor only)
- `DELETE /api/exam/:id` - Delete exam (instructor only)
- `POST /api/exam/:id/submit` - Submit exam answers
- `GET /api/exam/:id/results` - Get exam results

### Violation Monitoring
- `POST /api/violation` - Log violation
- `GET /api/violation` - Get violations (filtered)
- `GET /api/violation/stats` - Get violation statistics
- `PUT /api/violation/:id/review` - Review violation

## Security Features

### Desktop Security
- **Kiosk Mode**: Fullscreen, no window controls, no taskbar
- **Shortcut Blocking**: Prevents Alt+Tab, Ctrl+C/V/X, F12, etc.
- **Window Lock**: Prevents minimizing or switching applications
- **Context Menu Disabled**: Right-click menus blocked

### Proctoring Features
- **Tab/Window Switching**: Detected and logged
- **Copy/Paste Prevention**: Keyboard shortcuts blocked
- **Right-click Blocking**: Context menus disabled
- **Fullscreen Monitoring**: Exit attempts logged
- **Multiple Monitor Detection**: Additional displays flagged

### Violation Tracking
- **Severity Levels**: Low, Medium, High, Critical
- **Real-time Logging**: Immediate backend and local logging
- **Evidence Collection**: Timestamps, descriptions, metadata
- **Review System**: Instructors can review and flag violations

## Available Scripts

### Root level

```bash
npm start              # Install & run everything concurrently
npm run install-all    # Install all dependencies
npm run backend        # Start backend server
npm run frontend       # Start React dev server
npm run electron       # Start Electron app
```

### Frontend

```bash
npm --prefix frontend start         # Start dev server
npm --prefix frontend build         # Build for production
npm --prefix frontend test          # Run tests
npm --prefix frontend electron-dev  # Run Electron in dev mode
npm --prefix frontend build-electron # Build Electron app
```

### Backend

```bash
npm --prefix backend start          # Start server
npm --prefix backend dev            # Start with nodemon
```

## Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`, models in `backend/models/`
2. **Frontend**: Add components in `frontend/src/components/`, pages in `frontend/src/pages/`
3. **Security**: Update Electron main process for new security features

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Build Electron app
npm run dist
```

## 🗄️ Database Models

### User
```javascript
{
  name, email, password (hashed), role, department,
  enrolledExams: [examId], createdAt, updatedAt
}
```

### Exam
```javascript
{
  title, description, duration (minutes), totalQuestions,
  passingPercentage, questions: [{questionText, options, correctAnswer, marks}],
  instructor, startDate, endDate, isActive,
  proctoring: {enabled, recordWebcam, allowTabSwitch, maxAttempts}
}
```

### Answer
```javascript
{
  studentId, examId, answers: [{questionId, answer, timeSpent}],
  score, totalQuestions, correctAnswers, submittedAt
}
```

### Violation
```javascript
{
  studentId, examId, violationType, severity,
  description, timestamp, screenshot, metadata
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- See `MONGODB_SETUP.md` for detailed setup instructions

### Port Already in Use
- Change PORT in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill -9`

### Frontend build issues
```bash
rm -rf frontend/node_modules package-lock.json
npm --prefix frontend install
```

## 📝 Example: Creating an Exam

```javascript
// POST /api/exam
{
  "title": "Math Quiz",
  "description": "Basic arithmetic",
  "duration": 30,
  "totalQuestions": 5,
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
  "proctoring": {
    "enabled": true,
    "recordWebcam": false,
    "allowTabSwitch": false,
    "maxAttempts": 1
  }
}
```

## Security Considerations

### Production Deployment
- Change JWT secret to a strong, random value
- Use HTTPS in production
- Configure MongoDB authentication
- Set NODE_ENV=production
- Use environment variables for sensitive data

### Additional Security Measures
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Regular security audits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review the security features and configuration

---

**⚠️ Important**: This application is designed for educational institutions. Ensure compliance with your organization's policies and local regulations regarding exam security and student privacy.
