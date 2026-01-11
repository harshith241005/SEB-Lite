const mongoose = require('mongoose');
const User = require('./models/User');
const Exam = require('./models/Exam');
require('dotenv').config();

async function runTests() {
  try {
    console.log('🧪 Running SEB-Lite Tests...\n');

    // Test 1: Environment Variables
    console.log('1. Testing Environment Variables...');
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
      console.log('Please create a .env file based on .env.example\n');
    } else {
      console.log('✅ All required environment variables are set\n');
    }

    // Test 2: Model Imports
    console.log('2. Testing Model Imports...');
    if (User && Exam) {
      console.log('✅ Models imported successfully\n');
    } else {
      console.log('❌ Model import failed\n');
    }

    // Test 3: Basic Model Validation (without DB)
    console.log('3. Testing Model Validation...');
    try {
      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'student'
      });
      await testUser.validate();
      console.log('✅ User model validation passed');
    } catch (error) {
      console.log('❌ User model validation failed:', error.message);
    }

    try {
      const testExam = new Exam({
        title: 'Test Exam',
        description: 'A test exam',
        duration: 60,
        totalQuestions: 10,
        passingPercentage: 60,
        questions: [{
          questionText: 'What is 2+2?',
          questionType: 'mcq',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          marks: 1
        }],
        instructor: new mongoose.Types.ObjectId(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true
      });
      await testExam.validate();
      console.log('✅ Exam model validation passed\n');
    } catch (error) {
      console.log('❌ Exam model validation failed:', error.message + '\n');
    }

    // Test 4: Database Connection (optional)
    console.log('4. Testing Database Connection (optional)...');
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Database connected successfully');
      await mongoose.connection.close();
    } catch (error) {
      console.log('⚠️  Database connection failed (this is OK for basic testing):', error.message);
      console.log('Make sure MongoDB is running for full functionality\n');
    }

    console.log('🎉 Basic tests completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start MongoDB: mongod');
    console.log('2. Start the backend server: npm run dev');
    console.log('3. Start the frontend: cd ../frontend && npm start');
    console.log('4. For desktop app: cd ../frontend && npm run electron-dev');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };