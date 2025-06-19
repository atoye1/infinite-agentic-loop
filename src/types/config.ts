// Configuration interfaces for Bar Chart Race system

export interface BarChartRaceConfig {
  output: {
    filename: string
    format: 'mp4' | 'webm'
    width: number // default: 1920
    height: number // default: 1080
    fps: number // default: 30
    duration: number // seconds
    quality: 'low' | 'medium' | 'high' | 'max'
  }
  data: {
    csvPath: string
    dateColumn: string
    dateFormat: string // e.g., "YYYY-MM-DD"
    valueColumns: string[] // column names to visualize
    interpolation: 'linear' | 'smooth' | 'step'
  }
  layers: {
    background: BackgroundLayerConfig
    chart: ChartLayerConfig
    title?: TitleLayerConfig
    text?: TextLayerConfig
    date?: DateLayerConfig
  }
}

export interface BackgroundLayerConfig {
  color: string // hex color
  opacity: number // 0-100
  image?: {
    path: string
    cropping: 'cover' | 'contain' | 'fill'
    opacity: number // 0-100
  }
}

export interface ChartLayerConfig {
  position: {
    top: number
    right: number
    bottom: number
    left: number
  }
  chart: {
    visibleItemCount: number // default: 10
    maxValue: 'local' | 'global' // local: 각 프레임의 최대값, global: 전체 기간 최대값
    itemSpacing: number // pixels
  }
  animation: {
    type: 'continuous' | 'discrete'
    overtakeDuration: number // seconds
  }
  bar: {
    colors: string[] | 'auto' // hex colors or auto-generate
    cornerRadius: number
    opacity: number // 0-100
  }
  labels: {
    title: {
      show: boolean
      fontSize: number
      fontFamily: string
      color: string
      position: 'inside' | 'outside'
    }
    value: {
      show: boolean
      fontSize: number
      fontFamily: string
      color: string
      format: string // e.g., "{value:,.0f}", "{value:.2f}M"
      prefix?: string // e.g., "$"
      suffix?: string // e.g., "원"
    }
    rank: {
      show: boolean
      fontSize: number
      backgroundColor: string
      textColor: string
    }
  }
  images?: {
    show: boolean
    mapping: Record<string, string> // { "itemName": "imagePath" }
    size: number
    borderRadius: number
  }
}

export interface TitleLayerConfig {
  text: string
  position: {
    top: number
    align: 'left' | 'center' | 'right'
  }
  style: {
    fontSize: number
    fontFamily: string
    color: string
    opacity: number
  }
  timeline: {
    startTime: number // seconds
    duration: number // seconds
  }
}

export interface TextLayerConfig {
  text: string
  position: {
    top: number
    left: number
    align: 'left' | 'center' | 'right'
  }
  style: {
    fontSize: number
    fontFamily: string
    color: string
    opacity: number
  }
  timeline: {
    startTime: number // seconds
    duration: number // seconds
  }
}

export interface DateLayerConfig {
  position: {
    bottom: number
    right: number
  }
  format: {
    pattern: string // e.g., "MMMM YYYY", "YYYY-MM-DD"
    locale: string // e.g., "en-US", "ko-KR"
  }
  style: {
    fontSize: number
    fontFamily: string
    color: string
    opacity: number
  }
  animation: {
    type: 'fixed' | 'continuous'
    duration: number // transition duration in seconds
  }
}

// CLI Options interface
export interface CLIOptions {
  config: string // config 파일 경로
  data: string // CSV 데이터 파일 경로
  output?: string // 출력 파일명 (기본값: config에서 읽음)
  quality?: 'low' | 'medium' | 'high' | 'max'
  parallel?: number // 병렬 처리 워커 수
  verbose?: boolean // 상세 로그 출력
  dryRun?: boolean // 실제 렌더링 없이 검증만
}

// Data processing interfaces
export interface RawData {
  headers: string[]
  rows: Array<Record<string, string | number>>
}

export interface TimeSeries {
  dates: Date[]
  values: Array<Record<string, number>>
}

export interface FrameData {
  date: Date
  items: Array<{
    id: string
    value: number
    rank: number
  }>
}

export interface RankedFrameData extends FrameData {
  maxValue: number
}

export interface ProcessedData {
  frames: RankedFrameData[]
  totalFrames: number
  columns: string[]
  dateRange: {
    start: Date
    end: Date
  }
}

// Validation error types
export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}