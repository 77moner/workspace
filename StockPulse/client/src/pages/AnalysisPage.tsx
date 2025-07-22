import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"
import { RecommendationCard } from "@/components/analysis/RecommendationCard"
import { ChartSection } from "@/components/analysis/ChartSection"
import { NewsSentimentPanel } from "@/components/analysis/NewsSentimentPanel"
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