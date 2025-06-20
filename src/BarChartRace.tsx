import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from "remotion";
import { z } from "zod";
import { ChartLayer } from "./ChartLayer";

// Core Types
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
  frames: FrameData[];
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

// Zod schema for validation
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

// Background Layer Component
export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ config }) => {
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
export const TitleLayer: React.FC<TitleLayerProps> = ({
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
export const DateLayer: React.FC<DateLayerProps> = ({
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

// Main Bar Chart Race Component
export const BarChartRaceComposition: React.FC<BarChartRaceCompositionProps> = ({
  config,
  processedData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Handle missing data gracefully
  if (!processedData || !processedData.frames || processedData.frames.length === 0) {
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

  // Get current frame data
  const clampedFrame = Math.max(0, Math.min(frame, processedData.frames.length - 1));
  const currentData = processedData.frames[clampedFrame];

  if (!currentData) {
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
        Loading frame {frame}...
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* Background Layer */}
      <BackgroundLayer config={config.layers.background} />

      {/* Chart Layer */}
      <ChartLayer
        config={config.layers.chart}
        data={currentData}
        frame={frame}
        fps={fps}
      />

      {/* Title Layer */}
      {config.layers.title && (
        <TitleLayer
          config={config.layers.title}
          frame={frame}
          fps={fps}
        />
      )}

      {/* Date Layer */}
      {config.layers.date && (
        <DateLayer
          config={config.layers.date}
          currentDate={currentData.date}
          frame={frame}
          fps={fps}
        />
      )}
    </AbsoluteFill>
  );
};