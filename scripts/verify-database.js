// scripts/verify-database.js - Verify MongoDB Database Structure
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import all models
const User = require('../models/User');
const Avatar = require('../models/Avatar');
const VoiceProfile = require('../models/VoiceProfile');
const Permission = require('../models/Permission');
const Notification = require('../models/Notification');

// ANSI color codes for better output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

async function verifyDatabase() {
    try {
        console.log(`${colors.cyan}🔍 MongoDB Database Verification Script${colors.reset}\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://eternum:RgnsZBpHwHaEGArI@eternum.oe2on.mongodb.net/?retryWrites=true&w=majority&appName=Eternum';
        console.log(`${colors.blue}📡 Connecting to MongoDB...${colors.reset}`);
        console.log(`   URI: ${mongoUri.replace(/:[^:@]*@/, ':****@')}\n`);
        
        await mongoose.connect(mongoUri);
        console.log(`${colors.green}✅ Connected to MongoDB successfully!${colors.reset}\n`);
        
        // Get database info
        const db = mongoose.connection.db;
        const dbName = db.databaseName;
        console.log(`${colors.blue}📊 Database Name:${colors.reset} ${dbName}\n`);
        
        // List all collections
        console.log(`${colors.blue}📚 Collections in Database:${colors.reset}`);
        const collections = await db.listCollections().toArray();
        collections.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col.name}`);
        });
        console.log('');
        
        // Define models to verify
        const modelsToVerify = [
            { name: 'User', model: User },
            { name: 'Avatar', model: Avatar },
            { name: 'VoiceProfile', model: VoiceProfile },
            { name: 'Permission', model: Permission },
            { name: 'Notification', model: Notification }
        ];
        
        // Verify each model
        for (const { name, model } of modelsToVerify) {
            console.log(`${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
            console.log(`${colors.cyan}📋 Verifying ${name} Collection${colors.reset}\n`);
            
            // Get collection info
            const collectionName = model.collection.name;
            const collectionExists = collections.some(col => col.name === collectionName);
            
            console.log(`   Collection Name: ${collectionName}`);
            console.log(`   Exists: ${collectionExists ? colors.green + '✅ Yes' : colors.red + '❌ No'}${colors.reset}`);
            
            // Count documents
            const count = await model.countDocuments();
            console.log(`   Document Count: ${count}`);
            
            // Get schema paths
            console.log(`\n   ${colors.yellow}Schema Fields:${colors.reset}`);
            const schemaPaths = model.schema.paths;
            const pathKeys = Object.keys(schemaPaths).filter(key => !key.startsWith('_'));
            
            pathKeys.forEach(path => {
                const schemaType = schemaPaths[path].instance;
                const isRequired = schemaPaths[path].isRequired;
                const defaultValue = schemaPaths[path].defaultValue;
                
                let fieldInfo = `      • ${path} (${schemaType})`;
                if (isRequired) fieldInfo += ` ${colors.red}[Required]${colors.reset}`;
                if (defaultValue !== undefined) fieldInfo += ` ${colors.green}[Default: ${typeof defaultValue === 'function' ? 'function' : defaultValue}]${colors.reset}`;
                
                console.log(fieldInfo);
            });
            
            // Get indexes
            console.log(`\n   ${colors.yellow}Indexes:${colors.reset}`);
            const indexes = await model.collection.getIndexes();
            Object.entries(indexes).forEach(([indexName, indexSpec]) => {
                if (indexName !== '_id_') {
                    console.log(`      • ${indexName}: ${JSON.stringify(indexSpec.key)}`);
                }
            });
            
            // Sample document
            if (count > 0) {
                console.log(`\n   ${colors.yellow}Sample Document:${colors.reset}`);
                const sample = await model.findOne().lean();
                console.log(`      ${JSON.stringify(sample, null, 2).split('\n').join('\n      ')}`);
            }
            
            // Validate a sample document against schema
            if (count > 0) {
                console.log(`\n   ${colors.yellow}Schema Validation:${colors.reset}`);
                try {
                    const doc = await model.findOne();
                    await doc.validate();
                    console.log(`      ${colors.green}✅ Sample document passes schema validation${colors.reset}`);
                } catch (validationError) {
                    console.log(`      ${colors.red}❌ Validation Error: ${validationError.message}${colors.reset}`);
                }
            }
            
            console.log('');
        }
        
        // Database Statistics
        console.log(`${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.cyan}📊 Database Statistics${colors.reset}\n`);
        
        const stats = await db.stats();
        console.log(`   Database Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Number of Collections: ${stats.collections}`);
        console.log(`   Total Documents: ${stats.objects}`);
        console.log(`   Average Document Size: ${(stats.avgObjSize).toFixed(2)} bytes`);
        
        // Connection Details
        console.log(`\n${colors.cyan}🔗 Connection Details${colors.reset}\n`);
        console.log(`   Host: ${mongoose.connection.host}`);
        console.log(`   Port: ${mongoose.connection.port}`);
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Ready State: ${getReadyStateText(mongoose.connection.readyState)}`);
        
        // Summary
        console.log(`\n${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.cyan}📝 Summary${colors.reset}\n`);
        
        const allCollectionsExist = modelsToVerify.every(({ model }) => 
            collections.some(col => col.name === model.collection.name)
        );
        
        if (allCollectionsExist) {
            console.log(`   ${colors.green}✅ All expected collections are present in the database${colors.reset}`);
        } else {
            console.log(`   ${colors.red}❌ Some collections are missing${colors.reset}`);
        }
        
        // Check for unexpected collections
        const expectedCollections = modelsToVerify.map(({ model }) => model.collection.name);
        const unexpectedCollections = collections
            .map(col => col.name)
            .filter(name => !expectedCollections.includes(name) && !name.startsWith('system.'));
        
        if (unexpectedCollections.length > 0) {
            console.log(`\n   ${colors.yellow}⚠️  Unexpected collections found:${colors.reset}`);
            unexpectedCollections.forEach(col => {
                console.log(`      • ${col}`);
            });
        }
        
        // Test write permissions
        console.log(`\n${colors.cyan}🔐 Testing Write Permissions${colors.reset}\n`);
        try {
            const testDoc = new Notification({
                userId: new mongoose.Types.ObjectId(),
                notificationId: `test_${Date.now()}`,
                type: 'system_update',
                title: 'Test Notification',
                message: 'This is a test notification to verify write permissions',
                priority: 'low'
            });
            
            await testDoc.save();
            console.log(`   ${colors.green}✅ Write permissions confirmed${colors.reset}`);
            
            // Clean up test document
            await Notification.deleteOne({ _id: testDoc._id });
            console.log(`   ${colors.green}✅ Delete permissions confirmed${colors.reset}`);
            
        } catch (error) {
            console.log(`   ${colors.red}❌ Write permission error: ${error.message}${colors.reset}`);
        }
        
        console.log(`\n${colors.green}✅ Database verification completed successfully!${colors.reset}\n`);
        
        // Close connection
        await mongoose.connection.close();
        console.log(`${colors.blue}👋 Database connection closed${colors.reset}`);
        
    } catch (error) {
        console.error(`\n${colors.red}❌ Verification failed:${colors.reset}`, error.message);
        console.error('\nFull error:', error);
        
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        
        process.exit(1);
    }
}

function getReadyStateText(state) {
    switch (state) {
        case 0: return `${colors.red}Disconnected${colors.reset}`;
        case 1: return `${colors.green}Connected${colors.reset}`;
        case 2: return `${colors.yellow}Connecting${colors.reset}`;
        case 3: return `${colors.yellow}Disconnecting${colors.reset}`;
        default: return 'Unknown';
    }
}

// Run verification
if (require.main === module) {
    verifyDatabase();
}

module.exports = { verifyDatabase };