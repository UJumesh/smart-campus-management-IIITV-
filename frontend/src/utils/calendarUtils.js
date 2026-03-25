/**
 * Calendar Integration Utilities
 * 
 * This file provides functions for adding events to calendars,
 * downloading ICS files, and managing calendar-related functionality.
 */

import { toast } from 'react-toastify';

/**
 * Adds an event to the user's calendar
 * Uses the browser's native calendar integration if available,
 * or falls back to downloading an .ics file
 * 
 * @param {Object} event - The event to add to the calendar
 * @param {string} event.title - Event title
 * @param {string} event.description - Event description
 * @param {string} event.location - Event location
 * @param {Date|string} event.start - Event start date/time
 * @param {Date|string} event.end - Event end date/time
 * @param {string} event.eventId - Unique event ID
 * @returns {Promise<boolean>} - True if successful
 */
export const addEventToCalendar = async (event) => {
  try {
    // Format dates if they're strings
    const startDate = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const endDate = typeof event.end === 'string' ? new Date(event.end) : event.end;
    
    // Try using the modern Calendar API first
    if (window.isSecureContext && navigator.scheduling && navigator.scheduling.createEvent) {
      await navigator.scheduling.createEvent({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        start: startDate,
        end: endDate
      });
      return true;
    }
    
    // Fall back to creating and downloading an .ics file
    const icsContent = createIcsContent({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start: startDate,
      end: endDate,
      uid: event.eventId || `event-${Date.now()}`
    });
    
    // Create a blob and trigger download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Creates the content for an .ics file
 * @param {Object} event - Event details
 * @returns {string} - .ics file content
 */
const createIcsContent = (event) => {
  // Format date to iCalendar format: YYYYMMDDTHHMMSSZ
  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const start = formatDate(event.start);
  const end = formatDate(event.end);
  const now = formatDate(new Date());
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SmartCampus//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
};

/**
 * Downloads an ICS file for calendar import
 * 
 * @param {Object} event - The event object
 */
export const downloadICSFile = (event) => {
  try {
    // Format dates
    const startDate = formatDateForICS(new Date(event.start));
    const endDate = formatDateForICS(new Date(event.end || event.start));
    
    // Create ICS file content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'PRODID:-//Smart Campus//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.eventId || 'event'}@smartcampus.edu`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    // Create a blob and download link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Calendar file downloaded. Import it to your calendar app.');
    return true;
  } catch (error) {
    toast.error('Failed to create calendar file');
    return false;
  }
};

/**
 * Format date for ICS file
 * 
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date for ICS file
 */
export const formatDateForICS = (date) => {
  const d = new Date(date);
  return d.toISOString().replace(/-|:|\.\d+/g, '');
};

/**
 * Removes an event from the calendar tracking in localStorage
 * 
 * @param {string} eventId - The event ID to remove
 * @returns {boolean} - Success status
 */
export const removeEventFromCalendarTracking = (eventId) => {
  try {
    const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    const filteredEvents = calendarEvents.filter(e => e.eventId !== eventId);
    localStorage.setItem('calendarEvents', JSON.stringify(filteredEvents));
      return true;
  } catch (error) {
    return false;
  }
};

/**
 * Checks if an event is in the user's calendar
 * 
 * @param {string} eventId - The event ID to check
 * @returns {boolean} - Whether the event is in the calendar
 */
export const isEventInCalendar = (eventId) => {
  try {
    const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    return calendarEvents.some(e => e.eventId === eventId);
  } catch (error) {
    return false;
  }
};

/**
 * Add event to calendar using browser's Calendar API if available
 * @param {Object} eventData - Event data with title, startTime, endTime, location and description
 * @returns {boolean} - Success status
 */
export const addToCalendar = (eventData) => {
  try {
    const { title, startTime, endTime, location, description } = eventData;
    
    // Check if the Web Calendar API is available
    if (navigator.scheduling && navigator.scheduling.addEvent) {
      navigator.scheduling.addEvent({
        title,
        start: new Date(startTime),
        end: new Date(endTime),
        location,
        description
      });
      return true;
    } else {
      // Fallback to creating an .ics file for download
      const icsFile = createIcsFile(eventData);
      if (icsFile) {
        downloadIcsFile(icsFile, title);
        return true;
      }
    }
  } catch (error) {
    return false;
  }
  
  return false;
};

/**
 * Create an ICS file content for an event
 * @param {Object} eventData - Event data
 * @returns {string} - ICS file content
 */
export const createIcsFile = (eventData) => {
  const { title, startTime, endTime, location, description } = eventData;
  
  // Format dates for ICS
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
  };
  
  // Create ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `LOCATION:${location || ''}`,
    `DESCRIPTION:${description || ''}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');
  
  return icsContent;
};

/**
 * Download ICS file to user's device
 * @param {string} icsContent - ICS file content
 * @param {string} title - Event title for filename
 */
export const downloadIcsFile = (icsContent, title) => {
  try {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    return false;
  }
}; 