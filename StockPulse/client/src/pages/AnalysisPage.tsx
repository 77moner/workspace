import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"
import { RecommendationCard } from "@/components/analysis/RecommendationCard"
import { ChartSection } from "@/components/analysis/ChartSection"
import { NewsSentimentPanel } from "@/components/analysis/NewsSentimentPanel"

// Card to display all company info from Tiingo
function CompanyInfoCard({ info, quote }: { info: any, quote?: any }) {
  if (!info) return null;
  return (
    <div className="bg-white/80 rounded-xl shadow p-6 mb-8 border border-gray-100">
      <h2 className="text-xl font-bold mb-2">Company Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div><span className="font-medium">Name:</span> {info.companyName}</div>
        <div><span className="font-medium">Ticker:</span> {info.ticker || '-'}</div>
        <div><span className="font-medium">Sector:</span> {info.sector || '-'}</div>
        <div><span className="font-medium">Industry:</span> {info.industry || '-'}</div>
        <div><span className="font-medium">Exchange:</span> {info.exchange || info.exchangeCode || '-'}</div>
        <div><span className="font-medium">Market Cap:</span> {info.marketCap || '-'}</div>
        <div className="md:col-span-2"><span className="font-medium">Description:</span> {info.description || '-'}</div>
        {quote && (
          <>
            <div><span className="font-medium">Last Close:</span> ${quote.close}</div>
            <div><span className="font-medium">Open:</span> ${quote.open}</div>
            <div><span className="font-medium">High:</span> ${quote.high}</div>
            <div><span className="font-medium">Low:</span> ${quote.low}</div>
            <div><span className="font-medium">Volume:</span> {quote.volume}</div>
            <div><span className="font-medium">Date:</span> {quote.date}</div>
          </>
        )}
      </div>
    </div>
  );
}
import { getStockAnalysis, refreshStockData } from "@/api/stocks"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function AnalysisPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  console.log("AnalysisPage: Component rendered for ticker:", ticker)

  useEffect(() => {
    if (ticker) {
      loadAnalysisData()
    }
  }, [ticker])

  const loadAnalysisData = async () => {
    if (!ticker) return

    console.log("AnalysisPage: Loading analysis data for:", ticker)
    setIsLoading(true)

    try {
      const data = await getStockAnalysis(ticker)
      setAnalysisData(data)
      console.log("AnalysisPage: Analysis data loaded successfully")
    } catch (error: any) {
      console.error("AnalysisPage: Error loading analysis data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load stock analysis",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!ticker) return

    console.log("AnalysisPage: Refreshing data for:", ticker)
    setIsRefreshing(true)

    try {
      await refreshStockData(ticker)
      await loadAnalysisData()
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      })
    } catch (error: any) {
      console.error("AnalysisPage: Error refreshing data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to refresh data",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No data available</h2>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Try to extract Tiingo quote if present (from backend, add to result if not already)
  const tiingoQuote = analysisData.tiingoQuote || analysisData.quote || analysisData.latestQuote;
  // Pass all company info fields
  const companyInfo = {
    companyName: analysisData.companyName,
    sector: analysisData.sector,
    industry: analysisData.industry,
    exchange: analysisData.exchange,
    exchangeCode: analysisData.exchangeCode,
    marketCap: analysisData.marketCap,
    description: analysisData.description,
    ticker: ticker
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{ticker}</h1>
              <p className="text-muted-foreground">{analysisData.companyName}</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="rounded-xl"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Company Info Card (all Tiingo data) */}
        <CompanyInfoCard info={companyInfo} quote={tiingoQuote} />

        {/* Analysis Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Recommendation and Charts */}
          <div className="lg:col-span-2 space-y-8">
            <RecommendationCard recommendation={analysisData.recommendation} />
            <ChartSection ticker={ticker!} chartData={analysisData.chartData} />
          </div>

          {/* Right Column - News Sentiment */}
          <div className="lg:col-span-1">
            <NewsSentimentPanel news={analysisData.news} sentiment={analysisData.sentiment} />
          </div>
        </div>
      </div>
    </div>
  )
}