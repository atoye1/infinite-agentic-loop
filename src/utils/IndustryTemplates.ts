import { BarChartRaceConfig } from '../types/config'

/**
 * Industry-specific template configurations
 * Provides specialized configurations for different business sectors and use cases
 */
export class IndustryTemplates {

  // TECHNOLOGY INDUSTRY TEMPLATES
  
  static getTechStartupConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'tech-startup-metrics.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 90,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Users', 'Revenue', 'Funding', 'Employees'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#0f0f23',
          opacity: 100,
          image: {
            path: './images/tech-bg.jpg',
            cropping: 'cover',
            opacity: 15
          }
        },
        chart: {
          position: {
            top: 160,
            right: 80,
            bottom: 120,
            left: 80
          },
          chart: {
            visibleItemCount: 12,
            maxValue: 'local',
            itemSpacing: 22
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.6
          },
          bar: {
            colors: ['#00d4ff', '#7b68ee', '#ff6b6b', '#4ecdc4'],
            cornerRadius: 8,
            opacity: 95
          },
          labels: {
            title: {
              show: true,
              fontSize: 24,
              fontFamily: 'Roboto',
              color: '#ffffff',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 20,
              fontFamily: 'Roboto',
              color: '#ffffff',
              format: '{value:,.0f}',
              suffix: ''
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#333366',
              textColor: '#00d4ff'
            }
          }
        },
        title: {
          text: 'Tech Startup Growth Metrics',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 52,
            fontFamily: 'Roboto Bold',
            color: '#00d4ff',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 90
          }
        },
        date: {
          position: {
            bottom: 50,
            right: 80
          },
          format: {
            pattern: 'MMM YYYY',
            locale: 'en-US'
          },
          style: {
            fontSize: 32,
            fontFamily: 'Roboto',
            color: '#7b68ee',
            opacity: 90
          },
          animation: {
            type: 'continuous',
            duration: 0.4
          }
        }
      }
    }
  }

  static getSoftwareDevelopmentConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'software-dev-metrics.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 75,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'Go', 'Rust'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#1e1e1e',
          opacity: 100
        },
        chart: {
          position: {
            top: 150,
            right: 60,
            bottom: 100,
            left: 60
          },
          chart: {
            visibleItemCount: 10,
            maxValue: 'global',
            itemSpacing: 20
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.5
          },
          bar: {
            colors: ['#f7df1e', '#3776ab', '#ed8b00', '#3178c6', '#512bd4', '#00add8', '#000000'],
            cornerRadius: 6,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 22,
              fontFamily: 'JetBrains Mono',
              color: '#ffffff',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 18,
              fontFamily: 'JetBrains Mono',
              color: '#ffffff',
              format: '{value:,.0f}%'
            },
            rank: {
              show: true,
              fontSize: 16,
              backgroundColor: '#404040',
              textColor: '#ffffff'
            }
          }
        },
        title: {
          text: 'Programming Language Popularity',
          position: {
            top: 50,
            align: 'center'
          },
          style: {
            fontSize: 48,
            fontFamily: 'JetBrains Mono Bold',
            color: '#4CAF50',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 75
          }
        }
      }
    }
  }

  // FINANCE INDUSTRY TEMPLATES

  static getStockMarketConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'stock-market-race.mp4',
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
        valueColumns: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'],
        interpolation: 'linear'
      },
      layers: {
        background: {
          color: '#001122',
          opacity: 100
        },
        chart: {
          position: {
            top: 180,
            right: 100,
            bottom: 150,
            left: 100
          },
          chart: {
            visibleItemCount: 15,
            maxValue: 'global',
            itemSpacing: 18
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.8
          },
          bar: {
            colors: ['#00c851', '#ff4444', '#ffbb33', '#33b5e5', '#aa66cc', '#ff6600', '#009688'],
            cornerRadius: 4,
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
              format: '${value:,.2f}',
              prefix: '$'
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#2c3e50',
              textColor: '#ecf0f1'
            }
          }
        },
        title: {
          text: 'Stock Price Performance',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 56,
            fontFamily: 'Arial Bold',
            color: '#00c851',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 120
          }
        },
        date: {
          position: {
            bottom: 80,
            right: 100
          },
          format: {
            pattern: 'MMM DD, YYYY',
            locale: 'en-US'
          },
          style: {
            fontSize: 28,
            fontFamily: 'Arial',
            color: '#bdc3c7',
            opacity: 85
          },
          animation: {
            type: 'continuous',
            duration: 0.3
          }
        }
      }
    }
  }

  static getCryptocurrencyConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'crypto-market-cap.mp4',
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
        valueColumns: ['Bitcoin', 'Ethereum', 'BNB', 'XRP', 'Solana', 'Cardano', 'Dogecoin'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#0d1421',
          opacity: 100,
          image: {
            path: './images/crypto-bg.jpg',
            cropping: 'cover',
            opacity: 20
          }
        },
        chart: {
          position: {
            top: 160,
            right: 70,
            bottom: 120,
            left: 70
          },
          chart: {
            visibleItemCount: 12,
            maxValue: 'local',
            itemSpacing: 20
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.4
          },
          bar: {
            colors: ['#f7931a', '#627eea', '#f3ba2f', '#23292f', '#9945ff', '#0033ad', '#c2a633'],
            cornerRadius: 12,
            opacity: 95
          },
          labels: {
            title: {
              show: true,
              fontSize: 26,
              fontFamily: 'Arial Bold',
              color: '#ffffff',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 22,
              fontFamily: 'Arial',
              color: '#ffffff',
              format: '${value:.2f}B',
              prefix: '$',
              suffix: 'B'
            },
            rank: {
              show: true,
              fontSize: 20,
              backgroundColor: '#f7931a',
              textColor: '#000000'
            }
          },
          images: {
            show: true,
            mapping: {
              'Bitcoin': './images/btc.png',
              'Ethereum': './images/eth.png',
              'BNB': './images/bnb.png',
              'XRP': './images/xrp.png',
              'Solana': './images/sol.png',
              'Cardano': './images/ada.png',
              'Dogecoin': './images/doge.png'
            },
            size: 40,
            borderRadius: 20
          }
        },
        title: {
          text: 'Cryptocurrency Market Cap Race',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 50,
            fontFamily: 'Arial Bold',
            color: '#f7931a',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 60
          }
        }
      }
    }
  }

  // SPORTS INDUSTRY TEMPLATES

  static getSportsStatsConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'sports-stats.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 60,
        duration: 45,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Nets', 'Bulls'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#1a1a2e',
          opacity: 100,
          image: {
            path: './images/basketball-court.jpg',
            cropping: 'cover',
            opacity: 25
          }
        },
        chart: {
          position: {
            top: 170,
            right: 80,
            bottom: 130,
            left: 80
          },
          chart: {
            visibleItemCount: 10,
            maxValue: 'local',
            itemSpacing: 25
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.3
          },
          bar: {
            colors: ['#552583', '#1d428a', '#007a33', '#98002e', '#000000', '#ce1141'],
            cornerRadius: 15,
            opacity: 90
          },
          labels: {
            title: {
              show: true,
              fontSize: 28,
              fontFamily: 'Arial Black',
              color: '#ffffff',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 24,
              fontFamily: 'Arial Bold',
              color: '#ffffff',
              format: '{value:,.0f}',
              suffix: ' pts'
            },
            rank: {
              show: true,
              fontSize: 22,
              backgroundColor: '#ff6b35',
              textColor: '#ffffff'
            }
          }
        },
        title: {
          text: 'NBA TEAM SCORING RACE',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 58,
            fontFamily: 'Arial Black',
            color: '#ff6b35',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 45
          }
        },
        date: {
          position: {
            bottom: 60,
            right: 80
          },
          format: {
            pattern: 'MMM YYYY',
            locale: 'en-US'
          },
          style: {
            fontSize: 36,
            fontFamily: 'Arial Bold',
            color: '#ffa500',
            opacity: 95
          },
          animation: {
            type: 'continuous',
            duration: 0.2
          }
        }
      }
    }
  }

  static getOlympicsConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'olympics-medals.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 90,
        quality: 'max'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['USA', 'China', 'Japan', 'Australia', 'ROC', 'Great Britain', 'Germany'],
        interpolation: 'linear'
      },
      layers: {
        background: {
          color: '#ffffff',
          opacity: 100,
          image: {
            path: './images/olympic-rings.png',
            cropping: 'contain',
            opacity: 10
          }
        },
        chart: {
          position: {
            top: 180,
            right: 90,
            bottom: 140,
            left: 90
          },
          chart: {
            visibleItemCount: 12,
            maxValue: 'global',
            itemSpacing: 20
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 1.0
          },
          bar: {
            colors: ['#bf0a30', '#de2910', '#bc002d', '#012169', '#ffffff', '#012169', '#000000'],
            cornerRadius: 8,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 24,
              fontFamily: 'Arial Bold',
              color: '#333333',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 20,
              fontFamily: 'Arial',
              color: '#333333',
              format: '{value:,.0f}',
              suffix: ' medals'
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#ffd700',
              textColor: '#000000'
            }
          },
          images: {
            show: true,
            mapping: {
              'USA': './images/flags/usa.png',
              'China': './images/flags/china.png',
              'Japan': './images/flags/japan.png',
              'Australia': './images/flags/australia.png',
              'ROC': './images/flags/roc.png',
              'Great Britain': './images/flags/gb.png',
              'Germany': './images/flags/germany.png'
            },
            size: 35,
            borderRadius: 4
          }
        },
        title: {
          text: 'Olympic Medal Count',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 54,
            fontFamily: 'Arial Bold',
            color: '#0081c8',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 90
          }
        }
      }
    }
  }

  // MARKETING INDUSTRY TEMPLATES

  static getSocialMediaGrowthConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'social-media-growth.mp4',
        format: 'mp4',
        width: 1080,
        height: 1920,
        fps: 30,
        duration: 40,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn', 'Snapchat'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#1a1a2e',
          opacity: 100
        },
        chart: {
          position: {
            top: 300,
            right: 50,
            bottom: 250,
            left: 50
          },
          chart: {
            visibleItemCount: 8,
            maxValue: 'local',
            itemSpacing: 30
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.4
          },
          bar: {
            colors: ['#e1306c', '#ff0050', '#ff0000', '#1da1f2', '#0077b5', '#fffc00'],
            cornerRadius: 20,
            opacity: 95
          },
          labels: {
            title: {
              show: true,
              fontSize: 32,
              fontFamily: 'Arial Bold',
              color: '#ffffff',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 28,
              fontFamily: 'Arial',
              color: '#ffffff',
              format: '{value:.1f}M',
              suffix: 'M'
            },
            rank: {
              show: true,
              fontSize: 24,
              backgroundColor: '#ff6b35',
              textColor: '#000000'
            }
          }
        },
        title: {
          text: 'Social Media Growth',
          position: {
            top: 120,
            align: 'center'
          },
          style: {
            fontSize: 60,
            fontFamily: 'Arial Bold',
            color: '#ff6b35',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 40
          }
        }
      }
    }
  }

  static getBrandPerformanceConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'brand-performance.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 75,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Apple', 'Google', 'Amazon', 'Microsoft', 'Samsung', 'Facebook', 'Tesla'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#f8f9fa',
          opacity: 100
        },
        chart: {
          position: {
            top: 160,
            right: 80,
            bottom: 120,
            left: 80
          },
          chart: {
            visibleItemCount: 12,
            maxValue: 'global',
            itemSpacing: 22
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.7
          },
          bar: {
            colors: ['#007aff', '#4285f4', '#ff9500', '#00a1f1', '#1428a0', '#1877f2', '#cc0000'],
            cornerRadius: 10,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 24,
              fontFamily: 'SF Pro Display',
              color: '#1d1d1f',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 20,
              fontFamily: 'SF Pro Display',
              color: '#1d1d1f',
              format: '${value:.1f}B',
              prefix: '$',
              suffix: 'B'
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#007aff',
              textColor: '#ffffff'
            }
          }
        },
        title: {
          text: 'Brand Value Rankings',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 52,
            fontFamily: 'SF Pro Display Bold',
            color: '#1d1d1f',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 75
          }
        }
      }
    }
  }

  // GOVERNMENT & PUBLIC SECTOR TEMPLATES

  static getElectionResultsConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'election-results.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 60,
        quality: 'max'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Democratic', 'Republican', 'Independent', 'Green', 'Libertarian'],
        interpolation: 'linear'
      },
      layers: {
        background: {
          color: '#f5f5f5',
          opacity: 100
        },
        chart: {
          position: {
            top: 180,
            right: 100,
            bottom: 150,
            left: 100
          },
          chart: {
            visibleItemCount: 8,
            maxValue: 'global',
            itemSpacing: 25
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 1.2
          },
          bar: {
            colors: ['#0015bc', '#e91d0e', '#6a0dad', '#00c851', '#fed100'],
            cornerRadius: 6,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 26,
              fontFamily: 'Times New Roman',
              color: '#2c3e50',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 22,
              fontFamily: 'Times New Roman',
              color: '#2c3e50',
              format: '{value:,.0f}',
              suffix: ' votes'
            },
            rank: {
              show: true,
              fontSize: 20,
              backgroundColor: '#34495e',
              textColor: '#ecf0f1'
            }
          }
        },
        title: {
          text: 'Election Results 2024',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 56,
            fontFamily: 'Times New Roman Bold',
            color: '#2c3e50',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 60
          }
        },
        date: {
          position: {
            bottom: 80,
            right: 100
          },
          format: {
            pattern: 'MMM DD, YYYY',
            locale: 'en-US'
          },
          style: {
            fontSize: 28,
            fontFamily: 'Times New Roman',
            color: '#7f8c8d',
            opacity: 90
          },
          animation: {
            type: 'continuous',
            duration: 0.5
          }
        }
      }
    }
  }

  static getEconomicIndicatorsConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'economic-indicators.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 100,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['GDP', 'Unemployment', 'Inflation', 'Interest Rate', 'Stock Index'],
        interpolation: 'linear'
      },
      layers: {
        background: {
          color: '#2c3e50',
          opacity: 100
        },
        chart: {
          position: {
            top: 170,
            right: 90,
            bottom: 130,
            left: 90
          },
          chart: {
            visibleItemCount: 10,
            maxValue: 'local',
            itemSpacing: 24
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.8
          },
          bar: {
            colors: ['#27ae60', '#e74c3c', '#f39c12', '#3498db', '#9b59b6'],
            cornerRadius: 8,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#ecf0f1',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 20,
              fontFamily: 'Arial',
              color: '#ecf0f1',
              format: '{value:.2f}%',
              suffix: '%'
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#34495e',
              textColor: '#ecf0f1'
            }
          }
        },
        title: {
          text: 'Economic Indicators Dashboard',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 50,
            fontFamily: 'Arial Bold',
            color: '#ecf0f1',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 100
          }
        }
      }
    }
  }

  // HEALTHCARE INDUSTRY TEMPLATES

  static getHealthcareMetricsConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'healthcare-metrics.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 80,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Hospital A', 'Hospital B', 'Hospital C', 'Hospital D', 'Hospital E'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#f8fffe',
          opacity: 100
        },
        chart: {
          position: {
            top: 160,
            right: 80,
            bottom: 120,
            left: 80
          },
          chart: {
            visibleItemCount: 10,
            maxValue: 'global',
            itemSpacing: 22
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.6
          },
          bar: {
            colors: ['#00b894', '#00a085', '#019875', '#028265', '#026b55'],
            cornerRadius: 12,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#2d3436',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 20,
              fontFamily: 'Arial',
              color: '#2d3436',
              format: '{value:,.0f}',
              suffix: ' patients'
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#00b894',
              textColor: '#ffffff'
            }
          }
        },
        title: {
          text: 'Patient Care Performance',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 50,
            fontFamily: 'Arial Bold',
            color: '#00b894',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 80
          }
        }
      }
    }
  }

  // EDUCATION INDUSTRY TEMPLATES

  static getEducationStatsConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'education-stats.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 70,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Harvard', 'MIT', 'Stanford', 'Berkeley', 'Yale', 'Princeton'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#f7f1e3',
          opacity: 100
        },
        chart: {
          position: {
            top: 170,
            right: 90,
            bottom: 130,
            left: 90
          },
          chart: {
            visibleItemCount: 12,
            maxValue: 'global',
            itemSpacing: 20
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.7
          },
          bar: {
            colors: ['#a41e22', '#8a2be2', '#8b0000', '#003262', '#00356b', '#ff8f00'],
            cornerRadius: 8,
            opacity: 100
          },
          labels: {
            title: {
              show: true,
              fontSize: 24,
              fontFamily: 'Georgia',
              color: '#2c2c54',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 20,
              fontFamily: 'Georgia',
              color: '#2c2c54',
              format: '{value:,.0f}',
              suffix: ' students'
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#40407a',
              textColor: '#ffffff'
            }
          }
        },
        title: {
          text: 'University Enrollment Rankings',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 50,
            fontFamily: 'Georgia Bold',
            color: '#2c2c54',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 70
          }
        }
      }
    }
  }

  // ENTERTAINMENT INDUSTRY TEMPLATES

  static getMovieBoxOfficeConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'movie-box-office.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 50,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Avengers', 'Avatar', 'Star Wars', 'Jurassic Park', 'Lion King', 'Frozen'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#1a1a1a',
          opacity: 100,
          image: {
            path: './images/movie-theater.jpg',
            cropping: 'cover',
            opacity: 20
          }
        },
        chart: {
          position: {
            top: 160,
            right: 70,
            bottom: 120,
            left: 70
          },
          chart: {
            visibleItemCount: 10,
            maxValue: 'local',
            itemSpacing: 24
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.5
          },
          bar: {
            colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa07a', '#dda0dd'],
            cornerRadius: 15,
            opacity: 95
          },
          labels: {
            title: {
              show: true,
              fontSize: 26,
              fontFamily: 'Arial Bold',
              color: '#ffd700',
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: 22,
              fontFamily: 'Arial',
              color: '#ffffff',
              format: '${value:.1f}M',
              prefix: '$',
              suffix: 'M'
            },
            rank: {
              show: true,
              fontSize: 20,
              backgroundColor: '#ffd700',
              textColor: '#000000'
            }
          }
        },
        title: {
          text: 'Box Office Champions',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 54,
            fontFamily: 'Arial Bold',
            color: '#ffd700',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 50
          }
        }
      }
    }
  }

  static getMusicStreamingConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'music-streaming.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 65,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Pandora', 'Tidal'],
        interpolation: 'smooth'
      },
      layers: {
        background: {
          color: '#191414',
          opacity: 100
        },
        chart: {
          position: {
            top: 150,
            right: 80,
            bottom: 110,
            left: 80
          },
          chart: {
            visibleItemCount: 8,
            maxValue: 'global',
            itemSpacing: 28
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.4
          },
          bar: {
            colors: ['#1db954', '#fc3c44', '#ff0000', '#00d4aa', '#0074e4', '#000000'],
            cornerRadius: 20,
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
              suffix: 'M users'
            },
            rank: {
              show: true,
              fontSize: 22,
              backgroundColor: '#1db954',
              textColor: '#000000'
            }
          }
        },
        title: {
          text: 'Music Streaming Platform Wars',
          position: {
            top: 50,
            align: 'center'
          },
          style: {
            fontSize: 52,
            fontFamily: 'Arial Bold',
            color: '#1db954',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 65
          }
        }
      }
    }
  }

  // ENVIRONMENTAL & SUSTAINABILITY TEMPLATES

  static getClimateDataConfig(): BarChartRaceConfig {
    return {
      output: {
        filename: 'climate-data.mp4',
        format: 'mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 90,
        quality: 'high'
      },
      data: {
        csvPath: './data.csv',
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM-DD',
        valueColumns: ['CO2 Emissions', 'Temperature', 'Sea Level', 'Deforestation', 'Renewable Energy'],
        interpolation: 'linear'
      },
      layers: {
        background: {
          color: '#2c5530',
          opacity: 100,
          image: {
            path: './images/earth-bg.jpg',
            cropping: 'cover',
            opacity: 25
          }
        },
        chart: {
          position: {
            top: 170,
            right: 80,
            bottom: 130,
            left: 80
          },
          chart: {
            visibleItemCount: 10,
            maxValue: 'global',
            itemSpacing: 22
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.8
          },
          bar: {
            colors: ['#e74c3c', '#f39c12', '#3498db', '#27ae60', '#2ecc71'],
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
              format: '{value:.2f}',
              suffix: ''
            },
            rank: {
              show: true,
              fontSize: 18,
              backgroundColor: '#27ae60',
              textColor: '#ffffff'
            }
          }
        },
        title: {
          text: 'Climate Change Indicators',
          position: {
            top: 60,
            align: 'center'
          },
          style: {
            fontSize: 50,
            fontFamily: 'Arial Bold',
            color: '#2ecc71',
            opacity: 100
          },
          timeline: {
            startTime: 0,
            duration: 90
          }
        }
      }
    }
  }

  /**
   * Get all industry-specific templates
   */
  static getAllIndustryTemplates(): Record<string, BarChartRaceConfig> {
    return {
      // Technology
      'tech-startup': this.getTechStartupConfig(),
      'software-dev': this.getSoftwareDevelopmentConfig(),
      
      // Finance
      'stock-market': this.getStockMarketConfig(),
      'cryptocurrency': this.getCryptocurrencyConfig(),
      
      // Sports
      'sports-stats': this.getSportsStatsConfig(),
      'olympics': this.getOlympicsConfig(),
      
      // Marketing
      'social-growth': this.getSocialMediaGrowthConfig(),
      'brand-performance': this.getBrandPerformanceConfig(),
      
      // Government
      'election-results': this.getElectionResultsConfig(),
      'economic-indicators': this.getEconomicIndicatorsConfig(),
      
      // Healthcare
      'healthcare-metrics': this.getHealthcareMetricsConfig(),
      
      // Education
      'education-stats': this.getEducationStatsConfig(),
      
      // Entertainment
      'movie-box-office': this.getMovieBoxOfficeConfig(),
      'music-streaming': this.getMusicStreamingConfig(),
      
      // Environment
      'climate-data': this.getClimateDataConfig()
    }
  }

  /**
   * Get industry template descriptions
   */
  static getIndustryTemplateDescriptions(): Record<string, string> {
    return {
      'tech-startup': 'Technology startup metrics with modern tech aesthetics',
      'software-dev': 'Programming language popularity with developer-focused styling',
      'stock-market': 'Financial market data with professional trading theme',
      'cryptocurrency': 'Crypto market cap race with blockchain aesthetics',
      'sports-stats': 'Sports statistics with high-energy athletic styling',
      'olympics': 'Olympic medal counts with official Olympic branding',
      'social-growth': 'Social media growth metrics optimized for vertical format',
      'brand-performance': 'Corporate brand value rankings with clean business styling',
      'election-results': 'Political election results with formal government styling',
      'economic-indicators': 'Economic data dashboard with professional indicators',
      'healthcare-metrics': 'Healthcare performance data with medical industry styling',
      'education-stats': 'Educational institution rankings with academic styling',
      'movie-box-office': 'Movie box office performance with entertainment industry flair',
      'music-streaming': 'Music streaming platform competition with audio industry styling',
      'climate-data': 'Environmental and climate change data with sustainability theme'
    }
  }

  /**
   * Get templates by industry category
   */
  static getTemplatesByIndustry(industry: string): Record<string, BarChartRaceConfig> {
    const allTemplates = this.getAllIndustryTemplates()
    const industryMap: Record<string, string[]> = {
      'technology': ['tech-startup', 'software-dev'],
      'finance': ['stock-market', 'cryptocurrency'],
      'sports': ['sports-stats', 'olympics'],
      'marketing': ['social-growth', 'brand-performance'],
      'government': ['election-results', 'economic-indicators'],
      'healthcare': ['healthcare-metrics'],
      'education': ['education-stats'],
      'entertainment': ['movie-box-office', 'music-streaming'],
      'environment': ['climate-data']
    }

    const templateKeys = industryMap[industry.toLowerCase()] || []
    const result: Record<string, BarChartRaceConfig> = {}
    
    templateKeys.forEach(key => {
      if (allTemplates[key]) {
        result[key] = allTemplates[key]
      }
    })

    return result
  }

  /**
   * Validate if an industry template exists
   */
  static isValidIndustryTemplate(templateName: string): boolean {
    return Object.keys(this.getAllIndustryTemplates()).includes(templateName)
  }

  /**
   * Get an industry template by name
   */
  static getIndustryTemplate(templateName: string): BarChartRaceConfig | null {
    const templates = this.getAllIndustryTemplates()
    return templates[templateName] || null
  }

  /**
   * Get all available industries
   */
  static getAvailableIndustries(): string[] {
    return ['technology', 'finance', 'sports', 'marketing', 'government', 'healthcare', 'education', 'entertainment', 'environment']
  }
}