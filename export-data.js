require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('./backend/models/User');
const Resource = require('./backend/models/Resource');
const Event = require('./backend/models/Event');

// Local database connection URI
const localUri = 'mongodb://127.0.0.1:27017/smart-campus';

// Create backups directory if it doesn't exist
const backupDir = path.join(__dirname, './backend/backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function exportData() {
  try {
    console.log('Connecting to local database...');
    await mongoose.connect(localUri);
    console.log(`Connected to local MongoDB at ${localUri}`);

    const backupData = {};

    // Export users
    console.log('Exporting User data...');
    const users = await User.find({});
    console.log(`Exported ${users.length} User documents`);
    backupData.users = users;

    // Export resources
    console.log('Exporting Resource data...');
    const resources = await Resource.find({});
    console.log(`Exported ${resources.length} Resource documents`);
    backupData.resources = resources;

    // Export events
    console.log('Exporting Event data...');
    const events = await Event.find({});
    console.log(`Exported ${events.length} Event documents`);
    backupData.events = events;

    // Save backup to file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFilePath = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    console.log(`Backup saved to ${backupFilePath}`);

    // Disconnect from local database
    await mongoose.disconnect();
    console.log('Disconnected from local database');

    console.log('Backup completed successfully!');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the export
exportData(); 