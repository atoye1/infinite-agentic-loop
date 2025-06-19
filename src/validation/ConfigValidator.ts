import { existsSync } from 'fs'
import { resolve } from 'path'
import {
  BarChartRaceConfig,
  BackgroundLayerConfig,
  ChartLayerConfig,
  TitleLayerConfig,
  TextLayerConfig,
  DateLayerConfig,
  ValidationError,
  ValidationResult
} from '../types/config'

export class ConfigValidator {
  validate(config: unknown): ValidationResult {
    const errors: ValidationError[] = []

    if (!config || typeof config !== 'object') {
      return {
        isValid: false,
        errors: [{ field: 'root', message: 'Config must be a valid object' }]
      }
    }

    const typedConfig = config as BarChartRaceConfig

    // Validate output section
    this.validateOutput(typedConfig.output, errors)

    // Validate data section
    this.validateData(typedConfig.data, errors)

    // Validate layers section
    this.validateLayers(typedConfig.layers, errors)

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private validateOutput(output: BarChartRaceConfig['output'] | undefined, errors: ValidationError[]): void {
    if (!output || typeof output !== 'object') {
      errors.push({ field: 'output', message: 'Output configuration is required' })
      return
    }

    // filename
    if (!output.filename || typeof output.filename !== 'string') {
      errors.push({ field: 'output.filename', message: 'filename must be a non-empty string' })
    }

    // format
    if (!output.format || !['mp4', 'webm'].includes(output.format)) {
      errors.push({ 
        field: 'output.format', 
        message: 'format must be either "mp4" or "webm"',
        value: output.format 
      })
    }

    // width
    if (!this.isPositiveInteger(output.width)) {
      errors.push({ 
        field: 'output.width', 
        message: 'width must be a positive integer',
        value: output.width 
      })
    }

    // height
    if (!this.isPositiveInteger(output.height)) {
      errors.push({ 
        field: 'output.height', 
        message: 'height must be a positive integer',
        value: output.height 
      })
    }

    // fps
    if (!this.isPositiveNumber(output.fps) || output.fps > 60) {
      errors.push({ 
        field: 'output.fps', 
        message: 'fps must be a positive number between 1 and 60',
        value: output.fps 
      })
    }

    // duration
    if (!this.isPositiveNumber(output.duration)) {
      errors.push({ 
        field: 'output.duration', 
        message: 'duration must be a positive number',
        value: output.duration 
      })
    }

    // quality
    if (!output.quality || !['low', 'medium', 'high', 'max'].includes(output.quality)) {
      errors.push({ 
        field: 'output.quality', 
        message: 'quality must be one of: low, medium, high, max',
        value: output.quality 
      })
    }
  }

  private validateData(data: BarChartRaceConfig['data'] | undefined, errors: ValidationError[]): void {
    if (!data || typeof data !== 'object') {
      errors.push({ field: 'data', message: 'Data configuration is required' })
      return
    }

    // csvPath
    if (!data.csvPath || typeof data.csvPath !== 'string') {
      errors.push({ field: 'data.csvPath', message: 'csvPath must be a non-empty string' })
    } else {
      const fullPath = resolve(data.csvPath)
      if (!existsSync(fullPath)) {
        errors.push({ 
          field: 'data.csvPath', 
          message: `CSV file not found: ${fullPath}`,
          value: data.csvPath 
        })
      }
    }

    // dateColumn
    if (!data.dateColumn || typeof data.dateColumn !== 'string') {
      errors.push({ field: 'data.dateColumn', message: 'dateColumn must be a non-empty string' })
    }

    // dateFormat
    if (!data.dateFormat || typeof data.dateFormat !== 'string') {
      errors.push({ field: 'data.dateFormat', message: 'dateFormat must be a non-empty string' })
    } else {
      // Basic validation for common date format patterns
      const validPatterns = ['YYYY-MM-DD', 'YYYY-MM', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY']
      if (!this.isValidDateFormat(data.dateFormat)) {
        errors.push({ 
          field: 'data.dateFormat', 
          message: `dateFormat appears to be invalid. Common formats: ${validPatterns.join(', ')}`,
          value: data.dateFormat 
        })
      }
    }

    // valueColumns
    if (!Array.isArray(data.valueColumns) || data.valueColumns.length === 0) {
      errors.push({ field: 'data.valueColumns', message: 'valueColumns must be a non-empty array' })
    } else {
      data.valueColumns.forEach((col: string, index: number) => {
        if (typeof col !== 'string' || col.trim() === '') {
          errors.push({ 
            field: `data.valueColumns[${index}]`, 
            message: 'Each value column must be a non-empty string',
            value: col 
          })
        }
      })
    }

    // interpolation
    if (!data.interpolation || !['linear', 'smooth', 'step'].includes(data.interpolation)) {
      errors.push({ 
        field: 'data.interpolation', 
        message: 'interpolation must be one of: linear, smooth, step',
        value: data.interpolation 
      })
    }
  }

  private validateLayers(layers: BarChartRaceConfig['layers'] | undefined, errors: ValidationError[]): void {
    if (!layers || typeof layers !== 'object') {
      errors.push({ field: 'layers', message: 'Layers configuration is required' })
      return
    }

    // background (required)
    if (!layers.background) {
      errors.push({ field: 'layers.background', message: 'Background layer is required' })
    } else {
      this.validateBackgroundLayer(layers.background, errors)
    }

    // chart (required)
    if (!layers.chart) {
      errors.push({ field: 'layers.chart', message: 'Chart layer is required' })
    } else {
      this.validateChartLayer(layers.chart, errors)
    }

    // title (optional)
    if (layers.title) {
      this.validateTitleLayer(layers.title, errors)
    }

    // text (optional)
    if (layers.text) {
      this.validateTextLayer(layers.text, errors)
    }

    // date (optional)
    if (layers.date) {
      this.validateDateLayer(layers.date, errors)
    }
  }

  private validateBackgroundLayer(bg: BackgroundLayerConfig | undefined, errors: ValidationError[]): void {
    if (!bg || typeof bg !== 'object') {
      errors.push({ field: 'layers.background', message: 'Background layer must be an object' })
      return
    }

    // color
    if (!this.isValidHexColor(bg.color)) {
      errors.push({ 
        field: 'layers.background.color', 
        message: 'color must be a valid hex color (e.g., #ffffff)',
        value: bg.color 
      })
    }

    // opacity
    if (!this.isValidOpacity(bg.opacity)) {
      errors.push({ 
        field: 'layers.background.opacity', 
        message: 'opacity must be a number between 0 and 100',
        value: bg.opacity 
      })
    }

    // image (optional)
    if (bg.image) {
      if (typeof bg.image !== 'object') {
        errors.push({ field: 'layers.background.image', message: 'image must be an object' })
      } else {
        if (!bg.image.path || typeof bg.image.path !== 'string') {
          errors.push({ field: 'layers.background.image.path', message: 'image path must be a string' })
        } else if (!existsSync(resolve(bg.image.path))) {
          errors.push({ 
            field: 'layers.background.image.path', 
            message: `Image file not found: ${resolve(bg.image.path)}`,
            value: bg.image.path 
          })
        }

        if (!['cover', 'contain', 'fill'].includes(bg.image.cropping)) {
          errors.push({ 
            field: 'layers.background.image.cropping', 
            message: 'cropping must be one of: cover, contain, fill',
            value: bg.image.cropping 
          })
        }

        if (!this.isValidOpacity(bg.image.opacity)) {
          errors.push({ 
            field: 'layers.background.image.opacity', 
            message: 'image opacity must be a number between 0 and 100',
            value: bg.image.opacity 
          })
        }
      }
    }
  }

  private validateChartLayer(chart: ChartLayerConfig | undefined, errors: ValidationError[]): void {
    if (!chart || typeof chart !== 'object') {
      errors.push({ field: 'layers.chart', message: 'Chart layer must be an object' })
      return
    }

    // position
    this.validatePosition(chart.position, 'layers.chart.position', errors)

    // chart section
    if (!chart.chart || typeof chart.chart !== 'object') {
      errors.push({ field: 'layers.chart.chart', message: 'Chart configuration is required' })
    } else {
      if (!this.isPositiveInteger(chart.chart.visibleItemCount)) {
        errors.push({ 
          field: 'layers.chart.chart.visibleItemCount', 
          message: 'visibleItemCount must be a positive integer',
          value: chart.chart.visibleItemCount 
        })
      }

      if (!['local', 'global'].includes(chart.chart.maxValue)) {
        errors.push({ 
          field: 'layers.chart.chart.maxValue', 
          message: 'maxValue must be either "local" or "global"',
          value: chart.chart.maxValue 
        })
      }

      if (!this.isPositiveNumber(chart.chart.itemSpacing)) {
        errors.push({ 
          field: 'layers.chart.chart.itemSpacing', 
          message: 'itemSpacing must be a positive number',
          value: chart.chart.itemSpacing 
        })
      }
    }

    // animation
    if (!chart.animation || typeof chart.animation !== 'object') {
      errors.push({ field: 'layers.chart.animation', message: 'Animation configuration is required' })
    } else {
      if (!['continuous', 'discrete'].includes(chart.animation.type)) {
        errors.push({ 
          field: 'layers.chart.animation.type', 
          message: 'animation type must be either "continuous" or "discrete"',
          value: chart.animation.type 
        })
      }

      if (!this.isPositiveNumber(chart.animation.overtakeDuration)) {
        errors.push({ 
          field: 'layers.chart.animation.overtakeDuration', 
          message: 'overtakeDuration must be a positive number',
          value: chart.animation.overtakeDuration 
        })
      }
    }

    // bar
    if (!chart.bar || typeof chart.bar !== 'object') {
      errors.push({ field: 'layers.chart.bar', message: 'Bar configuration is required' })
    } else {
      if (chart.bar.colors !== 'auto') {
        if (!Array.isArray(chart.bar.colors)) {
          errors.push({ 
            field: 'layers.chart.bar.colors', 
            message: 'colors must be "auto" or an array of hex colors',
            value: chart.bar.colors 
          })
        } else {
          chart.bar.colors.forEach((color: string, index: number) => {
            if (!this.isValidHexColor(color)) {
              errors.push({ 
                field: `layers.chart.bar.colors[${index}]`, 
                message: 'Each color must be a valid hex color',
                value: color 
              })
            }
          })
        }
      }

      if (!this.isNonNegativeNumber(chart.bar.cornerRadius)) {
        errors.push({ 
          field: 'layers.chart.bar.cornerRadius', 
          message: 'cornerRadius must be a non-negative number',
          value: chart.bar.cornerRadius 
        })
      }

      if (!this.isValidOpacity(chart.bar.opacity)) {
        errors.push({ 
          field: 'layers.chart.bar.opacity', 
          message: 'bar opacity must be a number between 0 and 100',
          value: chart.bar.opacity 
        })
      }
    }

    // labels
    if (!chart.labels || typeof chart.labels !== 'object') {
      errors.push({ field: 'layers.chart.labels', message: 'Labels configuration is required' })
    } else {
      this.validateLabelConfig(chart.labels.title, 'layers.chart.labels.title', errors, ['inside', 'outside'])
      this.validateLabelConfig(chart.labels.value, 'layers.chart.labels.value', errors)
      this.validateRankConfig(chart.labels.rank, 'layers.chart.labels.rank', errors)
    }

    // images (optional)
    if (chart.images) {
      if (typeof chart.images !== 'object') {
        errors.push({ field: 'layers.chart.images', message: 'Images configuration must be an object' })
      } else {
        if (typeof chart.images.show !== 'boolean') {
          errors.push({ 
            field: 'layers.chart.images.show', 
            message: 'images.show must be a boolean',
            value: chart.images.show 
          })
        }

        if (!chart.images.mapping || typeof chart.images.mapping !== 'object') {
          errors.push({ field: 'layers.chart.images.mapping', message: 'images.mapping must be an object' })
        }

        if (!this.isPositiveNumber(chart.images.size)) {
          errors.push({ 
            field: 'layers.chart.images.size', 
            message: 'images.size must be a positive number',
            value: chart.images.size 
          })
        }

        if (!this.isNonNegativeNumber(chart.images.borderRadius)) {
          errors.push({ 
            field: 'layers.chart.images.borderRadius', 
            message: 'images.borderRadius must be a non-negative number',
            value: chart.images.borderRadius 
          })
        }
      }
    }
  }

  private validateTitleLayer(title: TitleLayerConfig | undefined, errors: ValidationError[]): void {
    if (!title || typeof title !== 'object') {
      errors.push({ field: 'layers.title', message: 'Title layer must be an object' })
      return
    }

    if (!title.text || typeof title.text !== 'string') {
      errors.push({ field: 'layers.title.text', message: 'title text must be a non-empty string' })
    }

    if (!title.position || typeof title.position !== 'object') {
      errors.push({ field: 'layers.title.position', message: 'title position is required' })
    } else {
      if (!this.isNonNegativeNumber(title.position.top)) {
        errors.push({ 
          field: 'layers.title.position.top', 
          message: 'title position top must be a non-negative number',
          value: title.position.top 
        })
      }

      if (!['left', 'center', 'right'].includes(title.position.align)) {
        errors.push({ 
          field: 'layers.title.position.align', 
          message: 'title position align must be one of: left, center, right',
          value: title.position.align 
        })
      }
    }

    this.validateStyleConfig(title.style, 'layers.title.style', errors)
    this.validateTimelineConfig(title.timeline, 'layers.title.timeline', errors)
  }

  private validateTextLayer(text: TextLayerConfig | undefined, errors: ValidationError[]): void {
    if (!text || typeof text !== 'object') {
      errors.push({ field: 'layers.text', message: 'Text layer must be an object' })
      return
    }

    if (!text.text || typeof text.text !== 'string') {
      errors.push({ field: 'layers.text.text', message: 'text content must be a non-empty string' })
    }

    if (!text.position || typeof text.position !== 'object') {
      errors.push({ field: 'layers.text.position', message: 'text position is required' })
    } else {
      if (!this.isNonNegativeNumber(text.position.top)) {
        errors.push({ 
          field: 'layers.text.position.top', 
          message: 'text position top must be a non-negative number',
          value: text.position.top 
        })
      }

      if (!this.isNonNegativeNumber(text.position.left)) {
        errors.push({ 
          field: 'layers.text.position.left', 
          message: 'text position left must be a non-negative number',
          value: text.position.left 
        })
      }

      if (!['left', 'center', 'right'].includes(text.position.align)) {
        errors.push({ 
          field: 'layers.text.position.align', 
          message: 'text position align must be one of: left, center, right',
          value: text.position.align 
        })
      }
    }

    this.validateStyleConfig(text.style, 'layers.text.style', errors)
    this.validateTimelineConfig(text.timeline, 'layers.text.timeline', errors)
  }

  private validateDateLayer(date: DateLayerConfig | undefined, errors: ValidationError[]): void {
    if (!date || typeof date !== 'object') {
      errors.push({ field: 'layers.date', message: 'Date layer must be an object' })
      return
    }

    if (!date.position || typeof date.position !== 'object') {
      errors.push({ field: 'layers.date.position', message: 'date position is required' })
    } else {
      if (!this.isNonNegativeNumber(date.position.bottom)) {
        errors.push({ 
          field: 'layers.date.position.bottom', 
          message: 'date position bottom must be a non-negative number',
          value: date.position.bottom 
        })
      }

      if (!this.isNonNegativeNumber(date.position.right)) {
        errors.push({ 
          field: 'layers.date.position.right', 
          message: 'date position right must be a non-negative number',
          value: date.position.right 
        })
      }
    }

    if (!date.format || typeof date.format !== 'object') {
      errors.push({ field: 'layers.date.format', message: 'date format is required' })
    } else {
      if (!date.format.pattern || typeof date.format.pattern !== 'string') {
        errors.push({ field: 'layers.date.format.pattern', message: 'date format pattern must be a string' })
      }

      if (!date.format.locale || typeof date.format.locale !== 'string') {
        errors.push({ field: 'layers.date.format.locale', message: 'date format locale must be a string' })
      }
    }

    this.validateStyleConfig(date.style, 'layers.date.style', errors)

    if (!date.animation || typeof date.animation !== 'object') {
      errors.push({ field: 'layers.date.animation', message: 'date animation is required' })
    } else {
      if (!['fixed', 'continuous'].includes(date.animation.type)) {
        errors.push({ 
          field: 'layers.date.animation.type', 
          message: 'date animation type must be either "fixed" or "continuous"',
          value: date.animation.type 
        })
      }

      if (!this.isNonNegativeNumber(date.animation.duration)) {
        errors.push({ 
          field: 'layers.date.animation.duration', 
          message: 'date animation duration must be a non-negative number',
          value: date.animation.duration 
        })
      }
    }
  }

  private validatePosition(position: ChartLayerConfig['position'] | undefined, fieldName: string, errors: ValidationError[]): void {
    if (!position || typeof position !== 'object') {
      errors.push({ field: fieldName, message: 'Position is required' })
      return
    }

    const requiredFields = ['top', 'right', 'bottom', 'left']
    requiredFields.forEach(field => {
      if (!this.isNonNegativeNumber(position[field])) {
        errors.push({ 
          field: `${fieldName}.${field}`, 
          message: `${field} must be a non-negative number`,
          value: position[field] 
        })
      }
    })
  }

  private validateLabelConfig(
    label: ChartLayerConfig['labels']['title'] | ChartLayerConfig['labels']['value'] | undefined, 
    fieldName: string, 
    errors: ValidationError[], 
    positionValues?: string[]
  ): void {
    if (!label || typeof label !== 'object') {
      errors.push({ field: fieldName, message: 'Label configuration is required' })
      return
    }

    if (typeof label.show !== 'boolean') {
      errors.push({ 
        field: `${fieldName}.show`, 
        message: 'show must be a boolean',
        value: label.show 
      })
    }

    if (!this.isPositiveNumber(label.fontSize)) {
      errors.push({ 
        field: `${fieldName}.fontSize`, 
        message: 'fontSize must be a positive number',
        value: label.fontSize 
      })
    }

    if (!label.fontFamily || typeof label.fontFamily !== 'string') {
      errors.push({ field: `${fieldName}.fontFamily`, message: 'fontFamily must be a non-empty string' })
    }

    if (!this.isValidHexColor(label.color)) {
      errors.push({ 
        field: `${fieldName}.color`, 
        message: 'color must be a valid hex color',
        value: label.color 
      })
    }

    if (positionValues && 'position' in label) {
      const titleLabel = label as ChartLayerConfig['labels']['title']
      if (titleLabel.position && !positionValues.includes(titleLabel.position)) {
        errors.push({ 
          field: `${fieldName}.position`, 
          message: `position must be one of: ${positionValues.join(', ')}`,
          value: titleLabel.position 
        })
      }
    }

    // Additional validation for value labels
    if (fieldName.includes('value') && 'format' in label) {
      const valueLabel = label as ChartLayerConfig['labels']['value']
      if (!valueLabel.format || typeof valueLabel.format !== 'string') {
        errors.push({ field: `${fieldName}.format`, message: 'format must be a non-empty string' })
      }
    }
  }

  private validateRankConfig(rank: ChartLayerConfig['labels']['rank'] | undefined, fieldName: string, errors: ValidationError[]): void {
    if (!rank || typeof rank !== 'object') {
      errors.push({ field: fieldName, message: 'Rank configuration is required' })
      return
    }

    if (typeof rank.show !== 'boolean') {
      errors.push({ 
        field: `${fieldName}.show`, 
        message: 'show must be a boolean',
        value: rank.show 
      })
    }

    if (!this.isPositiveNumber(rank.fontSize)) {
      errors.push({ 
        field: `${fieldName}.fontSize`, 
        message: 'fontSize must be a positive number',
        value: rank.fontSize 
      })
    }

    if (!this.isValidHexColor(rank.backgroundColor)) {
      errors.push({ 
        field: `${fieldName}.backgroundColor`, 
        message: 'backgroundColor must be a valid hex color',
        value: rank.backgroundColor 
      })
    }

    if (!this.isValidHexColor(rank.textColor)) {
      errors.push({ 
        field: `${fieldName}.textColor`, 
        message: 'textColor must be a valid hex color',
        value: rank.textColor 
      })
    }
  }

  private validateStyleConfig(
    style: TitleLayerConfig['style'] | TextLayerConfig['style'] | DateLayerConfig['style'] | undefined, 
    fieldName: string, 
    errors: ValidationError[]
  ): void {
    if (!style || typeof style !== 'object') {
      errors.push({ field: fieldName, message: 'Style configuration is required' })
      return
    }

    if (!this.isPositiveNumber(style.fontSize)) {
      errors.push({ 
        field: `${fieldName}.fontSize`, 
        message: 'fontSize must be a positive number',
        value: style.fontSize 
      })
    }

    if (!style.fontFamily || typeof style.fontFamily !== 'string') {
      errors.push({ field: `${fieldName}.fontFamily`, message: 'fontFamily must be a non-empty string' })
    }

    if (!this.isValidHexColor(style.color)) {
      errors.push({ 
        field: `${fieldName}.color`, 
        message: 'color must be a valid hex color',
        value: style.color 
      })
    }

    if (!this.isValidOpacity(style.opacity)) {
      errors.push({ 
        field: `${fieldName}.opacity`, 
        message: 'opacity must be a number between 0 and 100',
        value: style.opacity 
      })
    }
  }

  private validateTimelineConfig(
    timeline: TitleLayerConfig['timeline'] | TextLayerConfig['timeline'] | undefined, 
    fieldName: string, 
    errors: ValidationError[]
  ): void {
    if (!timeline || typeof timeline !== 'object') {
      errors.push({ field: fieldName, message: 'Timeline configuration is required' })
      return
    }

    if (!this.isNonNegativeNumber(timeline.startTime)) {
      errors.push({ 
        field: `${fieldName}.startTime`, 
        message: 'startTime must be a non-negative number',
        value: timeline.startTime 
      })
    }

    if (!this.isPositiveNumber(timeline.duration)) {
      errors.push({ 
        field: `${fieldName}.duration`, 
        message: 'duration must be a positive number',
        value: timeline.duration 
      })
    }
  }

  // Helper validation methods
  private isPositiveInteger(value: unknown): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value > 0
  }

  private isPositiveNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && value > 0
  }

  private isNonNegativeNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && value >= 0
  }

  private isValidOpacity(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 100
  }

  private isValidHexColor(value: unknown): boolean {
    if (typeof value !== 'string') return false
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
  }

  private isValidDateFormat(format: string): boolean {
    // Basic validation for common date format patterns
    const commonPatterns = [
      /YYYY/, /MM/, /DD/, /M/, /D/, /Y/,
      /\//, /-/, /\./
    ]
    return commonPatterns.some(pattern => pattern.test(format))
  }

  // Generate a valid config template with default values
  public generateDefaultConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'output.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 60,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Column1', 'Column2', 'Column3'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#1a1a1a',
          opacity: 100
        },
        chart: {
          position: {
            top: 150,
            right: 50,
            bottom: 100,
            left: 50
          },
          chart: {
            visibleItemCount: 10,
            maxValue: 'local',
            itemSpacing: 20
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.5
          },
          bar: {
            colors: 'auto',
            cornerRadius: 10,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#ffffff',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 20,
              fontFamily: 'Arial',
              color: '#ffffff',
              format: '{value:,.0f}',
              suffix: ''
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#333333',
              textColor: '#ffffff'
            }
          }
        }
      }
    }
  }
}