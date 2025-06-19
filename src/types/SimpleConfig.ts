// Simplified Bar Chart Race Configuration - Maximum 10 Essential Options
// This interface reduces complexity while maintaining full functionality through smart defaults

export interface SimpleBarChartRaceConfig {
  // 1. Data source (most critical)
  dataFile: string
  
  // 2. Chart title (essential for context)
  title: string
  
  // 3. Data columns to visualize (core functionality)
  columns: string[]
  
  // 4. Date column for time series (required for racing)
  dateColumn?: string  // Smart default: 'Date'
  
  // 5. Output filename (users need to control where it saves)
  outputFile?: string  // Smart default: auto-generated from title
  
  // 6. Video duration in seconds (affects pacing)
  duration?: number    // Smart default: 60 seconds
  
  // 7. Visual theme/style (major visual impact)
  theme?: 'default' | 'dark' | 'light' | 'corporate' | 'sports' | 'social' | 'gaming' | 'minimal'
  
  // 8. Number of bars to show (affects readability)
  topN?: number       // Smart default: 10
  
  // 9. Animation speed (affects user experience)  
  speed?: 'slow' | 'normal' | 'fast'  // Smart default: 'normal'
  
  // 10. Video quality (affects file size vs quality tradeoff)
  quality?: 'draft' | 'good' | 'high' | 'max'  // Smart default: 'good'
}

// Extended interface for users who need more control
// This preserves backward compatibility with existing complex configs
export interface AdvancedBarChartRaceConfig extends SimpleBarChartRaceConfig {
  // All the detailed options from the original BarChartRaceConfig
  advanced?: {
    output?: {
      format?: 'mp4' | 'webm'
      width?: number
      height?: number
      fps?: number
    }
    data?: {
      dateFormat?: string
      interpolation?: 'linear' | 'smooth' | 'step'
    }
    styling?: {
      backgroundColor?: string
      barColors?: string[] | 'auto'
      cornerRadius?: number
      fontFamily?: string
    }
    layout?: {
      margins?: { top: number, right: number, bottom: number, left: number }
      itemSpacing?: number
      showRanks?: boolean
      showValues?: boolean
      valueFormat?: string
    }
    animation?: {
      type?: 'continuous' | 'discrete'
      overtakeDuration?: number
      effects?: boolean
    }
    layers?: {
      showTitle?: boolean
      showDate?: boolean
      dateFormat?: string
      customText?: string
    }
  }
}

// Smart defaults mapping
export const SMART_DEFAULTS = {
  dateColumn: 'Date',
  duration: 60,
  theme: 'default' as const,
  topN: 10,
  speed: 'normal' as const,
  quality: 'good' as const,
  
  // Theme configurations
  themes: {
    default: {
      backgroundColor: '#1a1a1a',
      barColors: 'auto' as const,
      textColor: '#ffffff',
      style: 'balanced'
    },
    dark: {
      backgroundColor: '#0a0a0a',
      barColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
      textColor: '#ffffff',
      style: 'modern'
    },
    light: {
      backgroundColor: '#f8f9fa',
      barColors: ['#495057', '#6c757d', '#adb5bd', '#ced4da', '#dee2e6'],
      textColor: '#212529',
      style: 'clean'
    },
    corporate: {
      backgroundColor: '#1A202C',
      barColors: ['#4299E1', '#48BB78', '#ED8936', '#9F7AEA', '#F56565'],
      textColor: '#F7FAFC',
      style: 'professional'
    },
    sports: {
      backgroundColor: '#0F1419',
      barColors: ['#FFD700', '#1E3A8A', '#059669', '#DC2626', '#7C3AED'],
      textColor: '#FFFFFF',
      style: 'energetic'
    },
    social: {
      backgroundColor: '#0f0f23',
      barColors: ['#E1306C', '#FF0050', '#FF0000', '#1DA1F2', '#25D366'],
      textColor: '#ffffff',
      style: 'vibrant'
    },
    gaming: {
      backgroundColor: '#0a0a0a',
      barColors: ['#9146FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
      textColor: '#00ff88',
      style: 'neon'
    },
    minimal: {
      backgroundColor: '#f8f9fa',
      barColors: ['#495057', '#6c757d', '#adb5bd', '#ced4da', '#dee2e6'],
      textColor: '#212529',
      style: 'simple'
    }
  },
  
  // Speed configurations
  speeds: {
    slow: { fps: 24, overtakeDuration: 1.2, interpolation: 'smooth' as const },
    normal: { fps: 30, overtakeDuration: 0.6, interpolation: 'smooth' as const },
    fast: { fps: 60, overtakeDuration: 0.3, interpolation: 'linear' as const }
  },
  
  // Quality configurations  
  qualities: {
    draft: { width: 1280, height: 720, fps: 24, quality: 'medium' as const },
    good: { width: 1920, height: 1080, fps: 30, quality: 'high' as const },
    high: { width: 1920, height: 1080, fps: 60, quality: 'high' as const },
    max: { width: 3840, height: 2160, fps: 60, quality: 'max' as const }
  }
}

// Type for internal use - represents the fully resolved configuration
export interface ResolvedBarChartRaceConfig {
  // Simple config expanded with all smart defaults applied
  simple: Required<SimpleBarChartRaceConfig>
  // Advanced overrides if provided
  advanced?: AdvancedBarChartRaceConfig['advanced']
  // Computed values
  computed: {
    outputFileName: string
    themeConfig: typeof SMART_DEFAULTS.themes.default
    speedConfig: typeof SMART_DEFAULTS.speeds.normal
    qualityConfig: typeof SMART_DEFAULTS.qualities.good
  }
}