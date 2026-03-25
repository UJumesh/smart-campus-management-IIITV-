@echo off
echo === Smart Campus MongoDB Migration Tool ===
echo Step 1: Exporting data from local MongoDB
node export-data.js
if %ERRORLEVEL% NEQ 0 (
  echo Error exporting data. Migration aborted.
  pause
  exit /b 1
)

echo.
echo Step 2: Importing data to MongoDB Atlas
node import-data.js
if %ERRORLEVEL% NEQ 0 (
  echo Error importing data to MongoDB Atlas.
  pause
  exit /b 1
)

echo.
echo Migration completed successfully!
echo.
echo Next steps:
echo 1. Update your .env file to use MongoDB Atlas:
echo    MONGO_URI=
echo 2. Restart your application
echo.
pause 
