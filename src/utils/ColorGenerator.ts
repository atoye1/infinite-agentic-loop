/**
 * Utility class for generating colors automatically for bar chart race
 */
export class ColorGenerator {
  
  // Predefined color palettes for different themes
  private static readonly COLOR_PALETTES: Record<string, string[]> = {
    // Professional/Business colors
    professional: [
      '#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#0077BE',
      '#6A994E', '#A663CC', '#F25C54', '#4F772D', '#F72585'
    ],
    
    // Vibrant colors for social media
    vibrant: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ],
    
    // Gaming/Tech colors
    gaming: [
      '#9146FF', '#FF6B35', '#00D9FF', '#32CD32', '#FF1493',
      '#00CED1', '#FFD700', '#FF4500', '#7B68EE', '#00FF7F'
    ],
    
    // Pastel colors for minimal/clean designs
    pastel: [
      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
      '#E6E6FA', '#F0E68C', '#DDA0DD', '#98FB98', '#87CEEB'
    ],
    
    // High contrast colors for accessibility
    accessible: [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ],
    
    // Monochromatic variations
    monochrome: [
      '#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7',
      '#ecf0f1', '#3498db', '#2980b9', '#e74c3c', '#c0392b'
    ]
  }

  /**
   * Generate colors automatically based on the number of items needed
   * @param count Number of colors needed
   * @param palette Color palette theme to use
   * @returns Array of hex color strings
   */
  static generateColors(count: number, palette: string = 'professional'): string[] {
    if (count <= 0) return []
    
    const paletteColors = this.COLOR_PALETTES[palette] || this.COLOR_PALETTES.professional
    
    if (count <= paletteColors.length) {
      // Return exact colors from palette
      return paletteColors.slice(0, count)
    }
    
    // Generate additional colors if more are needed
    const colors: string[] = [...paletteColors]
    const baseColors = paletteColors.length
    
    for (let i = baseColors; i < count; i++) {
      // Generate variations of existing colors
      const baseColorIndex = i % baseColors
      const baseColor = paletteColors[baseColorIndex]
      const variation = this.generateColorVariation(baseColor, i - baseColors + 1)
      colors.push(variation)
    }
    
    return colors
  }

  /**
   * Generate a variation of a base color
   * @param baseColor Hex color string
   * @param variation Variation number
   * @returns Modified hex color string
   */
  private static generateColorVariation(baseColor: string, variation: number): string {
    const rgb = this.hexToRgb(baseColor)
    if (!rgb) return baseColor
    
    // Apply different transformations based on variation number
    const factor = 0.3 * (variation % 3 + 1) // 0.3, 0.6, 0.9
    
    let newRgb: { r: number; g: number; b: number }
    
    switch (variation % 4) {
      case 0: // Lighten
        newRgb = {
          r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
          g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
          b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor))
        }
        break
      case 1: // Darken
        newRgb = {
          r: Math.max(0, Math.round(rgb.r * (1 - factor))),
          g: Math.max(0, Math.round(rgb.g * (1 - factor))),
          b: Math.max(0, Math.round(rgb.b * (1 - factor)))
        }
        break
      case 2: // Adjust hue
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b)
        hsl.h = (hsl.h + factor * 60) % 360 // Shift hue by up to 180 degrees
        newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l)
        break
      case 3: // Adjust saturation
        const hsl2 = this.rgbToHsl(rgb.r, rgb.g, rgb.b)
        hsl2.s = Math.min(1, hsl2.s + factor * 0.3) // Increase saturation
        newRgb = this.hslToRgb(hsl2.h, hsl2.s, hsl2.l)
        break
      default:
        newRgb = rgb
    }
    
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b)
  }

  /**
   * Generate a color sequence with good contrast between adjacent colors
   * @param count Number of colors needed
   * @param palette Base palette to use
   * @returns Array of hex color strings with good contrast
   */
  static generateContrastingColors(count: number, palette: string = 'accessible'): string[] {
    if (count <= 0) return []
    
    const paletteColors = this.COLOR_PALETTES[palette] || this.COLOR_PALETTES.accessible
    
    if (count <= paletteColors.length) {
      // Reorder colors to maximize contrast between adjacent ones
      return this.reorderForContrast(paletteColors.slice(0, count))
    }
    
    // Generate more colors and ensure contrast
    const allColors = this.generateColors(count, palette)
    return this.reorderForContrast(allColors)
  }

  /**
   * Reorder colors to maximize contrast between adjacent colors
   * @param colors Array of hex color strings
   * @returns Reordered array
   */
  private static reorderForContrast(colors: string[]): string[] {
    if (colors.length <= 2) return colors
    
    const result: string[] = [colors[0]]
    const remaining = colors.slice(1)
    
    while (remaining.length > 0) {
      const lastColor = result[result.length - 1]
      
      // Find the color with maximum contrast to the last added color
      let maxContrast = 0
      let bestIndex = 0
      
      remaining.forEach((color, index) => {
        const contrast = this.calculateColorContrast(lastColor, color)
        if (contrast > maxContrast) {
          maxContrast = contrast
          bestIndex = index
        }
      })
      
      result.push(remaining[bestIndex])
      remaining.splice(bestIndex, 1)
    }
    
    return result
  }

  /**
   * Calculate contrast ratio between two colors
   * @param color1 First hex color
   * @param color2 Second hex color
   * @returns Contrast ratio
   */
  private static calculateColorContrast(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) return 0
    
    const l1 = this.getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
    const l2 = this.getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)
    
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Get relative luminance of a color
   * @param r Red component (0-255)
   * @param g Green component (0-255)
   * @param b Blue component (0-255)
   * @returns Relative luminance (0-1)
   */
  private static getRelativeLuminance(r: number, g: number, b: number): number {
    const rsRGB = r / 255
    const gsRGB = g / 255
    const bsRGB = b / 255
    
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
  }

  /**
   * Convert hex color to RGB
   * @param hex Hex color string
   * @returns RGB object or null if invalid
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  /**
   * Convert RGB to hex
   * @param r Red component (0-255)
   * @param g Green component (0-255)
   * @param b Blue component (0-255)
   * @returns Hex color string
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
  }

  /**
   * Convert RGB to HSL
   * @param r Red component (0-255)
   * @param g Green component (0-255)
   * @param b Blue component (0-255)
   * @returns HSL object
   */
  private static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    
    return { h: h * 360, s, l }
  }

  /**
   * Convert HSL to RGB
   * @param h Hue (0-360)
   * @param s Saturation (0-1)
   * @param l Lightness (0-1)
   * @returns RGB object
   */
  private static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360
    
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    let r, g, b
    
    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }

  /**
   * Get available color palette names
   * @returns Array of palette names
   */
  static getAvailablePalettes(): string[] {
    return Object.keys(this.COLOR_PALETTES)
  }

  /**
   * Get colors from a specific palette
   * @param paletteName Name of the palette
   * @returns Array of hex color strings
   */
  static getPaletteColors(paletteName: string): string[] {
    return this.COLOR_PALETTES[paletteName] || this.COLOR_PALETTES.professional
  }

  /**
   * Validate if colors provide sufficient contrast for readability
   * @param backgroundColor Background color
   * @param textColor Text color
   * @returns true if contrast is sufficient for readability
   */
  static hasGoodContrast(backgroundColor: string, textColor: string): boolean {
    const contrast = this.calculateColorContrast(backgroundColor, textColor)
    return contrast >= 4.5 // WCAG AA standard
  }

  /**
   * Suggest a text color (black or white) based on background color
   * @param backgroundColor Background color hex string
   * @returns '#000000' or '#ffffff'
   */
  static suggestTextColor(backgroundColor: string): string {
    const rgb = this.hexToRgb(backgroundColor)
    if (!rgb) return '#000000'
    
    const luminance = this.getRelativeLuminance(rgb.r, rgb.g, rgb.b)
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }
}