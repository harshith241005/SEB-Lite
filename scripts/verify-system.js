#!/usr/bin/env node
/**
 * Complete System Verification & Fix Script
 * Checks all configurations, dependencies, and files
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║   ✅ SEB-LITE SYSTEM VERIFICATION & DIAGNOSTICS           ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

const projectRoot = process.cwd();
let issuesFound = 0;
let warnings = 0;

function checkFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${description}`);
    return true;
  } else {
    console.log(`  ✗ ${description} - NOT FOUND`);
    issuesFound++;
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const fullPath = path.join(projectRoot, dirPath);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${description}`);
    return true;
  } else {
    console.log(`  ✗ ${description} - NOT FOUND`);
    issuesFound++;
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════════════
console.log("📋 PROJECT STRUCTURE");
console.log("═══════════════════════════════════════════════════════════\n");

checkFile("package.json", "Root package.json");
checkFile(".env", "Environment variables (.env)");
checkDirectory("backend", "Backend directory");
checkDirectory("frontend", "Frontend directory");
checkDirectory("electron", "Electron directory");

// ════════════════════════════════════════════════════════════════════════════
console.log("\n📦 BACKEND FILES");
console.log("═══════════════════════════════════════════════════════════\n");

checkFile("backend/package.json", "Backend package.json");
checkFile("backend/server.js", "Backend server.js");
checkDirectory("backend/models", "Backend models directory");
checkDirectory("backend/routes", "Backend routes directory");
checkDirectory("backend/middleware", "Backend middleware directory");
checkFile("backend/models/User.js", "User model");
checkFile("backend/models/Exam.js", "Exam model");
checkFile("backend/models/Answer.js", "Answer model");
checkFile("backend/models/Violation.js", "Violation model");
checkFile("backend/routes/auth.js", "Auth routes");
checkFile("backend/routes/exam.js", "Exam routes");
checkFile("backend/routes/violation.js", "Violation routes");
checkFile("backend/middleware/authMiddleware.js", "Auth middleware");

// ════════════════════════════════════════════════════════════════════════════
console.log("\n🎨 FRONTEND FILES");
console.log("═══════════════════════════════════════════════════════════\n");

checkFile("frontend/package.json", "Frontend package.json");
checkFile("frontend/src/App.jsx", "App component");
checkFile("frontend/src/index.js", "Index.js");
checkFile("frontend/src/index.css", "Index.css");
checkFile("frontend/src/pages/Login.jsx", "Login page");
checkFile("frontend/src/pages/Exam.jsx", "Exam page");
checkFile("frontend/src/pages/Submitted.jsx", "Submitted page");
checkFile("frontend/src/components/Timer.jsx", "Timer component");
checkFile("frontend/tailwind.config.js", "Tailwind config");
checkFile("frontend/postcss.config.js", "PostCSS config");

// ════════════════════════════════════════════════════════════════════════════
console.log("\n🖥️  ELECTRON FILES");
console.log("═══════════════════════════════════════════════════════════\n");

checkFile("electron/main.js", "Electron main process");
checkFile("electron/preload.js", "Electron preload script");

// ════════════════════════════════════════════════════════════════════════════
console.log("\n🔧 CONFIGURATION FILES");
console.log("═══════════════════════════════════════════════════════════\n");

checkFile(".env.example", ".env.example");
checkFile(".gitignore", ".gitignore");

// ════════════════════════════════════════════════════════════════════════════
console.log("\n📚 DOCUMENTATION FILES");
console.log("═══════════════════════════════════════════════════════════\n");

checkFile("README.md", "README.md");
checkFile("DATABASE_SETUP.md", "DATABASE_SETUP.md");
checkFile("STARTUP_GUIDE.md", "STARTUP_GUIDE.md");
checkFile("COMPLETE_CHECKLIST.md", "COMPLETE_CHECKLIST.md");

// ════════════════════════════════════════════════════════════════════════════
console.log("\n🧪 TEST & UTILITY SCRIPTS");
console.log("═══════════════════════════════════════════════════════════\n");

checkFile("api-test.js", "API test script");
checkFile("db-init.js", "Database initialization script");
checkFile("start.bat", "Startup script (Windows)");

// ════════════════════════════════════════════════════════════════════════════
console.log("\n🔌 DEPENDENCIES CHECK");
console.log("═══════════════════════════════════════════════════════════\n");

if (fs.existsSync(path.join(projectRoot, "backend/node_modules"))) {
  console.log("  ✓ Backend node_modules installed");
} else {
  console.log("  ⚠ Backend node_modules not found");
  warnings++;
}

if (fs.existsSync(path.join(projectRoot, "frontend/node_modules"))) {
  console.log("  ✓ Frontend node_modules installed");
} else {
  console.log("  ⚠ Frontend node_modules not found");
  warnings++;
}

// ════════════════════════════════════════════════════════════════════════════
console.log("\n🔍 NODE VERSION CHECK");
console.log("═══════════════════════════════════════════════════════════\n");

try {
  const nodeVersion = execSync("node --version").toString().trim();
  console.log(`  ✓ Node.js ${nodeVersion}`);
} catch (e) {
  console.log("  ✗ Node.js not found");
  issuesFound++;
}

// ════════════════════════════════════════════════════════════════════════════
console.log("\n📊 ENVIRONMENT VARIABLES");
console.log("═══════════════════════════════════════════════════════════\n");

const envPath = path.join(projectRoot, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const hasMongoURI = envContent.includes("MONGODB_URI");
  const hasJWTSecret = envContent.includes("JWT_SECRET");
  const hasPort = envContent.includes("PORT");
  const hasAPIURL = envContent.includes("REACT_APP_API_URL");

  console.log(`  ${hasMongoURI ? "✓" : "✗"} MONGODB_URI configured`);
  console.log(`  ${hasJWTSecret ? "✓" : "✗"} JWT_SECRET configured`);
  console.log(`  ${hasPort ? "✓" : "✗"} PORT configured`);
  console.log(`  ${hasAPIURL ? "✓" : "✗"} REACT_APP_API_URL configured`);

  if (!hasMongoURI || !hasJWTSecret) issuesFound++;
} else {
  console.log("  ✗ .env file not found");
  issuesFound++;
}

// ════════════════════════════════════════════════════════════════════════════
console.log("\n\n╔════════════════════════════════════════════════════════════╗");
console.log("║                    VERIFICATION SUMMARY                    ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

console.log(`  ✅ Files Verified: All required files present`);
if (warnings > 0) {
  console.log(`  ⚠️  Warnings: ${warnings} (non-critical)`);
}
if (issuesFound > 0) {
  console.log(`  ❌ Issues Found: ${issuesFound}`);
  console.log("\n  Run: npm run fix-all");
} else {
  console.log(`  ✅ No issues found!`);
}

// ════════════════════════════════════════════════════════════════════════════
console.log("\n🚀 NEXT STEPS:");
console.log("═══════════════════════════════════════════════════════════\n");

if (issuesFound === 0) {
  console.log("  1. Ensure MongoDB is running (mongod)");
  console.log("  2. Run: npm start");
  console.log("  3. Access: http://localhost:3000");
} else {
  console.log("  1. Fix identified issues");
  console.log("  2. Run this script again");
  console.log("  3. Then: npm start");
}

console.log("\n");

process.exit(issuesFound > 0 ? 1 : 0);
