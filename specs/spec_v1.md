# Bar Chart Race 자동 렌더링 시스템 - PRD

## 1. 프로젝트 개요

### 1.1 목적

- Config 파일과 CSV 데이터를 입력받아 Bar Chart Race 비디오를 자동으로 렌더링하는 CLI 시스템
- Remotion.js 기반으로 고품질 MP4/WebM 비디오 생성
- 인공지능 에이전트가 파라미터를 조작하여 완전 자동화된 비디오 생성

### 1.2 핵심 아키텍처

```
Input: config.json + data.csv
  ↓
Processing: Data Parser + Config Validator
  ↓
Rendering: Remotion Components
  ↓
Output: video.mp4
```

## 2. Config 스키마 정의

### 2.1 전체 Config 구조

```typescript
interface BarChartRaceConfig {
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
```

### 2.2 Background Layer Config

```typescript
interface BackgroundLayerConfig {
  color: string // hex color
  opacity: number // 0-100
  image?: {
    path: string
    cropping: 'cover' | 'contain' | 'fill'
    opacity: number // 0-100
  }
}
```

### 2.3 Chart Layer Config (핵심)

```typescript
interface ChartLayerConfig {
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
```

### 2.4 Title Layer Config

```typescript
interface TitleLayerConfig {
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
```

### 2.5 Date Layer Config

```typescript
interface DateLayerConfig {
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
```

## 3. CLI 인터페이스

### 3.1 기본 명령어

```bash
# 기본 렌더링
barchart-race render --config config.json --data data.csv

# 출력 옵션 지정
barchart-race render --config config.json --data data.csv --output output.mp4

# 품질 설정
barchart-race render --config config.json --data data.csv --quality high

# 검증만 수행
barchart-race validate --config config.json --data data.csv

# 기본 config 템플릿 생성
barchart-race init --template default
```

### 3.2 CLI 옵션

```typescript
interface CLIOptions {
  config: string // config 파일 경로
  data: string // CSV 데이터 파일 경로
  output?: string // 출력 파일명 (기본값: config에서 읽음)
  quality?: 'low' | 'medium' | 'high' | 'max'
  parallel?: number // 병렬 처리 워커 수
  verbose?: boolean // 상세 로그 출력
  dryRun?: boolean // 실제 렌더링 없이 검증만
}
```

## 4. 데이터 처리

### 4.1 CSV 입력 형식

```csv
Date,YouTube,Netflix,Disney+,HBO Max
2020-01,1000000,800000,0,0
2020-02,1200000,850000,100000,50000
2020-03,1400000,900000,200000,100000
```

### 4.2 데이터 변환 파이프라인

```typescript
interface DataProcessor {
  // CSV 파싱 및 검증
  parseCSV(filePath: string): RawData
  
  // 날짜 형식 변환
  parseDates(data: RawData, format: string): TimeSeries
  
  // 프레임별 데이터 보간
  interpolateFrames(
    data: TimeSeries, 
    fps: number, 
    duration: number,
    method: 'linear' | 'smooth' | 'step'
  ): FrameData[]
  
  // 순위 계산
  calculateRanks(frames: FrameData[]): RankedFrameData[]
}
```

## 5. Remotion 컴포넌트 구현

### 5.1 메인 컴포지션

```typescript
export const BarChartRaceComposition: React.FC<{
  config: BarChartRaceConfig
  processedData: ProcessedData
}> = ({ config, processedData }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  
  const currentData = processedData.frames[frame]
  
  return (
    <AbsoluteFill>
      {config.layers.background && (
        <BackgroundLayer config={config.layers.background} />
      )}
      
      <ChartLayer 
        config={config.layers.chart}
        data={currentData}
        frame={frame}
        fps={fps}
      />
      
      {config.layers.title && (
        <TitleLayer 
          config={config.layers.title}
          frame={frame}
          fps={fps}
        />
      )}
      
      {config.layers.date && (
        <DateLayer
          config={config.layers.date}
          currentDate={currentData.date}
          frame={frame}
          fps={fps}
        />
      )}
    </AbsoluteFill>
  )
}
```

### 5.2 Chart Layer 컴포넌트

```typescript
const ChartLayer: React.FC<{
  config: ChartLayerConfig
  data: FrameData
  frame: number
  fps: number
}> = ({ config, data, frame, fps }) => {
  const sortedItems = data.items
    .sort((a, b) => b.value - a.value)
    .slice(0, config.chart.visibleItemCount)
  
  return (
    <div style={{
      position: 'absolute',
      top: config.position.top,
      right: config.position.right,
      bottom: config.position.bottom,
      left: config.position.left
    }}>
      {sortedItems.map((item, index) => (
        <BarItem
          key={item.id}
          item={item}
          index={index}
          config={config}
          maxValue={getMaxValue(data, config.chart.maxValue)}
        />
      ))}
    </div>
  )
}
```

## 6. 렌더링 파이프라인

### 6.1 렌더링 프로세스

```typescript
class RenderPipeline {
  async render(options: CLIOptions): Promise<void> {
    // 1. Config 로드 및 검증
    const config = await this.loadConfig(options.config)
    this.validateConfig(config)
    
    // 2. 데이터 로드 및 처리
    const rawData = await this.loadCSV(options.data)
    const processedData = await this.processData(rawData, config)
    
    // 3. Remotion 번들 생성
    const bundleLocation = await this.createBundle(config, processedData)
    
    // 4. 비디오 렌더링
    await this.renderVideo(bundleLocation, config, options)
  }
  
  private async renderVideo(
    bundleLocation: string,
    config: BarChartRaceConfig,
    options: CLIOptions
  ): Promise<void> {
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'bar-chart-race',
      inputProps: { config, processedData }
    })
    
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: config.output.format === 'mp4' ? 'h264' : 'vp8',
      outputLocation: options.output || config.output.filename,
      inputProps: { config, processedData },
      parallelism: options.parallel,
      onProgress: (progress) => {
        if (options.verbose) {
          console.log(`Rendering: ${(progress.progress * 100).toFixed(1)}%`)
        }
      }
    })
  }
}
```

## 7. 에러 처리 및 검증

### 7.1 Config 검증

```typescript
class ConfigValidator {
  validate(config: unknown): BarChartRaceConfig {
    // 필수 필드 확인
    // 타입 검증
    // 범위 검증 (fps: 1-60, duration > 0 등)
    // 파일 경로 존재 확인
  }
}
```

### 7.2 데이터 검증

```typescript
class DataValidator {
  validate(data: RawData, config: BarChartRaceConfig): void {
    // 날짜 컬럼 존재 확인
    // 값 컬럼 존재 확인
    // 날짜 형식 일치 확인
    // 숫자 값 유효성 확인
    // 최소 데이터 포인트 확인
  }
}
```

## 8. 예제 사용법

### 8.1 기본 Config 예제

```json
{
  "output": {
    "filename": "output.mp4",
    "format": "mp4",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "duration": 60,
    "quality": "high"
  },
  "data": {
    "csvPath": "./data.csv",
    "dateColumn": "Date",
    "dateFormat": "YYYY-MM",
    "valueColumns": ["YouTube", "Netflix", "Disney+"],
    "interpolation": "smooth"
  },
  "layers": {
    "background": {
      "color": "#1a1a1a",
      "opacity": 100
    },
    "chart": {
      "position": {
        "top": 150,
        "right": 50,
        "bottom": 100,
        "left": 50
      },
      "chart": {
        "visibleItemCount": 10,
        "maxValue": "local",
        "itemSpacing": 20
      },
      "animation": {
        "type": "continuous",
        "overtakeDuration": 0.5
      },
      "bar": {
        "colors": "auto",
        "cornerRadius": 10,
        "opacity": 100
      },
      "labels": {
        "title": {
          "show": true,
          "fontSize": 24,
          "fontFamily": "Arial",
          "color": "#ffffff",
          "position": "outside"
        },
        "value": {
          "show": true,
          "fontSize": 20,
          "fontFamily": "Arial",
          "color": "#ffffff",
          "format": "{value:,.0f}",
          "suffix": " subscribers"
        }
      }
    },
    "title": {
      "text": "Top Streaming Platforms 2020-2024",
      "position": {
        "top": 50,
        "align": "center"
      },
      "style": {
        "fontSize": 48,
        "fontFamily": "Arial",
        "color": "#ffffff",
        "opacity": 100
      },
      "timeline": {
        "startTime": 0,
        "duration": 60
      }
    },
    "date": {
      "position": {
        "bottom": 50,
        "right": 50
      },
      "format": {
        "pattern": "MMMM YYYY",
        "locale": "en-US"
      },
      "style": {
        "fontSize": 36,
        "fontFamily": "Arial",
        "color": "#ffffff",
        "opacity": 80
      },
      "animation": {
        "type": "continuous",
        "duration": 0.3
      }
    }
  }
}
```

### 8.2 실행 예제

```bash
# 기본 실행
barchart-race render --config config.json --data data.csv

# 상세 로그와 함께 실행
barchart-race render --config config.json --data data.csv --verbose

# 높은 품질로 렌더링
barchart-race render --config config.json --data data.csv --quality max --parallel 8
``ㅓㅏ
