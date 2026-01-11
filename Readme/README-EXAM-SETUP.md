# SEB Lite - Secure Exam Browser

## 🚀 Quick Start - Step 1: Import Exam Data & Conduct Exam

### Prerequisites
1. **MongoDB is running** on `localhost:27017`
2. **Backend server is running** on `http://localhost:5001`

### Step 1: Import Exam Data into MongoDB

#### Option A: Using Compass (Recommended)
1. Open **MongoDB Compass**
2. Connect to: `mongodb://localhost:27017`
3. Select database: `seb-lite`
4. Click **"+ Create Database"** if `seb-lite` doesn't exist
5. Select the `seb-lite` database
6. Click **"Add Data" → "Import File"**
7. Select `exam-data.json` from the root directory
8. Choose **"JSON"** as import format
9. Click **"Import"**

#### Option B: Using Import Script
```bash
# Make sure MongoDB is running, then:
node import-exam.js
```

### Step 2: Test the Backend API
```bash
# Check if exam is available
curl http://localhost:5001/api/exam/active
```

### Step 3: Run the Electron App
```bash
cd electron
npm install
npm start
```

### Step 4: Login & Take Exam
1. Use student credentials (create via backend API or database)
2. Login through the Electron app
3. Take the exam with timer and question navigation
4. Auto-submit when time runs out

## 📁 Project Structure

```
SEB-Lite/
├── exam-data.json          # Sample exam data
├── import-exam.js          # Script to import exam data
├── backend/                # Node.js/Express backend
├── frontend/               # React frontend
├── electron/               # Electron secure browser
│   ├── src/
│   │   ├── main.js        # Electron main process
│   │   ├── preload.js     # Security preload script
│   │   └── renderer/      # Electron UI
│   │       ├── index.html
│   │       ├── styles.css
│   │       └── app.js
│   └── package.json
└── mongodb/               # Local MongoDB data
```

## 🔧 Development Setup

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Electron
```bash
cd electron
npm install
npm start
```

## 📊 Database Schema

### Exam Collection
```json
{
  "title": "SEB Placement Mock Test",
  "duration": 60,
  "maxViolations": 3,
  "questions": [
    {
      "id": 1,
      "question": "What is JVM?",
      "options": ["Operating System", "Virtual Machine", "Compiler", "Hardware"],
      "correct": 1
    }
  ],
  "isActive": true
}
```

### Answer Collection
```json
{
  "examId": "ObjectId",
  "studentId": "ObjectId",
  "answers": { "1": 1, "2": 0 },
  "score": 80,
  "submittedAt": "Date"
}
```

## 🎯 Features Implemented

✅ **Exam Data Import** - JSON import to MongoDB
✅ **Active Exam API** - Fetch current exam
✅ **Submit API** - Score calculation and storage
✅ **Electron App** - Secure browser environment
✅ **Timer & Auto-submit** - Time-based exam completion
✅ **Question Navigation** - Palette-based navigation
✅ **Login System** - Student authentication

## 🚀 Next Steps

1. ✅ Import exam data & conduct exam
2. 🔄 Connect Electron app to database (completed)
3. ⏭️ Add admin exam upload screen
4. ⏭️ Enhanced security features
5. ⏭️ Results dashboard

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `netstat -ano | findstr :27017`
- Check MongoDB logs in `mongodb/log.txt`

### Backend Issues
- Check if port 5001 is available
- Verify `.env` configuration

### Electron Issues
- Run `npm install` in electron directory
- Check console for preload script errors

## 📞 Support

For issues, check:
1. MongoDB is running
2. Backend server is running on port 5001
3. Exam data is imported
4. Student account exists in database