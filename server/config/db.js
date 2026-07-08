const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`📦 Database: ${conn.connection.db.databaseName}`);
    console.log(`🔗 Host: ${conn.connection.host}`);
    console.log(`📊 Connection state: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
    return conn;
    
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('\n🔧 Please verify:');
    console.error('1. Check your internet connection');
    console.error('2. MongoDB Atlas cluster is running (check status.mongodb.com)');
    console.error('3. Network Access allows your IP (0.0.0.0/0)');
    console.error('4. Username "loop" and password are correct');
    console.error('5. Connection string is properly formatted');
    console.error('\n💡 Your connection string should be:');
    console.error('mongodb+srv://loop:2004@cluster0.j95knif.mongodb.net/loop?retryWrites=true&w=majority&appName=Cluster0');
    
    // Exit if connection fails
    console.error('\n❌ Server will exit. Fix the connection and restart.');
    process.exit(1);
  }
};