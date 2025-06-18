// Simple MongoDB connection test
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...\n');
        
        const uri = process.env.MONGODB_URI || 'mongodb+srv://eternum:RgnsZBpHwHaEGArI@eternum.oe2on.mongodb.net/?retryWrites=true&w=majority&appName=Eternum';
        console.log('Connection URI:', uri.replace(/:[^:@]*@/, ':****@'));
        
        console.log('\nAttempting to connect...');
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected successfully!');
        
        // Get database info
        const db = mongoose.connection.db;
        console.log('\nDatabase Name:', db.databaseName);
        
        // List collections
        const collections = await db.listCollections().toArray();
        console.log('\nCollections found:', collections.length);
        collections.forEach(col => {
            console.log(' -', col.name);
        });
        
        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Connection closed successfully');
        
    } catch (error) {
        console.error('\n❌ Connection failed:');
        console.error('Error:', error.message);
        console.error('\nPossible issues:');
        console.error('1. Check your internet connection');
        console.error('2. Verify MongoDB Atlas whitelist includes your IP');
        console.error('3. Confirm the connection string is correct');
        console.error('4. Check if the cluster is active on MongoDB Atlas');
        
        process.exit(1);
    }
}

testConnection();