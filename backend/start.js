/**
 * Simple script to start the server
 */
require("dotenv").config();
require("colors");

console.log("Starting server...");
console.log(`Environment: ${process.env.NODE_ENV}`.cyan);
console.log(`Port: ${process.env.PORT}`.cyan);
console.log(
  `MongoDB: ${
    process.env.SKIP_MONGODB === "true"
      ? "Skipped".yellow
      : process.env.MONGO_URI.cyan
  }`
);
console.log(`Frontend URL: ${process.env.FRONTEND_URL}`.cyan);

// Start the server
require("./server");
