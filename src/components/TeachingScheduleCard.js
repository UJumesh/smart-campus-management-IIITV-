import React from 'react';
import moment from 'moment';
import { Card, ListGroup, Badge, Button } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa';

const TeachingScheduleCard = () => {
  // Sample events with future dates
  const events = [
    {
      title: 'CS101 Lecture',
      start: new Date(2024, 5, 15, 9, 0),  // June 15, 2024
      end: new Date(2024, 5, 15, 10, 30),
      location: 'Hall A-101',
    },
    {
      title: 'Math Workshop',
      start: new Date(2024, 5, 16, 14, 0), // June 16, 2024
      end: new Date(2024, 5, 16, 16, 0),
      location: 'Lab B-203',
    },
    {
      title: 'Database Systems',
      start: new Date(), // Today's date for testing
      end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // +2 hours
      location: 'Room C-105',
    },
  ];
  
  const today = new Date();
  const upcomingClasses = events
    .filter(event => event.start > today)
    .sort((a, b) => a.start - b.start)
    .slice(0, 3);

  return (
    <Card className="shadow-sm h-100">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaCalendarAlt className="me-2" />
          Teaching Schedule
        </h5>
        <Badge bg="primary" pill>{upcomingClasses.length}</Badge>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {upcomingClasses.map((event, index) => (
            <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold">{event.title}</div>
                <div className="text-muted small">
                  {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                  {event.location && ` • ${event.location}`}
                </div>
              </div>
              <Badge 
                bg={moment(event.start).isSame(today, 'day') ? 'danger' : 'secondary'} 
                className="text-white"
              >
                {moment(event.start).format('MMM D')}
              </Badge>
            </ListGroup.Item>
          ))}
          {upcomingClasses.length === 0 && (
            <ListGroup.Item className="text-center text-muted py-3">
              No upcoming classes
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card.Body>
      <Card.Footer className="text-center bg-white">
        <Button variant="outline-primary" size="sm">View Full Schedule</Button>
      </Card.Footer>
    </Card>
  );
};

export default TeachingScheduleCard; 