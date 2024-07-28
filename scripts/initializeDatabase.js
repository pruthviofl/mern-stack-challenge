
const axios = require('axios');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/transactionDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Fetch data from API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    // Clear existing data
    await Transaction.deleteMany({});

    // Insert new data
    await Transaction.insertMany(transactions);

    console.log('Database initialized successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();
