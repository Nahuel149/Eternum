// scripts/analyze-existing-database.js - Analyze existing MongoDB collections
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
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB Atlas\n');
        
        const db = mongoose.connection.db;
        
        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections in database "${db.databaseName}":\n`);
        
        // Our expected collections based on models
        const ourModels = {
            'users': User,
            'avatars': Avatar,
            'voiceprofiles': VoiceProfile,
            'permissions': Permission,
            'notifications': Notification
        };
        
        // Check existing collections
        for (const collection of collections) {
            const colName = collection.name;
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📁 Collection: ${colName}`);
            
            // Get collection stats
            const stats = await db.collection(colName).stats();
            const count = await db.collection(colName).countDocuments();
            console.log(`   Documents: ${count}`);
            console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
            
            // Check if we have a model for this collection
            const modelKey = colName.toLowerCase();
            if (ourModels[modelKey]) {
                console.log(`   ✅ Matches our model: ${modelKey}`);
                
                // Get a sample document
                const sample = await db.collection(colName).findOne();
                if (sample) {
                    console.log(`   Sample fields:`);
                    Object.keys(sample).slice(0, 10).forEach(field => {
                        const value = sample[field];
                        const type = Array.isArray(value) ? 'Array' : typeof value;
                        console.log(`      • ${field}: ${type}`);
                    });
                    
                    // Compare with our schema
                    const model = ourModels[modelKey];
                    const schemaFields = Object.keys(model.schema.paths);
                    const documentFields = Object.keys(sample);
                    
                    const missingInDoc = schemaFields.filter(f => !documentFields.includes(f) && !f.startsWith('_'));
                    const extraInDoc = documentFields.filter(f => !schemaFields.includes(f) && f !== '__v');
                    
                    if (missingInDoc.length > 0) {
                        console.log(`   ⚠️  Fields in schema but not in document:`);
                        missingInDoc.forEach(f => console.log(`      - ${f}`));
                    }
                    
                    if (extraInDoc.length > 0) {
                        console.log(`   ℹ️  Fields in document but not in schema:`);
                        extraInDoc.forEach(f => console.log(`      + ${f}`));
                    }
                }
            } else {
                console.log(`   ℹ️  No matching model in our backend`);
                
                // Show sample document structure
                const sample = await db.collection(colName).findOne();
                if (sample) {
                    console.log(`   Sample fields:`);
                    Object.keys(sample).slice(0, 10).forEach(field => {
                        const value = sample[field];
                        const type = Array.isArray(value) ? 'Array' : typeof value;
                        console.log(`      • ${field}: ${type}`);
                    });
                }
            }
        }
        
        // Check which of our models don't have collections
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`\n📋 Model Analysis:\n`);
        
        const collectionNames = collections.map(c => c.name.toLowerCase());
        
        Object.entries(ourModels).forEach(([modelName, model]) => {
            const exists = collectionNames.includes(modelName);
            console.log(`   ${modelName}: ${exists ? '✅ Collection exists' : '❌ Collection missing'}`);
        });
        
        // Summary
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`\n📊 Summary:\n`);
        
        console.log(`   Database: ${db.databaseName}`);
        console.log(`   Total Collections: ${collections.length}`);
        console.log(`   Collections matching our models: ${Object.keys(ourModels).filter(m => collectionNames.includes(m)).length}`);
        console.log(`   Additional collections in database: ${collections.length - Object.keys(ourModels).filter(m => collectionNames.includes(m)).length}`);
        
        // List extra collections
        const extraCollections = collections
            .map(c => c.name)
            .filter(name => !Object.keys(ourModels).includes(name.toLowerCase()));
        
        if (extraCollections.length > 0) {
            console.log(`\n   Extra collections (not in our models):`);
            extraCollections.forEach(col => console.log(`      • ${col}`));
        }
        
        await mongoose.connection.close();
        console.log('\n✅ Analysis complete!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

analyzeDatabase();