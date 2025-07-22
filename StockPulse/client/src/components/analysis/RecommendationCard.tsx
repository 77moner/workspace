import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface RecommendationProps {
  recommendation: {
    action: "BUY" | "HOLD" | "SELL"
    confidence: number
    summary: string
    targetPrice?: number
    currentPrice: number
    reasoning: string[]
  }
}

export function RecommendationCard({ recommendation }: RecommendationProps) {
  const getRecommendationColor = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-gradient-to-r from-green-500 to-emerald-600"
      case "SELL":
        return "bg-gradient-to-r from-red-500 to-rose-600"
      default:
        return "bg-gradient-to-r from-yellow-500 to-orange-600"
    }
  }

  const getRecommendationIcon = (action: string) => {
    switch (action) {
      case "BUY":
        return <TrendingUp className="h-8 w-8 text-white" />
      case "SELL":
        return <TrendingDown className="h-8 w-8 text-white" />
      default:
        return <Minus className="h-8 w-8 text-white" />
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Trading Recommendation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Recommendation */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl ${getRecommendationColor(recommendation.action)}`}>
            {getRecommendationIcon(recommendation.action)}
            <span className="text-3xl font-bold text-white">{recommendation.action}</span>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Confidence Score</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {recommendation.confidence}%
            </Badge>
          </div>
          <Progress value={recommendation.confidence} className="h-3" />
        </div>

        {/* Price Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-sm text-muted-foreground">Current Price</div>
            <div className="text-2xl font-bold">${recommendation.currentPrice}</div>
          </div>
          {recommendation.targetPrice && (
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-sm text-muted-foreground">Target Price</div>
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Target className="h-5 w-5" />
                ${recommendation.targetPrice}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium mb-2">Analysis Summary</h4>
          <p className="text-sm text-muted-foreground">{recommendation.summary}</p>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="font-medium mb-3">Key Factors</h4>
          <ul className="space-y-2">
            {recommendation.reasoning.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}