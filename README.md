# 🏫 Smart Campus Management System

A full-stack **Smart Campus Management System** designed to centralize and simplify campus activities such as user management, events, resource reservations, scheduling, notifications, real-time communication, and administrative analytics.

The system provides role-based access for **Administrators, Lecturers, and Students** and is built using **React, Node.js, Express.js, MongoDB, Mongoose, and Socket.IO**.

---

## 📌 Overview

The Smart Campus Management System provides a centralized platform where students, lecturers, and administrators can access campus services according to their roles.

The application combines a modern React frontend with a Node.js/Express backend and MongoDB database to provide a centralized campus-management platform.

### Core Areas

- Authentication and authorization
- Role-based access control
- User management
- Event management
- Event registration and check-in
- Campus resource management
- Resource reservations
- Reservation approval and conflict detection
- Scheduling and calendar management
- Real-time messaging
- Notifications
- Administrative analytics
- Profile management

---

## 🎯 Objectives

The main objectives of this project are:

- Centralize campus-related operations
- Provide role-based access to campus services
- Simplify event creation and registration
- Improve campus resource utilization
- Reduce resource reservation conflicts
- Provide centralized scheduling
- Improve communication between students, lecturers, and administrators
- Provide administrative statistics and analytics
- Provide a scalable foundation for future campus modules

---

# ✨ Features

## 🔐 Authentication & Authorization

The application uses JWT-based authentication with role-based authorization.

### Features

- User registration
- User login
- Logout
- JWT authentication
- JWT verification
- JWT refresh
- Password hashing using bcrypt
- Password update
- Forgot-password flow
- Password reset
- Protected routes
- Role-based authorization
- Current-user information
- Login tracking

### Authentication Module

The authentication system is responsible for securely identifying users and controlling access to protected application resources.

---

# 👥 Role-Based Access Control

The system supports three primary user roles:

| Role | Description |
|------|-------------|
| 👨‍💼 Admin | Manages users, events, resources, reservations, analytics and administrative operations |
| 👨‍🏫 Lecturer | Manages campus/academic activities and interacts with students |
| 🎓 Student | Accesses events, resources, schedules, notifications and communication |

Protected routes and role-based authorization are used to restrict access to different areas of the application.

---

# 👤 User Management

Administrators can manage campus users through the administration interface.

### Features

- View users
- Search users
- Filter users
- Filter by role
- Filter by department
- Filter by sub-department
- Filter by account status
- Create users
- Update users
- Delete users
- Update user profile
- Manage user status
- Pagination
- User statistics

### Supported Roles

- `admin`
- `lecturer`
- `student`

### Account Status

- `active`
- `inactive`

---

# 🏛️ Department Management

The user model supports main departments and sub-departments.

The application includes department-based user organization and filtering.

Example structure:

    School of Engineering
    ├── Civil Engineering
    ├── Mechanical Engineering
    ├── Electrical Engineering
    ├── Computer Engineering
    └── Chemical Engineering

    School of Business
    ├── Business Administration
    ├── Finance
    ├── Marketing
    ├── Accounting
    └── Management

    School of Science
    ├── Computer Science
    ├── Physics
    ├── Chemistry
    ├── Biology
    └── Mathematics

    School of Arts and Humanities
    ├── History
    ├── Literature
    ├── Languages
    ├── Philosophy
    └── Cultural Studies

    School of Social Sciences
    ├── Economics
    ├── Psychology
    ├── Sociology
    ├── Political Science
    └── Anthropology

    School of Law
    ├── Law
    └── Criminal Justice

    School of Medicine & Health Sciences
    ├── Medicine
    ├── Nursing
    ├── Public Health
    └── Pharmacy

---

# 🎉 Event Management

The event module provides functionality for creating, viewing, managing and registering for campus events.

### Features

- Create events
- View events
- View event details
- Update events
- Delete events
- Event registration
- Event unregistration
- View registered events
- View event attendees
- Event check-in
- Capacity management
- Featured events
- Event posters/images
- Event filtering
- Department-based events

### Event Categories

- Academic
- Workshop
- Seminar
- Club
- Sports
- Social

### Target Audiences

- Students
- Lecturers
- All

### Event Status

- `upcoming`
- `ongoing`
- `completed`
- `cancelled`

### Event Workflow

    Admin / Lecturer
           │
           ▼
      Create Event
           │
           ▼
      Publish Event
           │
           ▼
    Users View Event
           │
           ▼
     Register Event
           │
           ▼
 Registration Stored
           │
           ▼
      Event Check-in
           │
           ▼
   Attendance Status

---

# 🏢 Campus Resource Management

The system provides centralized management of campus resources.

### Resource Types

- Classroom
- Laboratory
- Equipment
- Facility
- Other

### Resource Information

A resource can contain:

- Resource name
- Resource type
- Building
- Floor
- Room number
- Capacity
- Description
- Features
- Availability
- Maintenance schedule
- Images
- Reservation requirements
- Allowed user roles
- Creator information

### Administrator Operations

Administrators can:

- Create resources
- Update resources
- Delete resources
- Change resource availability

### User Operations

Authenticated users can:

- View resources
- Search resources
- Filter resources
- View resource details

---

# 📋 Resource Reservations

Authenticated users can request campus resources according to the configured reservation rules.

### Features

- Create reservation
- View reservations
- View reservation details
- Update reservation
- Cancel reservation
- Delete reservation
- Admin approval
- Admin rejection
- Rejection reason
- Reservation status
- Recurring reservations
- Reservation conflict detection

### Reservation Status

- `pending`
- `approved`
- `rejected`
- `cancelled`

### Recurrence

- `daily`
- `weekly`
- `monthly`

### Reservation Workflow

    User
     │
     ▼
    Browse Resources
     │
     ▼
    Select Resource
     │
     ▼
    Choose Date & Time
     │
     ▼
    Enter Reservation Details
     │
     ▼
    Check Existing Reservations
     │
     ├───────────────┐
     │               │
     ▼               ▼
    Conflict       No Conflict
     │               │
     ▼               ▼
    Prevent       Create Reservation
                       │
                       ▼
                     Pending
                       │
                 ┌─────┴─────┐
                 ▼           ▼
              Approved     Rejected

The reservation system checks overlapping reservations for the same resource and time period to help prevent double booking.

---

# 📅 Schedule & Calendar

The application contains schedule and calendar-related functionality.

### Schedule Information

- Title
- Description
- Start date
- End date
- Location
- Schedule type
- Organizer
- Participants
- Resources
- Recurrence
- Target audience
- Calendar color

### Schedule Types

- Class
- Lecture
- Meeting
- Exam
- Workshop
- Event
- Other

### Recurrence Options

- None
- Daily
- Weekly
- Biweekly
- Monthly

The frontend contains calendar and schedule management interfaces.

> **Development Status:** The repository contains multiple schedule-related implementations. The schedule module should be consolidated and completed before production deployment.

---

# 💬 Messaging & Real-Time Communication

The application provides direct and group communication using REST APIs and Socket.IO.

### Features

- Direct conversations
- Group conversations
- Conversation management
- Send messages
- Message attachments
- Read receipts
- Typing indicators
- User search
- Participant management
- Real-time message delivery

### Conversation Types

- `direct`
- `group`
- `course`

### Real-Time Communication

Socket.IO is used for:

- User connections
- Personal rooms
- Conversation rooms
- New message events
- Typing indicators
- Message read events
- Conversation read events
- Real-time notifications

### Messaging Workflow

    User A
      │
      ▼
    Open Conversation
      │
      ▼
    Send Message
      │
      ▼
    Socket.IO
      │
      ▼
    Node.js / Express
      │
      ▼
    MongoDB
      │
      ▼
    Socket.IO
      │
      ▼
    User B
      │
      ▼
    New Message

---

# 🔔 Notifications

The system provides in-application notifications for users.

### Features

- Retrieve notifications
- View notification details
- Mark notification as read
- Mark all notifications as read
- Delete notification
- Delete all notifications
- Notification priority
- Notification links
- Related model references
- Notification expiration
- Delivery status tracking

### Notification Types

- `event_invitation`
- `event_reminder`
- `schedule_change`
- `resource_approval`
- `resource_rejection`
- `message`
- `announcement`
- `system`
- `other`

### Priority Levels

- `low`
- `medium`
- `high`

---

# 📊 Administrative Analytics

The application contains an analytics module for administrative dashboards.

### Analytics Include

- Total users
- Active users
- Inactive users
- Student count
- Lecturer count
- Admin count
- Department distribution
- Registration statistics
- Login activity
- Server status
- Database connection status
- System health information

### Login Activity

Statistics can be viewed for:

- Today
- This Week
- This Month

### Visualization

The frontend uses Chart.js and React Chart.js for:

- Bar charts
- Pie charts
- Line charts
- Doughnut charts
- Dashboard statistic cards

---

# 📚 Courses

The project contains a Courses section in the frontend.

Current components include:

- Courses page
- Course details page
- Course routing
- Course-related UI structure

> **Current Status:** The Courses module is still under development and contains placeholder/mock behavior. It should not be considered a fully implemented backend course-management module.

---

# 👤 Profile Management

Authenticated users can access and update their profile information.

The backend provides profile update functionality through the user API.

---

# 🛠️ Technology Stack

## Frontend

- React 18
- React Router
- Redux Toolkit
- React Redux
- Material UI
- MUI Data Grid
- FullCalendar
- React Big Calendar
- Axios
- Chart.js
- React Chart.js
- Formik
- Yup
- Framer Motion
- React Icons
- React Toastify
- React Hot Toast
- Socket.IO Client
- date-fns
- jwt-decode

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT
- bcrypt / bcryptjs
- Nodemailer
- Multer
- Express Validator
- Helmet
- Express Rate Limit
- CORS
- Morgan
- Winston
- Node Cron
- Cookie Parser
- dotenv

## Testing & Development

- Jest
- Supertest
- Nodemon
- Concurrently
- Git
- GitHub

---

# 🏗️ System Architecture

    ┌─────────────────────────────────────────────┐
    │                    USERS                    │
    │                                             │
    │        Admin / Lecturer / Student           │
    └──────────────────────┬──────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────┐
    │              REACT FRONTEND                │
    │                                             │
    │ React Router • Redux Toolkit • Material UI │
    │ Calendar • Charts • Axios                  │
    └──────────────────────┬──────────────────────┘
                           │
                      HTTP / REST
                           │
                           ▼
    ┌─────────────────────────────────────────────┐
    │             NODE.JS + EXPRESS              │
    │                                             │
    │ Routes • Controllers • Middleware          │
    │ Authentication • Authorization             │
    └───────────────┬─────────────────┬───────────┘
                    │                 │
                    ▼                 ▼
    ┌────────────────────────┐   ┌─────────────────────┐
    │        MONGODB         │   │      SOCKET.IO      │
    │                        │   │                     │
    │ Users                  │   │ Real-Time Messaging │
    │ Events                 │   │ Notifications       │
    │ Resources              │   │ Typing Indicators   │
    │ Reservations           │   │ Read Receipts       │
    │ Messages               │   │                     │
    │ Notifications          │   │                     │
    │ Schedules              │   │                     │
    └────────────────────────┘   └─────────────────────┘

---

# 📁 Project Structure

    smart-campus-management-IIITV-/
    │
    ├── backend/
    │   ├── backups/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── public/
    │   ├── routes/
    │   ├── scripts/
    │   ├── utils/
    │   ├── .env.example
    │   ├── check-registrations.js
    │   ├── package.json
    │   ├── server.js
    │   └── start.js
    │
    ├── frontend/
    │   ├── public/
    │   ├── src/
    │   │   ├── app/
    │   │   ├── components/
    │   │   ├── context/
    │   │   ├── features/
    │   │   ├── hooks/
    │   │   ├── pages/
    │   │   │   ├── admin/
    │   │   │   ├── auth/
    │   │   │   ├── courses/
    │   │   │   ├── dashboard/
    │   │   │   ├── errors/
    │   │   │   ├── events/
    │   │   │   ├── messages/
    │   │   │   ├── notifications/
    │   │   │   ├── resources/
    │   │   │   └── users/
    │   │   ├── routes/
    │   │   ├── selectors/
    │   │   ├── services/
    │   │   ├── slices/
    │   │   ├── store/
    │   │   ├── styles/
    │   │   └── utils/
    │   │
    │   ├── package.json
    │   └── package-lock.json
    │
    ├── src/
    ├── export-data.js
    ├── import-data.js
    ├── migrate.js
    ├── migrate.bat
    ├── migrate-to-atlas.bat
    ├── package.json
    ├── package-lock.json
    └── README.md

---

# 🗃️ Database Models

The backend uses Mongoose models for persistent application data.

### Main Models

- User
- Analytics
- Conversation
- Event
- Message
- Notification
- Registration
- Reservation
- Resource
- Schedule

## User

Stores:

- First name
- Last name
- Email
- Password
- Role
- Main department
- Sub-department
- Status
- Last login
- Password reset information
- Timestamps

## Event

Stores:

- Title
- Description
- Start date
- End date
- Venue
- Organizer
- Department
- Category
- Target audience
- Capacity
- Attendees
- Poster
- Featured status
- Event status
- Creator
- Timestamps

## Registration

Stores:

- User
- Event
- Registration date
- Check-in status
- Check-in time
- Attendance status

Attendance states include:

- `registered`
- `attended`
- `no-show`

## Resource

Stores:

- Resource name
- Resource type
- Location
- Building
- Floor
- Room
- Capacity
- Description
- Features
- Availability
- Maintenance information
- Images
- Approval requirement
- Allowed roles
- Creator

## Reservation

Stores:

- Resource
- User
- Title
- Purpose
- Start time
- End time
- Attendee count
- Status
- Approver
- Approval date
- Rejection reason
- Recurrence information
- Creation date

## Schedule

Stores:

- Title
- Description
- Start date
- End date
- Location
- Type
- Organizer
- Participants
- Resources
- Recurrence
- Target audience
- Calendar color

## Message

Stores:

- Sender
- Recipient
- Conversation
- Content
- Attachments
- Read information
- System message information
- Timestamps

## Conversation

Supports:

- `direct`
- `group`
- `course`

Stores:

- Participants
- Participant roles
- Course reference
- Avatar
- Archive state
- Last message
- Last-message timestamp
- Creator
- Timestamps

## Notification

Stores:

- Recipient
- Sender
- Notification type
- Title
- Content
- Read status
- Priority
- Link
- Related model
- Related record
- Delivery status
- Expiration
- Timestamps

## Analytics

Provides analytics-related aggregation and statistical data.

---

# 🔌 API Modules

The backend is organized into REST API modules.

    /api/auth
    /api/users
    /api/schedules
    /api/resources
    /api/analytics
    /api/events
    /api/messages
    /api/notifications
    /api/reservations

### Authentication

    /api/auth

### Users

    /api/users

### Events

    /api/events

### Resources

    /api/resources

### Reservations

    /api/reservations

### Schedules

    /api/schedules

### Messages

    /api/messages

### Notifications

    /api/notifications

### Analytics

    /api/analytics

---

# 🩺 Health Check

The backend provides:

    GET /health

Example response:

    {
      "success": true,
      "message": "Server is running"
    }

---

# ⚙️ Requirements

Before running the project, install:

- Node.js 14+
- npm
- MongoDB
- Git
- Modern web browser

A current Node.js LTS release is recommended for development.

---

# 🚀 Installation

## 1. Clone the Repository

    git clone https://github.com/UJumesh/smart-campus-management-IIITV-.git

Navigate into the project:

    cd smart-campus-management-IIITV-

---

## 2. Install Dependencies

From the root directory:

    npm run install-all

Or install dependencies separately.

### Root

    npm install

### Backend

    cd backend
    npm install

### Frontend

    cd ../frontend
    npm install

---

# 🗄️ MongoDB Setup

The application uses MongoDB.

For local development:

    mongodb://localhost:27017/smart-campus

Make sure MongoDB is running before starting the backend.

MongoDB will create the database when application data is first written.

---

# 🔐 Environment Configuration

Create:

    backend/.env

Use:

    backend/.env.example

as the reference.

Example environment configuration:

    NODE_ENV=development
    PORT=5001

    MONGO_URI=mongodb://localhost:27017/smart-campus

    JWT_SECRET=your_secure_jwt_secret
    JWT_EXPIRE=30d
    JWT_COOKIE_EXPIRE=30

    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=your_email@gmail.com
    SMTP_PASSWORD=your_app_password

    FROM_NAME=Smart Campus
    FROM_EMAIL=noreply@smartcampus.com

    FRONTEND_URL=http://localhost:3000

### Important

Never commit the real `.env` file or credentials to GitHub.

---

# ▶️ Running the Application

## Run Frontend and Backend Together

From the project root:

    npm run dev

The project uses Concurrently to run the frontend and backend during development.

### Backend

    http://localhost:5001

### Frontend

    http://localhost:3000

---

## Run Backend Separately

    cd backend
    npm run dev

---

## Run Frontend Separately

Open another terminal:

    cd frontend
    npm start

Then open:

    http://localhost:3000

---

# 🌐 Frontend API Configuration

The frontend supports:

    REACT_APP_API_URL=http://localhost:5001

For local development, make sure the frontend API URL matches the backend port.

---

# 🔄 Application Workflow

    USER
      │
      ▼
    Login / Register
      │
      ▼
    JWT Authentication
      │
      ▼
    Role Identification
      │
      ├──────────────────┬──────────────────┐
      │                  │                  │
      ▼                  ▼                  ▼
    ADMIN             LECTURER           STUDENT
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
                         ▼
                     DASHBOARD
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
        Events       Resources       Schedule
          │              │              │
          ▼              ▼              ▼
     Registration   Reservation      Calendar
          │              │
          └───────┬──────┘
                  ▼
             Notifications
                  │
                  ▼
             Communication
                  │
                  ▼
               Analytics

---

# 🎟️ Event Registration Workflow

    User
     ↓
    View Events
     ↓
    Open Event Details
     ↓
    Check Capacity
     ↓
    Register
     ↓
    Registration Stored
     ↓
    Attend Event
     ↓
    Admin / Lecturer Check-in
     ↓
    Attendance Status

---

# 🏢 Resource Reservation Workflow

    User
     ↓
    Browse Resources
     ↓
    Select Resource
     ↓
    Choose Date & Time
     ↓
    Enter Purpose & Attendees
     ↓
    Check Reservation Conflict
     ↓
    Create Reservation
     ↓
    Pending
     ↓
    ┌───────────┐
    │           │
    ▼           ▼
    Approved   Rejected

---

# 💬 Messaging Workflow

    User A
      │
      ▼
    Conversation
      │
      ▼
    Send Message
      │
      ▼
    Socket.IO
      │
      ▼
    Node.js / Express
      │
      ▼
    MongoDB
      │
      ▼
    Socket.IO
      │
      ▼
    User B

---

# 🔒 Security

The application includes:

- JWT authentication
- Protected routes
- Role-based authorization
- bcrypt password hashing
- Helmet security middleware
- CORS
- Express rate limiting
- Express Validator
- Environment variables
- Authentication middleware
- Password reset functionality
- HTTP security headers

### Production Security Recommendations

Before production deployment, additionally configure and review:

- HTTPS
- Secure cookies
- Strong JWT secrets
- Strict CORS policies
- Input sanitization
- CSRF protection where applicable
- MongoDB authentication
- Secure SMTP credentials
- Secret management
- Audit logging
- Security testing
- Dependency vulnerability scanning

---

# 🧪 Testing

The backend includes Jest and Supertest dependencies.

Run backend tests:

    cd backend
    npm test

Frontend tests can be started using:

    cd frontend
    npm test

Testing coverage should be expanded as development continues.

---

# 🏗️ Production Build

Build the frontend:

    cd frontend
    npm run build

Or from the project root:

    npm run build

The production frontend build is generated in:

    frontend/build/

---

# 📸 Screenshots

Add a `screenshots` directory to the repository:

    screenshots/
    ├── login.png
    ├── register.png
    ├── dashboard.png
    ├── events.png
    ├── event-details.png
    ├── resources.png
    ├── resource-details.png
    ├── reservation.png
    ├── schedule.png
    ├── calendar.png
    ├── messages.png
    ├── notifications.png
    ├── user-management.png
    └── analytics.png

Then add screenshots to this README using standard Markdown image syntax.

---

# 📋 Current Implementation Status

| Module | Status |
|--------|--------|
| Authentication | ✅ Implemented |
| JWT Authorization | ✅ Implemented |
| Role-Based Access | ✅ Implemented |
| User Management | ✅ Implemented |
| Profile Management | ✅ Implemented |
| Event Management | ✅ Implemented |
| Event Registration | ✅ Implemented |
| Event Check-in | ✅ Implemented |
| Resource Management | ✅ Implemented |
| Resource Reservations | ✅ Implemented |
| Reservation Approval | ✅ Implemented |
| Reservation Conflict Detection | ✅ Implemented |
| Messaging | ✅ Implemented |
| Socket.IO Communication | ✅ Implemented |
| Notifications | ✅ Implemented |
| Admin Analytics | ✅ Implemented |
| Calendar UI | ✅ Implemented |
| Schedule | ⚠️ Under Development |
| Courses | 🚧 Under Development |
| Production Deployment | 🚧 Requires Configuration |

---

# ⚠️ Development Notes

The project is currently under active development.

Some areas contain placeholder or duplicate implementations that should be cleaned up before production deployment.

### Schedule

The repository contains multiple schedule-related implementations. These should eventually be consolidated into a single clean API implementation.

### Courses

The Courses frontend exists, but the module is currently under development and does not represent a fully completed course-management backend.

### API Configuration

The backend development environment uses port `5001`.

Make sure the frontend API configuration points to the correct backend port.

### Development Data

Some development/demo data and fallback behavior are present in the repository.

Production deployments should use properly configured database records and environment variables.

---

# 🚀 Future Improvements

## Academic Management

- Complete course management
- Course enrollment
- Faculty-course mapping
- Assignment management
- Examination management
- Results and grades
- Complete attendance management

## Campus Services

- Library management
- Hostel management
- Fee management
- Complaint management
- Transport management
- Campus navigation
- Lost and found

## Communication

- Push notifications
- Email notifications
- SMS notifications
- Advanced group communication
- File/document sharing

## Analytics

- Advanced campus analytics
- Resource utilization analysis
- Event participation analytics
- Predictive resource demand
- AI-powered campus assistant

## Infrastructure

- Docker support
- CI/CD pipeline
- Cloud deployment
- MongoDB Atlas
- Automated backups
- Monitoring
- Centralized logging

## Security

- Two-factor authentication
- OTP verification
- Advanced permission management
- Security auditing
- Automated vulnerability scanning

---

# 🤝 Contribution

Contributions and suggestions are welcome.

## Create a Feature Branch

    git checkout -b feature/your-feature

## Make Your Changes

Implement and test your changes locally.

## Stage Changes

    git add .

## Commit Changes

    git commit -m "Add your feature"

## Push Changes

    git push origin feature/your-feature

## Pull Request

Create a Pull Request describing your changes.

---

# 🔄 Git Workflow

Check repository status:

    git status

Pull the latest changes:

    git pull

Add changes:

    git add .

Commit:

    git commit -m "Update Smart Campus Management System"

Push:

    git push

---

# 📌 Project Information

| Property | Details |
|----------|---------|
| Project | Smart Campus Management System |
| Type | Full-Stack Web Application |
| Architecture | MERN |
| Frontend | React 18 |
| Backend | Node.js + Express |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Real-Time Communication | Socket.IO |
| State Management | Redux Toolkit |
| UI Framework | Material UI |
| Calendar | FullCalendar / React Big Calendar |
| Charts | Chart.js |
| Roles | Admin / Lecturer / Student |
| Status | Active Development |

---

# 📊 Technology Highlights

### Frontend

React, Redux Toolkit, Material UI, React Router, Axios, FullCalendar, React Big Calendar, Chart.js, Formik, Yup and Socket.IO Client.

### Backend

Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Socket.IO, Nodemailer, Multer, Express Validator, Helmet and Express Rate Limit.

### Development & Testing

Jest, Supertest, Nodemon, Concurrently, Git and GitHub.

---

# 🧩 Key Technical Highlights

### 1. JWT Authentication

Secure authentication is implemented using JSON Web Tokens.

### 2. Role-Based Authorization

Different users receive different access permissions based on their roles.

### 3. MongoDB Data Layer

Mongoose models are used to organize persistent campus data.

### 4. Reservation Conflict Detection

The reservation module checks overlapping reservations to help prevent double booking of campus resources.

### 5. Real-Time Communication

Socket.IO provides real-time messaging and communication capabilities.

### 6. Notification System

Users can receive and manage application notifications related to campus activities.

### 7. Analytics Dashboard

Administrative dashboards provide user, registration, activity and system-level statistics.

### 8. Calendar Integration

Calendar interfaces are provided for schedule and campus activity management.

---

# 🌐 Application Modules

The application is organized into several major modules:

    Authentication
         │
         ├── Login
         ├── Registration
         ├── Password Reset
         └── Authorization
         
    User Management
         │
         ├── Users
         ├── Roles
         ├── Departments
         └── Profiles
         
    Events
         │
         ├── Event Creation
         ├── Registration
         ├── Attendance
         └── Check-in
         
    Resources
         │
         ├── Resource Management
         ├── Availability
         └── Reservations
         
    Communication
         │
         ├── Conversations
         ├── Messages
         ├── Typing Indicators
         └── Read Receipts
         
    Notifications
         │
         ├── Event Notifications
         ├── Reservation Notifications
         ├── Message Notifications
         └── System Notifications
         
    Analytics
         │
         ├── User Statistics
         ├── Registration Statistics
         ├── Login Activity
         └── System Health

---

# 🧪 Development & Testing Notes

The repository includes testing dependencies and development tooling.

Recommended development process:

1. Start MongoDB
2. Configure `.env`
3. Install backend dependencies
4. Install frontend dependencies
5. Start backend
6. Start frontend
7. Verify authentication
8. Verify database connectivity
9. Test major user workflows
10. Run automated tests before deployment

---

# 🚀 Future Roadmap

The long-term roadmap can include:

### Phase 1

- Complete current schedule implementation
- Complete Courses module
- Remove duplicate implementations
- Improve validation
- Expand automated tests

### Phase 2

- Complete academic management
- Course enrollment
- Faculty-course mapping
- Attendance
- Assignments
- Examination management

### Phase 3

- Library management
- Hostel management
- Fee management
- Complaint management
- Transport management

### Phase 4

- Cloud deployment
- Docker
- CI/CD
- Monitoring
- Automated backups
- Production security hardening

### Phase 5

- AI-powered campus assistant
- Predictive analytics
- Intelligent resource allocation
- Smart notifications

---

# 👨‍💻 Author

## Umesh Jatav

**B.Tech — Computer Science & Engineering**  
**Indian Institute of Information Technology Vadodara**

### GitHub

https://github.com/UJumesh

### Project Repository

https://github.com/UJumesh/smart-campus-management-IIITV-

---

# 📈 Project Status

**Active Development**

The Smart Campus Management System is an academic full-stack software engineering project focused on centralizing campus users, events, resources, reservations, scheduling, communication, notifications, and administrative analytics.

The architecture is designed to allow additional campus modules to be added as development continues.

---

# ⚠️ Disclaimer

This project is developed for **academic, educational, demonstration, and software-development purposes**.

It should not be considered production-ready without additional:

- Security auditing
- Infrastructure hardening
- Database security configuration
- Comprehensive testing
- Monitoring
- Backup strategy
- Privacy controls
- Production-grade secret management

---

# ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

## 🏫 Smart Campus Management System

### One Platform for Smarter Campus Management.
