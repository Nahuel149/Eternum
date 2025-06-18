// scripts/analyze-database-simple.js - Analyze existing MongoDB collections
const mongoose = require('mongoose');
require('dotenv').config();

// Import our models
const User = require('../models/User');
const Avatar = require('../models/Avatar');
const VoiceProfile = require('../models/VoiceProfile');
const Permission = require('../models/Permission');
const Notification = require('../models/Notification');

async function analyzeDatabase() {
    try {
        console.log('🔍 Analyzing existing MongoDB database...\n');
        
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        
        console.log('✅ Connected to MongoDB Atlas\n');
        
        const db = mongoose.connection.db;
        
        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections in database "${db.databaseName}":\n`);
        
        // Our expected collections based on models
        const ourModels = {
            'users': { model: User, name: 'User' },
            'avatars': { model: Avatar, name: 'Avatar' },
            'voiceprofiles': { model: VoiceProfile, name: 'VoiceProfile' },
            'permissions': { model: Permission, name: 'Permission' },
            'notifications': { model: Notification, name: 'Notification' }
        };
        
        // First, let's see what collections exist
        console.log('📁 Existing Collections:\n');
        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            console.log(`   • ${collection.name} (${count} documents)`);
        }
        
        // Now let's check each of our models
        console.log('\n\n📋 Checking Our Models Against Database:\n');
        
        for (const [collectionName, modelInfo] of Object.entries(ourModels)) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🔍 Model: ${modelInfo.name}`);
            console.log(`   Expected collection: ${collectionName}`);
            
            // Check if collection exists
            const exists = collections.some(c => c.name.toLowerCase() === collectionName);
            console.log(`   Status: ${exists ? '✅ Collection exists' : '❌ Collection not found'}`);
            
            if (exists) {
                const count = await db.collection(collectionName).countDocuments();
                console.log(`   Documents: ${count}`);
                
                // Get a sample document
                const sample = await db.collection(collectionName).findOne();
                if (sample) {
                    console.log(`\n   Sample document structure:`);
                    const fields = Object.keys(sample);
                    fields.slice(0, 15).forEach(field => {
                        const value = sample[field];
                        let type = typeof value;
                        if (Array.isArray(value)) type = `Array[${value.length}]`;
                        if (value instanceof Date) type = 'Date';
                        if (value && value._bsontype) type = value._bsontype;
                        console.log(`      • ${field}: ${type}`);
                    });
                    if (fields.length > 15) {
                        console.log(`      ... and ${fields.length - 15} more fields`);
                    }
                    
                    // Compare with our schema
                    const model = modelInfo.model;
                    const schemaFields = Object.keys(model.schema.paths).filter(f => !f.startsWith('_'));
                    const documentFields = Object.keys(sample).filter(f => f !== '_id' && f !== '__v');
                    
                    const missingInDoc = schemaFields.filter(f => !documentFields.includes(f));
                    const extraInDoc = documentFields.filter(f => !schemaFields.includes(f));
                    
                    if (missingInDoc.length > 0) {
                        console.log(`\n   ⚠️  Schema fields missing in database:`);
                        missingInDoc.slice(0, 10).forEach(f => console.log(`      - ${f}`));
                        if (missingInDoc.length > 10) {
                            console.log(`      ... and ${missingInDoc.length - 10} more`);
                        }
                    }
                    
                    if (extraInDoc.length > 0) {
                        console.log(`\n   ℹ️  Database fields not in schema:`);
                        extraInDoc.slice(0, 10).forEach(f => console.log(`      + ${f}`));
                        if (extraInDoc.length > 10) {
                            console.log(`      ... and ${extraInDoc.length - 10} more`);
                        }
                    }
                    
                    if (missingInDoc.length === 0 && extraInDoc.length === 0) {
                        console.log(`\n   ✅ Schema and database structure match perfectly!`);
                    }
                }
            }
        }
        
        // Check for extra collections not in our models
        console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📊 Summary:\n');
        
        const modelCollectionNames = Object.keys(ourModels);
        const dbCollectionNames = collections.map(c => c.name.toLowerCase());
        
        const matchingCollections = modelCollectionNames.filter(m => dbCollectionNames.includes(m));
        const missingCollections = modelCollectionNames.filter(m => !dbCollectionNames.includes(m));
        const extraCollections = collections.filter(c => !modelCollectionNames.includes(c.name.toLowerCase()));
        
        console.log(`   Total collections in database: ${collections.length}`);
        console.log(`   Models defined in backend: ${modelCollectionNames.length}`);
        console.log(`   Matching collections: ${matchingCollections.length}`);
        
        if (missingCollections.length > 0) {
            console.log(`\n   ❌ Missing collections (need to create):`);
            missingCollections.forEach(col => console.log(`      • ${col}`));
        }
        
        if (extraCollections.length > 0) {
            console.log(`\n   ℹ️  Additional collections in database:`);
            extraCollections.forEach(col => {
                console.log(`      • ${col.name}`);
            });
        }
        
        // Test creating a document
        console.log('\n\n🧪 Testing Write Permissions...');
        try {
            // Try to create a test notification
            const testNotif = await db.collection('notifications').insertOne({
                userId: new mongoose.Types.ObjectId(),
                notificationId: `test_${Date.now()}`,
                type: 'system_update',
                title: 'Backend Connection Test',
                message: 'Testing backend integration',
                priority: 'low',
                read: false,
                createdAt: new Date()
            });
            
            console.log('   ✅ Write test successful');
            
            // Clean up
            await db.collection('notifications').deleteOne({ _id: testNotif.insertedId });
            console.log('   ✅ Delete test successful');
            
        } catch (error) {
            console.log('   ❌ Write test failed:', error.message);
        }
        
        await mongoose.connection.close();
        console.log('\n\n✅ Analysis complete!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

analyzeDatabase();