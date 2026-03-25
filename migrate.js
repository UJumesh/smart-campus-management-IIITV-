require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('./backend/models/User');
const Registration = require('./backend/models/Registration');
const Resource = require('./backend/models/Resource');
const Event = require('./backend/models/Event');
const Analytics = require('./backend/models/Analytics');
const Notification = require('./backend/models/Notification');
const Conversation = require('./backend/models/Conversation');
const Message = require('./backend/models/Message');
const Reservation = require('./backend/models/Reservation');
const Schedule = require('./backend/models/Schedule');

// Local database connection URI
const localUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-campus';

// Atlas database connection URI
const atlasUri = "mongodb+srv://janithrulz2001:password1234@scms.j4l2f.mongodb.net/smart-campus?retryWrites=true&w=majority";

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
const backupDir = path.join(__dirname, './backend/backups');
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
      
      // Insert data
      if (data[name] && data[name].length > 0) {
        try {
          await model.insertMany(data[name], { ordered: false });
          console.log(`Imported ${data[name].length} ${name} documents`.green);
        } catch (err) {
          console.log(`Some documents in ${name} were not imported: ${err.message}`.yellow);
        }
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

// Main migration function
const migrateData = async () => {
  console.log('=== Smart Campus Data Migration Tool ==='.bold.cyan);
  console.log(`Local Database: ${localUri}`.cyan);
  console.log(`Atlas Database: ${atlasUri}`.cyan);
  
  console.log('Starting data migration...'.cyan);
  try {
    const data = await exportData();
    await importData(data);
  } catch (err) {
    console.error(`Migration failed: ${err.message}`.red.bold);
  }
};

// Run migration
migrateData(); 