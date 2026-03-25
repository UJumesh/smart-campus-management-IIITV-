const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);

    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`.red.bold);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected'.yellow);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected'.green);
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = connectDB; 