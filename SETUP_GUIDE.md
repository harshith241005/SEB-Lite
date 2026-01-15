# SEB-Lite Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Docker)
- npm or yarn

## Quick Start

### 1. Start MongoDB
Using Docker:
```bash
docker run -d --name mongodb -p 27017:27017 mongo:6.0
```

Or install MongoDB locally and start it on port 27017.

### 2. Setup Backend
```bash
cd backend
npm install
node seed-data.js  # This will create test users and import the placement exam
npm start          # Starts backend on http://localhost:5001
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start          # Starts frontend on http://localhost:3000
```

### 4. Test Credentials

The seed script creates the following test users:

**Student Account:**
- Email: `student@seb.com`
- Password: `student123`

**Instructor Account:**
- Email: `instructor@seb.com`
- Password: `instructor123`

**Admin Account:**
- Email: `admin@seb.com`
- Password: `admin123`

## Features Implemented

### Backend
✅ MongoDB connection (local only: mongodb://127.0.0.1:27017/seb_lite)
✅ JWT authentication enforced
✅ Exam model with proper validation
✅ Correct answers NEVER sent to frontend
✅ Server-side result evaluation
✅ Violation logging with auto-submit
✅ Admin endpoints for exam upload and toggle

**API Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/exam/available` - Get active exams
- `GET /api/exam/:id/start` - Start exam (removes correct answers)
- `POST /api/exam/:id/submit` - Submit exam answers
- `POST /api/violation` - Log security violation
- `POST /api/exam/admin/upload` - Upload exam JSON (admin/instructor)
- `PATCH /api/exam/:id/toggle` - Toggle exam active status

### Frontend
✅ Student dashboard showing real exams
✅ Exam instructions page with security warnings
✅ Full exam flow: Instructions → Exam → Result
✅ Timer with auto-submit on timeout
✅ Auto-save answers every 10 seconds
✅ Answer restoration on page refresh
✅ Question palette with answered/unanswered states
✅ Result page with score, grade, and statistics
✅ Admin dashboard with exam upload and toggle

### Electron (Security Features)
✅ Fullscreen kiosk mode
✅ Dev tools disabled in production
✅ Keyboard shortcuts blocked (Ctrl+C, Ctrl+V, F5, etc.)
✅ Window blur detection
✅ Violation logging to backend
✅ Single-instance lock
✅ Auto-submit on violation limit

## Exam Data Format

The system uses a specific JSON format for exams. Example:

```json
{
  "title": "Software Fresher Technical Assessment",
  "company": "Generic IT Company",
  "type": "PLACEMENT_QUIZ",
  "duration": 60,
  "maxViolations": 3,
  "isActive": true,
  "questions": [
    {
      "question": "What is JVM?",
      "options": [
        "Java Variable Machine",
        "Java Virtual Machine",
        "Java Verified Module",
        "Java Visual Machine"
      ],
      "correct": 1,
      "category": "Java",
      "difficulty": "Easy"
    }
  ]
}
```

**Field Descriptions:**
- `title`: Exam title
- `company`: Company/organization name
- `type`: PLACEMENT_QUIZ or PRACTICE_TEST
- `duration`: Time in minutes
- `maxViolations`: Max violations before auto-submit
- `isActive`: Whether exam is available to students
- `questions`: Array of question objects
  - `question`: Question text
  - `options`: Array of option strings
  - `correct`: Index of correct option (0-based)
  - `category`: Java, DSA, DBMS, OS, SQL, Computer Networks, etc.
  - `difficulty`: Easy, Medium, Hard

## Usage Workflow

### For Students:
1. Login with student credentials
2. View available exams on dashboard
3. Click "Start Quiz" on an exam
4. Read instructions and click "I Understand - Start Exam"
5. Answer questions (auto-saved every 10 seconds)
6. Navigate using arrows or question palette
7. Submit when complete or auto-submit on timeout
8. View detailed results

### For Instructors/Admins:
1. Login with instructor/admin credentials
2. View dashboard with exam stats and violations
3. **Upload Exam:**
   - Go to "Create Exam" tab
   - Click "Upload Exam JSON"
   - Select a JSON file with proper format
4. **Toggle Exam Status:**
   - Go to "My Exams" tab
   - Click "Active"/"Inactive" button to toggle
5. Monitor violations in "Recent Violations" tab

## Security Features

### Browser-Level Security:
- Copy/paste blocked
- Right-click context menu disabled
- Keyboard shortcuts blocked
- Text selection disabled during exam

### Electron-Level Security:
- Fullscreen enforcement
- Tab/window switching detection
- Multiple monitor detection
- System-level shortcut blocking
- Process monitoring

### Backend Security:
- Correct answers never exposed to frontend
- JWT authentication on all endpoints
- Server-side answer validation
- Violation tracking and auto-submit
- Session management

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# If not running, start it
docker start mongodb

# Or create new container
docker run -d --name mongodb -p 27017:27017 mongo:6.0
```

### Port Already in Use
```bash
# Backend (5001)
lsof -ti:5001 | xargs kill -9

# Frontend (3000)
lsof -ti:3000 | xargs kill -9
```

### Clear Exam Progress
If you need to reset a student's exam attempt:
```bash
# Connect to MongoDB
mongosh mongodb://127.0.0.1:27017/seb_lite

# Delete answer for specific student and exam
db.answers.deleteOne({studentId: ObjectId("..."), examId: ObjectId("...")})
```

## Project Structure

```
SEB-Lite/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, validation
│   ├── config/          # Database config
│   ├── seed-data.js     # Database seeding script
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── utils/       # API utilities
│   └── public/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script
└── placement-quiz.json  # Sample exam data
```

## Development Notes

- Backend runs on port 5001
- Frontend runs on port 3000
- MongoDB must be on port 27017
- All API calls go through axios with auth interceptors
- Exam context manages global exam state
- Auto-save happens every 10 seconds
- Violations trigger auto-submit at max limit

## Production Deployment

For production:
1. Build frontend: `cd frontend && npm run build`
2. Configure environment variables
3. Use production MongoDB instance
4. Enable HTTPS
5. Update CORS settings
6. Build Electron app for distribution

## Support

For issues or questions:
1. Check console logs (browser & backend)
2. Verify MongoDB is running
3. Check network requests in browser DevTools
4. Ensure all dependencies are installed
5. Clear browser cache/localStorage if needed
