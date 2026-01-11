# ⚡ SEB-Lite Quick Start

**Get up and running in 5 minutes!**

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env with your MongoDB URI
# For local: mongodb://127.0.0.1:27017/seb-lite
# For Atlas: mongodb+srv://user:pass@cluster.mongodb.net/seb-lite
```

### 3. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```

### 4. Start Application
```bash
npm start
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

---

## 📝 First Steps

### Register a User
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in details:
   - Name: Your Name
   - Email: your@email.com
   - Password: yourpassword
   - Role: Student or Instructor

### Create an Exam (Instructor)
1. Register as **Instructor**
2. Login
3. Go to "Create Exam"
4. Fill exam details
5. Add questions
6. Submit

### Take an Exam (Student)
1. Register as **Student**
2. Login
3. View available exams
4. Click "Start Exam"
5. Read instructions
6. Answer questions
7. Submit

---

## 🔑 Default Test Credentials

After running `node db-init.js`:

- **Instructor**: `instructor@seb-lite.com` / `instructor123`
- **Student**: `student@seb-lite.com` / `student123`

---

## 📋 Essential Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start everything (backend + frontend) |
| `npm run backend` | Start backend only |
| `npm run frontend` | Start frontend only |
| `npm run electron` | Launch Electron app |
| `npm run install-all` | Install all dependencies |
| `npm run test-api` | Test API endpoints |

---

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **API Health**: http://localhost:5001/api/health
- **MongoDB**: mongodb://127.0.0.1:27017/seb-lite

---

## 🐛 Quick Troubleshooting

### MongoDB Connection Failed?
```bash
# Start MongoDB
mongod

# Or check connection string in .env
```

### Port Already in Use?
```bash
# Change PORT in .env
PORT=5002
```

### Dependencies Not Installing?
```bash
npm cache clean --force
npm run install-all
```

---

## 📚 More Information

- **Full Documentation**: `Readme/README.md`
- **Setup Guide**: `Readme/SETUP_GUIDE.md`
- **Database Setup**: `Readme/DATABASE_SETUP.md`

---

**That's it! You're ready to go!** 🎉
