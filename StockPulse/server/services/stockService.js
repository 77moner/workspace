const axios = require('axios');
const LLMService = require('./llmService');

class StockService {
  constructor() {
    this.llmService = new LLMService();
    this.tiingoApiKey = process.env.TIINGO_API_KEY;
    this.baseUrl = 'https://api.tiingo.com/tiingo';
    console.log(`StockService: Constructor - Tiingo API key configured: ${this.tiingoApiKey ? 'YES' : 'NO'}`);
    if (this.tiingoApiKey) {
      console.log(`StockService: Constructor - API key starts with: ${this.tiingoApiKey.substring(0, 4)}...`);
    }
  }

async validateTicker(ticker) {
  try {
    console.log(`StockService: Validating ticker symbol: ${ticker}`);
    if (!this.tiingoApiKey) {
      console.warn('StockService: Tiingo API key not configured, using fallback validation');
      return this.fallbackValidation(ticker);
    }
    // Use Tiingo API to validate ticker and get company info
    const url = `https://api.tiingo.com/tiingo/daily/${ticker}`;
    const response = await axios.get(url, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${this.tiingoApiKey}` },
      timeout: 10000
    });
    const data = response.data;
    if (!data.ticker) {
      return {
        valid: false,
        message: `Stock symbol '${ticker}' not found. Please verify the ticker symbol.`
      };
    }
    return {
      valid: true,
      companyName: data.name || data.ticker,
      industry: data.industry || data.assetType || 'N/A',
      marketCap: data.marketCap || data.market_cap || 'N/A',
      currentPrice: data.last || data.close || 'N/A',
      exchange: data.exchange || data.exchangeCode || 'N/A',
      sector: data.sector || 'N/A',
      description: data.description || data.shortDescription || 'N/A',
      ticker: data.ticker
    };
  } catch (error) {
    throw new Error(`Failed to validate ticker symbol: ${error.message}`);
  }
}

async fetchRealNews(ticker) {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.warn('StockService: NEWS_API_KEY not set, returning empty news array.');
      return [];
    }
    // Use NewsAPI.org for real news headlines
    const url = `https://newsapi.org/v2/everything`;
    const res = await axios.get(url, {
      params: {
        q: ticker,
        sortBy: 'publishedAt',
        language: 'en',
        apiKey
      },
      timeout: 10000
    });
    const articles = res.data.articles || [];
    
    // Map to expected format and add LLM-based sentiment analysis
    const articlesWithSentiment = [];
    for (const article of articles.slice(0, 5)) {
      const text = article.title + ' ' + (article.description || '');
      const sentiment = await this.llmService.analyzeSentiment(text);
      
      articlesWithSentiment.push({
        headline: article.title,
        source: article.source.name,
        timestamp: article.publishedAt,
        excerpt: article.description || '',
        url: article.url,
        sentiment: sentiment
      });
    }
    
    return articlesWithSentiment;
  } catch (err) {
    console.error('StockService: Error fetching real news:', err.message);
    return [];
  }
}

  async getStockAnalysis(ticker) {
    try {
      console.log(`StockService: Getting stock analysis for ticker: ${ticker}`);
      if (!this.tiingoApiKey) {
        console.warn('StockService: Tiingo API key not configured, using fallback analysis');
        return this.fallbackAnalysis(ticker);
      }
      // Validate ticker and get company info from Tiingo
      const validation = await this.validateTicker(ticker);
      if (!validation.valid) {
        throw new Error(validation.message || 'Invalid ticker');
      }
      // Get latest summary/quote from Tiingo
      let tiingoQuote = null;
      try {
        const quoteUrl = `https://api.tiingo.com/tiingo/daily/${ticker}/prices`;
        const quoteRes = await axios.get(quoteUrl, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${this.tiingoApiKey}` },
          timeout: 10000
        });
        tiingoQuote = Array.isArray(quoteRes.data) ? quoteRes.data[0] : quoteRes.data;
      } catch (err) {
        console.warn('StockService: Tiingo quote fetch failed:', err.message);
      }
      // --- Yahoo Finance for price chart only ---
      let chartData = { oneMinute: [], fifteenMinute: [], oneHour: [] };
      try {
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
        const intradayRes = await axios.get(yahooUrl, {
          params: {
            interval: '1m',
            range: '5d',  // Use 5d to get ~1950 data points (5 * 390 minutes per trading day)
          },
          timeout: 10000
        });
        const chart = intradayRes.data.chart;
        if (chart && chart.result && chart.result[0]) {
          const yahooResult = chart.result[0];
          const timestamps = yahooResult.timestamp;
          const indicators = yahooResult.indicators;
          const quote = indicators.quote[0];
          const intradayData = {};
          for (let i = 0; i < timestamps.length; i++) {
            const date = new Date(timestamps[i] * 1000);
            const timeStr = date.toISOString().replace('T', ' ').substring(0, 19);
            intradayData[timeStr] = {
              '1. open': quote.open[i],
              '2. high': quote.high[i],
              '3. low': quote.low[i],
              '4. close': quote.close[i],
              '5. volume': quote.volume[i]
            };
          }
          chartData = this.processChartData(intradayData);
        }
      } catch (err) {
        console.warn('StockService: Yahoo Finance chart fetch failed, chart will be empty:', err.message);
      }
      // Generate recommendation based on Tiingo data
      const news = await this.fetchRealNews(ticker);
      const sentiment = this.calculateSentiment(news);
      const recommendation = this.generateRecommendation(validation, tiingoQuote, chartData, sentiment);
      // Force all OHLCV values to numbers before sending to frontend
      function forceOHLCVNumbers(arr) {
        return (arr || []).map(d => {
          const converted = {
            time: d.time,
            open: parseFloat(String(d.open)),
            high: parseFloat(String(d.high)),
            low: parseFloat(String(d.low)),
            close: parseFloat(String(d.close)),
            volume: parseInt(String(d.volume)) || 0
          };
          return converted;
        });
      }
      const fixedChartData = {
        oneMinute: forceOHLCVNumbers(chartData.oneMinute),
        fifteenMinute: forceOHLCVNumbers(chartData.fifteenMinute),
        oneHour: forceOHLCVNumbers(chartData.oneHour)
      };
      // Log typeof for each OHLCV field in first 3 points
      const debugTypes = (fixedChartData.oneMinute.slice(0,3) || []).map(d => ({
        open: typeof d.open,
        high: typeof d.high,
        low: typeof d.low,
        close: typeof d.close,
        volume: typeof d.volume,
        values: { open: d.open, high: d.high, low: d.low, close: d.close }
      }));
      console.log('DEBUG OHLCV types (first 3 oneMinute):', JSON.stringify(debugTypes));
      const result = {
        ...validation,
        companyName: validation.companyName || `${ticker} Corporation`,
        recommendation,
        chartData: fixedChartData,
        news,
        sentiment,
        tiingoQuote,
        debugTypes
      };
      console.log(`StockService: Successfully generated analysis for ${ticker}`);
      return result;
    } catch (error) {
      console.error(`StockService: Error getting stock analysis for ${ticker}:`, error.message);
      // Fallback to mock data if API fails
      console.log(`StockService: Using fallback analysis for ${ticker}`);
      return this.fallbackAnalysis(ticker);
    }
  }

  async refreshStockData(ticker) {
    try {
      console.log(`StockService: Refreshing stock data for ticker: ${ticker}`);

      // For now, just return success since we're fetching fresh data each time
      // In a real implementation, you might cache data and refresh it here
      
      return {
        success: true,
        message: `Stock data for ${ticker} refreshed successfully`
      };

    } catch (error) {
      console.error(`StockService: Error refreshing stock data for ${ticker}:`, error.message);
      throw new Error(`Failed to refresh stock data: ${error.message}`);
    }
  }

  processChartData(intradayData) {
    // To get 100 points for each interval, need 100*interval 1-min points
    const allTimes = Object.keys(intradayData).reverse();
    const parseNum = v => Number(v);
    
    // Helper function to format time as hh:mm
    const formatTime = (timeString) => {
      const timePart = timeString.split(' ')[1]; // Get time part from "YYYY-MM-DD HH:MM:SS"
      return timePart.substring(0, 5); // Get only HH:MM, removing seconds
    };
    
    // Filter out invalid data points and process 1-minute data
    const oneMinute = allTimes.slice(0, 150).map(time => {
      const open = parseNum(intradayData[time]['1. open']);
      const high = parseNum(intradayData[time]['2. high']);
      const low = parseNum(intradayData[time]['3. low']);
      const close = parseNum(intradayData[time]['4. close']);
      const volume = parseNum(intradayData[time]['5. volume']);
      return {
        time: formatTime(time),
        open,
        high,
        low,
        close,
        volume
      };
    }).filter(d => 
      // Only keep points with valid OHLC data (not zero or NaN)
      !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
      d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0
    ).slice(0, 100); // Take exactly 100 valid points
    
    // Debug: log first 3 processed points
    console.log('processChartData: first 3 oneMinute points (after filtering):', JSON.stringify(oneMinute.slice(0,3)));

    // For 15m and 1h, use more data and ensure we have valid aggregation
    const rawDataFor15m = allTimes.slice(0, Math.min(1500, allTimes.length)).map(time => {
      const open = parseNum(intradayData[time]['1. open']);
      const high = parseNum(intradayData[time]['2. high']);
      const low = parseNum(intradayData[time]['3. low']);
      const close = parseNum(intradayData[time]['4. close']);
      const volume = parseNum(intradayData[time]['5. volume']);
      return {
        time: formatTime(time),
        open,
        high,
        low,
        close,
        volume
      };
    }).filter(d => 
      // Filter out invalid data for aggregation
      !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
      d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0
    );
    
    // For 1-hour, we need to ensure we get exactly 100 data points
    // With 7 days of data (~2100 1-minute points), we need to adjust the interval
    const totalAvailable = allTimes.length;
    let hourlyInterval = 60;
    
    // Calculate what interval we need to get close to 100 data points
    // With ~2100 points available, we need ~21-minute intervals to get 100 data points
    if (totalAvailable < 6000) {
      hourlyInterval = Math.max(15, Math.floor(totalAvailable / 100));
      console.log(`processChartData: Adjusting 1-hour interval to ${hourlyInterval} minutes to get 100 data points from ${totalAvailable} available`);
    }
    
    const rawDataFor1h = allTimes.slice(0, totalAvailable).map(time => {
      const open = parseNum(intradayData[time]['1. open']);
      const high = parseNum(intradayData[time]['2. high']);
      const low = parseNum(intradayData[time]['3. low']);
      const close = parseNum(intradayData[time]['4. close']);
      const volume = parseNum(intradayData[time]['5. volume']);
      return {
        time: formatTime(time),
        open,
        high,
        low,
        close,
        volume
      };
    }).filter(d => 
      // Filter out invalid data for aggregation
      !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
      d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0
    );

    const fifteenMinute = this.aggregateData(rawDataFor15m, 15);
    const oneHour = this.aggregateData(rawDataFor1h, hourlyInterval);
    
    console.log('processChartData: aggregated data counts:', {
      oneMinute: oneMinute.length,
      fifteenMinute: fifteenMinute.length,
      oneHour: oneHour.length
    });
    
    // Debug: Log first few 15-minute data points
    console.log('processChartData: fifteenMinute sample:', {
      first5: fifteenMinute.slice(0, 5).map(d => ({ time: d.time, open: d.open, close: d.close })),
      last5: fifteenMinute.slice(-5).map(d => ({ time: d.time, open: d.open, close: d.close }))
    });

    return {
      oneMinute,
      fifteenMinute,
      oneHour
    };
  }

  aggregateData(minuteData, interval) {
    const aggregated = [];
    
    // For 1-hour intervals, we need at least 6000 1-minute data points to create 100 hourly candles
    // For 15-minute intervals, we need at least 1500 1-minute data points to create 100 15-minute candles
    const requiredDataPoints = interval * 100;
    
    if (minuteData.length < requiredDataPoints) {
      console.log(`aggregateData: Warning - only ${minuteData.length} data points available, need ${requiredDataPoints} for ${interval}min intervals`);
      console.log(`aggregateData: Will create ${Math.floor(minuteData.length / interval)} ${interval}-minute candles instead of 100`);
    }
    
    // Create as many candles as possible, up to 100
    const maxCandles = Math.min(100, Math.floor(minuteData.length / interval));
    
    for (let i = 0; i < minuteData.length && aggregated.length < maxCandles; i += interval) {
      const chunk = minuteData.slice(i, i + interval).filter(d => 
        !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
        d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0
      );
      
      if (chunk.length > 0) {
        const open = chunk[0].open;
        const close = chunk[chunk.length - 1].close;
        const high = Math.max(...chunk.map(d => d.high));
        const low = Math.min(...chunk.map(d => d.low));
        const volume = chunk.reduce((sum, d) => sum + (d.volume || 0), 0);
        
        // Only add if all OHLC values are valid
        if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close) &&
            open > 0 && high > 0 && low > 0 && close > 0) {
          
          // For aggregated data, create consistent time boundaries to ensure categorical scale compatibility
          let timeLabel;
          if (interval === 1) {
            // For 1-minute data, use the original time
            timeLabel = chunk[0].time;
          } else {
            // For aggregated intervals, create consistent time boundaries
            const originalTime = chunk[0].time;
            const [hours, minutes] = originalTime.split(':').map(Number);
            
            if (interval === 15) {
              // Round to nearest 15-minute boundary for consistent categorical scale
              const roundedMinutes = Math.floor(minutes / 15) * 15;
              timeLabel = `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
            } else if (interval >= 60) {
              // For hourly and longer intervals, round to hour boundary
              timeLabel = `${hours.toString().padStart(2, '0')}:00`;
            } else if (interval >= 15) {
              // For intervals between 15 and 60 minutes, round to the nearest interval boundary
              const roundedMinutes = Math.floor(minutes / interval) * interval;
              timeLabel = `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
            } else {
              // Fallback to original time
              timeLabel = originalTime;
            }
          }
          
          aggregated.push({
            time: timeLabel,
            open,
            high,
            low,
            close,
            volume
          });
        }
      }
    }
    console.log(`aggregateData: Created ${aggregated.length} ${interval}min candles from ${minuteData.length} 1min candles`);
    return aggregated;
  }

  generateRecommendation(validation, tiingoQuote, chartData, sentiment) {
    // Enhanced recommendation logic combining technical analysis and sentiment
    const currentPrice = tiingoQuote && tiingoQuote.close ? parseFloat(tiingoQuote.close) : 0;
    
    // Technical Analysis: Simple moving average
    let avgPrice = 0;
    if (chartData && chartData.oneMinute && chartData.oneMinute.length > 0) {
      avgPrice = chartData.oneMinute.reduce((sum, d) => sum + d.close, 0) / chartData.oneMinute.length;
    }
    
    // Technical signals
    let technicalSignal = 'HOLD';
    let technicalConfidence = 60;
    if (currentPrice > avgPrice * 1.05) {
      technicalSignal = 'SELL';
      technicalConfidence = 70;
    } else if (currentPrice < avgPrice * 0.95) {
      technicalSignal = 'BUY';
      technicalConfidence = 75;
    }
    
    // Sentiment Analysis Impact
    let sentimentSignal = 'NEUTRAL';
    let sentimentConfidence = 50;
    if (sentiment && sentiment.overall) {
      if (sentiment.score >= 70) {
        sentimentSignal = 'BULLISH';
        sentimentConfidence = Math.min(90, sentiment.score);
      } else if (sentiment.score <= 30) {
        sentimentSignal = 'BEARISH';
        sentimentConfidence = Math.min(90, 100 - sentiment.score);
      } else {
        sentimentSignal = 'NEUTRAL';
        sentimentConfidence = 50;
      }
    }
    
    // Combined Recommendation Logic
    let finalAction = 'HOLD';
    let finalConfidence = 60;
    let reasoning = [];
    
    // Technical analysis reasoning
    reasoning.push(`Current price: $${currentPrice}`);
    reasoning.push(`Average price (last 100 min): $${avgPrice.toFixed(2)}`);
    reasoning.push(`Technical signal: ${technicalSignal} (${technicalConfidence}% confidence)`);
    
    // Sentiment analysis reasoning
    if (sentiment) {
      reasoning.push(`Market sentiment: ${sentiment.overall.toUpperCase()} (${sentiment.score}/100)`);
      reasoning.push(`News analysis: ${sentiment.positive} positive, ${sentiment.negative} negative, ${sentiment.neutral} neutral`);
    }
    
    // Decision matrix combining technical and sentiment
    if (technicalSignal === 'BUY' && sentimentSignal === 'BULLISH') {
      finalAction = 'BUY';
      finalConfidence = Math.min(95, (technicalConfidence + sentimentConfidence) / 2 + 10);
      reasoning.push('Strong BUY: Technical and sentiment both positive');
    } else if (technicalSignal === 'SELL' && sentimentSignal === 'BEARISH') {
      finalAction = 'SELL';
      finalConfidence = Math.min(95, (technicalConfidence + sentimentConfidence) / 2 + 10);
      reasoning.push('Strong SELL: Technical and sentiment both negative');
    } else if (technicalSignal === 'BUY' && sentimentSignal === 'BEARISH') {
      finalAction = 'HOLD';
      finalConfidence = Math.max(40, (technicalConfidence + sentimentConfidence) / 2 - 5);
      reasoning.push('HOLD: Mixed signals - technical positive but sentiment negative');
    } else if (technicalSignal === 'SELL' && sentimentSignal === 'BULLISH') {
      finalAction = 'HOLD';
      finalConfidence = Math.max(40, (technicalConfidence + sentimentConfidence) / 2 - 5);
      reasoning.push('HOLD: Mixed signals - technical negative but sentiment positive');
    } else if (technicalSignal === 'HOLD' && sentimentSignal === 'BULLISH') {
      finalAction = 'BUY';
      finalConfidence = Math.max(65, sentimentConfidence - 5);
      reasoning.push('BUY: Neutral technical but positive sentiment drives recommendation');
    } else if (technicalSignal === 'HOLD' && sentimentSignal === 'BEARISH') {
      finalAction = 'SELL';
      finalConfidence = Math.max(65, sentimentConfidence - 5);
      reasoning.push('SELL: Neutral technical but negative sentiment drives recommendation');
    } else if (technicalSignal === 'BUY') {
      finalAction = 'BUY';
      finalConfidence = Math.max(65, technicalConfidence - 5);
      reasoning.push('BUY: Technical analysis positive, neutral sentiment');
    } else if (technicalSignal === 'SELL') {
      finalAction = 'SELL';
      finalConfidence = Math.max(65, technicalConfidence - 5);
      reasoning.push('SELL: Technical analysis negative, neutral sentiment');
    } else {
      finalAction = 'HOLD';
      finalConfidence = Math.max(50, (technicalConfidence + sentimentConfidence) / 2);
      reasoning.push('HOLD: Neutral technical and sentiment signals');
    }
    
    return {
      action: finalAction,
      confidence: finalConfidence,
      summary: `Based on combined technical and sentiment analysis, ${validation.companyName} shows ${finalAction.toLowerCase()} signals.`,
      targetPrice: avgPrice > 0 ? avgPrice.toFixed(2) : undefined,
      currentPrice: currentPrice > 0 ? currentPrice : undefined,
      reasoning: reasoning
    };
  }

  calculateSentiment(news) {
    const positive = news.filter(n => n.sentiment === 'positive').length;
    const negative = news.filter(n => n.sentiment === 'negative').length;
    const neutral = news.filter(n => n.sentiment === 'neutral').length;
    
    const score = Math.round(((positive - negative) / news.length + 1) * 50);
    const overall = score > 60 ? 'positive' : score < 40 ? 'negative' : 'neutral';
    
    return {
      overall,
      score,
      positive,
      negative,
      neutral
    };
  }

  fallbackValidation(ticker) {
    console.log(`StockService: Using fallback validation for ${ticker}`);

    // Common stock symbols for fallback validation
    const knownStocks = {
      'AAPL': { name: 'Apple Inc.', industry: 'Technology', exchange: 'NASDAQ' },
      'TSLA': { name: 'Tesla Inc.', industry: 'Automotive', exchange: 'NASDAQ' },
      'GOOGL': { name: 'Alphabet Inc.', industry: 'Technology', exchange: 'NASDAQ' },
      'MSFT': { name: 'Microsoft Corporation', industry: 'Technology', exchange: 'NASDAQ' },
      'AMZN': { name: 'Amazon.com Inc.', industry: 'E-commerce', exchange: 'NASDAQ' },
      'NVDA': { name: 'NVIDIA Corporation', industry: 'Technology', exchange: 'NASDAQ' },
      'META': { name: 'Meta Platforms Inc.', industry: 'Technology', exchange: 'NASDAQ' },
      'NFLX': { name: 'Netflix Inc.', industry: 'Entertainment', exchange: 'NASDAQ' },
      'AMD': { name: 'Advanced Micro Devices Inc.', industry: 'Technology', exchange: 'NASDAQ' },
      'INTC': { name: 'Intel Corporation', industry: 'Technology', exchange: 'NASDAQ' }
    };

    const stock = knownStocks[ticker.toUpperCase()];

    if (stock) {
      console.log(`StockService: Fallback validation successful for ${ticker}`);
      return {
        valid: true,
        companyName: stock.name,
        industry: stock.industry,
        marketCap: 'N/A',
        currentPrice: 'N/A',
        exchange: stock.exchange,
        sector: 'Technology',
        description: 'N/A'
      };
    }

    console.log(`StockService: Fallback validation failed for ${ticker}`);
    return {
      valid: false,
      message: `Stock symbol '${ticker}' not found. Please try common symbols like AAPL, TSLA, GOOGL, MSFT, etc.`
    };
  }

  fallbackAnalysis(ticker) {
    console.log(`StockService: Using fallback analysis for ${ticker}`);
    
    const mockChartData = {
      oneMinute: Array.from({ length: 100 }, (_, i) => ({
        time: `${9 + Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}`,
        open: 150 + Math.random() * 10,
        high: 155 + Math.random() * 10,
        low: 145 + Math.random() * 10,
        close: 150 + Math.random() * 10,
        volume: Math.floor(Math.random() * 1000000)
      })),
      fifteenMinute: Array.from({ length: 100 }, (_, i) => ({
        time: `${9 + Math.floor(i / 4)}:${String((i % 4) * 15).padStart(2, '0')}`,
        open: 150 + Math.random() * 15,
        high: 160 + Math.random() * 15,
        low: 140 + Math.random() * 15,
        close: 150 + Math.random() * 15,
        volume: Math.floor(Math.random() * 5000000)
      })),
      oneHour: Array.from({ length: 100 }, (_, i) => ({
        time: `Day ${i + 1}`,
        open: 150 + Math.random() * 20,
        high: 165 + Math.random() * 20,
        low: 135 + Math.random() * 20,
        close: 150 + Math.random() * 20,
        volume: Math.floor(Math.random() * 10000000)
      }))
    };

    // Mock validation object
    const mockValidation = {
      companyName: ticker === 'AAPL' ? 'Apple Inc.' : `${ticker} Corporation`
    };

    // Mock Tiingo quote
    const mockTiingoQuote = {
      close: 152.34
    };

    // Mock sentiment data
    const mockSentiment = {
      overall: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral',
      score: Math.floor(Math.random() * 100),
      positive: Math.floor(Math.random() * 5) + 1,
      negative: Math.floor(Math.random() * 3),
      neutral: Math.floor(Math.random() * 2) + 1
    };

    // Use the enhanced recommendation logic
    const recommendation = this.generateRecommendation(mockValidation, mockTiingoQuote, mockChartData, mockSentiment);

    return {
      companyName: mockValidation.companyName,
      recommendation: recommendation,
      chartData: mockChartData,
      news: [],
      sentiment: mockSentiment
    };
  }

  formatMarketCap(marketCap) {
    const num = parseInt(marketCap);
    if (isNaN(num)) return 'N/A';

    if (num >= 1e12) {
      return `$${(num / 1e12).toFixed(2)}T`;
    } else if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    }
    return `$${num.toLocaleString()}`;
  }

  async getPopularStocks(tickers) {
    try {
      console.log(`StockService: Getting popular stocks data for: ${tickers.join(', ')}`);
      
      const stocksData = [];
      
      // Fetch real-time data for each ticker using Yahoo Finance API
      for (const ticker of tickers) {
        try {
          console.log(`StockService: Fetching real data for ${ticker}`);
          
          // Get current quote from Yahoo Finance
          const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
          const response = await axios.get(yahooUrl, {
            params: {
              interval: '1d',
              range: '2d', // Get 2 days to calculate change
            },
            timeout: 10000
          });

          const chart = response.data.chart;
          if (chart && chart.result && chart.result[0]) {
            const result = chart.result[0];
            const meta = result.meta;
            const timestamps = result.timestamp;
            const indicators = result.indicators;
            const quote = indicators.quote[0];

            if (meta && quote && timestamps && timestamps.length > 0) {
              // Get current (latest) price
              const currentPrice = meta.regularMarketPrice || quote.close[quote.close.length - 1];
              
              // Get previous day's close to calculate change
              const previousClose = meta.previousClose || meta.chartPreviousClose;
              
              if (currentPrice && previousClose) {
                // Calculate percentage change
                const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
                
                // Get company name from meta or use default
                const companyName = this.getDefaultCompanyName(ticker);
                
                stocksData.push({
                  symbol: ticker,
                  name: companyName,
                  currentPrice: currentPrice.toFixed(2),
                  change: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
                  isPositive: changePercent >= 0
                });
                
                console.log(`StockService: Successfully fetched real data for ${ticker}: $${currentPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
              } else {
                throw new Error('Missing price data');
              }
            } else {
              throw new Error('Invalid chart data structure');
            }
          } else {
            throw new Error('No chart data returned');
          }
        } catch (error) {
          console.warn(`StockService: Failed to fetch real data for ${ticker}, using fallback:`, error.message);
          
          // Fallback for failed requests
          stocksData.push({
            symbol: ticker,
            name: this.getDefaultCompanyName(ticker),
            currentPrice: "N/A",
            change: "N/A",
            isPositive: true
          });
        }
      }
      
      console.log(`StockService: Successfully retrieved data for ${stocksData.length} popular stocks`);
      return stocksData;
      
    } catch (error) {
      console.error('StockService: Error getting popular stocks:', error.message);
      throw new Error('Failed to fetch popular stocks data');
    }
  }

  getDefaultCompanyName(ticker) {
    const companyNames = {
      'AAPL': 'Apple Inc.',
      'TSLA': 'Tesla Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corp.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corp.'
    };
    return companyNames[ticker] || `${ticker} Corp.`;
  }
}

module.exports = new StockService();