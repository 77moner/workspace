import { useState } from "react"
import { ExternalLink, ThumbsUp, ThumbsDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NewsSentimentPanelProps {
  news: Array<{
    headline: string
    source: string
    timestamp: string
    excerpt: string
    url: string
    sentiment: "positive" | "negative" | "neutral"
  }>
  sentiment: {
    overall: "positive" | "negative" | "neutral"
    score: number
    positive: number
    negative: number
    neutral: number
  }
}

export function NewsSentimentPanel({ news, sentiment }: NewsSentimentPanelProps) {
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "neutral">("all")

  console.log("NewsSentimentPanel: Rendering news panel with", news.length, "articles")

  const getSentimentIcon = (sentimentType: string) => {
    switch (sentimentType) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-green-500" />
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  const getSentimentColor = (sentimentType: string) => {
    switch (sentimentType) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-200"
      case "negative":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const filteredNews = filter === "all" ? news : news.filter(article => article.sentiment === filter)

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl h-fit">
      <CardHeader>
        <CardTitle className="text-2xl">News Sentiment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getSentimentIcon(sentiment.overall)}
            <span className="font-bold text-lg capitalize">{sentiment.overall}</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{sentiment.score}%</div>
          <div className="text-sm text-muted-foreground">Overall Sentiment Score</div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{sentiment.positive}</div>
            <div className="text-xs text-muted-foreground">Positive</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{sentiment.neutral}</div>
            <div className="text-xs text-muted-foreground">Neutral</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{sentiment.negative}</div>
            <div className="text-xs text-muted-foreground">Negative</div>
          </div>
        </div>

        {/* News Filter */}
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="positive" className="text-xs">+</TabsTrigger>
            <TabsTrigger value="neutral" className="text-xs">~</TabsTrigger>
            <TabsTrigger value="negative" className="text-xs">-</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* News Articles */}
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {filteredNews.map((article, index) => (
              <div key={index} className="p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={`${getSentimentColor(article.sentiment)} text-xs`}>
                    {article.sentiment}
                  </Badge>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{article.source}</div>
                    <div>{article.timestamp}</div>
                  </div>
                </div>

                <h4 className="font-medium text-sm mb-2 line-clamp-2">{article.headline}</h4>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Read Full Article
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}