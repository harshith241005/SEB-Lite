# 🗄️ Database Setup Guide

Complete guide for setting up MongoDB for SEB-Lite.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Option 1: MongoDB Atlas (Cloud - Recommended)](#option-1-mongodb-atlas-cloud---recommended)
- [Option 2: Local MongoDB Installation](#option-2-local-mongodb-installation)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start

**For Quick Testing:**
1. Use MongoDB Atlas (free tier)
2. Get connection string
3. Add to `.env` file
4. Done!

**For Development:**
1. Install local MongoDB
2. Start MongoDB service
3. Configure `.env`
4. Initialize database

---

## ☁️ Option 1: MongoDB Atlas (Cloud - Recommended)

### Why MongoDB Atlas?

✅ **Free Tier Available** - 512MB storage, perfect for development  
✅ **No Installation Required** - Cloud-based, ready to use  
✅ **Automatic Backups** - Data safety guaranteed  
✅ **Easy Scaling** - Upgrade when needed  
✅ **Production Ready** - Used by many production apps  

### Setup Steps

#### Step 1: Create Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Sign up with email or Google account
4. Verify your email

#### Step 2: Create Cluster

1. Click "Build a Database"
2. Choose **FREE (M0) Shared** tier
3. Select **AWS** as cloud provider
4. Choose region closest to you
5. Name your cluster (e.g., "SEB-Lite")
6. Click "Create"

**Wait 3-5 minutes** for cluster to be created.

#### Step 3: Create Database User

1. Go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username (e.g., `sebadmin`)
5. Enter strong password (save it securely!)
6. Select "Atlas Admin" role
7. Click "Add User"

#### Step 4: Configure Network Access

1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses
5. Click "Confirm"

#### Step 5: Get Connection String

1. Go to "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

**Example:**
```
mongodb+srv://sebadmin:<password>@cluster0.xxxxx.mongodb.net/seb-lite?retryWrites=true&w=majority
```

#### Step 6: Update .env File

Replace `<password>` with your actual password:

```env
MONGODB_URI=mongodb+srv://sebadmin:yourpassword@cluster0.xxxxx.mongodb.net/seb-lite?retryWrites=true&w=majority
```

**Done!** Your database is ready.

---

## 💻 Option 2: Local MongoDB Installation

### Windows Installation

#### Method 1: MSI Installer (Recommended)

1. **Download MongoDB:**
   - Go to https://www.mongodb.com/try/download/community
   - Select: Windows → MSI
   - Click "Download"

2. **Run Installer:**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Install MongoDB Compass" (GUI tool)
   - Click "Install"

3. **Verify Installation:**
   ```powershell
   # Check if MongoDB service is running
   Get-Service MongoDB
   
   # Should show: Running
   ```

4. **Start MongoDB (if not running):**
   ```powershell
   # Start service
   net start MongoDB
   
   # Or run manually
   mongod
   ```

#### Method 2: Using Chocolatey

```powershell
# Install Chocolatey first (if not installed)
# Then:
choco install mongodb
```

#### Method 3: Using setup-mongodb.bat

```batch
# Run the provided script
setup-mongodb.bat
```

### macOS Installation

#### Using Homebrew (Recommended)

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify
mongod --version
```

#### Manual Installation

1. Download from https://www.mongodb.com/try/download/community
2. Extract and move to `/usr/local/mongodb`
3. Add to PATH
4. Start MongoDB: `mongod --config /usr/local/etc/mongod.conf`

### Linux Installation (Ubuntu/Debian)

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
```

### Docker Installation

```bash
# Pull MongoDB image
docker pull mongo

# Run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo

# Verify
docker ps
```

---

## ⚙️ Configuration

### Environment Variables

Create or update `.env` file in project root:

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seb-lite?retryWrites=true&w=majority
```

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/seb-lite
```

**For Docker MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/seb-lite
```

### Connection Options

**With Authentication:**
```env
MONGODB_URI=mongodb://username:password@127.0.0.1:27017/seb-lite?authSource=admin
```

**With SSL:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seb-lite?ssl=true
```

---

## ✅ Verification

### Test Connection

**Using MongoDB Compass:**
1. Download: https://www.mongodb.com/products/compass
2. Connect using connection string
3. Should see `seb_lite` database

**Using Command Line:**
```bash
# Connect to MongoDB
mongosh
# Or
mongo

# List databases
show dbs

# Use SEB-Lite database
use seb_lite

# List collections
show collections
```

**Using Node.js:**
```bash
# Run database initialization
node db-init.js

# Should create sample data
```

### Check Backend Connection

1. Start backend: `npm run backend`
2. Look for: `✅ MongoDB connected successfully`
3. If error, check connection string in `.env`

---

## 🐛 Troubleshooting

### Connection Refused Error

**Error:**
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
1. **Check if MongoDB is running:**
   ```bash
   # Windows
   Get-Service MongoDB
   
   # macOS/Linux
   sudo systemctl status mongod
   ```

2. **Start MongoDB:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Check port:**
   ```bash
   # Verify port 27017 is not in use
   netstat -an | findstr 27017
   ```

### Authentication Failed

**Error:**
```
MongoServerError: Authentication failed
```

**Solutions:**
1. Verify username and password in connection string
2. Check if user has proper permissions
3. For Atlas: Verify network access settings
4. For local: Check authentication database

### Network Access Denied (Atlas)

**Error:**
```
MongoServerError: IP not whitelisted
```

**Solutions:**
1. Go to Atlas → Network Access
2. Add your IP address (or 0.0.0.0/0 for development)
3. Wait 1-2 minutes for changes to apply

### Database Not Found

**Error:**
```
Database 'seb_lite' not found
```

**Solutions:**
1. Database is created automatically on first connection
2. Run `node db-init.js` to create collections
3. Verify connection string includes database name

### Connection Timeout

**Error:**
```
MongoServerError: connection timeout
```

**Solutions:**
1. Check internet connection (for Atlas)
2. Verify firewall settings
3. Check MongoDB service status
4. Increase timeout in connection string:
   ```
   ?serverSelectionTimeoutMS=5000
   ```

---

## 📊 Database Collections

SEB-Lite uses the following collections:

### users
- Stores user accounts (students, instructors, admins)
- Fields: name, email, password (hashed), role, isActive

### exams
- Stores exam definitions
- Fields: title, duration, questions, instructor, dates

### answers
- Stores student exam submissions
- Fields: studentId, examId, answers, score, submittedAt

### violations
- Stores security violation logs
- Fields: studentId, examId, violationType, severity, timestamp

**Collections are created automatically** when first data is inserted.

---

## 🔧 Advanced Configuration

### Enable Authentication (Local)

1. **Create admin user:**
   ```javascript
   use admin
   db.createUser({
     user: "admin",
     pwd: "password",
     roles: ["root"]
   })
   ```

2. **Update connection string:**
   ```env
   MONGODB_URI=mongodb://admin:password@127.0.0.1:27017/seb-lite?authSource=admin
   ```

### Enable SSL (Local)

1. Generate SSL certificates
2. Update `mongod.conf`:
   ```yaml
   net:
     ssl:
       mode: requireSSL
       PEMKeyFile: /path/to/cert.pem
   ```
3. Update connection string with `?ssl=true`

### Performance Tuning

**For Production:**
- Use connection pooling
- Enable indexes on frequently queried fields
- Set up replica sets for high availability
- Configure sharding for large datasets

---

## 📚 Additional Resources

- **MongoDB Documentation**: https://docs.mongodb.com/
- **MongoDB Atlas**: https://www.mongodb.com/atlas
- **MongoDB Compass**: https://www.mongodb.com/products/compass
- **MongoDB University**: https://university.mongodb.com/

---

## ✅ Quick Checklist

- [ ] MongoDB installed or Atlas account created
- [ ] Connection string obtained
- [ ] `.env` file configured
- [ ] MongoDB service running (local)
- [ ] Network access configured (Atlas)
- [ ] Database connection verified
- [ ] Collections created (via db-init.js)

---

**Database setup complete!** 🎉

Your SEB-Lite application is now ready to connect to MongoDB.
