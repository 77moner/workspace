import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Cell } from 'recharts';

interface StockDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  data: StockDataPoint[];
  ticker: string;
  interval: string;
}

// Custom shape component for candlesticks
const CandlestickBar = (props: any) => {
  const { payload, x, y, width, height } = props;
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isPositive = close >= open;
  const color = isPositive ? '#10B981' : '#EF4444';

  // Calculate positions relative to the high-low range
  const range = high - low;
  if (range === 0) return null;

  const bodyTop = Math.max(open, close);
  const bodyBottom = Math.min(open, close);

  // Scale to chart coordinates
  const wickTopY = y;
  const wickBottomY = y + height;
  const bodyTopY = y + ((high - bodyTop) / range) * height;
  const bodyBottomY = y + ((high - bodyBottom) / range) * height;
  const bodyHeightScaled = Math.max(bodyBottomY - bodyTopY, 1);

  const candleWidth = Math.max(width * 0.6, 2);
  const centerX = x + width / 2;

  return (
    <g>
      {/* High-Low wick */}
      <line
        x1={centerX}
        y1={wickTopY}
        x2={centerX}
        y2={wickBottomY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Open-Close body */}
      <rect
        x={centerX - candleWidth / 2}
        y={bodyTopY}
        width={candleWidth}
        height={bodyHeightScaled}
        fill={isPositive ? 'none' : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-semibold">{label}</p>
        <div className="space-y-1 text-sm">
          <p>Open: <span className="font-medium">${data.open?.toFixed(2)}</span></p>
          <p>High: <span className="font-medium text-green-600">${data.high?.toFixed(2)}</span></p>
          <p>Low: <span className="font-medium text-red-600">${data.low?.toFixed(2)}</span></p>
          <p>Close: <span className="font-medium">${data.close?.toFixed(2)}</span></p>
          <p>Volume: <span className="font-medium">{data.volume?.toLocaleString()}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

export function StockChart({ data, ticker, interval }: StockChartProps) {
  console.log(`StockChart: Rendering ${interval} chart for ${ticker}`);

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No chart data available
      </div>
    );
  }

  // Transform data for candlestick display
  const chartData = data.map(point => ({
    ...point,
    // For the bar chart, we'll use high-low range
    range: point.high - point.low,
    rangeStart: point.low
  }));

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          {/* Main Y-axis for price data */}
          <YAxis
            yAxisId="price"
            domain={['dataMin - 5', 'dataMax + 5']}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          {/* Secondary Y-axis for volume data */}
          <YAxis
            yAxisId="volume"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Candlestick bars */}
          <Bar
            yAxisId="price"
            dataKey="range"
            shape={<CandlestickBar />}
            isAnimationActive={false}
          />

          {/* Volume bars at bottom */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#8884d8"
            fillOpacity={0.3}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}