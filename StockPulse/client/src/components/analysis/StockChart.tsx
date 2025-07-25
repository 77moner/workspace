import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Customized } from 'recharts';

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



// Customized candlestick renderer for accurate charting
const CandlestickLayer = (props: any) => {
  // Defensive: fallback to empty if missing axes or data
  const { xAxisMap, yAxisMap, data } = props;
  
    console.log('CandlestickLayer: Received props:', {
    hasXAxisMap: !!xAxisMap,
    hasYAxisMap: !!yAxisMap, 
    hasData: !!data && data.length > 0,
    dataLength: data?.length || 0,
    xAxisMapKeys: Object.keys(xAxisMap || {}),
    yAxisMapKeys: Object.keys(yAxisMap || {}),
    firstDataPoint: data && data.length > 0 ? data[0] : null,
    dataKeys: data && data.length > 0 ? Object.keys(data[0]) : []
  });
  
  if (!xAxisMap || !yAxisMap || !data) {
    console.log('CandlestickLayer: Missing required props, returning null');
    return null;
  }
  
  const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
  const yAxis = yAxisMap[Object.keys(yAxisMap).find((k) => yAxisMap[k].axisId === 'price') || Object.keys(yAxisMap)[0]];
  
  console.log('CandlestickLayer: Axes found:', {
    hasXAxis: !!xAxis,
    hasYAxis: !!yAxis,
    yAxisId: yAxis?.axisId,
    xAxisScale: typeof xAxis?.scale,
    yAxisScale: typeof yAxis?.scale,
    xAxisType: xAxis?.type,
    xAxisDataKey: xAxis?.dataKey,
    xAxisDomain: xAxis?.domain,
    scaleDomain: xAxis?.scale?.domain ? xAxis.scale.domain() : 'no domain method'
  });
  
  // Debug the scale function for first few items
  if (data?.length > 0 && xAxis?.scale) {
    console.log('Scale test for first 3 items:');
    const domain = xAxis.scale.domain ? xAxis.scale.domain() : 'no domain';
    const range = xAxis.scale.range ? xAxis.scale.range() : 'no range';
    console.log('Scale domain:', domain);
    console.log('Scale domain length:', Array.isArray(domain) ? domain.length : 'not array');
    console.log('Scale domain first 10:', Array.isArray(domain) ? domain.slice(0, 10) : 'not array');
    console.log('Scale domain last 10:', Array.isArray(domain) ? domain.slice(-10) : 'not array');
    console.log('Scale range:', range);
    console.log('Data time values (first 5):', data.slice(0, 5).map((d: any) => d.time));
    console.log('Data time values (last 5):', data.slice(-5).map((d: any) => d.time));
    
    // Check if any data time values exist in domain
    const dataTimeValues = data.map((d: any) => d.time);
    const domainArray = Array.isArray(domain) ? domain : [];
    const matchingValues = dataTimeValues.filter((time: any) => domainArray.includes(time));
    console.log('Matching time values between data and domain:', matchingValues.length, 'out of', dataTimeValues.length);
    console.log('Sample matching values:', matchingValues.slice(0, 5));
    
    for (let i = 0; i < Math.min(3, data.length); i++) {
      const testResult = xAxis.scale(data[i].time);
      console.log(`  data[${i}].time = "${data[i].time}" -> scale result = ${testResult} (type: ${typeof testResult})`);
      console.log(`  Domain includes "${data[i].time}": ${Array.isArray(domain) ? domain.includes(data[i].time) : false}`);
    }
  }
  
  if (!xAxis || !yAxis) {
    console.log('CandlestickLayer: Missing xAxis or yAxis, returning null');
    return null;
  }
  
  const renderedCandles = data.map((d: any, i: number) => {
    const open = Number(d.open);
    const high = Number(d.high);
    const low = Number(d.low);
    const close = Number(d.close);
    
    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      console.log(`CandlestickLayer: Invalid data point ${i}:`, d);
      return null;
    }
    
    // For 15m charts with numeric X-axis, use index; for others use time
    const xValue = d.hasOwnProperty('index') ? d.index : d.time;
    let x = xAxis.scale(xValue);
    
    if (typeof x !== 'number') {
      console.log(`CandlestickLayer: Invalid x position for ${xValue}:`, x, 'Type:', typeof x, 'Data point:', d);
      return null;
    }
    
    // For numeric scales, no need to add bandwidth; for categorical scales, center the candle
    if (xAxis.scale.bandwidth) {
      x = x + xAxis.scale.bandwidth() / 2;
    }
    
    const yHigh = yAxis.scale(high);
    const yLow = yAxis.scale(low);
    const yOpen = yAxis.scale(open);
    const yClose = yAxis.scale(close);
    
    // Debug first few candles
    if (i < 3) {
      console.log(`CandlestickLayer: Candle ${i}:`, {
        data: { open, high, low, close, time: d.time, xValue },
        positions: { x, yHigh, yLow, yOpen, yClose },
        xBand: xAxis.scale.bandwidth ? xAxis.scale.bandwidth() : 'no bandwidth (numeric scale)'
      });
    }
    
    const isPositive = close >= open;
    const color = isPositive ? '#10B981' : '#EF4444';
    const candleWidth = xAxis.scale.bandwidth ? Math.max(xAxis.scale.bandwidth() * 0.6, 2) : 6;
    const bodyTop = Math.min(yOpen, yClose);
    const bodyBottom = Math.max(yOpen, yClose);
    
    return (
      <g key={i}>
        {/* High-Low wick */}
        <line
          x1={x}
          y1={yHigh}
          x2={x}
          y2={yLow}
          stroke={color}
          strokeWidth={1}
        />
        {/* Open-Close body */}
        <rect
          x={x - candleWidth / 2}
          y={bodyTop}
          width={candleWidth}
          height={Math.max(bodyBottom - bodyTop, 1)}
          fill={isPositive ? 'none' : color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  }).filter((candle: any) => candle !== null);
  
  console.log(`CandlestickLayer: Rendered ${renderedCandles.length} candles out of ${data.length} data points`);
  
  // If no candles were rendered, show a debug rectangle
  if (renderedCandles.length === 0) {
    console.log('CandlestickLayer: No candles rendered, showing debug rectangle');
    return (
      <g>
        <rect x={10} y={10} width={50} height={20} fill="red" opacity={0.5} />
        <text x={15} y={25} fontSize="10" fill="white">DEBUG</text>
      </g>
    );
  }
  
  return <g>{renderedCandles}</g>;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // For numeric scales (15m, 1h), use data.time; for categorical scales (1m), use label
    const timeLabel = data.time || label;
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-semibold">{timeLabel}</p>
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
  console.log(`StockChart ${interval}: Data received:`, { 
    count: data?.length || 0, 
    firstThree: data?.slice(0, 3),
    lastThree: data?.slice(-3),
    hasValidData: data?.length > 0 && data.every(d => d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0),
    allDataValid: data?.every(d => 
      !isNaN(Number(d.open)) && !isNaN(Number(d.high)) && 
      !isNaN(Number(d.low)) && !isNaN(Number(d.close)) &&
      Number(d.open) > 0 && Number(d.high) > 0 && 
      Number(d.low) > 0 && Number(d.close) > 0
    )
  });
  
  // Debug: Log all time values to see the pattern
  if (interval === '15m' && data?.length > 0) {
    console.log(`StockChart 15m: All time values:`, data.map(d => d.time));
  }

  // Enhanced debugging for 1h charts to see what broke
  if (interval === '1h') {
    console.log('🔍 1H DEBUG - Received data sample:', data?.slice(0, 5));
    console.log('🔍 1H DEBUG - Time value analysis:');
    data?.slice(0, 5).forEach((d, i) => {
      console.log(`  [${i}] time: "${d.time}" (length: ${d.time?.length}, type: ${typeof d.time})`);
    });
  }

  if (!data || data.length === 0) {
    console.log(`StockChart ${interval}: No data available, showing empty message`);
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No chart data available
      </div>
    );
  }

  // Ensure all data is properly converted to numbers to prevent rendering issues
  let processedData = data.map((d) => ({
    time: d.time,
    open: Number(d.open),
    high: Number(d.high),
    low: Number(d.low),
    close: Number(d.close),
    volume: Number(d.volume || 0)
  })).filter(d => 
    // Only keep points with valid OHLC data
    !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
    d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0
  );

  // Fix: Normalize 15-minute time format to match what Recharts expects
  if (interval === '15m') {
    processedData = processedData.map(d => ({
      ...d,
      time: d.time.trim() // Remove any whitespace that might cause issues
    }));
    console.log('🔧 15m FIX - Normalized time values:', processedData.slice(0, 5).map(d => `"${d.time}"`));
  }

  console.log(`StockChart ${interval}: Processed data:`, {
    originalCount: data.length,
    processedCount: processedData.length,
    firstProcessed: processedData.slice(0, 2),
    lastProcessed: processedData.slice(-2),
    filteredOut: data.length - processedData.length
  });

  if (processedData.length === 0) {
    console.log(`StockChart ${interval}: No valid processed data, showing error message`);
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No valid price data available for {interval}
      </div>
    );
  }

  // Precompute Y-axis domain from all visible data
  const lows = processedData.map(d => d.low);
  const highs = processedData.map(d => d.high);
  
  if (lows.length === 0 || highs.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No valid price data available
      </div>
    );
  }
  
  let minLow = Math.min(...lows);
  let maxHigh = Math.max(...highs);
  
  // Ensure we never start at 0 for stock prices
  if (minLow <= 0) minLow = Math.min(...lows.filter(v => v > 0));
  
  if (minLow === maxHigh) {
    const basePrice = minLow;
    minLow = basePrice * 0.999;  // 0.1% below
    maxHigh = basePrice * 1.001; // 0.1% above
  }
  
  // Add small padding (0.1%) to ensure candles fit perfectly
  const padding = (maxHigh - minLow) * 0.001;
  const yDomain = [Math.max(0.01, minLow - padding), maxHigh + padding]; // Never go below $0.01
  
  // Generate ticks to include minLow and maxHigh, plus 3 evenly spaced ticks in between
  const tickCount = 5;
  const step = (maxHigh - minLow) / (tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, i) => parseFloat((minLow + i * step).toFixed(2)));
  console.log('StockChart Y-axis domain (exact fit):', yDomain, 'ticks:', ticks, 'data range:', minLow, 'to', maxHigh);

  // Separate X-axis configuration for each interval to avoid cross-contamination
  let xAxisProps;
  
  if (interval === '15m') {
    // 15-minute uses numeric scale
    xAxisProps = {
      dataKey: "index",
      type: "number" as const,
      tick: { fontSize: 10 },
      domain: (([dataMin, dataMax]: [number, number]) => [dataMin - 0.5, dataMax + 0.5]) as any,
      ticks: Array.from({ length: Math.min(7, processedData.length) }, (_, i) => Math.floor(i * (processedData.length - 1) / 6)),
      tickFormatter: (value: number) => {
        const dataPoint = processedData[Math.round(value)];
        return dataPoint ? dataPoint.time : '';
      }
    };
  } else if (interval === '1h') {
    // 1-hour uses numeric scale (same fix as 15m) to avoid categorical domain issues
    xAxisProps = {
      dataKey: "index",
      type: "number" as const,
      tick: { fontSize: 10 },
      domain: (([dataMin, dataMax]: [number, number]) => [dataMin - 0.5, dataMax + 0.5]) as any,
      ticks: Array.from({ length: Math.min(7, processedData.length) }, (_, i) => Math.floor(i * (processedData.length - 1) / 6)),
      tickFormatter: (value: number) => {
        const dataPoint = processedData[Math.round(value)];
        return dataPoint ? dataPoint.time : '';
      }
    };
  } else {
    // 1-minute and other intervals use categorical scale with original logic
    xAxisProps = {
      dataKey: "time",
      type: "category" as const,
      tick: { fontSize: 10 },
      interval: 0,
      tickFormatter: (value: string, index: number) => {
        const showInterval = 20; // Show every 20th tick for 1-minute data
        if (index % showInterval === 0) {
          if (value && value.includes(' ')) {
            return value.split(' ')[1] || value;
          }
          return value || '';
        }
        return '';
      }
    };
  }

  // For 15m and 1h, add numeric index to data (both use numeric scales)
  if (interval === '15m' || interval === '1h') {
    processedData = processedData.map((d, i) => ({ ...d, index: i }));
    console.log(`🔧 ${interval} FIX - Added numeric indices, sample:`, processedData.slice(0, 3));
  }

  console.log(`StockChart ${interval}: X-axis configuration:`, {
    interval: interval,
    showInterval: interval === '1m' ? 20 : (interval === '15m' || interval === '1h' ? 'numeric scale' : 15),
    dataCount: processedData.length,
    sampleTimes: processedData.slice(0, 5).map(d => d.time),
    axisType: (interval === '15m' || interval === '1h') ? 'numeric' : 'categorical'
  });

  // Debug: Force log the data being passed to ComposedChart for 15m
  if (interval === '15m') {
    console.log('🔍 15m DEBUG - ComposedChart data sample (first 10):', processedData.slice(0, 10));
    console.log('🔍 15m DEBUG - All time values in processedData:', processedData.map(d => d.time));
    console.log('🔍 15m DEBUG - Data validation:', {
      allHaveTimeField: processedData.every(d => d.hasOwnProperty('time')),
      allTimeValuesAreStrings: processedData.every(d => typeof d.time === 'string'),
      uniqueTimeValues: new Set(processedData.map(d => d.time)).size,
      totalDataPoints: processedData.length
    });
    
    // Compare with what 1m data looks like
    console.log('🔍 15m DEBUG - Time value analysis:');
    processedData.slice(0, 5).forEach((d, i) => {
      console.log(`  [${i}] time: "${d.time}" (length: ${d.time.length}, chars: ${d.time.split('').map(c => c.charCodeAt(0))})`);
    });
  }
  
  // Debug 1m for comparison
  if (interval === '1m') {
    console.log('✅ 1m DEBUG - Time value analysis:');
    processedData.slice(0, 5).forEach((d, i) => {
      console.log(`  [${i}] time: "${d.time}" (length: ${d.time.length}, chars: ${d.time.split('').map(c => c.charCodeAt(0))})`);
    });
  }

  // Debug 1h after processing
  if (interval === '1h') {
    console.log('🔍 1H DEBUG AFTER PROCESSING - Processed data sample:', processedData.slice(0, 5));
    console.log('🔍 1H DEBUG - Final time values after processing:');
    processedData.slice(0, 5).forEach((d, i) => {
      console.log(`  [${i}] time: "${d.time}" (length: ${d.time.length})`);
    });
    console.log('🔍 1H DEBUG - X-axis will use NUMERIC scale, dataKey="index"');
    console.log('🔍 1H DEBUG - Should HAVE index property:', processedData[0]?.hasOwnProperty('index'));
  }

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={processedData}
          margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis {...xAxisProps} />
          {/* Main Y-axis for price data */}
          <YAxis
            yAxisId="price"
            domain={yDomain}
            ticks={ticks}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            allowDecimals={true}
            includeHidden={false}
            scale="linear"
          />
          {/* Secondary Y-axis for volume data */}
          <YAxis
            yAxisId="volume"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Accurate candlestick rendering using Customized layer */}
          <Customized 
            component={CandlestickLayer} 
            data={processedData}
            xAxisId={0}
            yAxisId="price"
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