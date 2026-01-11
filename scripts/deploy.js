#!/usr/bin/env node

/**
 * SEB-Lite Deployment Script
 * Builds and packages the application for production
 * Usage: node deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function createDeploymentPackage() {
  console.log('\n📦 Creating deployment package...');

  const deployDir = 'seb-lite-deployment';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Create deployment directory
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir);
  }

  // Copy necessary files
  const filesToCopy = [
    'README.md',
    'package.json',
    'backend/package.json',
    'backend/server.js',
    'backend/.env.example',
    'frontend/package.json',
    'electron/main.js',
    'electron/preload.js',
    'setup-mongodb.bat',
    'api-test.js'
  ];

  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      const dest = path.join(deployDir, file);
      const destDir = path.dirname(dest);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFileSync(file, dest);
    }
  });

  // Create deployment README
  const deployReadme = `# SEB-Lite Deployment Package

Generated on: ${new Date().toISOString()}

## Quick Start

1. Extract this package to your desired location
2. Run: \`setup-mongodb.bat\` (Windows only)
3. Run: \`npm run install-all\`
4. Run: \`npm start\`

## Files Included

- Complete source code
- Package configurations
- Database setup script
- API testing tools
- Documentation

## Production Deployment

For production deployment:

1. Set up MongoDB Atlas or dedicated MongoDB instance
2. Update \`.env\` with production database URL
3. Set NODE_ENV=production
4. Use a process manager like PM2 for the backend
5. Configure reverse proxy (nginx) for production

## Security Notes

- Change JWT_SECRET to a strong random value
- Use HTTPS in production
- Configure proper CORS settings
- Set up database authentication
- Regular security updates

---
Built with SEB-Lite Deployment Script
`;

  fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT-README.md'), deployReadme);

  console.log(`✅ Deployment package created: ${deployDir}`);
  console.log(`📁 Package size: ${getDirectorySize(deployDir)} MB`);
}

function getDirectorySize(dirPath) {
  let totalSize = 0;

  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath);
      items.forEach(item => {
        calculateSize(path.join(itemPath, item));
      });
    } else {
      totalSize += stats.size;
    }
  }

  calculateSize(dirPath);
  return (totalSize / (1024 * 1024)).toFixed(2);
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                🚀 SEB-LITE DEPLOYMENT BUILD                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Build backend
  runCommand('npm --prefix backend install', 'Installing backend dependencies');

  // Build frontend
  runCommand('npm --prefix frontend install', 'Installing frontend dependencies');
  runCommand('npm --prefix frontend run build', 'Building frontend production bundle');

  // Build Electron app
  runCommand('npm --prefix frontend run build-electron', 'Building Electron desktop application');

  // Create deployment package
  createDeploymentPackage();

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   🎉 DEPLOYMENT COMPLETE!                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  console.log('\n📋 Deployment Summary:');
  console.log('✅ Backend dependencies installed');
  console.log('✅ Frontend production build completed');
  console.log('✅ Electron desktop app built');
  console.log('✅ Deployment package created');

  console.log('\n📦 Files generated:');
  console.log('- frontend/build/ (React production build)');
  console.log('- frontend/dist/ (Electron app packages)');
  console.log('- seb-lite-deployment/ (Complete deployment package)');

  console.log('\n🚀 To run the application:');
  console.log('1. Extract seb-lite-deployment.zip');
  console.log('2. Run setup-mongodb.bat (Windows)');
  console.log('3. Run npm start');

  console.log('\n🔒 Production Checklist:');
  console.log('- [ ] Set up production MongoDB database');
  console.log('- [ ] Configure environment variables');
  console.log('- [ ] Set up HTTPS certificates');
  console.log('- [ ] Configure firewall and security');
  console.log('- [ ] Set up monitoring and logging');
}

main().catch(error => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});