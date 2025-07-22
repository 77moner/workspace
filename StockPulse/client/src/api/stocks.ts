import api from './api';

// Description: Validate stock ticker symbol
// Endpoint: GET /api/stocks/validate/:ticker
// Request: { ticker: string }
// Response: { valid: boolean, message?: string, companyName?: string, industry?: string, marketCap?: string, currentPrice?: string, exchange?: string, sector?: string, description?: string }
export const validateTicker = async (ticker: string) => {
  try {
    console.log(`API: Validating ticker symbol: ${ticker}`);
    const response = await api.get(`/api/stocks/validate/${ticker}`);
    console.log(`API: Ticker validation successful for ${ticker}`);
    return response.data;
  } catch (error: any) {
    console.error(`API: Error validating ticker ${ticker}:`, error);

    // Handle 404 responses which contain validation results
    if (error.response && error.response.status === 404 && error.response.data) {
      console.log(`API: Ticker ${ticker} not found, returning validation result`);
      return error.response.data;
    }

    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get comprehensive stock analysis
// Endpoint: GET /api/stocks/analysis/:ticker
// Request: { ticker: string }
// Response: { recommendation, chartData, news, sentiment, companyName }
export const getStockAnalysis = async (ticker: string) => {
  try {
    console.log(`API: Getting stock analysis for: ${ticker}`);
    const response = await api.get(`/api/stocks/analysis/${ticker}`);
    console.log(`API: Stock analysis successful for ${ticker}`);
    return response.data;
  } catch (error: any) {
    console.error(`API: Error getting stock analysis for ${ticker}:`, error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Refresh stock data
// Endpoint: POST /api/stocks/refresh/:ticker
// Request: { ticker: string }
// Response: { success: boolean, message: string }
export const refreshStockData = async (ticker: string) => {
  try {
    console.log(`API: Refreshing stock data for: ${ticker}`);
    const response = await api.post(`/api/stocks/refresh/${ticker}`);
    console.log(`API: Stock data refresh successful for ${ticker}`);
    return response.data;
  } catch (error: any) {
    console.error(`API: Error refreshing stock data for ${ticker}:`, error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};