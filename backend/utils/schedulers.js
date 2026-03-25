const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Resource = require('../models/Resource');
const Notification = require('../models/Notification');
const cron = require('node-cron');

/**
 * Initialize all scheduled tasks
 */
const initSchedulers = () => {
  console.log('Initializing scheduled tasks...');
  
  // Check for expired reservations every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled task: Check for expired reservations');
    await updateResourceAvailability();
  });
  
  // Other schedulers can be added here
  
  console.log('All scheduled tasks initialized');
};

/**
 * Update resource availability after reservations end
 */
const updateResourceAvailability = async () => {
  try {
    const now = new Date();
    
    // Get all approved reservations that have ended
    const expiredReservations = await Reservation.find({
      status: 'approved',
      endTime: { $lt: now }
    }).populate('resource user');
    
    console.log(`Found ${expiredReservations.length} expired reservations`);
    
    // Get unique resource IDs from expired reservations
    const expiredResourceIds = [...new Set(expiredReservations.map(r => r.resource._id.toString()))];
    
    // For each resource, check if there are any active reservations
    for (const resourceId of expiredResourceIds) {
      // Check if the resource has any current approved reservations
      const activeReservations = await Reservation.findOne({
        resource: resourceId,
        status: 'approved',
        startTime: { $lte: now },
        endTime: { $gt: now }
      });
      
      // If no active reservations, update resource to available
      if (!activeReservations) {
        console.log(`No active reservations for resource ${resourceId}, updating to available`);
        
        await Resource.findByIdAndUpdate(
          resourceId,
          { availability: true },
          { new: true }
        );
        
        // Create a system notification for admin users
        await Notification.create({
          recipient: null, // Will be filtered to admin users in the front end
          type: 'system',
          title: 'Resource Available',
          content: `Resource ${expiredReservations.find(r => r.resource._id.toString() === resourceId).resource.name} is now available`,
          priority: 'low',
          relatedModel: 'Resource',
          relatedId: resourceId
        });
      }
    }
    
    // Update expired reservations to mark them as completed
    await Reservation.updateMany(
      {
        status: 'approved',
        endTime: { $lt: now }
      },
      {
        $set: { status: 'completed' }
      }
    );
    
    console.log('Resource availability updated successfully');
  } catch (error) {
    console.error('Error updating resource availability:', error);
  }
};

module.exports = { initSchedulers, updateResourceAvailability }; 