import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { BarChartRaceCompositionProps } from "./types";
import { BackgroundLayer } from "./BackgroundLayer";
import { ChartLayer } from "./ChartLayer";
import { TitleLayer } from "./TitleLayer";
import { DateLayer } from "./DateLayer";
import { getFrameData } from "./utils";
import { ErrorBoundary, DataErrorBoundary } from "./components/ErrorBoundary";

// Schema for props validation
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
            }),
          ),
          maxValue: z.number(),
        }),
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

export const BarChartRaceComposition: React.FC<
  BarChartRaceCompositionProps
> = ({ config, processedData }) => {
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
      const { getFrameDataWithRemotionInterpolation } = require("./utils");

      currentData = getFrameDataWithRemotionInterpolation(
        processedData.rawData,
        frame,
        processedData.totalFrames,
        config.layers.chart.chart.visibleItemCount,
      );
    } else if (processedData.frames && processedData.frames.length > 0) {
      // Fallback to pre-processed frame data
      const { getFrameData } = require("./utils");
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
