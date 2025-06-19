import React from 'react';
import { spring } from 'remotion';
import { DateLayerProps } from './types';

export const DateLayer: React.FC<DateLayerProps> = ({
  config,
  currentDate,
  frame,
  fps
}) => {
  // Format the date according to config
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    
    // Simple date formatting based on pattern
    if (config.format.pattern === 'MMMM YYYY') {
      return date.toLocaleDateString(config.format.locale, {
        month: 'long',
        year: 'numeric'
      });
    } else if (config.format.pattern === 'YYYY-MM-DD') {
      return date.toISOString().split('T')[0];
    } else if (config.format.pattern === 'YYYY') {
      return date.getFullYear().toString();
    } else if (config.format.pattern === 'MM/YYYY') {
      return date.toLocaleDateString(config.format.locale, {
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    // Default formatting
    return date.toLocaleDateString(config.format.locale);
  };
  
  const formattedDate = formatDate(currentDate);
  
  // Animation based on type
  let opacity = config.style.opacity / 100;
  let scale = 1;
  
  if (config.animation.type === 'continuous') {
    // Smooth fade in/out with scale effect
    opacity = spring({
      frame,
      fps,
      config: {
        damping: 100,
        stiffness: 200,
        mass: 1,
      },
      from: 0,
      to: config.style.opacity / 100,
    });
    
    scale = spring({
      frame,
      fps,
      config: {
        damping: 100,
        stiffness: 200,
        mass: 1,
      },
      from: 0.8,
      to: 1,
    });
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: config.position.bottom,
        right: config.position.right,
        fontSize: config.style.fontSize,
        fontFamily: config.style.fontFamily,
        color: config.style.color,
        opacity,
        transform: `scale(${scale})`,
        fontWeight: '600',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
        whiteSpace: 'nowrap',
        zIndex: 10,
        transformOrigin: 'bottom right',
      }}
    >
      {formattedDate}
    </div>
  );
};