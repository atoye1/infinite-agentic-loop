import { BarChartRaceConfig } from '../types/config'

export class ConfigTemplates {
  
  /**
   * Generate a basic default configuration
   */
  static getDefaultConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'bar-chart-race.mp4',
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
              format: '{value:,.0f}'
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

  /**
   * Generate a configuration optimized for social media content
   */
  static getSocialMediaConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'social-media-race.mp4',
        format: 'mp4',
        width: 1080,
        height: 1920, // Vertical format for mobile
        fps: 30,
        duration: 30, // Shorter for social media
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Instagram', 'TikTok', 'YouTube', 'Twitter'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#0f0f23',
          opacity: 100
        },
        chart: {
          position: {
            top: 300,
            right: 40,
            bottom: 200,
            left: 40
          },
          chart: {
            visibleItemCount: 8,
            maxValue: 'global',
            itemSpacing: 25
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.3
          },
          bar: {
            colors: ['#E1306C', '#FF0050', '#FF0000', '#1DA1F2'],
            cornerRadius: 15,
            opacity: 95
          },
          labels: {
            title: {
              show: true,
              fontSize: 28,
              fontFamily: 'Arial Bold',
              color: '#ffffff',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#ffffff',
              format: '{value:.1f}M',
              suffix: ' followers'
            },
            rank: {
              show: true,
              fontSize: 20,
              backgroundColor: '#444444',
              textColor: '#ffffff'
            }
          },
          images: {
            show: true,
            mapping: {
              'Instagram': './images/instagram.png',
              'TikTok': './images/tiktok.png',
              'YouTube': './images/youtube.png',
              'Twitter': './images/twitter.png'
            },
            size: 40,
            borderRadius: 8
          }
        },
        title: {
          text: 'Social Media Followers Race',
          position: {
            top: 100,
            align: 'center'
          },
          style: {
            fontSize: 48,
            fontFamily: 'Arial Bold',
            color: '#ffffff',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 30
          }
        },
        date: {
          position: {
            bottom: 80,
            right: 40
          },
          format: {
            pattern: 'MMMM YYYY',
            locale: 'en-US'
          },
          style: {
            fontSize: 32,
            fontFamily: 'Arial',
            color: '#ffffff',
            opacity: 90
          },
          animation: {
            type: 'continuous',
            duration: 0.2
          }
        }
      }
    }
  }

  /**
   * Generate a professional presentation-style configuration
   */
  static getPresentationConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'presentation-chart.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 120,
        quality: 'max'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Q1', 'Q2', 'Q3', 'Q4'],
        interpolation: 'linear'
      },
      layers: {
        background: {
          color: '#ffffff',
          opacity: 100
        },
        chart: {
          position: {
            top: 200,
            right: 100,
            bottom: 150,
            left: 100
          },
          chart: {
            visibleItemCount: 12,
            maxValue: 'global',
            itemSpacing: 15
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 1.0
          },
          bar: {
            colors: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D'],
            cornerRadius: 5,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 22,
              fontFamily: 'Arial',
              color: '#333333',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 18,
              fontFamily: 'Arial',
              color: '#333333',
              format: '${value:,.0f}',
              prefix: '$'
            },
            rank: {
              show: true,
              fontSize: 16,
              backgroundColor: '#f0f0f0',
              textColor: '#333333'
            }
          }
        },
        title: {
          text: 'Quarterly Revenue Comparison',
          position: {
            top: 50,
            align: 'center'
          },
          style: {
            fontSize: 54,
            fontFamily: 'Arial Bold',
            color: '#2c3e50',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 120
          }
        },
        date: {
          position: {
            bottom: 50,
            right: 100
          },
          format: {
            pattern: 'YYYY',
            locale: 'en-US'
          },
          style: {
            fontSize: 36,
            fontFamily: 'Arial',
            color: '#7f8c8d',
            opacity: 80
          },
          animation: {
            type: 'continuous',
            duration: 0.5
          }
        }
      }
    }
  }

  /**
   * Generate a gaming/esports themed configuration
   */
  static getGamingConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'gaming-stats.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 60, // Higher FPS for gaming content
        duration: 45,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Fortnite', 'Valorant', 'League of Legends', 'CS:GO', 'Apex Legends'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#0a0a0a',
          opacity: 100,
          image: {
            path: './images/gaming-bg.jpg',
            cropping: 'cover',
            opacity: 30
          }
        },
        chart: {
          position: {
            top: 180,
            right: 60,
            bottom: 120,
            left: 60
          },
          chart: {
            visibleItemCount: 10,
            maxValue: 'local',
            itemSpacing: 18
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.4
          },
          bar: {
            colors: ['#9146FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
            cornerRadius: 12,
            opacity: 90
          },
          labels: {
            title: {
              show: true,
              fontSize: 26,
              fontFamily: 'Arial Bold',
              color: '#00ff88',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 22,
              fontFamily: 'Arial',
              color: '#ffffff',
              format: '{value:,.0f}',
              suffix: ' players'
            },
            rank: {
              show: true,
              fontSize: 20,
              backgroundColor: '#ff6b35',
              textColor: '#000000'
            }
          },
          images: {
            show: true,
            mapping: {
              'Fortnite': './images/fortnite.png',
              'Valorant': './images/valorant.png',
              'League of Legends': './images/lol.png',
              'CS:GO': './images/csgo.png',
              'Apex Legends': './images/apex.png'
            },
            size: 45,
            borderRadius: 10
          }
        },
        title: {
          text: 'MOST PLAYED GAMES',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 56,
            fontFamily: 'Arial Black',
            color: '#00ff88',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 45
          }
        },
        date: {
          position: {
            bottom: 40,
            right: 60
          },
          format: {
            pattern: 'MMM YYYY',
            locale: 'en-US'
          },
          style: {
            fontSize: 38,
            fontFamily: 'Arial Bold',
            color: '#ff6b35',
            opacity: 95
          },
          animation: {
            type: 'continuous',
            duration: 0.3
          }
        }
      }
    }
  }

  /**
   * Generate a minimal, clean configuration
   */
  static getMinimalConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'minimal-chart.mp4',
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
        valueColumns: ['A', 'B', 'C', 'D', 'E'],
        interpolation: 'linear'
      },
      layers: {
        background: {
          color: '#f8f9fa',
          opacity: 100
        },
        chart: {
          position: {
            top: 100,
            right: 50,
            bottom: 100,
            left: 50
          },
          chart: {
            visibleItemCount: 8,
            maxValue: 'global',
            itemSpacing: 30
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.8
          },
          bar: {
            colors: ['#495057', '#6c757d', '#adb5bd', '#ced4da', '#dee2e6'],
            cornerRadius: 0,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 20,
              fontFamily: 'Arial',
              color: '#212529',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 16,
              fontFamily: 'Arial',
              color: '#495057',
              format: '{value:,.0f}'
            },
            rank: {
              show: false,
              fontSize: 14,
              backgroundColor: '#ffffff',
              textColor: '#000000'
            }
          }
        },
        date: {
          position: {
            bottom: 30,
            right: 50
          },
          format: {
            pattern: 'YYYY',
            locale: 'en-US'
          },
          style: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#6c757d',
            opacity: 100
          },
          animation: {
            type: 'fixed',
            duration: 0
          }
        }
      }
    }
  }

  /**
   * Get all available template configurations
   */
  static getAllTemplates(): Record<string, BarChartRaceConfig> {
    return {
      default: this.getDefaultConfig(),
      'social-media': this.getSocialMediaConfig(),
      presentation: this.getPresentationConfig(),
      gaming: this.getGamingConfig(),
      minimal: this.getMinimalConfig()
    }
  }

  /**
   * Get template names and descriptions
   */
  static getTemplateDescriptions(): Record<string, string> {
    return {
      default: 'Standard configuration with balanced settings for general use',
      'social-media': 'Vertical format optimized for Instagram, TikTok, and other social platforms',
      presentation: 'Professional style suitable for business presentations and reports',
      gaming: 'High-energy design with gaming aesthetics and higher frame rate',
      minimal: 'Clean, simple design with minimal visual elements'
    }
  }

  /**
   * Validate if a template name exists
   */
  static isValidTemplate(templateName: string): boolean {
    return Object.keys(this.getAllTemplates()).includes(templateName)
  }

  /**
   * Get a template by name with fallback to default
   */
  static getTemplate(templateName: string): BarChartRaceConfig {
    const templates = this.getAllTemplates()
    return templates[templateName] || templates.default
  }
}