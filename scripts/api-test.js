#!/usr/bin/env node

/**
 * SEB-Lite API Test Script
 * Tests all major API endpoints
 * Usage: node api-test.js
 */

const http = require("http");

const API_URL = "http://localhost:5001";
const API_BASE = `${API_URL}/api`;

let authToken = null;
let userId = null;
let examId = null;

// Helper function to make HTTP requests
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (authToken) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed =
            res.statusCode === 204 ? null : JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers,
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log("\n🔍 Testing: Health Check");
  console.log("────────────────────────");

  try {
    const result = await request("GET", "/health");
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data)}`);
    return result.status === 200;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testRegister() {
  console.log("\n🔍 Testing: User Registration");
  console.log("─────────────────────────────");

  const testUser = {
    name: "Test Student",
    email: `student-${Date.now()}@test.edu`,
    password: "testpass123",
    role: "student",
  };

  try {
    const result = await request("POST", "/auth/register", testUser);
    console.log(`✅ Status: ${result.status}`);

    if (result.status === 201) {
      authToken = result.data.token;
      userId = result.data.user.id;
      console.log(`   User: ${result.data.user.name}`);
      console.log(`   Email: ${result.data.user.email}`);
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log(`❌ Unexpected status: ${result.status}`);
      console.log(`   Error: ${result.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetExams() {
  console.log("\n🔍 Testing: Get Exams");
  console.log("────────────────────");

  try {
    const result = await request("GET", "/exam");
    console.log(`✅ Status: ${result.status}`);

    if (Array.isArray(result.data)) {
      console.log(`   Found ${result.data.length} exam(s)`);
      if (result.data.length > 0) {
        examId = result.data[0]._id;
        console.log(`   Sample exam: ${result.data[0].title}`);
      }
    }

    return result.status === 200;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testCreateExam() {
  console.log("\n🔍 Testing: Create Exam");
  console.log("──────────────────────");

  const newExam = {
    title: `Test Exam ${Date.now()}`,
    description: "API Test Exam",
    duration: 30,
    totalQuestions: 2,
    passingPercentage: 50,
    questions: [
      {
        questionId: "q1",
        questionText: "What is 2+2?",
        questionType: "mcq",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        marks: 1,
      },
      {
        questionId: "q2",
        questionText: "What is 5*5?",
        questionType: "mcq",
        options: ["20", "25", "30", "35"],
        correctAnswer: "25",
        marks: 1,
      },
    ],
    proctoring: {
      enabled: true,
      recordWebcam: false,
      allowTabSwitch: false,
      maxAttempts: 1,
    },
  };

  try {
    const result = await request("POST", "/exam", newExam);
    console.log(`✅ Status: ${result.status}`);

    if (result.status === 201) {
      examId = result.data._id;
      console.log(`   Exam Created: ${result.data.title}`);
      console.log(`   Exam ID: ${examId}`);
      return true;
    } else {
      console.log(`❌ Unexpected status: ${result.status}`);
      console.log(`   Error: ${result.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testSubmitExam() {
  console.log("\n🔍 Testing: Submit Exam");
  console.log("──────────────────────");

  if (!examId) {
    console.log("⚠️  Skipping: No exam ID available");
    return false;
  }

  const submission = {
    answers: [
      { questionId: "q1", answer: "4" },
      { questionId: "q2", answer: "25" },
    ],
  };

  try {
    const result = await request("POST", `/exam/${examId}/submit`, submission);
    console.log(`✅ Status: ${result.status}`);

    if (result.status === 201) {
      console.log(`   Score: ${result.data.score}%`);
      console.log(`   Passed: ${result.data.passed ? "Yes" : "No"}`);
      console.log(`   Correct: ${result.data.submission.correctAnswers}/${result.data.submission.totalQuestions}`);
      return true;
    } else {
      console.log(`❌ Unexpected status: ${result.status}`);
      console.log(`   Error: ${result.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testLogViolation() {
  console.log("\n🔍 Testing: Log Violation");
  console.log("────────────────────────");

  if (!examId) {
    console.log("⚠️  Skipping: No exam ID available");
    return false;
  }

  const violation = {
    examId: examId,
    violationType: "tab_switch",
    severity: "high",
    description: "Test violation - tab switch detected",
  };

  try {
    const result = await request("POST", "/violation", violation);
    console.log(`✅ Status: ${result.status}`);

    if (result.status === 201) {
      console.log(`   Violation Type: ${result.data.violation.violationType}`);
      console.log(`   Severity: ${result.data.violation.severity}`);
    }

    return result.status === 201;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetProfile() {
  console.log("\n🔍 Testing: Get User Profile");
  console.log("───────────────────────────");

  try {
    const result = await request("GET", "/auth/profile");
    console.log(`✅ Status: ${result.status}`);

    if (result.status === 200) {
      console.log(`   Name: ${result.data.name}`);
      console.log(`   Email: ${result.data.email}`);
      console.log(`   Role: ${result.data.role}`);
    }

    return result.status === 200;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║          🧪 SEB-LITE API TEST SUITE                       ║");
  console.log("║                                                            ║");
  console.log(`║  API URL: ${API_URL}`);
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results = {};

  // Test 1: Health Check
  results["Health Check"] = await testHealthCheck();

  // Test 2: Register User
  results["Register User"] = await testRegister();

  // Test 3: Get Exams
  results["Get Exams"] = await testGetExams();

  // Test 4: Create Exam
  results["Create Exam"] = await testCreateExam();

  // Test 5: Get User Profile
  results["Get Profile"] = await testGetProfile();

  // Test 6: Submit Exam
  results["Submit Exam"] = await testSubmitExam();

  // Test 7: Log Violation
  results["Log Violation"] = await testLogViolation();

  // Summary
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                      📊 TEST SUMMARY                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  let passed = 0;
  let failed = 0;

  for (const [test, result] of Object.entries(results)) {
    const status = result ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${status}  ${test}`);
    result ? passed++ : failed++;
  }

  console.log("────────────────────────────────────────────────────────────");
  console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`);
  console.log("────────────────────────────────────────────────────────────\n");

  if (failed === 0) {
    console.log("✅ All tests passed! API is working correctly.\n");
    process.exit(0);
  } else {
    console.log(`❌ ${failed} test(s) failed. Check the errors above.\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
