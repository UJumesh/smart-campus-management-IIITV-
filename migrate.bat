@echo off
echo Running data migration...
node backend/scripts/migrate-data.js "mongodb+srv://janithrulz2001:password1234@scms.j4l2f.mongodb.net/smart-campus?retryWrites=true&w=majority"
pause 