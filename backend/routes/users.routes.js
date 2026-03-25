const { getUserRegisteredEvents } = require('../controllers/events.controller');

// Add the new route
router.get('/:userId/events', protect, getUserRegisteredEvents); 