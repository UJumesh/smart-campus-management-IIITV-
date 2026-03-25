require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('../models/User');
const Registration = require('../models/Registration');
const Resource = require('../models/Resource');
const Event = require('../models/Event');
const Analytics = require('../models/Analytics');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Reservation = require('../models/Reservation');
const Schedule = require('../models/Schedule');

// Local database connection URI
const localUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-campus';

// Atlas database connection URI - will be provided via command line
const atlasUri = process.argv[2];

if (!atlasUri) {
  console.error('Error: Atlas MongoDB URI is required as a command line argument'.red);
  console.log('Usage: node migrate-data.js "mongodb+srv://username:password@cluster.mongodb.net/database"'.yellow);
  process.exit(1);
}

// Models to migrate
const models = [
  { name: 'User', model: User },
  { name: 'Registration', model: Registration },
  { name: 'Resource', model: Resource },
  { name: 'Event', model: Event },
  { name: 'Analytics', model: Analytics },
  { name: 'Notification', model: Notification },
  { name: 'Conversation', model: Conversation },
  { name: 'Message', model: Message },
  { name: 'Reservation', model: Reservation },
  { name: 'Schedule', model: Schedule }
];

// Create backups directory if it doesn't exist
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Function to export data from local database
const exportData = async () => {
  try {
    console.log('Connecting to local database...'.cyan);
    await mongoose.connect(localUri);
    console.log(`Connected to local MongoDB at ${localUri}`.green);

    const backupData = {};

    // Export data from each model
    for (const { name, model } of models) {
      console.log(`Exporting ${name} data...`.cyan);
      const data = await model.find({});
      console.log(`Exported ${data.length} ${name} documents`.green);
      backupData[name] = data;
    }

    // Save backup to file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFilePath = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    console.log(`Backup saved to ${backupFilePath}`.green);

    // Disconnect from local database
    await mongoose.disconnect();
    console.log('Disconnected from local database'.yellow);

    return backupData;
  } catch (error) {
    console.error(`Error exporting data: ${error.message}`.red);
    process.exit(1);
  }
};

// Function to import data to Atlas database
const importData = async (data) => {
  try {
    console.log('Connecting to Atlas database...'.cyan);
    await mongoose.connect(atlasUri);
    console.log(`Connected to Atlas MongoDB at ${atlasUri}`.green);

    // Import data for each model
    for (const { name, model } of models) {
      console.log(`Importing ${name} data...`.cyan);
      
      // Check if collection exists and has data
      const count = await model.countDocuments();
      if (count > 0) {
        console.log(`WARNING: ${name} collection already has ${count} documents`.yellow);
        const proceed = await promptUser(`Do you want to proceed with importing ${name} data? This may create duplicates. (yes/no): `);
        
        if (proceed.toLowerCase() !== 'yes') {
          console.log(`Skipping import for ${name}`.yellow);
          continue;
        }
      }
      
      // Insert data
      if (data[name] && data[name].length > 0) {
        await model.insertMany(data[name], { ordered: false });
        console.log(`Imported ${data[name].length} ${name} documents`.green);
      } else {
        console.log(`No ${name} data to import`.yellow);
      }
    }

    // Disconnect from Atlas database
    await mongoose.disconnect();
    console.log('Disconnected from Atlas database'.yellow);
    console.log('Data migration completed successfully!'.green.bold);
  } catch (error) {
    console.error(`Error importing data: ${error.message}`.red);
    process.exit(1);
  }
};

// Prompt user for confirmation
function promptUser(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Main migration function
const migrateData = async () => {
  console.log('=== Smart Campus Data Migration Tool ==='.bold.cyan);
  console.log(`Local Database: ${localUri}`.cyan);
  console.log(`Atlas Database: ${atlasUri}`.cyan);
  
  const proceed = await promptUser('Are you sure you want to proceed with the migration? (yes/no): ');
  
  if (proceed.toLowerCase() !== 'yes') {
    console.log('Migration cancelled'.yellow);
    process.exit(0);
  }
  
  console.log('Starting data migration...'.cyan);
  const data = await exportData();
  await importData(data);
};

// Run migration
migrateData().catch(err => {
  console.error(`Migration failed: ${err.message}`.red.bold);
  process.exit(1);
}); 