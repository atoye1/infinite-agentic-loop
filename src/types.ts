// Bar Chart Race TypeScript interfaces
import { TimingFunction } from './utils/AnimationUtils';

export interface BarChartRaceConfig {
  output: {
    filename: string;
    format: 'mp4' | 'webm';
    width: number; // default: 1920
    height: number; // default: 1080
    fps: number; // default: 30
    duration: number; // seconds
    quality: 'low' | 'medium' | 'high' | 'max';
  };
  data: {
    csvPath: string;
    dateColumn: string;
    dateFormat: string; // e.g., "YYYY-MM-DD"
    valueColumns: string[]; // column names to visualize
    interpolation: 'linear' | 'smooth' | 'step';
  };
  layers: {
    background: BackgroundLayerConfig;
    chart: ChartLayerConfig;
    title?: TitleLayerConfig;
    text?: TextLayerConfig;
    date?: DateLayerConfig;
  };
}

export interface BackgroundLayerConfig {
  color: string; // hex color
  opacity: number; // 0-100
  image?: {
    path: string;
    cropping: 'cover' | 'contain' | 'fill';
    opacity: number; // 0-100
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
    visibleItemCount: number; // default: 10
    maxValue: 'local' | 'global'; // local: max per frame, global: overall max
    itemSpacing: number; // pixels
  };
  animation: {
    type: 'continuous' | 'discrete';
    overtakeDuration: number; // seconds
  };
  animations?: AdvancedAnimationsConfig;
  bar: {
    colors: string[] | 'auto'; // hex colors or auto-generate
    cornerRadius: number;
    opacity: number; // 0-100
  };
  labels: {
    title: {
      show: boolean;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: 'inside' | 'outside';
      animation?: TextAnimationConfig;
    };
    value: {
      show: boolean;
      fontSize: number;
      fontFamily: string;
      color: string;
      format: string; // e.g., "{value:,.0f}", "{value:.2f}M"
      prefix?: string; // e.g., "$"
      suffix?: string; // e.g., "원"
      animation?: TextAnimationConfig;
    };
    rank: {
      show: boolean;
      fontSize: number;
      backgroundColor: string;
      textColor: string;
      animation?: TextAnimationConfig;
    };
  };
  images?: {
    show: boolean;
    mapping: Record<string, string>; // { "itemName": "imagePath" }
    size: number;
    borderRadius: number;
  };
  particles?: ParticleSystemConfig;
}

export interface TitleLayerConfig {
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
    startTime: number; // seconds
    duration: number; // seconds
  };
}

export interface TextLayerConfig {
  text: string;
  position: {
    top: number;
    left: number;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
  };
}

export interface DateLayerConfig {
  position: {
    bottom: number;
    right: number;
  };
  format: {
    pattern: string; // e.g., "MMMM YYYY", "YYYY-MM-DD"
    locale: string; // e.g., "en-US", "ko-KR"
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
  };
  animation: {
    type: 'fixed' | 'continuous';
    duration: number; // transition duration in seconds
  };
}

// Data interfaces
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

export interface RawDataRow {
  [key: string]: string | number;
}

export interface TimeSeries {
  dates: string[];
  data: Record<string, number[]>;
}

// Component props interfaces
export interface BarChartRaceCompositionProps {
  config: BarChartRaceConfig;
  processedData: ProcessedData;
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

export interface BackgroundLayerProps {
  config: BackgroundLayerConfig;
}

// Advanced Animation Configuration Types
export interface AdvancedAnimationsConfig {
  bar?: {
    type: 'spring' | 'interpolate';
    springPreset?: string;
    duration?: number;
    easing?: TimingFunction;
    staggerDelay?: number;
  };
  rank?: {
    type: 'spring' | 'interpolate';
    springPreset?: string;
    duration?: number;
    easing?: TimingFunction;
  };
  entry?: {
    effect: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'flip';
    duration: number;
    delay: number;
  };
  overtaking?: {
    enabled?: boolean;
    preset?: 'smooth' | 'dramatic' | 'swift' | 'bouncy';
    customConfig?: {
      duration: number;
      easing: 'smooth' | 'elastic' | 'bounce' | 'aggressive';
      trailEffect: boolean;
      glowIntensity: number;
      curveIntensity: number;
      accelerationCurve: 'linear' | 'exponential' | 'logarithmic';
    };
  };
  celebrations?: {
    enabled?: boolean;
    recordPreset?: 'subtle' | 'exciting' | 'epic';
    overtakePreset?: 'subtle' | 'exciting' | 'epic';
    milestones?: number[];
  };
  effects?: {
    shake?: boolean;
    pulse?: boolean;
    shimmer?: boolean;
    gradient?: boolean;
    recordHighlight?: boolean;
    overtakeHighlight?: boolean;
  };
}

export interface TextAnimationConfig {
  type: 'typewriter' | 'reveal' | 'glow' | 'bounce' | 'none';
  duration?: number;
  delay?: number;
  effect?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom';
}

export interface ParticleSystemConfig {
  enabled: boolean;
  maxParticles: number;
  emissionRate: number;
  lifespan: number;
  size: { min: number; max: number };
  speed: { min: number; max: number };
  colors: string[];
  shapes: ('circle' | 'square' | 'star' | 'heart' | 'sparkle')[];
  gravity: number;
  wind: number;
  fadeOut: boolean;
  trail: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
}

export interface CelebrationEffect {
  type: 'confetti' | 'fireworks' | 'sparkles' | 'burst';
  intensity: number;
  duration: number;
  colors: string[];
  position: { x: number; y: number };
}

export interface MilestoneConfig {
  enabled: boolean;
  thresholds: number[];
  effects: CelebrationEffect[];
  particles: ParticleSystemConfig;
  soundEffects?: boolean;
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