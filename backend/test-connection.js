/**
 * Quick test script to verify MongoDB connection
 * Run: node test-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shiplink';

console.log('🔍 Testing MongoDB connection...');
console.log('Connection string:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! Connected to MongoDB');
    console.log('✅ Your connection string is correct!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ FAILED! Connection error:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 SOLUTION:');
      console.log('1. Check username and password in MongoDB Atlas');
      console.log('2. If password has special characters (@, #, etc.), URL-encode them:');
      console.log('   @ = %40');
      console.log('   # = %23');
      console.log('   % = %25');
      console.log('3. Update MONGODB_URI in .env file');
    }
    
    process.exit(1);
  });


