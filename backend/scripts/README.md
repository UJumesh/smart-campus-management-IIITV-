# MongoDB Data Migration Tool

This tool allows you to migrate data from your local MongoDB database to MongoDB Atlas.

## Prerequisites

- Node.js installed
- MongoDB running locally
- MongoDB Atlas account and cluster set up
- Connection string for your MongoDB Atlas cluster

## Setup MongoDB Atlas

1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster
3. Set up database access (create a user with password)
4. Set up network access (IP whitelist)
5. Get your connection string from Atlas (Click "Connect" → "Connect your application")

## Usage

Run the migration script with your MongoDB Atlas connection string as an argument:

```bash
node scripts/migrate-data.js "mongodb+srv://username:password@cluster.mongodb.net/database"
```

Replace the connection string with your actual MongoDB Atlas connection string.

## What the Script Does

1. Connects to your local MongoDB database
2. Exports all collections to JSON files (stored in the `backups` directory)
3. Connects to your MongoDB Atlas cluster
4. Imports all data into the corresponding collections
5. Provides prompts to confirm actions and warnings about potential duplicates

## After Migration

1. Update your application's `.env` file to use the new MongoDB Atlas connection string:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

2. Restart your application

## Troubleshooting

- If the script fails with authentication errors, make sure your MongoDB Atlas username and password are correct
- If the script fails with connection errors, make sure your IP address is whitelisted in MongoDB Atlas
- If you encounter duplicate key errors, it means some data already exists in the Atlas database 