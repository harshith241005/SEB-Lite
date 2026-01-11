#!/bin/bash
# SEB-Lite Quick Start Script

echo "🚀 SEB-Lite Setup Wizard"
echo "=========================="
echo ""

# Check if MongoDB is running
echo "Checking MongoDB connection..."
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/seb-lite', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 2000
})
  .then(() => {
    console.log('✓ MongoDB is running');
    process.exit(0);
  })
  .catch(() => {
    console.log('✗ MongoDB is not running');
    console.log('Start MongoDB with: mongod');
    process.exit(1);
  });
" || exit 1

echo ""
echo "Installing dependencies..."
npm run install-all

echo ""
echo "✓ Setup complete!"
echo ""
echo "To start the application, run:"
echo "  npm start"
echo ""
echo "Or run services individually:"
echo "  Terminal 1: npm run backend"
echo "  Terminal 2: npm run frontend"
echo "  Terminal 3: npm run electron"
