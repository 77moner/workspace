import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockChart } from "./StockChart"

interface ChartSectionProps {
  ticker: string
  chartData: {
    oneMinute: any[]
    fifteenMinute: any[]
    oneHour: any[]
  }
}

export function ChartSection({ ticker, chartData }: ChartSectionProps) {
  const [activeTab, setActiveTab] = useState("1m")

  console.log("ChartSection: Rendering charts for ticker:", ticker)
  console.log("ChartSection: Chart data received:", {
    oneMinute: chartData?.oneMinute?.length || 0,
    fifteenMinute: chartData?.fifteenMinute?.length || 0,
    oneHour: chartData?.oneHour?.length || 0,
    fifteenMinuteFirst3: chartData?.fifteenMinute?.slice(0, 3)
  })

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Price Charts</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="1m" className="rounded-xl">1 Minute</TabsTrigger>
            <TabsTrigger value="15m" className="rounded-xl">15 Minutes</TabsTrigger>
            <TabsTrigger value="1h" className="rounded-xl">1 Hour</TabsTrigger>
          </TabsList>
          
          <TabsContent value="1m" className="mt-0">
            <StockChart 
              data={chartData.oneMinute} 
              interval="1m"
              ticker={ticker}
            />
          </TabsContent>
          
          <TabsContent value="15m" className="mt-0">
            <StockChart 
              data={chartData.fifteenMinute} 
              interval="15m"
              ticker={ticker}
            />
          </TabsContent>
          
          <TabsContent value="1h" className="mt-0">
            <StockChart 
              data={chartData.oneHour} 
              interval="1h"
              ticker={ticker}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}