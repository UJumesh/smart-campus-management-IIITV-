import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import TeachingScheduleCard from '../../components/TeachingScheduleCard';

const Dashboard = () => {
  return (
    <div className="p-4">
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <h3>Welcome back, Lecturer!</h3>
              <p className="text-muted">Today's schedule and updates</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <TeachingScheduleCard />
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header>
              <h5>Recent Notifications</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-muted">No new notifications</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 