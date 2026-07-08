require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...');
  console.log(`📡 Using URI: ${process.env.MONGO_URI.replace(/\/\/[^@]+@/, '//****:****@')}`);
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
      maxPoolSize: 5,
    });
    
    console.log('✅ Connection successful!');
    console.log(`📦 Database: ${conn.connection.db.databaseName}`);
    console.log(`🔗 Host: ${conn.connection.host}`);
    console.log(`📊 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📚 Collections: ${collections.map(c => c.name).join(', ') || 'No collections found (this is normal for a new database)'}`);
    
    await mongoose.disconnect();
    console.log('✅ Test complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('\n🔧 Troubleshooting Guide:');
    console.log('1. Check your internet connection');
    console.log('2. Verify MongoDB Atlas cluster is running: https://status.mongodb.com/');
    console.log('3. Check Network Access: MongoDB Atlas → Network Access → Add 0.0.0.0/0');
    console.log('4. Verify credentials: Username "loop", Password "2004"');
    console.log('5. Try flushing DNS: ipconfig /flushdns (Windows)');
    console.log('6. Use Google DNS: 8.8.8.8 and 1.1.1.1');
    process.exit(1);
  }
}

testConnection();