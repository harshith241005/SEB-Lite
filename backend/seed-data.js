#!/usr/bin/env node

/**
 * Seed script to populate the database with initial data
 * - Creates test users (admin, instructor, student)
 * - Imports placement exam from placement-quiz.json
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Exam = require('./models/Exam');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/seb_lite';

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create test users
    console.log('\n📝 Creating test users...');
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@seb.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Instructor User',
        email: 'instructor@seb.com',
        password: 'instructor123',
        role: 'instructor'
      },
      {
        name: 'Student User',
        email: 'student@seb.com',
        password: 'student123',
        role: 'student'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`  ℹ️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = new User(userData);
      await user.save();
      console.log(`  ✅ Created ${userData.role}: ${userData.email} / ${userData.password}`);
    }

    // Get instructor ID for exam creation
    const instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      console.error('❌ No instructor found. Cannot create exams.');
      process.exit(1);
    }

    // Load and import placement exam
    console.log('\n📝 Importing placement exam...');
    const examFilePath = path.join(__dirname, '../placement-quiz.json');
    
    if (!fs.existsSync(examFilePath)) {
      console.error(`❌ Exam file not found: ${examFilePath}`);
      process.exit(1);
    }

    const examData = JSON.parse(fs.readFileSync(examFilePath, 'utf8'));

    // Check if exam already exists
    const existingExam = await Exam.findOne({ title: examData.title });
    if (existingExam) {
      console.log('  ℹ️  Exam already exists, updating...');
      existingExam.questions = examData.questions;
      existingExam.duration = examData.duration;
      existingExam.maxViolations = examData.maxViolations;
      existingExam.isActive = examData.isActive;
      existingExam.company = examData.company;
      existingExam.type = examData.type;
      await existingExam.save();
      console.log('  ✅ Exam updated successfully');
    } else {
      const exam = new Exam({
        title: examData.title,
        company: examData.company,
        type: examData.type,
        duration: examData.duration,
        maxViolations: examData.maxViolations,
        isActive: examData.isActive,
        questions: examData.questions,
        instructor: instructor._id
      });

      await exam.save();
      console.log(`  ✅ Created exam: ${examData.title}`);
      console.log(`     - Questions: ${examData.questions.length}`);
      console.log(`     - Duration: ${examData.duration} minutes`);
      console.log(`     - Max Violations: ${examData.maxViolations}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔐 Test Credentials:');
    console.log('   Admin: admin@seb.com / admin123');
    console.log('   Instructor: instructor@seb.com / instructor123');
    console.log('   Student: student@seb.com / student123');
    console.log('\n🚀 You can now start the backend server');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the seed script
seedDatabase();
