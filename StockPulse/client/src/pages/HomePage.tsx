import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, TrendingUp, BarChart3, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/useToast"
import { validateTicker } from "@/api/stocks"

export function HomePage() {
  const [ticker, setTicker] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  console.log("HomePage: Component rendered")

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

  const popularStocks = [
    { symbol: "AAPL", name: "Apple Inc.", change: "+2.34%" },
    { symbol: "TSLA", name: "Tesla Inc.", change: "-1.23%" },
    { symbol: "GOOGL", name: "Alphabet Inc.", change: "+0.87%" },
    { symbol: "MSFT", name: "Microsoft Corp.", change: "+1.45%" },
    { symbol: "AMZN", name: "Amazon.com Inc.", change: "+0.92%" },
    { symbol: "NVDA", name: "NVIDIA Corp.", change: "+3.21%" },
  ]

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
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
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
                className="pl-12 pr-4 py-6 text-lg rounded-2xl border-2 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                disabled={isLoading}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl w-fit mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Smart Recommendations</CardTitle>
              <CardDescription>
                AI-powered buy/hold/sell signals with confidence scores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl w-fit mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Interactive Charts</CardTitle>
              <CardDescription>
                Professional candlestick charts with technical indicators
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl w-fit mb-4">
                <Newspaper className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">News Sentiment</CardTitle>
              <CardDescription>
                Real-time news analysis with sentiment scoring
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Popular Stocks */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Popular Stocks</CardTitle>
            <CardDescription className="text-center">
              Click on any stock to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {popularStocks.map((stock) => (
                <Button
                  key={stock.symbol}
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-start bg-white/60 hover:bg-white/80 border-2 hover:border-blue-300 rounded-xl transition-all duration-300"
                  onClick={() => navigate(`/analysis/${stock.symbol}`)}
                >
                  <div className="font-bold text-lg">{stock.symbol}</div>
                  <div className="text-sm text-muted-foreground text-left">{stock.name}</div>
                  <Badge
                    variant={stock.change.startsWith("+") ? "default" : "destructive"}
                    className="mt-2"
                  >
                    {stock.change}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}