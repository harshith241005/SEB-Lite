# 📁 File Organization Guide

## Project Structure

```
SEB-Lite/
├── backend/                    # Backend API server
│   ├── config/                # Configuration files
│   │   └── db.js              # Database connection
│   ├── middleware/            # Express middleware
│   ├── models/                 # MongoDB models
│   ├── routes/                # API routes
│   ├── utils/                 # Utility functions
│   ├── db.js                  # Database abstraction layer
│   └── server.js              # Main server file
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # React Context providers
│   │   ├── pages/             # Page components
│   │   └── utils/             # Frontend utilities
│   └── public/                # Static assets
│
├── electron/                   # Electron desktop wrapper
│   ├── main.js               # Main Electron process
│   └── preload.js            # Secure IPC bridge
│
├── scripts/                    # Utility scripts (NEW)
│   ├── api-test.js           # API endpoint testing
│   ├── full-test.js          # Full integration testing
│   ├── deploy.js             # Deployment script
│   ├── db-init.js            # Database initialization
│   ├── verify-system.js      # System verification
│   ├── setup.bat             # Windows setup script
│   ├── setup-mongodb.bat     # MongoDB setup script
│   ├── start.bat             # Start script
│   └── setup.sh              # Linux/Mac setup script
│
├── examples/                   # Example files (NEW)
│   └── example-exam.json     # Example exam JSON format
│
├── Readme/                    # Documentation
│   ├── README.md             # Main documentation
│   ├── SETUP_GUIDE.md        # Setup instructions
│   ├── QUICK_START.md        # Quick reference
│   ├── DATABASE_SETUP.md     # Database guide
│   ├── FEATURES.md           # Feature list
│   ├── ENHANCEMENTS.md       # Enhancement summary
│   ├── AUTHENTICATION.md     # Authentication guide
│   ├── AUTHENTICATION_IMPROVEMENTS.md
│   ├── PROJECT_SPEC_COMPLIANCE.md
│   ├── DUPLICATES_REMOVED.md
│   └── FILE_ORGANIZATION.md  # This file
│
├── mongodb/                    # Local MongoDB data (runtime)
│   └── data/                  # Database files
│
├── package.json               # Root package.json
├── README.md                  # Quick overview (GitHub)
└── .gitignore                 # Git ignore rules
```

---

## 📂 Folder Purposes

### `backend/`
- **Purpose**: Backend API server (Node.js + Express)
- **Contains**: Models, routes, middleware, configuration
- **Key Files**:
  - `server.js` - Main server entry point
  - `db.js` - Database abstraction layer
  - `config/db.js` - Database connection setup

### `frontend/`
- **Purpose**: React frontend application
- **Contains**: Components, pages, utilities, static assets
- **Key Files**:
  - `src/App.jsx` - Main app component
  - `src/index.js` - Entry point

### `electron/`
- **Purpose**: Desktop security wrapper
- **Contains**: Electron main process and preload scripts
- **Key Files**:
  - `main.js` - Security enforcement
  - `preload.js` - Secure IPC bridge

### `scripts/` ⭐ NEW
- **Purpose**: Utility scripts for testing, deployment, and setup
- **Contains**:
  - **Test Scripts**: `api-test.js`, `full-test.js`
  - **Deployment**: `deploy.js`
  - **Database**: `db-init.js`
  - **System**: `verify-system.js`
  - **Setup**: `setup.bat`, `setup-mongodb.bat`, `start.bat`, `setup.sh`

### `examples/` ⭐ NEW
- **Purpose**: Example files and templates
- **Contains**:
  - `example-exam.json` - Example exam JSON format for import

### `Readme/`
- **Purpose**: All project documentation
- **Contains**: Setup guides, feature docs, API docs, etc.

---

## 🔧 Updated Scripts

After reorganization, use these commands:

```bash
# Testing
npm run test-api        # Run API tests (scripts/api-test.js)
npm run test-full       # Run full integration tests (scripts/full-test.js)
npm run verify          # Verify system (scripts/verify-system.js)

# Database
npm run db-init         # Initialize database (scripts/db-init.js)
npm run setup-db        # Setup MongoDB (scripts/setup-mongodb.bat)

# Deployment
npm run deploy          # Deploy application (scripts/deploy.js)
```

---

## 📝 Files Moved

### To `scripts/`
- ✅ `api-test.js` → `scripts/api-test.js`
- ✅ `full-test.js` → `scripts/full-test.js`
- ✅ `deploy.js` → `scripts/deploy.js`
- ✅ `db-init.js` → `scripts/db-init.js`
- ✅ `verify-system.js` → `scripts/verify-system.js`
- ✅ `setup.bat` → `scripts/setup.bat`
- ✅ `setup-mongodb.bat` → `scripts/setup-mongodb.bat`
- ✅ `start.bat` → `scripts/start.bat`
- ✅ `setup.sh` → `scripts/setup.sh`

### To `examples/`
- ✅ `example-exam.json` → `examples/example-exam.json`

### To `Readme/`
- ✅ `AUTHENTICATION_IMPROVEMENTS.md` → `Readme/AUTHENTICATION_IMPROVEMENTS.md`
- ✅ `PROJECT_SPEC_COMPLIANCE.md` → `Readme/PROJECT_SPEC_COMPLIANCE.md`
- ✅ `DUPLICATES_REMOVED.md` → `Readme/DUPLICATES_REMOVED.md`

---

## 🗑️ Files to Ignore (Runtime/Generated)

These files should be in `.gitignore`:

```
# MongoDB runtime files
mongodb/
mongodb-win32-x86_64-windows-7.0.2/
mongodb.zip

# Node modules
node_modules/
backend/node_modules/
frontend/node_modules/

# Build outputs
frontend/build/
dist/

# Environment files
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
```

---

## ✅ Benefits of Organization

1. **Cleaner Root Directory**: Only essential files at root level
2. **Better Organization**: Related files grouped together
3. **Easier Navigation**: Clear folder structure
4. **Maintainability**: Easier to find and update files
5. **Professional Structure**: Industry-standard organization

---

## 📚 Related Documentation

- See `Readme/README.md` for complete project documentation
- See `Readme/SETUP_GUIDE.md` for setup instructions
- See `Readme/QUICK_START.md` for quick reference

---

**Last Updated**: After file reorganization
**Status**: ✅ All files properly organized
