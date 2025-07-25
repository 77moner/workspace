import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, TrendingUp, BarChart3, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/useToast"
import { validateTicker, getPopularStocks } from "@/api/stocks"

interface PopularStock {
  symbol: string;
  name: string;
  currentPrice: string;
  change: string;
  isPositive: boolean;
}

export function HomePage() {
  const [ticker, setTicker] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [popularStocks, setPopularStocks] = useState<PopularStock[]>([])
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  console.log("HomePage: Component rendered")

  // Fetch popular stocks data on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchPopularStocks = async () => {
      console.log("HomePage: useEffect triggered - fetching popular stocks")
      try {
        const response = await getPopularStocks()
        if (response.success && isMounted) {
          setPopularStocks(response.stocks)
          console.log("HomePage: Popular stocks data loaded successfully")
        }
      } catch (error: any) {
        console.error("HomePage: Error fetching popular stocks:", error)
        if (isMounted) {
          // Use fallback data on error
          setPopularStocks([
            { symbol: "AAPL", name: "Apple Inc.", currentPrice: "N/A", change: "N/A", isPositive: true },
            { symbol: "TSLA", name: "Tesla Inc.", currentPrice: "N/A", change: "N/A", isPositive: true },
            { symbol: "GOOGL", name: "Alphabet Inc.", currentPrice: "N/A", change: "N/A", isPositive: true },
            { symbol: "MSFT", name: "Microsoft Corp.", currentPrice: "N/A", change: "N/A", isPositive: true },
            { symbol: "AMZN", name: "Amazon.com Inc.", currentPrice: "N/A", change: "N/A", isPositive: true },
            { symbol: "NVDA", name: "NVIDIA Corp.", currentPrice: "N/A", change: "N/A", isPositive: true },
          ])
        }
      } finally {
        if (isMounted) {
          setIsLoadingStocks(false)
        }
      }
    }

    fetchPopularStocks()
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    }
  }, [])

  const handleSearch = async () => {
    if (!ticker.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stock ticker symbol",
        variant: "destructive",
      })
      return
    }

    console.log("HomePage: Searching for ticker:", ticker)
    setIsLoading(true)

    try {
      const validation = await validateTicker(ticker.toUpperCase())
      if (validation.valid) {
        console.log("HomePage: Ticker valid, navigating to analysis")
        navigate(`/analysis/${ticker.toUpperCase()}`)
      } else {
        toast({
          title: "Invalid Ticker",
          description: validation.message || "Please enter a valid stock ticker symbol",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("HomePage: Error validating ticker:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to validate ticker symbol",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              StockAnalyzer
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Get instant buy/hold/sell recommendations with advanced technical analysis and real-time market sentiment
          </p>
          
          {/* Search Section */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter stock ticker (e.g., AAPL, TSLA)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="pl-12 pr-4 py-6 text-lg rounded-2xl border-2 border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                disabled={isLoading}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full mt-4 py-6 text-lg rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? "Analyzing..." : "Analyze Stock"}
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl w-fit mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">Smart Recommendations</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                AI-powered buy/hold/sell signals with confidence scores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl w-fit mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">Interactive Charts</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Professional candlestick charts with technical indicators
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl w-fit mb-4">
                <Newspaper className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">News Sentiment</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Real-time news analysis with sentiment scoring
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Popular Stocks */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">Popular Stocks</CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-300">
              Click on any stock to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {isLoadingStocks ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="p-4 h-20 flex flex-col items-start bg-white/80 dark:bg-gray-700/80 border-2 border-gray-200 dark:border-gray-600 rounded-xl animate-pulse"
                  >
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                  </div>
                ))
              ) : (
                popularStocks.map((stock) => (
                  <Button
                    key={stock.symbol}
                    variant="outline"
                    className="p-4 h-auto flex flex-col items-start bg-white/80 dark:bg-gray-700/80 hover:bg-white/90 dark:hover:bg-gray-600/90 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 rounded-xl transition-all duration-300"
                    onClick={() => navigate(`/analysis/${stock.symbol}`)}
                  >
                    <div className="font-bold text-lg text-gray-900 dark:text-white">{stock.symbol}</div>
                    {stock.currentPrice !== "N/A" && (
                      <div className="text-sm text-gray-600 dark:text-gray-300">${stock.currentPrice}</div>
                    )}
                    <Badge
                      variant="secondary"
                      className={`mt-2 ${
                        stock.change.includes("+") 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50" 
                          : stock.change.includes("-") 
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50" 
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {stock.change}
                    </Badge>
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}