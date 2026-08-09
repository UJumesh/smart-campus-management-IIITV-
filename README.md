🏫 Smart Campus Management System

A full-stack Smart Campus Management System built with the MERN stack to provide a centralized platform for managing campus users, events, schedules, resources, reservations, notifications, communication, and administrative analytics.

The application supports three primary roles:

Admin

Lecturer

Student

The project is organized as a separate React frontend and Node.js/Express backend, with MongoDB/Mongoose for persistence and Socket.IO for real-time communication.

Project status: Active Development / Academic ProjectSome modules are fully implemented while others, such as the Courses module and parts of the Schedule/Attendance functionality, are still under development or contain placeholder endpoints.

📌 Table of Contents

Project Overview

Objectives

Features

Authentication

Role-Based Access

User Management

Event Management

Resource Management

Reservations

Schedule & Calendar

Messaging

Notifications

Analytics

Courses

Technology Stack

System Architecture

Project Structure

User Roles

Database Models

API Modules

Requirements

Installation

Environment Configuration

Running the Application

Application Workflows

Security

Testing

Production Build

Screenshots

Current Implementation Status

Known Development Notes

Future Improvements

Contribution

Git Workflow

Author

Disclaimer

📖 Project Overview

The Smart Campus Management System is designed to bring common campus activities into a single web application.

Instead of managing events, campus resources, reservations, schedules, communication, and user administration through separate systems, the application provides a centralized environment where authenticated users can access services according to their role.

Core areas

User authentication and authorization

Student, lecturer, and administrator management

Campus event management

Event registration and attendance/check-in support

Campus resource management

Resource reservation and approval workflow

Scheduling and calendar interface

Direct and group messaging

Notifications

Administrative analytics

Profile management

🎯 Objectives

The project aims to:

Centralize campus-related operations

Provide role-based access to campus services

Simplify event creation and registration

Improve utilization of campus resources

Reduce reservation conflicts

Provide a shared scheduling interface

Improve communication between campus users

Provide administrators with user and system analytics

Provide a scalable foundation for future campus modules

✨ Features

🔐 Authentication

The backend provides an authentication system based on JWT.

Implemented authentication functionality

User registration

User login

Logout

Current-user information

JWT verification

JWT refresh

Password update

Forgot-password flow

Reset-password flow

Protected routes

Role-based authorization

Password hashing with bcrypt

Login timestamp tracking

Authentication endpoints

POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/verify
GET    /api/auth/me
GET    /api/auth/logout
PUT    /api/auth/updatepassword
POST   /api/auth/refresh-token
POST   /api/auth/forgotpassword
PUT    /api/auth/resetpassword/:resettoken

👥 Role-Based Access

The system defines three roles:

Role

Main Responsibilities

👨‍💼 Admin

User management, resources, analytics, event administration, settings

👨‍🏫 Lecturer

Event creation/management, communication, schedules and campus services

🎓 Student

View campus information, events, resources, reservations, schedules and communication

Access to frontend routes is controlled using protected routes and role checks.

👤 User Management

Administrators can manage campus users.

User functionality

View users

Search users

Filter by role

Filter by main department

Filter by sub-department

Filter by status

Create users

Update users

Delete users

Update user profile

Manage user status

Pagination

Auto-refresh of user data

User selection/actions

User roles

admin
lecturer
student

User status

active
inactive

🏛️ Department Structure

The User model contains a main-department/sub-department structure.

Examples include:

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

Administration is also supported for administrator accounts.

🎉 Event Management

Events are one of the major implemented modules.

Event functionality

View events

View individual event details

Featured events

Filter events

Events by department

Create events

Update events

Delete events

Event registration

Event unregistration

View current user's registrations

View event attendees

Attendee check-in

Featured-event management

Event posters/images

Capacity management

Event status management

Event categories

Academic
Workshop
Seminar
Club
Sports
Social

Target audiences

Students
Lecturers
All

Event statuses

upcoming
ongoing
completed
cancelled

Event workflow

Admin / Lecturer
       │
       ▼
Create Event
       │
       ▼
Enter Event Details
       │
       ▼
Publish Event
       │
       ▼
Students / Lecturers View Event
       │
       ▼
Register for Event
       │
       ▼
Registration Stored
       │
       ▼
Event Attendance / Check-in

🏢 Campus Resource Management

The system provides a resource-management module for campus facilities and equipment.

Resource types

classroom
laboratory
equipment
facility
other

Resource information

A resource can contain:

Name

Type

Building

Floor

Room number

Capacity

Description

Features

Availability

Maintenance schedule

Images

Reservation approval requirement

Allowed user roles

Creator information

Resource permissions

Administrators can:

Create resources

Update resources

Delete resources

Change resource availability

Authenticated users can:

View resources

View resource details

Filter resources by type

📅 Resource Reservations

The reservation module allows authenticated users to request campus resources.

Reservation features

Create reservation

View own reservations

View resource reservations

View individual reservation

Update reservation

Cancel reservation

Delete reservation

Admin approval

Admin rejection

Rejection reason

Reservation status

Recurring reservations

Reservation conflict detection

Reservation statuses

pending
approved
rejected
cancelled

Recurrence

daily
weekly
monthly

Conflict detection

The Reservation model checks for overlapping reservations for the same resource.

Requested Time
      │
      ▼
Check Existing Reservations
      │
      ├── Conflict Found ──► Reject / Prevent Conflict
      │
      └── No Conflict ─────► Create Reservation

🗓️ Schedule & Calendar

The frontend contains a dedicated schedule-management interface and calendar functionality.

Schedule model supports

Title

Description

Start date

End date

Location

Type

Organizer

Participants

Resources

Recurrence

Target audience

Calendar color

Schedule types

class
lecture
meeting
exam
workshop
event
other

Recurrence options

none
daily
weekly
biweekly
monthly

The frontend also provides:

Calendar view

Schedule creation UI

Schedule editing UI

Schedule deletion UI

Filters

Conflict-checking UI

Resource-availability UI

Report-generation UI

Important: The repository contains more than one schedule implementation. The route currently mounted by backend/server.js is schedule.routes.js, whose CRUD handlers are placeholders, while scheduleRoutes.js contains a more developed implementation. Therefore, the schedule module should be considered partially implemented / under development in the current repository state.

💬 Messaging & Communication

The application includes direct and group communication.

Messaging functionality

View conversations

View conversation messages

Direct conversations

Group conversations

Search users by email

Add participants

Send messages

Message attachments

Read receipts

Typing indicators

Conversation rooms

Real-time message delivery

Conversation types

direct
group
course

Real-time communication

Socket.IO is used for:

User connections

Personal rooms

Conversation rooms

New message events

Typing indicators

Message read events

Conversation read events

Message notifications

Messaging workflow

User A
  │
  ▼
Open / Create Conversation
  │
  ▼
Send Message
  │
  ▼
Express / Socket.IO
  │
  ▼
Store Message in MongoDB
  │
  ▼
Emit Real-Time Event
  │
  ▼
User B Receives Message

🔔 Notifications

The notification system provides in-application notifications for authenticated users.

Notification functionality

Get notifications

View notification details

Mark notification as read

Mark all notifications as read

Delete notification

Delete all notifications

Notification priority

Notification links

Related-model references

Notification expiration support

Delivery-status tracking

Notification types

event_invitation
event_reminder
schedule_change
resource_approval
resource_rejection
message
announcement
system
other

Priority levels

low
medium
high

📊 Administrative Analytics

The admin analytics module provides user and system statistics.

Analytics include

Total users

Active users

Inactive users

Admin count

Lecturer count

Student count

Department distribution

Registration trends

Login activity

Server status

Database connection status

System health information

Login activity

The backend calculates:

Today
This Week
This Month

Visualization

The frontend uses:

Chart.js

React Chart.js

Bar charts

Pie charts

Line charts

Doughnut charts

Dashboard statistic cards

📚 Courses

A Courses section exists in the frontend, including:

Courses page

Course details page

Course route

Course-related UI structure

However, the current implementation explicitly marks the Courses module as under development and uses placeholder/mock behavior rather than a completed course API.

Therefore:

Courses are not claimed as a completed backend feature in this README.

👤 Profile Management

Authenticated users can access the profile page and update their own profile.

The backend provides:

PUT /api/users/profile

Administrators additionally have access to user-management operations.

🛠️ Technology Stack

Frontend

Technology

Purpose

React 18

Frontend UI

React Router

Client-side routing

Redux Toolkit

State management

React Redux

Redux integration

Material UI

UI components

MUI Data Grid

Data tables

FullCalendar

Calendar functionality

React Big Calendar

Calendar interface

Axios

HTTP requests

Chart.js

Data visualization

React Chart.js

Chart integration

Formik

Form handling

Yup

Validation

Framer Motion

UI animations

React Icons

Icons

React Toastify

Notifications/toasts

React Hot Toast

Toast notifications

Socket.IO Client

Real-time communication

date-fns

Date handling

jwt-decode

JWT decoding

Backend

Technology

Purpose

Node.js

Runtime

Express.js

REST API

MongoDB

Database

Mongoose

MongoDB ODM

Socket.IO

Real-time communication

JWT

Authentication

bcrypt / bcryptjs

Password hashing

Nodemailer

Email

Multer

File uploads

Express Validator

Validation

Helmet

HTTP security headers

Express Rate Limit

Rate limiting

CORS

Cross-origin requests

Morgan

Development logging

Winston

Application logging

Node Cron

Scheduled tasks

Cookie Parser

Cookie handling

dotenv

Environment configuration

Development / Testing

Nodemon

Jest

Supertest

Concurrently

🏗️ System Architecture

                         ┌─────────────────────┐
                         │        USERS        │
                         │                     │
                         │ Admin / Lecturer /  │
                         │ Student             │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │                     │
                         │ React Router        │
                         │ Redux Toolkit       │
                         │ Material UI         │
                         │ Calendar            │
                         │ Chart.js            │
                         └──────────┬──────────┘
                                    │
                              HTTP / REST
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Node.js + Express   │
                         │                     │
                         │ Routes              │
                         │ Controllers         │
                         │ Middleware          │
                         │ Authentication      │
                         │ Authorization       │
                         └──────────┬──────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                     ▼                             ▼
            ┌─────────────────┐          ┌─────────────────┐
            │     MongoDB     │          │    Socket.IO    │
            │                 │          │                 │
            │ Users           │          │ Real-time       │
            │ Events          │          │ Messaging       │
            │ Resources       │          │ Notifications   │
            │ Reservations    │          │ Typing          │
            │ Messages        │          │ Read Receipts   │
            │ Notifications   │          └─────────────────┘
            │ Schedules       │
            └─────────────────┘

📁 Project Structure

smart-campus-management-IIITV-/
│
├── backend/
│   ├── backups/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── event.controller.js
│   │   ├── eventController.js
│   │   ├── events.controller.js
│   │   ├── message.controller.js
│   │   ├── reservations.controller.js
│   │   ├── resources.controller.js
│   │   ├── scheduleController.js
│   │   └── user.controller.js
│   │
│   ├── middleware/
│   │   ├── async.js
│   │   ├── auth.js
│   │   └── error.js
│   │
│   ├── models/
│   │   ├── Analytics.js
│   │   ├── Conversation.js
│   │   ├── Event.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Registration.js
│   │   ├── Reservation.js
│   │   ├── Resource.js
│   │   ├── Schedule.js
│   │   └── User.js
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   └── test.html
│   │
│   ├── routes/
│   │   ├── analytics.routes.js
│   │   ├── auth.routes.js
│   │   ├── events.routes.js
│   │   ├── message.routes.js
│   │   ├── notification.routes.js
│   │   ├── reservations.js
│   │   ├── resource.routes.js
│   │   ├── schedule.routes.js
│   │   ├── scheduleRoutes.js
│   │   ├── user.routes.js
│   │   ├── users.js
│   │   └── users.routes.js
│   │
│   ├── scripts/
│   │   ├── README.md
│   │   └── migrate-data.js
│   │
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── errorResponse.js
│   │   ├── notifications.js
│   │   ├── schedulers.js
│   │   └── sendEmail.js
│   │
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
│   │   ├── utils/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
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

🗃️ Database Models

The backend defines the following main Mongoose models.

User

Stores:

First name

Last name

Email

Role

Password

Main department

Sub-department

Status

Last login

Password-reset information

Creation timestamp

Event

Stores:

Title

Description

Start date

End date

Venue

Organizer

Department

Category

Target audience

Capacity

Attendees

Poster

Featured status

Event status

Creator

Timestamps

Registration

Stores:

User

Event

Registration date

Check-in status

Check-in time

Attendance status

Attendance states:

registered
attended
no-show

A unique index prevents a user from registering for the same event more than once.

Resource

Stores:

Resource name

Type

Location

Capacity

Description

Features

Availability

Maintenance schedule

Images

Approval requirement

Allowed roles

Creator

Creation date

Reservation

Stores:

Resource

User

Title

Purpose

Start time

End time

Attendee count

Status

Approver

Approval date

Rejection reason

Recurrence information

Creation date

Schedule

Stores:

Title

Description

Start date

End date

Location

Type

Organizer

Participants

Resources

Recurrence

Target audience

Calendar color

Message

Stores:

Sender

Recipient

Conversation

Content

Attachments

Read-by information

System-message flag

Timestamps

Conversation

Supports:

direct
group
course

and stores:

Participants

Participant roles

Course reference

Avatar

Archive state

Last message

Last-message timestamp

Creator

Timestamps

Notification

Stores:

Recipient

Sender

Notification type

Title

Content

Read state

Priority

Link

Related model

Related record

Delivery status

Expiration

Creation date

Analytics

Provides aggregation support for:

Types

Categories

Actions

Counts

Total values

Time-series data

🔌 API Modules

The backend mounts the following primary API modules:

/api/auth
/api/users
/api/schedules
/api/resources
/api/analytics
/api/events
/api/messages
/api/notifications
/api/reservations

Authentication

/api/auth

Users

/api/users

Schedules

/api/schedules

Resources

/api/resources

Analytics

/api/analytics

Events

/api/events

Messages

/api/messages

Notifications

/api/notifications

Reservations

/api/reservations

🩺 Health Check

The backend provides:

GET /health

Example response:

{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}

⚙️ Requirements

Install the following before running the project:

Node.js 14+

npm

MongoDB

Git

Modern web browser

For development, a current Node.js LTS release is recommended.

🚀 Installation

1. Clone the Repository

git clone https://github.com/UJumesh/smart-campus-management-IIITV-.git

Navigate into the project:

cd smart-campus-management-IIITV-

2. Install All Dependencies

The root package.json provides an installation helper:

npm run install-all

This installs:

Root dependencies
       ↓
Backend dependencies
       ↓
Frontend dependencies

Alternatively:

Root

npm install

Backend

cd backend
npm install

Frontend

cd ../frontend
npm install

🔐 Environment Configuration

Create a file:

backend/.env

Use backend/.env.example as the template.

Example:

NODE_ENV=development
PORT=5001

MONGO_URI=mongodb://localhost:27017/smart-campus

JWT_SECRET=replace_with_a_secure_secret
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

Important

Never commit real:

JWT secrets

SMTP passwords

API keys

Database credentials

to GitHub.

🗄️ MongoDB Setup

The default development database URI is:

mongodb://localhost:27017/smart-campus

Start MongoDB locally and ensure the database server is available before starting the backend.

MongoDB will create the smart-campus database when application data is written.

▶️ Running the Application

Option 1 — Run Frontend and Backend Together

From the project root:

npm run dev

The root script starts:

Backend
Frontend

concurrently.

Option 2 — Run Backend Separately

cd backend
npm run dev

The backend prefers:

http://localhost:5001

If the preferred port is already occupied, the server attempts to find another available port.

Option 3 — Run Frontend Separately

Open another terminal:

cd frontend
npm start

The React development server normally runs at:

http://localhost:3000

🌐 Frontend API Configuration

The frontend Axios client supports:

REACT_APP_API_URL

For local development, set:

REACT_APP_API_URL=http://localhost:5001

This is recommended because the backend's default development port is 5001.

The frontend package also contains a development proxy targeting port 5001.

🔄 Application Flow

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
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
        ADMIN           LECTURER         STUDENT
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                       DASHBOARD
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
      Events           Resources          Schedule
        │                  │                  │
        ▼                  ▼                  ▼
   Registration       Reservation         Calendar
        │                  │
        └──────────┬───────┘
                   ▼
              Notifications
                   │
                   ▼
              Communication
                   │
                   ▼
                Analytics

🎟️ Event Registration Workflow

User
 │
 ▼
View Events
 │
 ▼
Open Event Details
 │
 ▼
Check Capacity
 │
 ▼
Register
 │
 ▼
Registration Stored
 │
 ▼
Attend Event
 │
 ▼
Admin / Lecturer Check-in
 │
 ▼
Attendance Status

🏢 Resource Reservation Workflow

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
Enter Purpose & Attendees
 │
 ▼
Check Reservation Conflict
 │
 ├── Conflict ──► Prevent / Reject
 │
 └── No Conflict
          │
          ▼
     Create Reservation
          │
          ▼
       Pending
          │
     ┌────┴────┐
     ▼         ▼
 Approved    Rejected

💬 Real-Time Messaging Workflow

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
 ├──────────────► MongoDB
 │
 ▼
Conversation Room
 │
 ▼
User B
 │
 ▼
New Message

Socket.IO also supports:

Typing indicators

Read receipts

Conversation rooms

Personal notification rooms

🔒 Security

The repository includes multiple security mechanisms.

Authentication & authorization

JWT authentication

Protected routes

Role-based authorization

Password hashing with bcrypt

Token refresh

Password reset flow

HTTP/API security

Helmet

CORS

Express rate limiting

Express Validator

Cookie Parser

Environment-based configuration

Production recommendations

Before production deployment, additionally implement/review:

HTTPS

Secure cookies

Strict CORS configuration

Strong JWT secrets

Input sanitization

CSRF protection where applicable

MongoDB authentication and network restrictions

Secure SMTP credentials

Secret management

Audit logging

Security testing

Dependency vulnerability scanning

🧪 Testing

The backend includes Jest and Supertest dependencies.

Run:

cd backend
npm test

The frontend uses the Create React App testing setup.

Run:

cd frontend
npm test

The repository should be considered a development/academic project; test coverage is not presented here as complete.

🏗️ Production Build

Build the React frontend:

cd frontend
npm run build

Or from the project root:

npm run build

The production frontend build is generated in:

frontend/build/

📸 Screenshots

Create a folder such as:

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

Then add them to this section.

Login

![Login](screenshots/login.png)

Dashboard

![Dashboard](screenshots/dashboard.png)

Events

![Events](screenshots/events.png)

Resources

![Resources](screenshots/resources.png)

Analytics

![Analytics](screenshots/analytics.png)

Screenshots are intentionally not embedded here because the uploaded repository does not contain a dedicated screenshot gallery.

📋 Current Implementation Status

Module

Status

Authentication

✅ Implemented

JWT authorization

✅ Implemented

Role-based access

✅ Implemented

User management

✅ Implemented

Profile management

✅ Implemented

Event management

✅ Implemented

Event registration

✅ Implemented

Event attendee/check-in support

✅ Implemented

Resource management

✅ Implemented

Resource reservation

✅ Implemented

Reservation approval/rejection

✅ Implemented

Reservation conflict detection

✅ Implemented

Messaging

✅ Implemented

Socket.IO communication

✅ Implemented

Notifications

✅ Implemented

Admin analytics

✅ Implemented

Calendar UI

✅ Implemented

Schedule backend

⚠️ Partially implemented

Attendance API

⚠️ Placeholder behavior

Courses

🚧 Under development

Production deployment

🚧 Requires deployment configuration

Automated test coverage

🚧 Not presented as complete

⚠️ Known Development Notes

The repository is actively evolving and contains some legacy/duplicate implementations.

1. Schedule implementations

There are multiple schedule-related route/controller files.

The server currently mounts:

backend/routes/schedule.routes.js

That file contains placeholder CRUD handlers.

A more developed implementation also exists in:

backend/routes/scheduleRoutes.js

This should be consolidated before production deployment.

2. Courses module

The frontend Courses pages explicitly use placeholder behavior and display a "Coming Soon" state.

The course backend/API is therefore not documented as a completed feature.

3. Frontend API port

The backend defaults to:

5001

The frontend Axios service has a fallback of:

5002

For local development, explicitly configure:

REACT_APP_API_URL=http://localhost:5001

to keep frontend API requests aligned with the backend.

4. Legacy files

The repository contains some similarly named route/controller files, for example:

event.controller.js
eventController.js
events.controller.js

auth.js
auth.routes.js

users.js
users.routes.js
users.routes.js

schedule.routes.js
scheduleRoutes.js

These should eventually be consolidated to make the project easier to maintain.

5. Development/demo data

The server contains initialization logic for default users and development behavior. Production credentials and secrets should never be retained in source code.

🚀 Future Improvements

Potential future enhancements include:

Academic Management

Complete Courses module

Course enrollment

Faculty-course mapping

Assignment management

Examination management

Results/grades

Attendance management

Campus Services

Library management

Hostel management

Fee management

Complaint management

Transport management

Campus navigation

Lost and found

Communication

Push notifications

Email notifications

SMS notifications

Advanced group communication

File/document sharing

Intelligence & Analytics

Advanced campus analytics

Resource utilization analysis

Event participation analytics

Predictive resource demand

AI-powered campus assistant

Infrastructure

MongoDB Atlas deployment

Cloud deployment

Docker support

CI/CD pipeline

Automated backups

Monitoring

Centralized logging

Security

Two-factor authentication

OTP verification

Stronger session controls

Security audit

Automated vulnerability scanning

Advanced permission management

🤝 Contribution

Contributions are welcome.

1. Fork the repository

2. Create a feature branch

git checkout -b feature/your-feature

3. Make your changes

4. Test the changes

5. Stage the changes

git add .

6. Commit

git commit -m "Add your feature"

7. Push

git push origin feature/your-feature

8. Open a Pull Request

🔄 Git Workflow

Check status

git status

Pull latest changes

git pull

Add changes

git add .

Commit

git commit -m "Update Smart Campus Management System"

Push

git push

📌 Project Information

Property

Details

Project

Smart Campus Management System

Type

Full-Stack Web Application

Architecture

MERN

Frontend

React 18

Backend

Node.js + Express

Database

MongoDB

ODM

Mongoose

Authentication

JWT

Password Hashing

bcrypt

Real-Time

Socket.IO

State Management

Redux Toolkit

UI Framework

Material UI

Calendar

FullCalendar / React Big Calendar

Charts

Chart.js

Roles

Admin / Lecturer / Student

License

MIT

Status

Active Development

👨‍💻 Author

Umesh Jatav

B.Tech — Computer Science & EngineeringIndian Institute of Information Technology Vadodara

GitHub

https://github.com/UJumesh

Project Repository

https://github.com/UJumesh/smart-campus-management-IIITV-

Add your LinkedIn and LeetCode links here if you want them displayed in the README.

📈 Project Status

Active Development

The Smart Campus Management System is an academic full-stack software engineering project focused on centralizing campus users, events, resources, reservations, scheduling, communication, notifications, and administrative analytics.

The architecture is designed to allow additional campus modules to be added as development continues.

⚠️ Disclaimer

This project is developed for academic, educational, demonstration, and software-development purposes.

It should not be considered production-ready without additional:

Security auditing

Infrastructure hardening

Database security configuration

Comprehensive testing

Monitoring

Deployment configuration

Backup strategy

Privacy controls

Production-grade secret management

⭐ Support

If you find the project useful, consider giving the repository a ⭐ on GitHub.

Smart Campus Management System

One platform for smarter campus management.
