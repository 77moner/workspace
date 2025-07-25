const express = require('express');
const stockService = require('../services/stockService');
const router = express.Router();

console.log("StockRoutes: Module loaded, defining routes...");

// Validate stock ticker symbol
router.get('/validate/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;

    console.log(`StockRoutes: Received validation request for ticker: ${ticker}`);

    // Validate input
    if (!ticker || ticker.trim().length === 0) {
      console.log('StockRoutes: Empty ticker symbol provided');
      return res.status(400).json({
        error: 'Ticker symbol is required'
      });
    }

    // Clean and validate ticker format
    const cleanTicker = ticker.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(cleanTicker)) {
      console.log(`StockRoutes: Invalid ticker format: ${cleanTicker}`);
      return res.status(400).json({
        error: 'Invalid ticker format. Ticker should be 1-5 letters only.'
      });
    }

    // Validate ticker using stock service
    const validationResult = await stockService.validateTicker(cleanTicker);

    console.log(`StockRoutes: Validation result for ${cleanTicker}:`, validationResult.valid);

    if (validationResult.valid) {
      res.json(validationResult);
    } else {
      res.status(404).json(validationResult);
    }

  } catch (error) {
    console.error('StockRoutes: Error in ticker validation:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while validating ticker'
    });
  }
});

// Get stock analysis data
router.get('/analysis/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;

    console.log(`StockRoutes: Received analysis request for ticker: ${ticker}`);

    // Validate input
    if (!ticker || ticker.trim().length === 0) {
      console.log('StockRoutes: Empty ticker symbol provided for analysis');
      return res.status(400).json({
        error: 'Ticker symbol is required'
      });
    }

    // Clean ticker
    const cleanTicker = ticker.trim().toUpperCase();
    console.log(`StockRoutes: Getting analysis for cleaned ticker: ${cleanTicker}`);

    // Get analysis data using stock service
    const analysisData = await stockService.getStockAnalysis(cleanTicker);

    console.log(`StockRoutes: Analysis data retrieved for ${cleanTicker}`);
    res.json(analysisData);

  } catch (error) {
    console.error('StockRoutes: Error in stock analysis:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while getting stock analysis'
    });
  }
});

// Refresh stock data
router.post('/refresh/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;

    console.log(`StockRoutes: Received refresh request for ticker: ${ticker}`);

    // Validate input
    if (!ticker || ticker.trim().length === 0) {
      console.log('StockRoutes: Empty ticker symbol provided for refresh');
      return res.status(400).json({
        error: 'Ticker symbol is required'
      });
    }

    // Clean ticker
    const cleanTicker = ticker.trim().toUpperCase();
    console.log(`StockRoutes: Refreshing data for cleaned ticker: ${cleanTicker}`);

    // Refresh data using stock service
    const refreshResult = await stockService.refreshStockData(cleanTicker);

    console.log(`StockRoutes: Data refreshed for ${cleanTicker}`);
    res.json(refreshResult);

  } catch (error) {
    console.error('StockRoutes: Error in stock data refresh:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while refreshing stock data'
    });
  }
});

// Get popular stocks with real-time data
router.get('/popular', async (req, res) => {
  try {
    console.log('StockRoutes: Getting popular stocks data');
    
    const popularTickers = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA'];
    const stocksData = await stockService.getPopularStocks(popularTickers);
    
    console.log(`StockRoutes: Retrieved data for ${stocksData.length} popular stocks`);
    res.json({ success: true, stocks: stocksData });
    
  } catch (error) {
    console.error('StockRoutes: Error getting popular stocks:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while getting popular stocks'
    });
  }
});

console.log("StockRoutes: All routes defined");
console.log("StockRoutes: Exporting router...");

module.exports = router;