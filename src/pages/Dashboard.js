import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import TeachingScheduleCard from '../components/TeachingScheduleCard';
import { FaBell } from 'react-icons/fa';

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
        <Col lg={8}>
          <TeachingScheduleCard />
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaBell className="me-2" />
                Recent Notifications
              </h5>
              <Badge bg="primary" pill>0</Badge>
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