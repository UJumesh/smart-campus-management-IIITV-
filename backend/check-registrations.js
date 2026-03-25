const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Get MongoDB URI from environment variables
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-campus';

console.log(`Using MongoDB URI: ${mongoUri}`);

mongoose.connect(mongoUri)
  .then(async () => {
    try {
      console.log('Connected to MongoDB');
      
      // Get all events with attendees
      const events = await Event.find().populate('attendees', 'firstName lastName email');
      
      console.log('\nEVENTS WITH REGISTRATIONS:');
      console.log('=========================\n');
      
      let totalRegistrations = 0;
      
      events.forEach(event => {
        const attendeeCount = event.attendees ? event.attendees.length : 0;
        totalRegistrations += attendeeCount;
        
        console.log(`Event: ${event.title}`);
        console.log(`Date: ${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`);
        console.log(`Status: ${event.status}`);
        console.log(`Attendees: ${attendeeCount}`);
        
        if (attendeeCount > 0) {
          console.log('Registered Users:');
          event.attendees.forEach((attendee, index) => {
            let userName = 'Unknown User';
            let email = 'No email';
            
            // Check if attendee is a populated object
            if (attendee && typeof attendee === 'object') {
              // Handle fully populated user object
              if (attendee.firstName && attendee.lastName) {
                userName = `${attendee.firstName} ${attendee.lastName}`;
              } 
              // Handle case where only one name field is available
              else if (attendee.firstName) {
                userName = attendee.firstName;
              }
              else if (attendee.lastName) {
                userName = attendee.lastName;
              }
              
              // Get email if available
              if (attendee.email) {
                email = attendee.email;
              }
            } 
            // Handle case where attendee is just an ID (not populated)
            else if (attendee) {
              userName = attendee.toString ? attendee.toString() : 'Unknown';
            }
            
            console.log(`  ${index + 1}. ${userName} (${email})`);
          });
        }
        
        console.log('------------------------\n');
      });
      
      console.log(`Total Events: ${events.length}`);
      console.log(`Total Registrations: ${totalRegistrations}`);
      
      // Get events with most registrations
      const topEvents = [...events]
        .sort((a, b) => (b.attendees ? b.attendees.length : 0) - (a.attendees ? a.attendees.length : 0))
        .slice(0, 5);
      
      console.log('\nTOP 5 EVENTS BY REGISTRATION:');
      topEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${event.attendees ? event.attendees.length : 0} registrations`);
      });
      
      mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    } catch (error) {
      console.error('Error:', error);
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 