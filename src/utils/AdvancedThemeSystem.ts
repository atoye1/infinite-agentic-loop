import { BarChartRaceConfig } from '../types/config'

export interface BrandProfile {
  name: string
  primaryColor: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  logoUrl?: string
  fontFamily?: string
  brandPersonality: 'professional' | 'creative' | 'tech' | 'friendly' | 'luxury' | 'energetic'
  colorPalette: string[]
  gradients?: {
    primary: string[]
    secondary: string[]
  }
}

export interface ThemeDefinition {
  id: string
  name: string
  description: string
  colors: {
    primary: string[]
    secondary: string[]
    background: string
    text: string
    accent: string
  }
  typography: {
    primaryFont: string
    secondaryFont: string
    titleSize: number
    bodySize: number
    weights: {
      light: number
      regular: number
      bold: number
    }
  }
  spacing: {
    small: number
    medium: number
    large: number
    extraLarge: number
  }
  animations: {
    duration: number
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
    stagger: number
  }
  visual: {
    cornerRadius: number
    opacity: number
    shadows: boolean
    gradients: boolean
  }
}

export interface ColorAnalysis {
  dominant: string
  complementary: string[]
  analogous: string[]
  triadic: string[]
  contrast: number
  saturation: number
  brightness: number
  temperature: 'warm' | 'cool' | 'neutral'
}

export class AdvancedThemeSystem {
  
  private static predefinedThemes: Record<string, ThemeDefinition> = {
    'corporate-blue': {
      id: 'corporate-blue',
      name: 'Corporate Blue',
      description: 'Professional theme with blue color scheme',
      colors: {
        primary: ['#1f4e79', '#2e6da4', '#428bca', '#5bc0de', '#7dd3c0'],
        secondary: ['#34495e', '#95a5a6', '#bdc3c7', '#ecf0f1'],
        background: '#ffffff',
        text: '#2c3e50',
        accent: '#3498db'
      },
      typography: {
        primaryFont: 'Arial',
        secondaryFont: 'Arial',
        titleSize: 48,
        bodySize: 20,
        weights: { light: 300, regular: 400, bold: 700 }
      },
      spacing: {
        small: 10,
        medium: 20,
        large: 40,
        extraLarge: 80
      },
      animations: {
        duration: 0.8,
        easing: 'ease-in-out',
        stagger: 0.1
      },
      visual: {
        cornerRadius: 6,
        opacity: 100,
        shadows: true,
        gradients: false
      }
    },
    'vibrant-tech': {
      id: 'vibrant-tech',
      name: 'Vibrant Tech',
      description: 'Modern tech theme with vibrant colors',
      colors: {
        primary: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
        secondary: ['#74b9ff', '#0984e3', '#6c5ce7', '#a29bfe'],
        background: '#2d3436',
        text: '#ffffff',
        accent: '#00cec9'
      },
      typography: {
        primaryFont: 'Roboto',
        secondaryFont: 'Roboto',
        titleSize: 52,
        bodySize: 22,
        weights: { light: 300, regular: 400, bold: 700 }
      },
      spacing: {
        small: 12,
        medium: 24,
        large: 48,
        extraLarge: 96
      },
      animations: {
        duration: 0.5,
        easing: 'ease-out',
        stagger: 0.08
      },
      visual: {
        cornerRadius: 12,
        opacity: 95,
        shadows: true,
        gradients: true
      }
    },
    'minimal-mono': {
      id: 'minimal-mono',
      name: 'Minimal Monochrome',
      description: 'Clean minimal theme with monochrome palette',
      colors: {
        primary: ['#212529', '#495057', '#6c757d', '#adb5bd', '#ced4da'],
        secondary: ['#e9ecef', '#f8f9fa', '#ffffff'],
        background: '#ffffff',
        text: '#212529',
        accent: '#6c757d'
      },
      typography: {
        primaryFont: 'Helvetica Neue',
        secondaryFont: 'Helvetica Neue',
        titleSize: 44,
        bodySize: 18,
        weights: { light: 200, regular: 300, bold: 600 }
      },
      spacing: {
        small: 8,
        medium: 16,
        large: 32,
        extraLarge: 64
      },
      animations: {
        duration: 1.0,
        easing: 'ease',
        stagger: 0.15
      },
      visual: {
        cornerRadius: 0,
        opacity: 100,
        shadows: false,
        gradients: false
      }
    },
    'warm-earth': {
      id: 'warm-earth',
      name: 'Warm Earth',
      description: 'Warm earth tones for organic, natural feel',
      colors: {
        primary: ['#8b4513', '#cd853f', '#daa520', '#f4a460', '#ffd700'],
        secondary: ['#654321', '#8b7355', '#a0522d', '#bc8f8f'],
        background: '#faf0e6',
        text: '#3e2723',
        accent: '#ff8c00'
      },
      typography: {
        primaryFont: 'Georgia',
        secondaryFont: 'Georgia',
        titleSize: 46,
        bodySize: 19,
        weights: { light: 300, regular: 400, bold: 700 }
      },
      spacing: {
        small: 10,
        medium: 20,
        large: 40,
        extraLarge: 80
      },
      animations: {
        duration: 0.9,
        easing: 'ease-in-out',
        stagger: 0.12
      },
      visual: {
        cornerRadius: 8,
        opacity: 95,
        shadows: true,
        gradients: true
      }
    },
    'neon-cyber': {
      id: 'neon-cyber',
      name: 'Neon Cyber',
      description: 'Futuristic cyberpunk theme with neon colors',
      colors: {
        primary: ['#00ff88', '#00ccff', '#ff0088', '#ffaa00', '#aa00ff'],
        secondary: ['#0066cc', '#cc0066', '#66cc00', '#cc6600'],
        background: '#0a0a0a',
        text: '#00ff88',
        accent: '#ff006e'
      },
      typography: {
        primaryFont: 'Orbitron',
        secondaryFont: 'Share Tech Mono',
        titleSize: 54,
        bodySize: 22,
        weights: { light: 300, regular: 400, bold: 900 }
      },
      spacing: {
        small: 14,
        medium: 28,
        large: 56,
        extraLarge: 112
      },
      animations: {
        duration: 0.3,
        easing: 'ease-out',
        stagger: 0.05
      },
      visual: {
        cornerRadius: 16,
        opacity: 90,
        shadows: true,
        gradients: true
      }
    }
  }

  /**
   * Extract brand colors from logo or brand guidelines
   */
  static extractBrandColors(imageUrl: string): Promise<string[]> {
    // In a real implementation, this would use image processing libraries
    // to extract dominant colors from brand assets
    return Promise.resolve([
      '#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9aa0a6'
    ])
  }

  /**
   * Generate color palette from a primary brand color
   */
  static generateColorPalette(primaryColor: string, count: number = 8): string[] {
    const palette: string[] = [primaryColor]
    
    // Convert hex to HSL for color manipulation
    const hsl = this.hexToHsl(primaryColor)
    
    // Generate analogous colors
    for (let i = 1; i < count; i++) {
      const hueShift = (i * 30) % 360
      const newHue = (hsl.h + hueShift) % 360
      const newColor = this.hslToHex({
        h: newHue,
        s: Math.max(0.3, hsl.s - i * 0.1),
        l: Math.max(0.2, Math.min(0.8, hsl.l + (i % 2 === 0 ? 0.1 : -0.1)))
      })
      palette.push(newColor)
    }
    
    return palette
  }

  /**
   * Create theme from brand profile
   */
  static createThemeFromBrand(brand: BrandProfile): ThemeDefinition {
    const baseTheme = this.selectBaseThemeForBrand(brand)
    
    return {
      id: `brand-${brand.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${brand.name} Theme`,
      description: `Custom theme for ${brand.name}`,
      colors: {
        primary: brand.colorPalette.length >= 5 ? 
          brand.colorPalette.slice(0, 5) : 
          this.generateColorPalette(brand.primaryColor, 5),
        secondary: this.generateSecondaryColors(brand.primaryColor),
        background: brand.backgroundColor || this.generateBackgroundColor(brand.primaryColor),
        text: brand.textColor || this.generateTextColor(brand.backgroundColor || '#ffffff'),
        accent: brand.accentColor || brand.secondaryColor || brand.primaryColor
      },
      typography: {
        primaryFont: brand.fontFamily || baseTheme.typography.primaryFont,
        secondaryFont: brand.fontFamily || baseTheme.typography.secondaryFont,
        titleSize: this.adjustFontSizeForPersonality(baseTheme.typography.titleSize, brand.brandPersonality),
        bodySize: this.adjustFontSizeForPersonality(baseTheme.typography.bodySize, brand.brandPersonality),
        weights: baseTheme.typography.weights
      },
      spacing: this.adjustSpacingForPersonality(baseTheme.spacing, brand.brandPersonality),
      animations: this.adjustAnimationsForPersonality(baseTheme.animations, brand.brandPersonality),
      visual: this.adjustVisualForPersonality(baseTheme.visual, brand.brandPersonality)
    }
  }

  /**
   * Apply theme to configuration
   */
  static applyTheme(config: BarChartRaceConfig, theme: ThemeDefinition): BarChartRaceConfig {
    const themedConfig = { ...config }

    // Apply colors
    themedConfig.layers.background.color = theme.colors.background
    themedConfig.layers.chart.bar.colors = theme.colors.primary
    themedConfig.layers.chart.bar.cornerRadius = theme.visual.cornerRadius
    themedConfig.layers.chart.bar.opacity = theme.visual.opacity

    // Apply typography
    themedConfig.layers.chart.labels.title.fontFamily = theme.typography.primaryFont
    themedConfig.layers.chart.labels.title.fontSize = theme.typography.bodySize + 4
    themedConfig.layers.chart.labels.title.color = theme.colors.text

    themedConfig.layers.chart.labels.value.fontFamily = theme.typography.secondaryFont
    themedConfig.layers.chart.labels.value.fontSize = theme.typography.bodySize
    themedConfig.layers.chart.labels.value.color = theme.colors.text

    themedConfig.layers.chart.labels.rank.fontSize = theme.typography.bodySize - 2
    themedConfig.layers.chart.labels.rank.backgroundColor = theme.colors.accent
    themedConfig.layers.chart.labels.rank.textColor = this.getContrastColor(theme.colors.accent)

    // Apply title styling if present
    if (themedConfig.layers.title) {
      themedConfig.layers.title.style.fontFamily = theme.typography.primaryFont
      themedConfig.layers.title.style.fontSize = theme.typography.titleSize
      themedConfig.layers.title.style.color = theme.colors.accent
    }

    // Apply date styling if present
    if (themedConfig.layers.date) {
      themedConfig.layers.date.style.fontFamily = theme.typography.secondaryFont
      themedConfig.layers.date.style.fontSize = theme.typography.bodySize + 8
      themedConfig.layers.date.style.color = theme.colors.text
      themedConfig.layers.date.animation.duration = theme.animations.duration
    }

    // Apply spacing
    themedConfig.layers.chart.chart.itemSpacing = theme.spacing.medium
    themedConfig.layers.chart.position.top = theme.spacing.extraLarge * 2
    themedConfig.layers.chart.position.bottom = theme.spacing.extraLarge
    themedConfig.layers.chart.position.left = theme.spacing.large
    themedConfig.layers.chart.position.right = theme.spacing.large

    // Apply animations
    themedConfig.layers.chart.animation.overtakeDuration = theme.animations.duration

    return themedConfig
  }

  /**
   * Analyze color characteristics
   */
  static analyzeColor(color: string): ColorAnalysis {
    const hsl = this.hexToHsl(color)
    
    return {
      dominant: color,
      complementary: [this.hslToHex({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l })],
      analogous: [
        this.hslToHex({ h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l }),
        this.hslToHex({ h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l })
      ],
      triadic: [
        this.hslToHex({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l }),
        this.hslToHex({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l })
      ],
      contrast: this.calculateContrast(color, '#ffffff'),
      saturation: hsl.s,
      brightness: hsl.l,
      temperature: this.determineColorTemperature(hsl.h)
    }
  }

  /**
   * Generate theme variations
   */
  static generateThemeVariations(baseTheme: ThemeDefinition, count: number = 5): ThemeDefinition[] {
    const variations: ThemeDefinition[] = [baseTheme]
    
    for (let i = 1; i < count; i++) {
      const variation = { ...baseTheme }
      variation.id = `${baseTheme.id}-variant-${i}`
      variation.name = `${baseTheme.name} Variant ${i}`
      
      // Vary colors
      variation.colors = { ...baseTheme.colors }
      variation.colors.primary = this.rotateColorPalette(baseTheme.colors.primary, i * 60)
      variation.colors.accent = this.adjustColorBrightness(baseTheme.colors.accent, i * 0.1)
      
      // Vary visual properties
      variation.visual = { ...baseTheme.visual }
      variation.visual.cornerRadius = Math.max(0, baseTheme.visual.cornerRadius + (i - 2) * 4)
      variation.visual.opacity = Math.max(80, Math.min(100, baseTheme.visual.opacity + (i - 2) * 5))
      
      variations.push(variation)
    }
    
    return variations
  }

  /**
   * Optimize theme for accessibility
   */
  static optimizeThemeForAccessibility(theme: ThemeDefinition): ThemeDefinition {
    const optimizedTheme = { ...theme }
    
    // Ensure sufficient contrast ratios
    optimizedTheme.colors.text = this.ensureContrast(theme.colors.text, theme.colors.background, 4.5)
    optimizedTheme.colors.accent = this.ensureContrast(theme.colors.accent, theme.colors.background, 3.0)
    
    // Increase font sizes for better readability
    optimizedTheme.typography.titleSize = Math.max(theme.typography.titleSize, 48)
    optimizedTheme.typography.bodySize = Math.max(theme.typography.bodySize, 18)
    
    // Slow down animations for better comprehension
    optimizedTheme.animations.duration = Math.max(theme.animations.duration, 0.8)
    
    // Ensure sufficient spacing
    optimizedTheme.spacing.medium = Math.max(theme.spacing.medium, 20)
    optimizedTheme.spacing.large = Math.max(theme.spacing.large, 40)
    
    return optimizedTheme
  }

  // Private helper methods

  private static selectBaseThemeForBrand(brand: BrandProfile): ThemeDefinition {
    const personalityMap: Record<string, string> = {
      'professional': 'corporate-blue',
      'creative': 'vibrant-tech',
      'tech': 'vibrant-tech',
      'friendly': 'warm-earth',
      'luxury': 'minimal-mono',
      'energetic': 'neon-cyber'
    }
    
    const themeId = personalityMap[brand.brandPersonality] || 'corporate-blue'
    return this.predefinedThemes[themeId]
  }

  private static generateSecondaryColors(primaryColor: string): string[] {
    const hsl = this.hexToHsl(primaryColor)
    return [
      this.hslToHex({ h: hsl.h, s: hsl.s * 0.7, l: hsl.l * 1.2 }),
      this.hslToHex({ h: hsl.h, s: hsl.s * 0.5, l: hsl.l * 1.4 }),
      this.hslToHex({ h: hsl.h, s: hsl.s * 0.3, l: hsl.l * 1.6 }),
      this.hslToHex({ h: hsl.h, s: hsl.s * 0.1, l: hsl.l * 1.8 })
    ]
  }

  private static generateBackgroundColor(primaryColor: string): string {
    const hsl = this.hexToHsl(primaryColor)
    
    // Generate a very light version of the primary color
    return this.hslToHex({
      h: hsl.h,
      s: Math.min(0.1, hsl.s * 0.2),
      l: Math.max(0.95, hsl.l * 2)
    })
  }

  private static generateTextColor(backgroundColor: string): string {
    const hsl = this.hexToHsl(backgroundColor)
    return hsl.l > 0.5 ? '#333333' : '#ffffff'
  }

  private static adjustFontSizeForPersonality(baseSize: number, personality: string): number {
    const adjustments: Record<string, number> = {
      'professional': 0,
      'creative': 4,
      'tech': 2,
      'friendly': -2,
      'luxury': 6,
      'energetic': 8
    }
    
    return baseSize + (adjustments[personality] || 0)
  }

  private static adjustSpacingForPersonality(baseSpacing: any, personality: string): any {
    const multipliers: Record<string, number> = {
      'professional': 1.0,
      'creative': 1.2,
      'tech': 1.1,
      'friendly': 0.9,
      'luxury': 1.5,
      'energetic': 0.8
    }
    
    const multiplier = multipliers[personality] || 1.0
    
    return {
      small: Math.round(baseSpacing.small * multiplier),
      medium: Math.round(baseSpacing.medium * multiplier),
      large: Math.round(baseSpacing.large * multiplier),
      extraLarge: Math.round(baseSpacing.extraLarge * multiplier)
    }
  }

  private static adjustAnimationsForPersonality(baseAnimations: any, personality: string): any {
    const adjustments: Record<string, { duration: number, easing: string, stagger: number }> = {
      'professional': { duration: 1.0, easing: 'ease-in-out', stagger: 1.0 },
      'creative': { duration: 0.7, easing: 'ease-out', stagger: 0.8 },
      'tech': { duration: 0.5, easing: 'ease-out', stagger: 0.6 },
      'friendly': { duration: 0.8, easing: 'ease', stagger: 1.2 },
      'luxury': { duration: 1.2, easing: 'ease-in-out', stagger: 1.5 },
      'energetic': { duration: 0.3, easing: 'ease-out', stagger: 0.4 }
    }
    
    const adjustment = adjustments[personality] || adjustments['professional']
    
    return {
      duration: baseAnimations.duration * adjustment.duration,
      easing: adjustment.easing as any,
      stagger: baseAnimations.stagger * adjustment.stagger
    }
  }

  private static adjustVisualForPersonality(baseVisual: any, personality: string): any {
    const adjustments: Record<string, any> = {
      'professional': { cornerRadius: 0.8, opacity: 1.0, shadows: true, gradients: false },
      'creative': { cornerRadius: 1.5, opacity: 0.95, shadows: true, gradients: true },
      'tech': { cornerRadius: 1.2, opacity: 0.95, shadows: true, gradients: true },
      'friendly': { cornerRadius: 1.3, opacity: 1.0, shadows: true, gradients: false },
      'luxury': { cornerRadius: 0.5, opacity: 1.0, shadows: true, gradients: false },
      'energetic': { cornerRadius: 2.0, opacity: 0.9, shadows: true, gradients: true }
    }
    
    const adjustment = adjustments[personality] || adjustments['professional']
    
    return {
      cornerRadius: Math.round(baseVisual.cornerRadius * adjustment.cornerRadius),
      opacity: Math.round(baseVisual.opacity * adjustment.opacity),
      shadows: adjustment.shadows,
      gradients: adjustment.gradients
    }
  }

  // Color utility methods

  private static hexToHsl(hex: string): { h: number, s: number, l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min
    const add = max + min
    const l = add * 0.5
    
    let s = 0
    let h = 0
    
    if (diff !== 0) {
      s = l < 0.5 ? diff / add : diff / (2 - add)
      
      switch (max) {
        case r:
          h = ((g - b) / diff) + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / diff + 2
          break
        case b:
          h = (r - g) / diff + 4
          break
      }
      h /= 6
    }
    
    return { h: h * 360, s, l }
  }

  private static hslToHex(hsl: { h: number, s: number, l: number }): string {
    const h = hsl.h / 360
    const s = hsl.s
    const l = hsl.l
    
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    let r: number, g: number, b: number
    
    if (s === 0) {
      r = g = b = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    
    const toHex = (c: number): string => {
      const hex = Math.round(c * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  private static calculateContrast(color1: string, color2: string): number {
    const getLuminance = (hex: string): number => {
      const rgb = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      ].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
    }
    
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  private static determineColorTemperature(hue: number): 'warm' | 'cool' | 'neutral' {
    if (hue >= 45 && hue <= 135) return 'cool'
    if (hue >= 225 && hue <= 315) return 'warm'
    return 'neutral'
  }

  private static rotateColorPalette(palette: string[], degrees: number): string[] {
    return palette.map(color => {
      const hsl = this.hexToHsl(color)
      return this.hslToHex({
        h: (hsl.h + degrees) % 360,
        s: hsl.s,
        l: hsl.l
      })
    })
  }

  private static adjustColorBrightness(color: string, adjustment: number): string {
    const hsl = this.hexToHsl(color)
    return this.hslToHex({
      h: hsl.h,
      s: hsl.s,
      l: Math.max(0, Math.min(1, hsl.l + adjustment))
    })
  }

  private static getContrastColor(backgroundColor: string): string {
    const hsl = this.hexToHsl(backgroundColor)
    return hsl.l > 0.5 ? '#000000' : '#ffffff'
  }

  private static ensureContrast(textColor: string, backgroundColor: string, minRatio: number): string {
    let currentContrast = this.calculateContrast(textColor, backgroundColor)
    
    if (currentContrast >= minRatio) {
      return textColor
    }
    
    const hsl = this.hexToHsl(textColor)
    const backgroundHsl = this.hexToHsl(backgroundColor)
    
    // If background is light, make text darker
    if (backgroundHsl.l > 0.5) {
      for (let l = hsl.l; l >= 0; l -= 0.1) {
        const testColor = this.hslToHex({ h: hsl.h, s: hsl.s, l })
        if (this.calculateContrast(testColor, backgroundColor) >= minRatio) {
          return testColor
        }
      }
      return '#000000'
    } else {
      // If background is dark, make text lighter
      for (let l = hsl.l; l <= 1; l += 0.1) {
        const testColor = this.hslToHex({ h: hsl.h, s: hsl.s, l })
        if (this.calculateContrast(testColor, backgroundColor) >= minRatio) {
          return testColor
        }
      }
      return '#ffffff'
    }
  }

  /**
   * Get all predefined themes
   */
  static getAllThemes(): Record<string, ThemeDefinition> {
    return this.predefinedThemes
  }

  /**
   * Get theme by ID
   */
  static getTheme(themeId: string): ThemeDefinition | null {
    return this.predefinedThemes[themeId] || null
  }

  /**
   * Add custom theme
   */
  static addCustomTheme(theme: ThemeDefinition): void {
    this.predefinedThemes[theme.id] = theme
  }
}