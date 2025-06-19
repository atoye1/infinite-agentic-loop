import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { BarChartRaceConfig, ProcessedData } from '../cli/types';

export interface BarChartRaceCompositionProps {
  config: BarChartRaceConfig;
  processedData: ProcessedData;
}

export const BarChartRaceComposition: React.FC<BarChartRaceCompositionProps> = ({
  config,
  processedData
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Get current frame data (safely handle edge cases)
  const currentData = processedData.frames[Math.min(frame, processedData.frames.length - 1)] || {
    date: new Date(),
    items: []
  };
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: config.layers.background.color,
        opacity: config.layers.background.opacity / 100
      }}
    >
      {/* Background Layer */}
      {config.layers.background.image && (
        <AbsoluteFill>
          <img
            src={config.layers.background.image.path}
            style={{
              width: '100%',
              height: '100%',
              objectFit: config.layers.background.image.cropping,
              opacity: config.layers.background.image.opacity / 100
            }}
            alt="Background"
          />
        </AbsoluteFill>
      )}
      
      {/* Title Layer */}
      {config.layers.title && (
        <div
          style={{
            position: 'absolute',
            top: config.layers.title.position.top,
            left: 0,
            right: 0,
            textAlign: config.layers.title.position.align,
            fontSize: config.layers.title.style.fontSize,
            fontFamily: config.layers.title.style.fontFamily,
            color: config.layers.title.style.color,
            opacity: config.layers.title.style.opacity / 100,
            zIndex: 10
          }}
        >
          {config.layers.title.text}
        </div>
      )}
      
      {/* Chart Layer */}
      <div
        style={{
          position: 'absolute',
          top: config.layers.chart.position.top,
          right: config.layers.chart.position.right,
          bottom: config.layers.chart.position.bottom,
          left: config.layers.chart.position.left,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Chart content will be implemented by other agents */}
        <div style={{ color: '#ffffff', fontSize: 24 }}>
          Bar Chart Race - Frame {frame}
        </div>
        <div style={{ color: '#cccccc', fontSize: 16 }}>
          Date: {currentData.date.toDateString()}
        </div>
        <div style={{ color: '#cccccc', fontSize: 16 }}>
          Items: {currentData.items.length}
        </div>
      </div>
      
      {/* Date Layer */}
      {config.layers.date && (
        <div
          style={{
            position: 'absolute',
            bottom: config.layers.date.position.bottom,
            right: config.layers.date.position.right,
            fontSize: config.layers.date.style.fontSize,
            fontFamily: config.layers.date.style.fontFamily,
            color: config.layers.date.style.color,
            opacity: config.layers.date.style.opacity / 100,
            zIndex: 10
          }}
        >
          {/* Date formatting will be implemented by other agents */}
          {currentData.date.toLocaleDateString(
            config.layers.date.format.locale,
            {
              year: 'numeric',
              month: 'long'
            }
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};