const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const transactionRoutes = require('./routes/transactions');

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api', transactionRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transactionDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));