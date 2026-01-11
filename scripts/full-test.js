#!/usr/bin/env node

/**
 * SEB-Lite Full Application Test Runner
 * Tests backend, frontend, and integration
 * Usage: node full-test.js
 */

const { spawn } = require('child_process');
const http = require('http');

const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:3000';

let backendProcess = null;
let frontendProcess = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testBackend() {
  console.log('\n🔧 Testing Backend Server...');

  try {
    // Test health endpoint
    const healthResponse = await makeRequest(`${BACKEND_URL}/api/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Backend health check passed');
      return true;
    } else {
      console.log('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend connection failed: ${error.message}`);
    return false;
  }
}

async function testFrontend() {
  console.log('\n🌐 Testing Frontend Server...');

  try {
    // Test if frontend is responding
    const response = await makeRequest(FRONTEND_URL);
    if (response.status === 200) {
      console.log('✅ Frontend server responding');
      return true;
    } else {
      console.log('❌ Frontend server not responding');
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend connection failed: ${error.message}`);
    return false;
  }
}

async function runApiTests() {
  console.log('\n🔍 Running API Tests...');

  return new Promise((resolve) => {
    const apiTest = spawn('node', ['api-test.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    apiTest.on('close', (code) => {
      if (code === 0) {
        console.log('✅ API tests passed');
        resolve(true);
      } else {
        console.log('❌ API tests failed');
        resolve(false);
      }
    });

    apiTest.on('error', (error) => {
      console.log(`❌ API test execution failed: ${error.message}`);
      resolve(false);
    });
  });
}

async function startServices() {
  console.log('🚀 Starting Services...');

  // Start backend
  backendProcess = spawn('cmd', ['/c', 'npm run backend'], {
    stdio: 'pipe',
    cwd: process.cwd(),
    detached: true
  });

  // Start frontend
  frontendProcess = spawn('cmd', ['/c', 'npm run frontend'], {
    stdio: 'pipe',
    cwd: process.cwd(),
    detached: true
  });

  console.log('⏳ Waiting for services to start...');
  await sleep(10000); // Wait 10 seconds for services to start

  return true;
}

async function stopServices() {
  console.log('\n🛑 Stopping Services...');

  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }

  await sleep(2000);
}

async function runFullTest() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 SEB-LITE FULL APPLICATION TEST              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const results = {};

  try {
    // Start services
    console.log('\n1. Starting Services...');
    await startServices();

    // Test backend
    console.log('\n2. Testing Backend...');
    results.backend = await testBackend();

    // Test frontend
    console.log('\n3. Testing Frontend...');
    results.frontend = await testFrontend();

    // Run API tests
    console.log('\n4. Running API Integration Tests...');
    results.api = await runApiTests();

  } finally {
    await stopServices();
  }

  // Summary
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      📊 TEST SUMMARY                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  let passed = 0;
  let failed = 0;

  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}  ${test.charAt(0).toUpperCase() + test.slice(1)}`);
    result ? passed++ : failed++;
  }

  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`);
  console.log('───────────────────────────────────────────────────────────────\n');

  if (failed === 0) {
    console.log('🎉 All tests passed! SEB-Lite is fully functional.\n');
    console.log('📋 Next Steps:');
    console.log('1. Run: npm start (to start all services)');
    console.log('2. Open: http://localhost:3000 (web app)');
    console.log('3. Or run: npm run electron (desktop app)');
    console.log('4. Register an instructor account to create exams');
    console.log('5. Register student accounts to take exams\n');
    process.exit(0);
  } else {
    console.log(`❌ ${failed} test(s) failed. Check the errors above.\n`);
    console.log('🔧 Troubleshooting:');
    console.log('1. Ensure MongoDB is running: setup-mongodb.bat');
    console.log('2. Check if ports 5001 (backend) and 3000 (frontend) are free');
    console.log('3. Verify all dependencies are installed: npm run install-all\n');
    process.exit(1);
  }
}

// Run full test
runFullTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});