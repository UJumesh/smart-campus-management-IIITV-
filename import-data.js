require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('./backend/models/User');
const Resource = require('./backend/models/Resource');
const Event = require('./backend/models/Event');

// MongoDB Atlas connection URI
const atlasUri = "mongodb+srv://janithrulz2001:password1234@scms.j4l2f.mongodb.net/smart-campus?retryWrites=true&w=majority";

// Path to backup file - should be the latest one in backups directory
const backupDir = path.join(__dirname, './backend/backups');

async function importData() {
  try {
    // Find the latest backup file
    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.json'));
    
    if (backupFiles.length === 0) {
      console.error('No backup files found in the backups directory');
      process.exit(1);
    }
    
    // Sort by date (filename format includes timestamp)
    backupFiles.sort();
    const latestBackup = backupFiles[backupFiles.length - 1];
    const backupFilePath = path.join(backupDir, latestBackup);
    
    console.log(`Using backup file: ${backupFilePath}`);
    
    // Read backup data
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    // Connect to Atlas
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(atlasUri);
    console.log('Connected to MongoDB Atlas');
    
    // Import Users
    if (backupData.users && backupData.users.length > 0) {
      console.log(`Importing ${backupData.users.length} User documents...`);
      try {
        // Clean up _id field
        const cleanedUsers = backupData.users.map(user => {
          const cleanUser = { ...user };
          if (cleanUser._id) delete cleanUser._id;
          return cleanUser;
        });
        
        await User.insertMany(cleanedUsers, { ordered: false });
        console.log('User import completed');
      } catch (err) {
        console.log(`Some User documents were not imported: ${err.message}`);
      }
    }
    
    // Import Resources
    if (backupData.resources && backupData.resources.length > 0) {
      console.log(`Importing ${backupData.resources.length} Resource documents...`);
      try {
        // Clean up _id field
        const cleanedResources = backupData.resources.map(resource => {
          const cleanResource = { ...resource };
          if (cleanResource._id) delete cleanResource._id;
          return cleanResource;
        });
        
        await Resource.insertMany(cleanedResources, { ordered: false });
        console.log('Resource import completed');
      } catch (err) {
        console.log(`Some Resource documents were not imported: ${err.message}`);
      }
    }
    
    // Import Events
    if (backupData.events && backupData.events.length > 0) {
      console.log(`Importing ${backupData.events.length} Event documents...`);
      try {
        // Clean up _id field
        const cleanedEvents = backupData.events.map(event => {
          const cleanEvent = { ...event };
          if (cleanEvent._id) delete cleanEvent._id;
          return cleanEvent;
        });
        
        await Event.insertMany(cleanedEvents, { ordered: false });
        console.log('Event import completed');
      } catch (err) {
        console.log(`Some Event documents were not imported: ${err.message}`);
      }
    }
    
    console.log('Import to MongoDB Atlas completed successfully');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the import
importData(); 