import { DataItem, FrameData, ProcessedData, ChartLayerConfig } from './types';

// Color palette for auto-generating colors
const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE'
];

// Generate colors for data items
export function generateColors(itemCount: number, colorConfig: string[] | 'auto'): string[] {
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
export function getItemColor(item: DataItem, colors: string[], index: number): string {
  if (item.color) return item.color;
  return colors[index % colors.length];
}

// Calculate max value based on config
export function getMaxValue(data: FrameData, maxValueType: 'local' | 'global', globalMax?: number): number {
  if (maxValueType === 'global' && globalMax) {
    return globalMax;
  }
  return data.maxValue;
}

// Format value based on format string
export function formatValue(value: number, format: string, prefix?: string, suffix?: string): string {
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

// Interpolate between two values with easing
export function smoothInterpolate(from: number, to: number, progress: number): number {
  // Use easeInOutCubic for smooth transitions
  const eased = progress < 0.5 
    ? 4 * progress * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  
  return from + (to - from) * eased;
}

// Calculate bar position with smooth animation
export function calculateBarPosition(
  currentRank: number,
  previousRank: number,
  frame: number,
  fps: number,
  overtakeDuration: number,
  itemSpacing: number
): number {
  const overtakeFrames = overtakeDuration * fps;
  const progress = Math.min(1, frame / overtakeFrames);
  
  const fromY = previousRank * itemSpacing;
  const toY = currentRank * itemSpacing;
  
  return smoothInterpolate(fromY, toY, progress);
}

// Calculate bar width with animation
export function calculateBarWidth(
  currentValue: number,
  previousValue: number,
  maxValue: number,
  containerWidth: number,
  frame: number,
  fps: number,
  animationType: 'continuous' | 'discrete'
): number {
  if (animationType === 'discrete') {
    return (currentValue / maxValue) * containerWidth;
  }
  
  // Continuous animation
  const animationFrames = fps * 0.5; // 0.5 second transition
  const progress = Math.min(1, frame / animationFrames);
  
  const fromWidth = (previousValue / maxValue) * containerWidth;
  const toWidth = (currentValue / maxValue) * containerWidth;
  
  return smoothInterpolate(fromWidth, toWidth, progress);
}

// Create sample data for testing
export function createSampleData(): ProcessedData {
  const sampleItems = [
    'YouTube', 'Netflix', 'Disney+', 'HBO Max', 'Amazon Prime',
    'Apple TV+', 'Hulu', 'Paramount+', 'Peacock', 'Discovery+'
  ];
  
  const frames: FrameData[] = [];
  const totalFrames = 300; // 10 seconds at 30fps
  
  for (let frame = 0; frame < totalFrames; frame++) {
    const items: DataItem[] = sampleItems.map((name, index) => {
      // Generate sample values with some randomness and growth
      const baseValue = 1000000 + (index * 500000);
      const growth = frame * 10000;
      const variation = Math.sin(frame * 0.1 + index) * 200000;
      const value = Math.max(0, baseValue + growth + variation);
      
      return {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name,
        value,
        rank: 0, // Will be calculated
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
      };
    });
    
    // Sort by value and assign ranks
    items.sort((a, b) => b.value - a.value);
    items.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    const maxValue = Math.max(...items.map(item => item.value));
    
    frames.push({
      frame,
      date: new Date(2020, 0, 1 + Math.floor(frame / 30)).toISOString().split('T')[0],
      items,
      maxValue
    });
  }
  
  const globalMaxValue = Math.max(...frames.map(f => f.maxValue));
  
  return {
    frames,
    totalFrames,
    dateRange: {
      start: frames[0].date,
      end: frames[frames.length - 1].date
    },
    valueColumns: sampleItems,
    globalMaxValue
  };
}

// Validate frame data
export function validateFrameData(data: FrameData): boolean {
  if (!data.items || data.items.length === 0) return false;
  
  for (const item of data.items) {
    if (!item.id || !item.name || typeof item.value !== 'number' || typeof item.rank !== 'number') {
      return false;
    }
    if (item.value < 0 || item.rank < 1) {
      return false;
    }
  }
  
  return true;
}

// Get frame data with comprehensive error handling
export function getFrameData(processedData: ProcessedData, frame: number): FrameData {
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

// Safe data access with fallbacks
export function safeGetFrameData(processedData: ProcessedData | null | undefined, frame: number): FrameData | null {
  try {
    if (!processedData) return null;
    return getFrameData(processedData, frame);
  } catch (error) {
    console.warn(`Failed to get frame data for frame ${frame}:`, error);
    return null;
  }
}

// Validate processed data structure
export function validateProcessedData(data: ProcessedData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('ProcessedData is null or undefined');
    return { isValid: false, errors };
  }

  if (!data.frames || !Array.isArray(data.frames)) {
    errors.push('frames must be an array');
  } else if (data.frames.length === 0) {
    errors.push('frames array cannot be empty');
  } else {
    // Validate each frame
    data.frames.forEach((frame, index) => {
      if (!frame) {
        errors.push(`Frame ${index} is null or undefined`);
        return;
      }

      if (typeof frame.frame !== 'number') {
        errors.push(`Frame ${index}: frame number must be a number`);
      }

      if (!frame.items || !Array.isArray(frame.items)) {
        errors.push(`Frame ${index}: items must be an array`);
      } else {
        frame.items.forEach((item, itemIndex) => {
          if (!item) {
            errors.push(`Frame ${index}, Item ${itemIndex}: item is null or undefined`);
            return;
          }

          if (!item.id || typeof item.id !== 'string') {
            errors.push(`Frame ${index}, Item ${itemIndex}: id must be a non-empty string`);
          }

          if (!item.name || typeof item.name !== 'string') {
            errors.push(`Frame ${index}, Item ${itemIndex}: name must be a non-empty string`);
          }

          if (typeof item.value !== 'number' || isNaN(item.value)) {
            errors.push(`Frame ${index}, Item ${itemIndex}: value must be a valid number`);
          }

          if (typeof item.rank !== 'number' || isNaN(item.rank) || item.rank < 1) {
            errors.push(`Frame ${index}, Item ${itemIndex}: rank must be a positive number`);
          }
        });
      }

      if (typeof frame.maxValue !== 'number' || isNaN(frame.maxValue)) {
        errors.push(`Frame ${index}: maxValue must be a valid number`);
      }
    });
  }

  if (typeof data.totalFrames !== 'number' || data.totalFrames < 0) {
    errors.push('totalFrames must be a non-negative number');
  }

  if (!data.valueColumns || !Array.isArray(data.valueColumns)) {
    errors.push('valueColumns must be an array');
  }

  if (typeof data.globalMaxValue !== 'number' || isNaN(data.globalMaxValue)) {
    errors.push('globalMaxValue must be a valid number');
  }

  return { isValid: errors.length === 0, errors };
}

// Calculate container dimensions based on config
export function calculateContainerDimensions(
  config: ChartLayerConfig,
  videoWidth: number,
  videoHeight: number
): { width: number; height: number } {
  const width = videoWidth - config.position.left - config.position.right;
  const height = videoHeight - config.position.top - config.position.bottom;
  
  return { width: Math.max(0, width), height: Math.max(0, height) };
}

// Calculate item height based on visible items and spacing
export function calculateItemHeight(
  containerHeight: number,
  visibleItemCount: number,
  itemSpacing: number
): number {
  const totalSpacing = (visibleItemCount - 1) * itemSpacing;
  const availableHeight = containerHeight - totalSpacing;
  return Math.max(20, availableHeight / visibleItemCount); // Minimum 20px height
}