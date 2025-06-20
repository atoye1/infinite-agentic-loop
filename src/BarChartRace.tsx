import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  spring,
} from "remotion";
import { z } from "zod";
import { ErrorBoundary, DataErrorBoundary } from "./components/ErrorBoundary";

// ===========================
// Type Definitions
// ===========================

export interface BarChartRaceConfig {
  output: {
    filename: string;
    format: "mp4" | "webm";
    width: number;
    height: number;
    fps: number;
    duration: number;
    quality: "low" | "medium" | "high" | "max";
  };
  data: {
    csvPath: string;
    dateColumn: string;
    dateFormat: string;
    valueColumns: string[];
    interpolation: "linear" | "smooth" | "step";
  };
  layers: {
    background: BackgroundLayerConfig;
    chart: ChartLayerConfig;
    title?: TitleLayerConfig;
    date?: DateLayerConfig;
  };
}

export interface BackgroundLayerConfig {
  color: string;
  opacity: number;
  image?: {
    path: string;
    cropping: "cover" | "contain" | "fill";
    opacity: number;
  };
}

export interface ChartLayerConfig {
  position: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  chart: {
    visibleItemCount: number;
    maxValue: "local" | "global";
    itemSpacing: number;
  };
  animation: {
    type: "continuous" | "discrete";
    overtakeDuration: number;
  };
  bar: {
    colors: string[] | "auto";
    cornerRadius: number;
    opacity: number;
  };
  labels: {
    title: {
      show: boolean;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: "inside" | "outside";
    };
    value: {
      show: boolean;
      fontSize: number;
      fontFamily: string;
      color: string;
      format: string;
      prefix?: string;
      suffix?: string;
    };
    rank: {
      show: boolean;
      fontSize: number;
      backgroundColor: string;
      textColor: string;
    };
  };
  images?: {
    show: boolean;
    mapping: Record<string, string>;
    size: number;
    borderRadius: number;
  };
}

export interface TitleLayerConfig {
  text: string;
  position: {
    top: number;
    align: "left" | "center" | "right";
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
  };
  timeline: {
    startTime: number;
    duration: number;
  };
}

export interface DateLayerConfig {
  position: {
    bottom: number;
    right: number;
  };
  format: {
    pattern: string;
    locale: string;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
  };
  animation: {
    type: "fixed" | "continuous";
    duration: number;
  };
}

export interface DataItem {
  id: string;
  name: string;
  value: number;
  rank: number;
  color?: string;
  image?: string;
}

export interface FrameData {
  frame: number;
  date: string;
  items: DataItem[];
  maxValue: number;
}

export interface ProcessedData {
  frames?: FrameData[];
  rawData?: any;
  totalFrames: number;
  dateRange: {
    start: string;
    end: string;
  };
  valueColumns: string[];
  globalMaxValue: number;
}

export interface BarChartRaceCompositionProps {
  config: BarChartRaceConfig;
  processedData?: ProcessedData;
}

export interface BackgroundLayerProps {
  config: BackgroundLayerConfig;
}

export interface ChartLayerProps {
  config: ChartLayerConfig;
  data: FrameData;
  frame: number;
  fps: number;
}

export interface BarItemProps {
  item: DataItem;
  index: number;
  config: ChartLayerConfig;
  maxValue: number;
  containerWidth: number;
  containerHeight: number;
  totalItems: number;
  previousRank?: number;
  isNewRecord?: boolean;
  isOvertaking?: boolean;
}

export interface TitleLayerProps {
  config: TitleLayerConfig;
  frame: number;
  fps: number;
}

export interface DateLayerProps {
  config: DateLayerConfig;
  currentDate: string;
  frame: number;
  fps: number;
}

// ===========================
// Zod Schema
// ===========================

export const barChartRaceSchema = z.object({
  config: z.object({
    output: z.object({
      filename: z.string(),
      format: z.enum(["mp4", "webm"]),
      width: z.number().default(1920),
      height: z.number().default(1080),
      fps: z.number().default(30),
      duration: z.number(),
      quality: z.enum(["low", "medium", "high", "max"]),
    }),
    data: z.object({
      csvPath: z.string(),
      dateColumn: z.string(),
      dateFormat: z.string(),
      valueColumns: z.array(z.string()),
      interpolation: z.enum(["linear", "smooth", "step"]),
    }),
    layers: z.object({
      background: z.object({
        color: z.string(),
        opacity: z.number().min(0).max(100),
        image: z
          .object({
            path: z.string(),
            cropping: z.enum(["cover", "contain", "fill"]),
            opacity: z.number().min(0).max(100),
          })
          .optional(),
      }),
      chart: z.object({
        position: z.object({
          top: z.number(),
          right: z.number(),
          bottom: z.number(),
          left: z.number(),
        }),
        chart: z.object({
          visibleItemCount: z.number().default(10),
          maxValue: z.enum(["local", "global"]),
          itemSpacing: z.number(),
        }),
        animation: z.object({
          type: z.enum(["continuous", "discrete"]),
          overtakeDuration: z.number(),
        }),
        bar: z.object({
          colors: z.union([z.array(z.string()), z.literal("auto")]),
          cornerRadius: z.number(),
          opacity: z.number().min(0).max(100),
        }),
        labels: z.object({
          title: z.object({
            show: z.boolean(),
            fontSize: z.number(),
            fontFamily: z.string(),
            color: z.string(),
            position: z.enum(["inside", "outside"]),
          }),
          value: z.object({
            show: z.boolean(),
            fontSize: z.number(),
            fontFamily: z.string(),
            color: z.string(),
            format: z.string(),
            prefix: z.string().optional(),
            suffix: z.string().optional(),
          }),
          rank: z.object({
            show: z.boolean(),
            fontSize: z.number(),
            backgroundColor: z.string(),
            textColor: z.string(),
          }),
        }),
        images: z
          .object({
            show: z.boolean(),
            mapping: z.record(z.string()),
            size: z.number(),
            borderRadius: z.number(),
          })
          .optional(),
      }),
      title: z
        .object({
          text: z.string(),
          position: z.object({
            top: z.number(),
            align: z.enum(["left", "center", "right"]),
          }),
          style: z.object({
            fontSize: z.number(),
            fontFamily: z.string(),
            color: z.string(),
            opacity: z.number(),
          }),
          timeline: z.object({
            startTime: z.number(),
            duration: z.number(),
          }),
        })
        .optional(),
      date: z
        .object({
          position: z.object({
            bottom: z.number(),
            right: z.number(),
          }),
          format: z.object({
            pattern: z.string(),
            locale: z.string(),
          }),
          style: z.object({
            fontSize: z.number(),
            fontFamily: z.string(),
            color: z.string(),
            opacity: z.number(),
          }),
          animation: z.object({
            type: z.enum(["fixed", "continuous"]),
            duration: z.number(),
          }),
        })
        .optional(),
    }),
  }),
  processedData: z
    .object({
      frames: z.array(
        z.object({
          frame: z.number(),
          date: z.string(),
          items: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              value: z.number(),
              rank: z.number(),
              color: z.string().optional(),
              image: z.string().optional(),
            })
          ),
          maxValue: z.number(),
        })
      ),
      totalFrames: z.number(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
      valueColumns: z.array(z.string()),
      globalMaxValue: z.number(),
    })
    .optional(),
});

// ===========================
// Utility Functions
// ===========================

// Color palette for auto-generating colors
const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE'
];

// Generate colors for data items
function generateColors(itemCount: number, colorConfig: string[] | 'auto'): string[] {
  if (colorConfig === 'auto') {
    const colors: string[] = [];
    for (let i = 0; i < itemCount; i++) {
      colors.push(DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
    }
    return colors;
  }
  return colorConfig;
}

// Get color for a specific item
function getItemColor(item: DataItem, colors: string[], index: number): string {
  if (item.color) return item.color;
  return colors[index % colors.length];
}

// Calculate max value based on config
function getMaxValue(data: FrameData, maxValueType: 'local' | 'global', globalMax?: number): number {
  if (maxValueType === 'global' && globalMax) {
    return globalMax;
  }
  return data.maxValue;
}

// Format value based on format string
function formatValue(value: number, format: string, prefix?: string, suffix?: string): string {
  let formatted = value.toLocaleString();
  
  // Handle format patterns
  if (format.includes(':,.0f')) {
    formatted = Math.round(value).toLocaleString();
  } else if (format.includes(':.2f')) {
    formatted = value.toFixed(2);
  } else if (format.includes('.2f}M')) {
    formatted = (value / 1000000).toFixed(2) + 'M';
  } else if (format.includes('.1f}K')) {
    formatted = (value / 1000).toFixed(1) + 'K';
  }
  
  return `${prefix || ''}${formatted}${suffix || ''}`;
}

// Calculate container dimensions based on config
function calculateContainerDimensions(
  config: ChartLayerConfig,
  videoWidth: number,
  videoHeight: number
): { width: number; height: number } {
  const width = videoWidth - config.position.left - config.position.right;
  const height = videoHeight - config.position.top - config.position.bottom;
  
  return { width: Math.max(0, width), height: Math.max(0, height) };
}

// Calculate item height based on visible items and spacing
function calculateItemHeight(
  containerHeight: number,
  visibleItemCount: number,
  itemSpacing: number
): number {
  const totalSpacing = (visibleItemCount - 1) * itemSpacing;
  const availableHeight = containerHeight - totalSpacing;
  return Math.max(20, availableHeight / visibleItemCount); // Minimum 20px height
}

// Get frame data with comprehensive error handling
function getFrameData(processedData: ProcessedData, frame: number): FrameData {
  // Validate inputs
  if (!processedData) {
    throw new Error('ProcessedData is required');
  }

  if (!processedData.frames || !Array.isArray(processedData.frames)) {
    throw new Error('ProcessedData.frames must be an array');
  }

  if (processedData.frames.length === 0) {
    throw new Error('ProcessedData.frames cannot be empty');
  }

  if (typeof frame !== 'number' || isNaN(frame)) {
    throw new Error('Frame must be a valid number');
  }

  // Clamp frame to valid range
  const clampedFrame = Math.max(0, Math.min(frame, processedData.frames.length - 1));
  const frameData = processedData.frames[clampedFrame];

  // Validate frame data structure
  if (!frameData) {
    throw new Error(`Frame data not found for frame ${clampedFrame}`);
  }

  // Ensure frame data has required properties
  if (!frameData.hasOwnProperty('frame')) {
    frameData.frame = clampedFrame;
  }

  if (!frameData.hasOwnProperty('items')) {
    frameData.items = [];
  }

  if (!frameData.hasOwnProperty('maxValue')) {
    frameData.maxValue = frameData.items.length > 0 
      ? Math.max(...frameData.items.map(item => item.value || 0))
      : 0;
  }

  if (!frameData.hasOwnProperty('date')) {
    frameData.date = new Date().toISOString();
  }

  return frameData;
}

// Get frame data using Remotion interpolation for real-time calculation
function getFrameDataWithRemotionInterpolation(
  rawData: any, 
  frame: number, 
  totalFrames: number,
  visibleItemCount: number = 10
): FrameData {
  if (!rawData || !rawData.dataPoints || rawData.dataPoints.length === 0) {
    return {
      frame,
      date: new Date().toISOString(),
      items: [],
      maxValue: 0
    };
  }

  const { dataPoints, dateRange, valueColumns, globalMaxValue } = rawData;
  
  // Calculate current time using Remotion interpolation
  const startTime = dateRange.start.getTime();
  const endTime = dateRange.end.getTime();
  
  // Use Remotion's interpolate function to map frame to timestamp
  const currentTime = interpolate(
    frame,
    [0, totalFrames - 1],
    [startTime, endTime],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    }
  );
  
  // Find surrounding data points
  let beforePoint = null;
  let afterPoint = null;
  
  for (let i = 0; i < dataPoints.length; i++) {
    const point = dataPoints[i];
    if (point.date <= currentTime) {
      beforePoint = point;
    }
    if (point.date >= currentTime && !afterPoint) {
      afterPoint = point;
      break;
    }
  }
  
  // If no surrounding points, use closest available
  if (!beforePoint) beforePoint = dataPoints[0];
  if (!afterPoint) afterPoint = dataPoints[dataPoints.length - 1];
  
  // Calculate interpolated values for each column using Remotion interpolate
  const items: DataItem[] = [];
  let frameMaxValue = 0;
  
  valueColumns.forEach((column: string, index: number) => {
    const beforeValue = beforePoint?.values[column] || 0;
    const afterValue = afterPoint?.values[column] || 0;
    
    let interpolatedValue: number;
    
    if (beforePoint === afterPoint) {
      // Same time point
      interpolatedValue = beforeValue;
    } else {
      // Use Remotion interpolate for smooth transitions
      interpolatedValue = interpolate(
        currentTime,
        [beforePoint.date, afterPoint.date],
        [beforeValue, afterValue],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp'
        }
      );
    }
    
    frameMaxValue = Math.max(frameMaxValue, interpolatedValue);
    
    items.push({
      id: column.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: column,
      value: Math.max(0, interpolatedValue),
      rank: 0, // Will be calculated after sorting
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    });
  });
  
  // Sort by value and assign ranks
  items.sort((a, b) => b.value - a.value);
  items.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  // Take only visible items
  const visibleItems = items.slice(0, visibleItemCount);
  
  return {
    frame,
    date: new Date(currentTime).toISOString(),
    items: visibleItems,
    maxValue: frameMaxValue
  };
}

// Parse CSV to time series data (not pre-calculated frames)
const parseCSVToTimeSeries = (csvContent: string, config: any) => {
  try {
    const lines = csvContent.trim().split("\n");

    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header and one data row");
    }

    const headers = lines[0].split(",");
    console.log("CSV headers:", headers);
    console.log("Looking for date column:", config.data.dateColumn);
    console.log("Looking for value columns:", config.data.valueColumns);

    const dateColumnIndex = headers.indexOf(config.data.dateColumn);
    if (dateColumnIndex === -1) {
      throw new Error(
        `Date column '${config.data.dateColumn}' not found in headers: ${headers.join(", ")}`,
      );
    }

    const valueColumnIndices = config.data.valueColumns.map((col: string) => {
      const index = headers.indexOf(col);
      if (index === -1) {
        console.warn(`Value column '${col}' not found in headers`);
      }
      return index;
    });

    // Check if any value columns are missing
    const missingColumns = config.data.valueColumns.filter(
      (col: string, idx: number) => valueColumnIndices[idx] === -1,
    );
    if (missingColumns.length > 0) {
      throw new Error(`Value columns not found: ${missingColumns.join(", ")}`);
    }

    const dataPoints = [];
    let globalMaxValue = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const dateStr = values[dateColumnIndex];

      // Parse date according to format
      let date: Date;
      if (config.data.dateFormat === "YYYY-MM") {
        const [year, month] = dateStr.split("-");
        date = new Date(parseInt(year), parseInt(month) - 1, 1);
      } else {
        date = new Date(dateStr);
      }

      const dataPoint: any = {
        date: date.getTime(), // Store as timestamp for easier interpolation
        values: {},
      };

      config.data.valueColumns.forEach((column: string, idx: number) => {
        const value = parseFloat(values[valueColumnIndices[idx]]) || 0;
        dataPoint.values[column] = value;
        globalMaxValue = Math.max(globalMaxValue, value);
      });

      dataPoints.push(dataPoint);
    }

    // Sort by date
    dataPoints.sort((a, b) => a.date - b.date);

    return {
      dataPoints,
      dateRange: {
        start: new Date(dataPoints[0]?.date || Date.now()),
        end: new Date(dataPoints[dataPoints.length - 1]?.date || Date.now()),
      },
      valueColumns: config.data.valueColumns,
      globalMaxValue,
    };
  } catch (error) {
    console.error("Error parsing CSV data:", error);
    throw new Error(
      `Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

// Hook for dynamic data loading with Remotion interpolation
const useDynamicData = (config: any, durationInFrames: number, fps: number) => {
  const [rawData, setRawData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadRawData = async () => {
      if (!config?.data?.csvPath) {
        setLoading(false);
        return;
      }

      try {
        console.log(`Loading CSV data for: ${config.data.csvPath}`);

        // Import modules dynamically
        const { BuildTimeDataLoader } = await import(
          "./dataprocessor/BuildTimeDataLoader"
        );

        const loader = new BuildTimeDataLoader();
        const csvContent = await loader.loadCSVContent(config.data.csvPath);

        console.log(`Loaded CSV content, length: ${csvContent.length}`);
        console.log(`CSV content preview: ${csvContent.substring(0, 200)}...`);

        // Parse CSV into raw time series data (not frames!)
        const rawTimeSeriesData = parseCSVToTimeSeries(csvContent, config);

        console.log(
          `Parsed ${rawTimeSeriesData.dataPoints.length} time series data points`,
        );
        console.log(
          "Raw data sample:",
          rawTimeSeriesData.dataPoints.slice(0, 3),
        );

        setRawData(rawTimeSeriesData);
      } catch (error) {
        console.error("Failed to load CSV data:", error);
        setRawData({
          dataPoints: [],
          dateRange: { start: new Date(), end: new Date() },
          valueColumns: config.data.valueColumns || [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadRawData();
  }, [config, durationInFrames, fps]);

  // Return processed data that uses Remotion interpolation
  if (loading || !rawData) {
    return {
      frames: [],
      totalFrames: durationInFrames,
      dateRange: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      valueColumns: config?.data?.valueColumns || [],
      globalMaxValue: 0,
    };
  }

  return {
    rawData, // Pass raw time series data for interpolation
    totalFrames: durationInFrames,
    dateRange: {
      start: rawData.dateRange.start.toISOString(),
      end: rawData.dateRange.end.toISOString(),
    },
    valueColumns: rawData.valueColumns,
    globalMaxValue: rawData.globalMaxValue || 0,
  };
};

// ===========================
// Components
// ===========================

// BarItem Component
const BarItem: React.FC<BarItemProps> = ({
  item,
  index,
  config,
  maxValue,
  containerWidth,
  containerHeight,
  totalItems,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Calculate dimensions
  const itemHeight = calculateItemHeight(containerHeight, config.chart.visibleItemCount, config.chart.itemSpacing);
  const barWidth = (item.value / maxValue) * containerWidth;
  
  // Simple spring animation for width
  const animatedWidth = spring({
    frame,
    fps,
    from: 0,
    to: barWidth,
    config: {
      damping: 30,
      stiffness: 100,
      mass: 0.5,
    }
  });
  
  // Position animation
  const yPosition = spring({
    frame,
    fps,
    from: index * (itemHeight + config.chart.itemSpacing),
    to: (item.rank - 1) * (itemHeight + config.chart.itemSpacing),
    config: {
      damping: 30,
      stiffness: 100,
      mass: 0.5,
    }
  });
  
  // Get color
  const colors = config.bar.colors === 'auto' ? [] : config.bar.colors;
  const barColor = getItemColor(item, colors, index);
  
  // Calculate label positions
  const labelPadding = 10;
  const valueWidth = 100;
  
  const titleX = config.labels.title.position === 'inside' 
    ? labelPadding 
    : Math.max(animatedWidth + labelPadding, labelPadding);
  
  // Simple fade in
  const opacity = interpolate(
    frame,
    [0, 5],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: yPosition,
        width: containerWidth,
        height: itemHeight,
        opacity: opacity,
      }}
    >
      {/* Bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: animatedWidth,
          height: itemHeight,
          backgroundColor: barColor,
          borderRadius: config.bar.cornerRadius,
          opacity: config.bar.opacity / 100,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      />
      
      {/* Item Image */}
      {config.images?.show && item.image && (
        <div
          style={{
            position: 'absolute',
            left: labelPadding,
            top: (itemHeight - config.images.size) / 2,
            width: config.images.size,
            height: config.images.size,
            borderRadius: config.images.borderRadius,
            overflow: 'hidden',
            zIndex: 2,
          }}
        >
          <Img
            src={item.image}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
      
      {/* Rank */}
      {config.labels.rank.show && (
        <div
          style={{
            position: 'absolute',
            left: config.images?.show ? config.images.size + labelPadding * 2 : labelPadding,
            top: (itemHeight - config.labels.rank.fontSize * 1.2) / 2,
            width: config.labels.rank.fontSize * 1.5,
            height: config.labels.rank.fontSize * 1.2,
            backgroundColor: config.labels.rank.backgroundColor,
            color: config.labels.rank.textColor,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: config.labels.rank.fontSize,
            fontWeight: 'bold',
            zIndex: 2,
          }}
        >
          {item.rank}
        </div>
      )}
      
      {/* Title Label */}
      {config.labels.title.show && (
        <div
          style={{
            position: 'absolute',
            left: titleX + (config.images?.show ? config.images.size + labelPadding : 0) + (config.labels.rank.show ? config.labels.rank.fontSize * 1.5 + labelPadding : 0),
            top: (itemHeight - config.labels.title.fontSize * 1.2) / 2,
            fontSize: config.labels.title.fontSize,
            fontFamily: config.labels.title.fontFamily,
            color: config.labels.title.color,
            fontWeight: '600',
            maxWidth: containerWidth - titleX - valueWidth - labelPadding * 3,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            zIndex: 2,
            textShadow: config.labels.title.position === 'inside' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {item.name}
        </div>
      )}
      
      {/* Value Label */}
      {config.labels.value.show && (
        <div
          style={{
            position: 'absolute',
            right: labelPadding,
            top: (itemHeight - config.labels.value.fontSize * 1.2) / 2,
            fontSize: config.labels.value.fontSize,
            fontFamily: config.labels.value.fontFamily,
            color: config.labels.value.color,
            fontWeight: '600',
            textAlign: 'right',
            minWidth: valueWidth,
            zIndex: 2,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {formatValue(
            item.value,
            config.labels.value.format,
            config.labels.value.prefix,
            config.labels.value.suffix
          )}
        </div>
      )}
    </div>
  );
};

// ChartLayer Component
const ChartLayer: React.FC<ChartLayerProps> = ({
  config,
  data,
  frame,
  fps
}) => {
  const { width: videoWidth, height: videoHeight } = useVideoConfig();
  
  // Calculate container dimensions
  const { width: containerWidth, height: containerHeight } = calculateContainerDimensions(
    config,
    videoWidth,
    videoHeight
  );
  
  // Get max value for scaling
  const maxValue = getMaxValue(data, config.chart.maxValue);
  
  // Sort items by value (descending) and take only visible items
  const sortedItems = [...data.items]
    .sort((a, b) => b.value - a.value)
    .slice(0, config.chart.visibleItemCount);
  
  // Generate colors if needed
  generateColors(sortedItems.length, config.bar.colors);
  
  return (
    <div
      style={{
        position: 'absolute',
        top: config.position.top,
        left: config.position.left,
        width: containerWidth,
        height: containerHeight,
        overflow: 'hidden',
      }}
    >
      {sortedItems.map((item, index) => (
        <BarItem
          key={item.id}
          item={item}
          index={index}
          config={config}
          maxValue={maxValue}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          totalItems={sortedItems.length}
        />
      ))}
      
      {/* Optional grid lines for better readability */}
      {config.chart.maxValue === 'global' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Vertical grid lines */}
          {[0.25, 0.5, 0.75, 1].map((percentage) => (
            <div
              key={percentage}
              style={{
                position: 'absolute',
                left: `${percentage * 100}%`,
                top: 0,
                width: 1,
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Background Layer Component
const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ config }) => {
  const backgroundColor = config.color;
  const opacity = config.opacity / 100;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        opacity,
      }}
    >
      {config.image && (
        <Img
          src={config.image.path}
          style={{
            width: "100%",
            height: "100%",
            objectFit: config.image.cropping,
            opacity: config.image.opacity / 100,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// Title Layer Component
const TitleLayer: React.FC<TitleLayerProps> = ({
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width: videoWidth } = useVideoConfig();

  // Calculate if title should be visible based on timeline
  const startFrame = config.timeline.startTime * fps;
  const endFrame = startFrame + config.timeline.duration * fps;
  const isVisible = frame >= startFrame && frame <= endFrame;

  if (!isVisible) return null;

  // Calculate horizontal position based on alignment
  let alignStyle: React.CSSProperties = {};
  switch (config.position.align) {
    case "left":
      alignStyle = { textAlign: "left", left: 0 };
      break;
    case "center":
      alignStyle = { textAlign: "center", left: "50%", transform: "translateX(-50%)" };
      break;
    case "right":
      alignStyle = { textAlign: "right", right: 0 };
      break;
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: config.position.top,
          width: videoWidth,
          fontSize: config.style.fontSize,
          fontFamily: config.style.fontFamily,
          color: config.style.color,
          opacity: config.style.opacity / 100,
          fontWeight: "bold",
          zIndex: 10,
          ...alignStyle,
        }}
      >
        {config.text}
      </div>
    </AbsoluteFill>
  );
};

// Date Layer Component
const DateLayer: React.FC<DateLayerProps> = ({
  config,
  currentDate,
}) => {
  // Format date based on pattern (simplified version)
  const formatDate = (dateStr: string, pattern: string) => {
    const date = new Date(dateStr);
    
    // Simple pattern matching - can be enhanced with date-fns or similar
    if (pattern === "MMMM YYYY") {
      return date.toLocaleDateString(config.format.locale, {
        month: "long",
        year: "numeric",
      });
    } else if (pattern === "YYYY-MM-DD") {
      return date.toLocaleDateString(config.format.locale);
    }
    
    return dateStr;
  };

  const formattedDate = formatDate(currentDate, config.format.pattern);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: config.position.bottom,
          right: config.position.right,
          fontSize: config.style.fontSize,
          fontFamily: config.style.fontFamily,
          color: config.style.color,
          opacity: config.style.opacity / 100,
          fontWeight: "bold",
          zIndex: 10,
        }}
      >
        {formattedDate}
      </div>
    </AbsoluteFill>
  );
};

// Inner Composition Component
const BarChartRaceCompositionInner: React.FC<
  BarChartRaceCompositionProps & { frame: number; fps: number }
> = ({ config, processedData, frame, fps }) => {
  // Validate required props
  if (!config) {
    throw new Error("Configuration is required");
  }

  // Check if data is still loading or not available
  if (!processedData) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: config.layers.background.color,
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 24,
        }}
      >
        Loading data...
      </AbsoluteFill>
    );
  }

  // Check if we have rawData (dynamic loading) but it's still loading
  if (
    processedData &&
    !processedData.rawData &&
    (!processedData.frames || processedData.frames.length === 0)
  ) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: config.layers.background.color,
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 24,
        }}
      >
        Loading CSV data...
      </AbsoluteFill>
    );
  }

  // Get current frame data with error handling
  let currentData;
  try {
    // Check if we have rawData for real-time interpolation
    if (processedData.rawData) {
      currentData = getFrameDataWithRemotionInterpolation(
        processedData.rawData,
        frame,
        processedData.totalFrames,
        config.layers.chart.chart.visibleItemCount,
      );
    } else if (processedData.frames && processedData.frames.length > 0) {
      // Fallback to pre-processed frame data
      currentData = getFrameData(processedData, frame);
    } else {
      // No data available yet
      return (
        <AbsoluteFill
          style={{
            backgroundColor: config.layers.background.color,
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontSize: 24,
          }}
        >
          No data available
        </AbsoluteFill>
      );
    }
  } catch (error) {
    console.error("Error getting frame data:", error);
    return (
      <AbsoluteFill
        style={{
          backgroundColor: config.layers.background.color,
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 24,
        }}
      >
        Data processing error:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </AbsoluteFill>
    );
  }

  // Validate data - provide fallback for missing data
  if (!currentData) {
    console.warn(`No data available for frame ${frame}`);
    // Create fallback data structure
    currentData = {
      frame,
      date: new Date().toISOString(),
      items: [],
      maxValue: 0,
    };
  }

  // Ensure items array exists
  if (!currentData.items) {
    currentData.items = [];
  }

  return (
    <AbsoluteFill>
      {/* Background Layer */}
      <ErrorBoundary fallback={<div>Background layer error</div>}>
        <BackgroundLayer config={config.layers?.background} />
      </ErrorBoundary>

      {/* Chart Layer */}
      <ErrorBoundary fallback={<div>Chart layer error</div>}>
        <ChartLayer
          config={config.layers?.chart}
          data={currentData}
          frame={frame}
          fps={fps}
        />
      </ErrorBoundary>

      {/* Title Layer */}
      {config.layers?.title && (
        <ErrorBoundary fallback={<div>Title layer error</div>}>
          <TitleLayer config={config.layers.title} frame={frame} fps={fps} />
        </ErrorBoundary>
      )}

      {/* Date Layer */}
      {config.layers?.date && (
        <ErrorBoundary fallback={<div>Date layer error</div>}>
          <DateLayer
            config={config.layers.date}
            currentDate={currentData.date}
            frame={frame}
            fps={fps}
          />
        </ErrorBoundary>
      )}
    </AbsoluteFill>
  );
};

// Main Bar Chart Race Component with Dynamic Loading
export const BarChartRaceComposition: React.FC<BarChartRaceCompositionProps> = ({
  config,
  processedData,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Dynamic data loading hook using Remotion interpolation
  const dynamicData = useDynamicData(config, durationInFrames, fps);

  // Use provided processedData or dynamically loaded data
  const finalData = processedData || dynamicData;

  return (
    <ErrorBoundary>
      <DataErrorBoundary dataSource={config?.data?.csvPath}>
        <BarChartRaceCompositionInner
          config={config}
          processedData={finalData}
          frame={frame}
          fps={fps}
        />
      </DataErrorBoundary>
    </ErrorBoundary>
  );
};