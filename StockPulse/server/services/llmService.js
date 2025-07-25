const axios = require('axios');

class LLMService {
  constructor() {
    this.clientId = process.env.CISCO_CLIENT_ID;
    this.clientSecret = process.env.CISCO_CLIENT_SECRET;
    this.appKey = process.env.CISCO_APP_KEY;
    this.tokenUrl = 'https://id.cisco.com/oauth2/default/v1/token';
    this.azureEndpoint = 'https://chat-ai.cisco.com';
    this.apiVersion = '2024-12-01-preview'; // Updated to match working example
    this.model = 'gpt-4.1'; // Updated to match working example
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Debug: Check if credentials are loaded
    console.log('LLMService: Constructor - Credentials check:');
    console.log(`  CLIENT_ID loaded: ${this.clientId ? 'YES' : 'NO'}`);
    console.log(`  CLIENT_SECRET loaded: ${this.clientSecret ? 'YES' : 'NO'}`);
    console.log(`  APP_KEY loaded: ${this.appKey ? 'YES' : 'NO'}`);
    if (this.clientId) {
      console.log(`  CLIENT_ID starts with: ${this.clientId.substring(0, 10)}...`);
    }
  }

  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Get new token
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(this.tokenUrl, 
        'grant_type=client_credentials',
        {
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      const tokenData = response.data;
      this.accessToken = tokenData.access_token;
      
      // Set expiry time (usually expires_in is in seconds)
      const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour
      this.tokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // Subtract 1 minute for safety
      
      console.log('LLMService: Successfully obtained access token');
      return this.accessToken;
      
    } catch (error) {
      console.error('LLMService: Error getting access token:', error.message);
      console.error('LLMService: Token request failed with details:');
      console.error(`  Status: ${error.response?.status}`);
      console.error(`  Status Text: ${error.response?.statusText}`);
      console.error(`  Response Data: ${JSON.stringify(error.response?.data)}`);
      console.error(`  Request URL: ${this.tokenUrl}`);
      throw new Error('Failed to authenticate with Cisco Azure OpenAI');
    }
  }

  async analyzeSentiment(text) {
    try {
      if (!text || text.trim().length === 0) {
        return 'neutral';
      }

      const accessToken = await this.getAccessToken();
      
      const messages = [
        {
          role: 'system',
          content: `You are a financial sentiment analysis expert. Analyze the sentiment of financial news text and respond with ONLY one word: "positive", "negative", or "neutral". 

Consider:
- Market impact and investor sentiment
- Financial performance indicators
- Company outlook and prospects
- Risk factors and opportunities

Respond with exactly one word only.`
        },
        {
          role: 'user',
          content: `Analyze the financial sentiment of this text: "${text}"`
        }
      ];

      // Use the proper OpenAI client approach as shown in the working example
      const response = await axios.post(
        `${this.azureEndpoint}/openai/deployments/${this.model}/chat/completions?api-version=${this.apiVersion}`,
        {
          messages: messages,
          temperature: 0.1, // Low temperature for consistent results
          max_tokens: 10,   // We only need one word
          user: JSON.stringify({ appkey: this.appKey })
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': accessToken, // Use 'api-key' header as shown in the OpenAI client approach
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const sentiment = response.data.choices[0].message.content.trim().toLowerCase();
      
      // Validate response and fallback to keyword analysis if needed
      if (['positive', 'negative', 'neutral'].includes(sentiment)) {
        console.log(`LLMService: Successfully analyzed sentiment via LLM: ${sentiment}`);
        return sentiment;
      } else {
        console.warn('LLMService: Invalid sentiment response, falling back to keyword analysis');
        return this.fallbackKeywordAnalysis(text);
      }

    } catch (error) {
      console.error('LLMService: Error analyzing sentiment with LLM:', error.message);
      console.error('LLMService: Sentiment analysis failed with details:');
      console.error(`  Status: ${error.response?.status}`);
      console.error(`  Status Text: ${error.response?.statusText}`);
      console.error(`  Response Data: ${JSON.stringify(error.response?.data)}`);
      console.error(`  Request URL: ${this.azureEndpoint}/openai/deployments/${this.model}/chat/completions`);
      // Fallback to keyword-based analysis
      return this.fallbackKeywordAnalysis(text);
    }
  }

  fallbackKeywordAnalysis(text) {
    if (!text) return 'neutral';
    
    const textLower = text.toLowerCase();
    
    // Positive keywords
    const positiveWords = [
      'gains', 'surge', 'soars', 'rallies', 'climbs', 'jumps', 'rises', 'up',
      'bullish', 'strong', 'beat', 'beats', 'exceed', 'outperform', 'profit',
      'growth', 'revenue', 'earnings', 'success', 'breakthrough', 'positive',
      'upgrade', 'buy', 'target', 'optimistic', 'boost', 'expand', 'expansion',
      'milestone', 'record', 'high', 'increase', 'good', 'great', 'excellent'
    ];
    
    // Negative keywords
    const negativeWords = [
      'falls', 'drops', 'plunges', 'crashes', 'declines', 'tumbles', 'slides',
      'bearish', 'weak', 'miss', 'misses', 'underperform', 'loss', 'losses',
      'decline', 'warning', 'concern', 'risk', 'sell', 'downgrade', 'cuts',
      'layoffs', 'bankruptcy', 'lawsuit', 'investigation', 'scandal', 'negative',
      'down', 'low', 'bad', 'poor', 'disappointing', 'worse', 'worst'
    ];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    // Count positive words
    positiveWords.forEach(word => {
      if (textLower.includes(word)) {
        positiveScore++;
      }
    });
    
    // Count negative words
    negativeWords.forEach(word => {
      if (textLower.includes(word)) {
        negativeScore++;
      }
    });
    
    // Determine sentiment
    if (positiveScore > negativeScore) {
      return 'positive';
    } else if (negativeScore > positiveScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  async batchAnalyzeSentiment(textArray) {
    // Analyze multiple texts in parallel for better performance
    const promises = textArray.map(text => this.analyzeSentiment(text));
    return Promise.all(promises);
  }
}

module.exports = LLMService;
