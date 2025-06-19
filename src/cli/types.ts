// CLI Types and Interfaces
export interface CLIOptions {
  config: string; // config file path
  data: string; // CSV data file path
  output?: string; // output filename (default: read from config)
  quality?: 'low' | 'medium' | 'high' | 'max';
  parallel?: number; // parallel processing worker count
  verbose?: boolean; // detailed log output
  dryRun?: boolean; // validation only without actual rendering
}

export interface RenderOptions extends CLIOptions {
  config: string;
  data: string;
}

export interface ValidateOptions {
  config: string;
  data: string;
  verbose?: boolean;
}

export interface InitOptions {
  template?: string;
  output?: string;
}

// Bar Chart Race Config Types (from spec)
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
    maxValue: 'local' | 'global'; // local: each frame's max, global: overall max
    itemSpacing: number; // pixels
  };
  animation: {
    type: 'continuous' | 'discrete';
    overtakeDuration: number; // seconds
  };
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
    };
    value: {
      show: boolean;
      fontSize: number;
      fontFamily: string;
      color: string;
      format: string; // e.g., "{value:,.0f}", "{value:.2f}M"
      prefix?: string; // e.g., "$"
      suffix?: string; // e.g., "원"
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
    mapping: Record<string, string>; // { "itemName": "imagePath" }
    size: number;
    borderRadius: number;
  };
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

// Data Processing Types
export interface RawData {
  headers: string[];
  rows: Record<string, any>[];
}

export interface TimeSeries {
  dates: Date[];
  data: Record<string, number[]>;
}

export interface FrameData {
  date: Date;
  items: {
    id: string;
    value: number;
    rank: number;
  }[];
}

export interface ProcessedData {
  frames: FrameData[];
  maxValue: number;
  totalFrames: number;
}