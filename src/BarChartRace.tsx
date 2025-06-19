import React from 'react';
import { AbsoluteFill, Composition, useCurrentFrame, useVideoConfig, Img } from 'remotion';
import { z } from 'zod';
import { ChartLayer } from './ChartLayer';
import { createSampleData } from './utils';

// Core Types
export interface BarChartRaceConfig {
  output: {
    filename: string;
    format: 'mp4' | 'webm';
    width: number;
    height: number;
    fps: number;
    duration: number;
    quality: 'low' | 'medium' | 'high' | 'max';
  };
  data: {
    csvPath: string;
    dateColumn: string;
    dateFormat: string;
    valueColumns: string[];
    interpolation: 'linear' | 'smooth' | 'step';
  };
  layers: {
    background: {
      color: string;
      opacity: number;
      image?: {
        path: string;
        cropping: 'cover' | 'contain' | 'fill';
        opacity: number;
      };
    };
    chart: {
      position: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
      chart: {
        visibleItemCount: number;
        maxValue: 'local' | 'global';
        itemSpacing: number;
      };
      animation: {
        type: 'continuous' | 'discrete';
        overtakeDuration: number;
      };
      bar: {
        colors: string[] | 'auto';
        cornerRadius: number;
        opacity: number;
      };
      labels: {
        title: {
          show: boolean;
          fontSize: number;
          fontFamily: string;
          color: string;
          position: 'inside' | 'outside';
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
    };
    title?: {
      text: string;
      position: {
        top: number;
        align: 'left' | 'center' | 'right';
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
    };
    date?: {
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
        type: 'fixed' | 'continuous';
        duration: number;
      };
    };
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
  processedData: ProcessedData;
}

// Zod Schema for validation
export const barChartRaceSchema = z.object({
  config: z.object({
    output: z.object({
      filename: z.string(),
      format: z.enum(['mp4', 'webm']),
      width: z.number().default(1920),
      height: z.number().default(1080),
      fps: z.number().default(30),
      duration: z.number(),
      quality: z.enum(['low', 'medium', 'high', 'max']),
    }),
    data: z.object({
      csvPath: z.string(),
      dateColumn: z.string(),
      dateFormat: z.string(),
      valueColumns: z.array(z.string()),
      interpolation: z.enum(['linear', 'smooth', 'step']),
    }),
    layers: z.object({
      background: z.object({
        color: z.string(),
        opacity: z.number().min(0).max(100),
        image: z.object({
          path: z.string(),
          cropping: z.enum(['cover', 'contain', 'fill']),
          opacity: z.number().min(0).max(100),
        }).optional(),
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
          maxValue: z.enum(['local', 'global']),
          itemSpacing: z.number(),
        }),
        animation: z.object({
          type: z.enum(['continuous', 'discrete']),
          overtakeDuration: z.number(),
        }),
        bar: z.object({
          colors: z.union([z.array(z.string()), z.literal('auto')]),
          cornerRadius: z.number(),
          opacity: z.number().min(0).max(100),
        }),
        labels: z.object({
          title: z.object({
            show: z.boolean(),
            fontSize: z.number(),
            fontFamily: z.string(),
            color: z.string(),
            position: z.enum(['inside', 'outside']),
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
        images: z.object({
          show: z.boolean(),
          mapping: z.record(z.string()),
          size: z.number(),
          borderRadius: z.number(),
        }).optional(),
      }),
      title: z.object({
        text: z.string(),
        position: z.object({
          top: z.number(),
          align: z.enum(['left', 'center', 'right']),
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
      }).optional(),
      date: z.object({
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
          type: z.enum(['fixed', 'continuous']),
          duration: z.number(),
        }),
      }).optional(),
    }),
  }),
  processedData: z.object({
    frames: z.array(z.object({
      frame: z.number(),
      date: z.string(),
      items: z.array(z.object({
        id: z.string(),
        name: z.string(),
        value: z.number(),
        rank: z.number(),
        color: z.string().optional(),
        image: z.string().optional(),
      })),
      maxValue: z.number(),
    })),
    totalFrames: z.number(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }),
    valueColumns: z.array(z.string()),
    globalMaxValue: z.number(),
  }),
});

// Utility functions
export function getFrameData(processedData: ProcessedData, frame: number): FrameData {
  if (!processedData || !processedData.frames || processedData.frames.length === 0) {
    throw new Error('Invalid processed data');
  }
  
  const clampedFrame = Math.max(0, Math.min(frame, processedData.frames.length - 1));
  const frameData = processedData.frames[clampedFrame];
  
  if (!frameData) {
    throw new Error(`Frame data not found for frame ${clampedFrame}`);
  }
  
  return frameData;
}

// Background Layer Component
const BackgroundLayer: React.FC<{ config: BarChartRaceConfig['layers']['background'] }> = ({ config }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: config.color,
        opacity: config.opacity / 100,
      }}
    >
      {config.image && (
        <Img
          src={config.image.path}
          style={{
            width: '100%',
            height: '100%',
            objectFit: config.image.cropping,
            opacity: config.image.opacity / 100,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// Title Layer Component
const TitleLayer: React.FC<{ 
  config: BarChartRaceConfig['layers']['title']; 
  frame: number; 
  fps: number; 
}> = ({ config, frame, fps }) => {
  if (!config) return null;
  
  const startFrame = config.timeline.startTime * fps;
  const endFrame = startFrame + (config.timeline.duration * fps);
  
  if (frame < startFrame || frame > endFrame) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: config.position.top,
        left: 0,
        right: 0,
        textAlign: config.position.align,
        fontSize: config.style.fontSize,
        fontFamily: config.style.fontFamily,
        color: config.style.color,
        opacity: config.style.opacity / 100,
        zIndex: 10,
      }}
    >
      {config.text}
    </div>
  );
};

// Date Layer Component
const DateLayer: React.FC<{ 
  config: BarChartRaceConfig['layers']['date']; 
  currentDate: string; 
  frame: number; 
  fps: number; 
}> = ({ config, currentDate, frame, fps }) => {
  if (!config) return null;
  
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(config.format.locale, {
        year: 'numeric',
        month: config.format.pattern.includes('MMMM') ? 'long' : 'short',
        day: config.format.pattern.includes('DD') ? '2-digit' : undefined,
      });
    } catch {
      return currentDate;
    }
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: config.position.bottom,
        right: config.position.right,
        fontSize: config.style.fontSize,
        fontFamily: config.style.fontFamily,
        color: config.style.color,
        opacity: config.style.opacity / 100,
        zIndex: 10,
      }}
    >
      {formatDate(currentDate)}
    </div>
  );
};

// Main Composition Component
export const BarChartRaceComposition: React.FC<BarChartRaceCompositionProps> = ({
  config,
  processedData
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Error handling
  if (!config || !processedData) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000', color: '#fff', padding: 20 }}>
        <div>Error: Missing configuration or processed data</div>
      </AbsoluteFill>
    );
  }
  
  let currentData: FrameData;
  try {
    currentData = getFrameData(processedData, frame);
  } catch (error) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000', color: '#fff', padding: 20 }}>
        <div>Error: {error instanceof Error ? error.message : 'Unknown error'}</div>
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

// Sample configuration for development
const sampleConfig: BarChartRaceConfig = {
  output: {
    filename: "bar-chart-race.mp4",
    format: "mp4",
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 10,
    quality: "high"
  },
  data: {
    csvPath: "./sample-data.csv",
    dateColumn: "Date",
    dateFormat: "YYYY-MM-DD",
    valueColumns: ["YouTube", "Netflix", "Disney+", "HBO Max", "Amazon Prime"],
    interpolation: "smooth"
  },
  layers: {
    background: {
      color: "#1a1a2e",
      opacity: 100
    },
    chart: {
      position: {
        top: 120,
        right: 80,
        bottom: 120,
        left: 80
      },
      chart: {
        visibleItemCount: 10,
        maxValue: "local",
        itemSpacing: 15
      },
      animation: {
        type: "continuous",
        overtakeDuration: 0.8
      },
      bar: {
        colors: "auto",
        cornerRadius: 8,
        opacity: 90
      },
      labels: {
        title: {
          show: true,
          fontSize: 22,
          fontFamily: "Inter, Arial, sans-serif",
          color: "#ffffff",
          position: "outside"
        },
        value: {
          show: true,
          fontSize: 18,
          fontFamily: "Inter, Arial, sans-serif",
          color: "#ffffff",
          format: "{value:,.0f}",
          suffix: " subscribers"
        },
        rank: {
          show: true,
          fontSize: 16,
          backgroundColor: "#0f3460",
          textColor: "#ffffff"
        }
      }
    },
    title: {
      text: "Top Streaming Platforms Race",
      position: {
        top: 40,
        align: "center"
      },
      style: {
        fontSize: 42,
        fontFamily: "Inter, Arial, sans-serif",
        color: "#ffffff",
        opacity: 100
      },
      timeline: {
        startTime: 0,
        duration: 10
      }
    },
    date: {
      position: {
        bottom: 40,
        right: 80
      },
      format: {
        pattern: "MMMM YYYY",
        locale: "en-US"
      },
      style: {
        fontSize: 28,
        fontFamily: "Inter, Arial, sans-serif",
        color: "#ffffff",
        opacity: 85
      },
      animation: {
        type: "continuous",
        duration: 0.5
      }
    }
  }
};

// Remotion Root Component
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BarChartRace"
        component={BarChartRaceComposition}
        durationInFrames={300} // 10 seconds at 30fps 
        fps={30}
        width={1920}
        height={1080}
        schema={barChartRaceSchema}
        defaultProps={{
          config: sampleConfig,
          processedData: createSampleData()
        }}
      />
    </>
  );
};