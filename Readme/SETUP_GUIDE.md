# 🚀 SEB-Lite Setup Guide

Complete step-by-step setup instructions for SEB-Lite.

## 📋 Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB** (4.4 or higher)
   - Option A: Local installation
   - Option B: MongoDB Atlas (cloud - recommended)

3. **Git** (optional, for cloning)
   - Download: https://git-scm.com/

### System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 2GB free space
- **Network**: Internet connection for initial setup

---

## 🔧 Installation Steps

### Step 1: Install Node.js

**Windows:**
1. Download installer from nodejs.org
2. Run installer with default settings
3. Verify: Open Command Prompt and run `node --version`

**macOS:**
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Step 2: Install MongoDB

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**
   - Go to https://www.mongodb.com/atlas
   - Sign up for free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose free tier (M0)
   - Select region closest to you
   - Click "Create"

3. **Configure Access**
   - Go to "Database Access"
   - Add new database user
   - Set username and password
   - Save credentials securely

4. **Network Access**
   - Go to "Network Access"
   - Add IP address: `0.0.0.0/0` (for development)
   - Or add your specific IP

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

#### Option B: Local MongoDB Installation

**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Complete" installation
4. Check "Install MongoDB as a Service"
5. Install MongoDB Compass (optional GUI)

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify
mongod --version
```

**Linux:**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 3: Clone/Download Project

**Using Git:**
```bash
git clone <repository-url>
cd SEB-Lite
```

**Or download ZIP:**
- Extract to desired location
- Navigate to folder in terminal

### Step 4: Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm run install-all

# This will:
# - Install root dependencies (concurrently, electron)
# - Install backend dependencies (express, mongoose, etc.)
# - Install frontend dependencies (react, tailwind, etc.)
```

**Expected Output:**
```
✓ Root dependencies installed
✓ Backend dependencies installed (191 packages)
✓ Frontend dependencies installed (100 packages)
```

**If installation fails:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install-all
```

### Step 5: Configure Environment

1. **Create `.env` file** in project root:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your settings:

   **For MongoDB Atlas:**
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seb-lite?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   REACT_APP_API_URL=http://localhost:5001/api
   ```

   **For Local MongoDB:**
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/seb-lite
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   REACT_APP_API_URL=http://localhost:5001/api
   ```

3. **Important**: Change `JWT_SECRET` to a strong random string for production!

### Step 6: Start MongoDB (Local Only)

**If using local MongoDB:**

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run manually
mongod
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Verify MongoDB is running:**
```bash
# Should connect successfully
mongosh
# Or
mongo
```

### Step 7: Initialize Database (Optional)

Create sample data for testing:

```bash
node db-init.js
```

This creates:
- Sample instructor account
- Sample student account
- Sample exam

**Test Credentials:**
- Instructor: `instructor@seb-lite.com` / `instructor123`
- Student: `student@seb-lite.com` / `student123`

### Step 8: Start Application

```bash
# Start everything (backend + frontend + electron)
npm start
```

**Or start individually:**

**Terminal 1 - Backend:**
```bash
npm run backend
# Server running on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
npm run frontend
# App running on http://localhost:3000
```

**Terminal 3 - Electron (Optional):**
```bash
npm run electron
# Desktop app launches
```

---

## ✅ Verification

### Check Backend

1. **Health Check:**
   ```bash
   curl http://localhost:5001/api/health
   ```
   Should return: `{"status":"Server is running"}`

2. **Check Console:**
   - Should see: `✓ Backend server running on http://localhost:5001`
   - Should see: `✅ MongoDB connected successfully`

### Check Frontend

1. **Open Browser:**
   - Navigate to http://localhost:3000
   - Should see login page

2. **Check Console:**
   - Open browser DevTools (F12)
   - No errors should appear

### Check Database

**Using MongoDB Compass:**
1. Download: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://127.0.0.1:27017` (local) or your Atlas URI
3. Should see `seb_lite` database

**Using Command Line:**
```bash
mongosh seb_lite
# Or
mongo seb_lite

# List collections
show collections
# Should show: users, exams, answers, violations
```

---

## 🧪 Testing

### Test API Endpoints

```bash
# Run API tests
npm run test-api

# Run full test suite
npm run test-full
```

### Manual Testing

1. **Register User:**
   - Go to http://localhost:3000
   - Click "Register"
   - Fill form and submit

2. **Login:**
   - Use registered credentials
   - Should redirect to dashboard

3. **Create Exam (Instructor):**
   - Register as instructor
   - Go to Create Exam page
   - Fill exam details
   - Add questions
   - Submit

4. **Take Exam (Student):**
   - Register as student
   - View available exams
   - Start exam
   - Answer questions
   - Submit

---

## 🐛 Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error:**
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
1. Ensure MongoDB is running: `mongod` or `brew services start mongodb-community`
2. Check connection string in `.env`
3. Verify MongoDB port (default: 27017)
4. Check firewall settings
5. For Atlas: Verify network access and credentials

### Issue: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solutions:**
1. **Kill process:**
   ```bash
   # macOS/Linux
   lsof -ti:5001 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5001
   taskkill /PID <PID> /F
   ```

2. **Change port in `.env`:**
   ```env
   PORT=5002
   ```

### Issue: npm install Fails

**Error:**
```
npm ERR! code ELIFECYCLE
```

**Solutions:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

2. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Update npm:
   ```bash
   npm install -g npm@latest
   ```

4. Use yarn instead:
   ```bash
   yarn install
   ```

### Issue: Electron Won't Launch

**Solutions:**
1. Ensure frontend is running on port 3000
2. Check Electron installation:
   ```bash
   npm --prefix frontend install electron
   ```
3. Verify `electron/main.js` exists
4. Check console for errors

### Issue: Frontend Build Errors

**Error:**
```
Module not found: Can't resolve '...'
```

**Solutions:**
1. Reinstall dependencies:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear React cache:
   ```bash
   rm -rf frontend/.cache
   ```

### Issue: JWT Token Errors

**Error:**
```
Invalid or expired token
```

**Solutions:**
1. Check `JWT_SECRET` in `.env`
2. Clear localStorage and re-login
3. Verify token expiration (default: 24 hours)

---

## 🔐 Security Checklist

Before production deployment:

- [ ] Change `JWT_SECRET` to strong random string
- [ ] Use MongoDB Atlas with authentication
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for specific domains
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Review and update violation thresholds
- [ ] Enable Electron code signing
- [ ] Add input validation on frontend
- [ ] Implement CAPTCHA for registration

---

## 📚 Next Steps

1. **Read Documentation:**
   - `Readme/README.md` - Complete documentation
   - `Readme/QUICK_START.md` - Quick reference

2. **Explore Features:**
   - Create your first exam
   - Test security features
   - Review violation monitoring

3. **Customize:**
   - Modify UI styling
   - Adjust security settings
   - Add custom features

---

## 💡 Tips

1. **Use MongoDB Compass** for easy database visualization
2. **Enable DevTools** in development for debugging
3. **Use Postman** or **Insomnia** for API testing
4. **Monitor console logs** for debugging
5. **Keep `.env` secure** - never commit to git

---

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Review `Readme/README.md` for detailed documentation
3. Check browser console (F12) for frontend errors
4. Check terminal output for backend errors
5. Verify MongoDB connection
6. Review environment variables

---

**Setup Complete!** 🎉

Your SEB-Lite application should now be running. Navigate to http://localhost:3000 to get started!
