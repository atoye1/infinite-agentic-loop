import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { BarChartRaceCompositionProps } from './types';
import { BackgroundLayer } from './BackgroundLayer';
import { ChartLayer } from './ChartLayer';
import { TitleLayer } from './TitleLayer';
import { DateLayer } from './DateLayer';
import { getFrameData } from './utils';

// Schema for props validation  
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

export const BarChartRaceComposition: React.FC<BarChartRaceCompositionProps> = ({
  config,
  processedData
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Get current frame data
  const currentData = getFrameData(processedData, frame);
  
  // Validate data
  if (!currentData || !currentData.items || currentData.items.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        No data available for frame {frame}
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