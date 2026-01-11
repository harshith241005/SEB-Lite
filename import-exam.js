// Import exam data into MongoDB
const mongoose = require(__dirname + '/backend/node_modules/mongoose');
const fs = require('fs');
const path = require('path');

// Exam model (simplified)
const examSchema = new mongoose.Schema({
  title: String,
  duration: Number,
  maxViolations: Number,
  questions: [{
    id: Number,
    question: String,
    options: [String],
    correct: Number
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Exam = mongoose.model('Exam', examSchema);

async function importExamData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/seb-lite', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Read exam data
    const examDataPath = path.join(__dirname, 'exam-data.json');
    const examData = JSON.parse(fs.readFileSync(examDataPath, 'utf8'));

    // Check if exam already exists
    const existingExam = await Exam.findOne({ title: examData.title });
    if (existingExam) {
      console.log('⚠️  Exam already exists, updating...');
      await Exam.findByIdAndUpdate(existingExam._id, examData);
    } else {
      console.log('📝 Creating new exam...');
      const exam = new Exam(examData);
      await exam.save();
    }

    console.log('✅ Exam data imported successfully!');
    console.log('📊 Exam details:');
    console.log(`   Title: ${examData.title}`);
    console.log(`   Duration: ${examData.duration} minutes`);
    console.log(`   Questions: ${examData.questions.length}`);
    console.log(`   Max Violations: ${examData.maxViolations}`);

  } catch (error) {
    console.error('❌ Error importing exam data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the import
importExamData();