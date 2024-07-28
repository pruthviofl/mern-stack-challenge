// routes/transactions.js
const express = require('express');
const Transaction = require('../models/Transaction');

const router = express.Router();

// List Transactions API
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, perPage = 10, search = '' } = req.query;

    const query = {
      $or: [
        { productTitle: new RegExp(search, 'i') },
        { productDescription: new RegExp(search, 'i') },
        { price: new RegExp(search, 'i') }
      ]
    };

    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));

    const totalCount = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(totalCount / perPage),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics API
router.get('/statistics/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth(); // Convert month name to index

    const stats = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: new Date(`2022-${monthIndex + 1}-01`),
            $lt: new Date(`2022-${monthIndex + 2}-01`)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$price' },
          totalSoldItems: { $sum: { $cond: ['$sold', 1, 0] } },
          totalNotSoldItems: { $sum: { $cond: [{ $not: ['$sold'] }, 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || { totalAmount: 0, totalSoldItems: 0, totalNotSoldItems: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bar Chart API
router.get('/bar-chart/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth();

    const ranges = [
      { $gte: 0, $lt: 100 },
      { $gte: 101, $lt: 200 },
      { $gte: 201, $lt: 300 },
      { $gte: 301, $lt: 400 },
      { $gte: 401, $lt: 500 },
      { $gte: 501, $lt: 600 },
      { $gte: 601, $lt: 700 },
      { $gte: 701, $lt: 800 },
      { $gte: 801, $lt: 900 },
      { $gte: 901 }
    ];

    const barData = await Promise.all(ranges.map(range =>
      Transaction.countDocuments({
        dateOfSale: {
          $gte: new Date(`2022-${monthIndex + 1}-01`),
          $lt: new Date(`2022-${monthIndex + 2}-01`)
        },
        price: range
      })
    ));

    res.json({
      ranges: [
        '0 - 100', '101 - 200', '201 - 300', '301 - 400',
        '401 - 500', '501 - 600', '601 - 700', '701 - 800',
        '801 - 900', '901-above'
      ],
      counts: barData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pie Chart API
router.get('/pie-chart/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth();

    const pieData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: new Date(`2022-${monthIndex + 1}-01`),
            $lt: new Date(`2022-${monthIndex + 2}-01`)
          }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(pieData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Combined API
router.get('/combined/:month', async (req, res) => {
  try {
    const { month } = req.params;

    const transactionsPromise = Transaction.find({
      dateOfSale: {
        $gte: new Date(`2022-${month}-01`),
        $lt: new Date(`2022-${month + 1}-01`)
      }
    });

    const statisticsPromise = Transaction.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: new Date(`2022-${month}-01`),
            $lt: new Date(`2022-${month + 1}-01`)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$price' },
          totalSoldItems: { $sum: { $cond: ['$sold', 1, 0] } },
          totalNotSoldItems: { $sum: { $cond: [{ $not: ['$sold'] }, 1, 0] } }
        }
      }
    ]);

    const barChartPromise = Transaction.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: new Date(`2022-${month}-01`),
            $lt: new Date(`2022-${month + 1}-01`)
          }
        }
      },
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
          default: 'Others',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const pieChartPromise = Transaction.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: new Date(`2022-${month}-01`),
            $lt: new Date(`2022-${month + 1}-01`)
          }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      transactionsPromise,
      statisticsPromise,
      barChartPromise,
      pieChartPromise
    ]);

    res.json({
      transactions,
      statistics: statistics[0] || { totalAmount: 0, totalSoldItems: 0, totalNotSoldItems: 0 },
      barChart,
      pieChart
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
