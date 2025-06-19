import React from 'react';
import { useVideoConfig, interpolate } from 'remotion';
import { TitleLayerProps } from './types';

export const TitleLayer: React.FC<TitleLayerProps> = ({
  config,
  frame,
  fps
}) => {
  const { width: videoWidth } = useVideoConfig();
  
  // Calculate timeline visibility
  const startFrame = config.timeline.startTime * fps;
  const endFrame = startFrame + (config.timeline.duration * fps);
  
  // Animate opacity based on timeline
  const opacity = interpolate(
    frame,
    [startFrame - 10, startFrame, endFrame, endFrame + 10],
    [0, config.style.opacity / 100, config.style.opacity / 100, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  // Calculate horizontal position based on alignment
  let left: string | number = '50%';
  let transform = 'translateX(-50%)';
  
  if (config.position.align === 'left') {
    left = 50;
    transform = 'none';
  } else if (config.position.align === 'right') {
    left = videoWidth - 50;
    transform = 'translateX(-100%)';
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        top: config.position.top,
        left,
        transform,
        fontSize: config.style.fontSize,
        fontFamily: config.style.fontFamily,
        color: config.style.color,
        opacity,
        fontWeight: '700',
        textAlign: config.position.align,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}
    >
      {config.text}
    </div>
  );
};