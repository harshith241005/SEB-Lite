// Simple exam import script
const { MongoClient } = require(__dirname + '/../backend/node_modules/mongodb');
const fs = require('fs');
const path = require('path');

async function importExam() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('seb-lite');
    const exams = db.collection('exams');

    // Read exam data from examples folder
    const examData = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/exam-data.json'), 'utf8'));

    // Add metadata
    examData.isActive = true;
    examData.createdAt = new Date();

    // Insert or update
    const result = await exams.replaceOne(
      { title: examData.title },
      examData,
      { upsert: true }
    );

    console.log('✅ Exam imported successfully!');
    console.log('📊 Operation:', result.upsertedCount ? 'Inserted' : 'Updated');
    console.log('📋 Exam details:');
    console.log(`   Title: ${examData.title}`);
    console.log(`   Duration: ${examData.duration} minutes`);
    console.log(`   Questions: ${examData.questions.length}`);
    console.log(`   Max Violations: ${examData.maxViolations}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

importExam();