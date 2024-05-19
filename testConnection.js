require('dotenv').config();
const mongoose = require('mongoose');
console.log('Starting test script');

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const database = mongoose.connection;

database.on('error', (error) => {
  console.error('Connection error:', error);
  process.exit(1);
});

database.once('open', function () {
  console.log('Connected to MongoDB yes');
  mongoose.connection.close();
});

// Log when the connection attempt starts
console.log('Attempting to connect to MongoDB...');
