import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Card, ListGroup, Badge, Button } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Setup moment as the localizer
const localizer = momentLocalizer(moment);

const Dashboard = () => {
  // Sample teaching schedule events
  const events = [
    {
      title: 'CS101 Lecture',
      start: new Date(2024, 2, 15, 9, 0),
      end: new Date(2024, 2, 15, 10, 30),
      location: 'Hall A-101',
    },
    {
      title: 'Math Workshop',
      start: new Date(2024, 2, 16, 14, 0),
      end: new Date(2024, 2, 16, 16, 0),
      location: 'Lab B-203',
    },
    {
      title: 'Database Systems',
      start: new Date(2024, 2, 17, 11, 0),
      end: new Date(2024, 2, 17, 12, 30),
      location: 'Room C-105',
    },
    {
      title: 'Advanced Algorithms',
      start: new Date(2024, 2, 18, 15, 0),
      end: new Date(2024, 2, 18, 16, 30),
      location: 'Hall A-201',
    },
    // Add more events as needed
  ];
  
  // Get upcoming classes (next 5)
  const today = new Date();
  const upcomingClasses = events
    .filter(event => event.start > today)
    .sort((a, b) => a.start - b.start)
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* Teaching Schedule Card - Similar to student's upcoming events */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <h5 className="mb-0">Teaching Schedule</h5>
          <Badge bg="primary" pill>{upcomingClasses.length}</Badge>
        </Card.Header>
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
        <Card.Footer className="text-center bg-white">
          <Button variant="outline-primary" size="sm">View All Classes</Button>
        </Card.Footer>
      </Card>
      
      {/* Original full calendar component */}
      <Card className="mt-4">
        <Card.Header>
          <h4>Teaching Schedule</h4>
        </Card.Header>
        <Card.Body style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            defaultView="week"
            views={['month', 'week', 'day']}
            min={new Date(0, 0, 0, 8, 0)}  // 8:00 AM
            max={new Date(0, 0, 0, 20, 0)} // 8:00 PM
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard; 