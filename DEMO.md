# 🎥 SEB-Lite Demo Flow (5-7 Minutes)

## Interview/Placement Ready Presentation

---

## ⏱️ TOTAL DEMO TIME: 5–7 minutes

### 1️⃣ INTRO (30 seconds)

**What you say:**
> "SEB-Lite is a Secure Exam Browser built using Electron, React, Node.js, and MongoDB. It enforces fullscreen, blocks cheating attempts, logs violations, and auto-submits exams securely."

**Action:** Open the Electron app (not browser)

---

### 2️⃣ LOGIN & ROLE SEPARATION (30 seconds)

**Action:** Login as Student

**What you say:**
> "Authentication is JWT-based and exam sessions are bound to the user."

**Show:** Role-based access (Admin / Student)

---

### 3️⃣ STUDENT DASHBOARD (45 seconds)

**Show:**
- List of available exams
- Company / Duration / Type

**What you say:**
> "Only active exams fetched from MongoDB are shown."

**Action:** Click Start Exam

---

### 4️⃣ INSTRUCTIONS PAGE (30 seconds)

**Show:**
- Exam rules
- Violation warnings
- Checkbox → Start Exam

**What you say:**
> "User consent is required before entering secure mode."

---

### 5️⃣ SECURE EXAM MODE (2 minutes) 🔥🔥

**This is the core.**

**Show:**
- Fullscreen kiosk mode
- Timer running
- Question palette
- Answer navigation

**⚠️ Trigger a violation live:**
- Alt+Tab / click outside window

**Show:**
- Warning message

**What you say:**
> "Window focus loss is detected and logged as a violation."

**(Optional: show MongoDB Compass → violations collection)**

---

### 6️⃣ AUTO-SUBMIT (45 seconds)

**Action:** Let timer end or trigger max violations

**Show:**
- Exam auto-submits
- Redirect to Result page

**What you say:**
> "Auto-submission is controlled by backend, not frontend."

---

### 7️⃣ RESULT PAGE (30 seconds)

**Show:**
- Score
- Attempted / total questions

**What you say:**
> "Evaluation is done server-side to prevent tampering."

---

### 8️⃣ ADMIN MODULE (1 minute)

**Action:** Login as Admin

**Show:**
- Upload exam (JSON)
- Activate / deactivate exam

**What you say:**
> "Admins manage exams; students can never access correct answers."

---

## 🚀 Quick Start Commands

```bash
# Start MongoDB
./scripts/setup-mongodb.bat

# Start Backend
cd backend && npm install && npm start

# Start Frontend (in new terminal)
cd frontend && npm install && npm start

# Start Electron (in new terminal)
cd electron && npm install && npm start
```

## 📋 Demo Checklist

- [ ] Electron app opens in fullscreen kiosk mode
- [ ] Student login works
- [ ] Exam list loads from database
- [ ] Instructions page shows rules
- [ ] Secure mode blocks Alt+Tab, right-click, etc.
- [ ] Window blur triggers warning
- [ ] Timer counts down correctly
- [ ] Auto-submit works
- [ ] Results page shows score
- [ ] Admin can upload/manage exams
- [ ] Violations logged in MongoDB

## 🎯 Key Talking Points

- **Security:** Electron kiosk mode + keyboard blocking
- **Integrity:** Server-side evaluation, encrypted answers
- **Monitoring:** Real-time violation detection and logging
- **Scalability:** MongoDB for data persistence
- **UX:** Clean React interface with responsive design
