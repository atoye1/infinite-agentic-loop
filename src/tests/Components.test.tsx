/**
 * Unit tests for React components
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BarItem } from '../BarItem';
import { BackgroundLayer } from '../BackgroundLayer';
import { TitleLayer } from '../TitleLayer';
import { DateLayer } from '../DateLayer';
import { ChartLayer } from '../ChartLayer';
import { BarChartRaceComposition } from '../BarChartRaceComposition';
import { useCurrentFrame } from 'remotion';

// Mock Remotion hooks
jest.mock('remotion', () => ({
  useCurrentFrame: jest.fn(),
  useVideoConfig: jest.fn(() => ({
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 150
  })),
  interpolate: jest.fn((value, inputRange, outputRange) => {
    // Simple linear interpolation for tests
    const ratio = value / inputRange[1];
    return outputRange[0] + (outputRange[1] - outputRange[0]) * ratio;
  }),
  spring: jest.fn((options) => options.frame),
  Sequence: ({ children }: any) => <div>{children}</div>,
  AbsoluteFill: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('React Components', () => {
  beforeEach(() => {
    (useCurrentFrame as jest.Mock).mockReturnValue(0);
  });

  describe('BarItem', () => {
    const defaultProps = {
      item: {
        id: 'item1',
        name: 'Test Item',
        value: 100,
        rank: 1
      },
      width: 300,
      height: 50,
      color: '#FF0000',
      maxValue: 100,
      showLabel: true,
      showValue: true,
      showRank: true,
      labelStyle: {
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#FFFFFF'
      },
      valueStyle: {
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#FFFFFF',
        format: '{value}'
      },
      rankStyle: {
        fontSize: 12,
        backgroundColor: '#333333',
        textColor: '#FFFFFF'
      },
      animationDuration: 30,
      cornerRadius: 5,
      opacity: 90
    };

    test('should render bar item', () => {
      const { container } = render(<BarItem {...defaultProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    test('should show label when showLabel is true', () => {
      const { getByText } = render(<BarItem {...defaultProps} />);
      expect(getByText('Test Item')).toBeTruthy();
    });

    test('should hide label when showLabel is false', () => {
      const { queryByText } = render(<BarItem {...defaultProps} showLabel={false} />);
      expect(queryByText('Test Item')).toBeNull();
    });

    test('should show value when showValue is true', () => {
      const { getByText } = render(<BarItem {...defaultProps} />);
      expect(getByText('100')).toBeTruthy();
    });

    test('should show rank when showRank is true', () => {
      const { getByText } = render(<BarItem {...defaultProps} />);
      expect(getByText('1')).toBeTruthy();
    });
  });

  describe('BackgroundLayer', () => {
    const defaultProps = {
      config: {
        color: '#1a1a2e',
        opacity: 100
      }
    };

    test('should render background layer', () => {
      const { container } = render(<BackgroundLayer {...defaultProps} />);
      const backgroundDiv = container.firstChild as HTMLElement;
      expect(backgroundDiv).toBeTruthy();
      expect(backgroundDiv.style.backgroundColor).toBe('rgb(26, 26, 46)');
    });

    test('should apply opacity', () => {
      const { container } = render(
        <BackgroundLayer config={{ color: '#FF0000', opacity: 50 }} />
      );
      const backgroundDiv = container.firstChild as HTMLElement;
      expect(backgroundDiv.style.opacity).toBe('0.5');
    });
  });

  describe('TitleLayer', () => {
    const defaultProps = {
      config: {
        text: 'Test Title',
        position: {
          top: 50,
          align: 'center' as const
        },
        style: {
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          opacity: 100
        },
        timeline: {
          startTime: 0,
          duration: 5
        }
      }
    };

    test('should render title layer', () => {
      const { getByText } = render(<TitleLayer {...defaultProps} />);
      expect(getByText('Test Title')).toBeTruthy();
    });

    test('should apply positioning', () => {
      const { container } = render(<TitleLayer {...defaultProps} />);
      const titleDiv = container.querySelector('div[style*="position"]') as HTMLElement;
      expect(titleDiv.style.top).toBe('50px');
    });

    test('should handle different alignments', () => {
      const alignments = ['left', 'center', 'right'] as const;
      alignments.forEach(align => {
        const props = {
          ...defaultProps,
          config: {
            ...defaultProps.config,
            position: { ...defaultProps.config.position, align }
          }
        };
        const { container } = render(<TitleLayer {...props} />);
        const titleDiv = container.querySelector('div[style*="position"]') as HTMLElement;
        expect(titleDiv.style.textAlign).toBe(align);
      });
    });
  });

  describe('DateLayer', () => {
    const defaultProps = {
      config: {
        position: {
          bottom: 50,
          right: 100
        },
        format: {
          pattern: 'YYYY-MM-DD',
          locale: 'en-US'
        },
        style: {
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          opacity: 80
        },
        animation: {
          type: 'fixed' as const,
          duration: 0.3
        }
      },
      currentDate: '2024-01-01'
    };

    test('should render date layer', () => {
      const { getByText } = render(<DateLayer {...defaultProps} />);
      expect(getByText('2024-01-01')).toBeTruthy();
    });

    test('should apply positioning', () => {
      const { container } = render(<DateLayer {...defaultProps} />);
      const dateDiv = container.querySelector('div[style*="position"]') as HTMLElement;
      expect(dateDiv.style.bottom).toBe('50px');
      expect(dateDiv.style.right).toBe('100px');
    });

    test('should format date correctly', () => {
      const patterns = [
        { pattern: 'YYYY-MM-DD', expected: '2024-01-01' },
        { pattern: 'MM/DD/YYYY', expected: '01/01/2024' },
        { pattern: 'DD/MM/YYYY', expected: '01/01/2024' },
        { pattern: 'YYYY/MM/DD', expected: '2024/01/01' }
      ];

      patterns.forEach(({ pattern, expected }) => {
        const props = {
          ...defaultProps,
          config: {
            ...defaultProps.config,
            format: { ...defaultProps.config.format, pattern }
          }
        };
        const { getByText } = render(<DateLayer {...props} />);
        expect(getByText(expected)).toBeTruthy();
      });
    });
  });

  describe('ChartLayer', () => {
    const defaultProps = {
      config: {
        position: {
          top: 100,
          right: 100,
          bottom: 100,
          left: 100
        },
        chart: {
          visibleItemCount: 5,
          maxValue: 'auto' as const,
          itemSpacing: 20
        },
        animation: {
          type: 'continuous' as const,
          overtakeDuration: 0.5
        },
        bar: {
          colors: ['#FF0000', '#00FF00', '#0000FF'],
          cornerRadius: 5,
          opacity: 90
        },
        labels: {
          title: {
            show: true,
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#FFFFFF',
            position: 'inside' as const
          },
          value: {
            show: true,
            fontSize: 14,
            fontFamily: 'Arial',
            color: '#FFFFFF',
            format: '{value}'
          },
          rank: {
            show: true,
            fontSize: 12,
            backgroundColor: '#333333',
            textColor: '#FFFFFF'
          }
        }
      },
      frameData: {
        frame: 0,
        date: '2024-01-01',
        items: [
          { id: 'item1', name: 'Item 1', value: 100, rank: 1 },
          { id: 'item2', name: 'Item 2', value: 80, rank: 2 },
          { id: 'item3', name: 'Item 3', value: 60, rank: 3 }
        ],
        maxValue: 100
      }
    };

    test('should render chart layer', () => {
      const { container } = render(<ChartLayer {...defaultProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    test('should render correct number of items', () => {
      const { container } = render(<ChartLayer {...defaultProps} />);
      const bars = container.querySelectorAll('[data-testid="bar-item"]');
      expect(bars.length).toBeLessThanOrEqual(defaultProps.config.chart.visibleItemCount);
    });

    test('should apply container dimensions', () => {
      const { container } = render(<ChartLayer {...defaultProps} />);
      const chartContainer = container.firstChild as HTMLElement;
      expect(chartContainer.style.position).toBe('absolute');
    });
  });

  describe('BarChartRaceComposition', () => {
    const validConfig = {
      output: {
        filename: "test.mp4",
        format: "mp4" as const,
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 5,
        quality: "high" as const
      },
      data: {
        csvPath: "./test.csv",
        dateColumn: "Date",
        dateFormat: "YYYY-MM-DD",
        valueColumns: ["Item1", "Item2"],
        interpolation: "smooth" as const
      },
      layers: {
        background: {
          color: "#000000",
          opacity: 100
        },
        chart: {
          position: {
            top: 100,
            right: 100,
            bottom: 100,
            left: 100
          },
          chart: {
            visibleItemCount: 10,
            maxValue: "auto" as const,
            itemSpacing: 20
          },
          animation: {
            type: "continuous" as const,
            overtakeDuration: 0.5
          },
          bar: {
            colors: ["#FF0000", "#00FF00"],
            cornerRadius: 5,
            opacity: 90
          },
          labels: {
            title: {
              show: true,
              fontSize: 16,
              fontFamily: "Arial",
              color: "#FFFFFF",
              position: "inside" as const
            },
            value: {
              show: true,
              fontSize: 14,
              fontFamily: "Arial",
              color: "#FFFFFF",
              format: "{value}"
            },
            rank: {
              show: true,
              fontSize: 12,
              backgroundColor: "#333333",
              textColor: "#FFFFFF"
            }
          }
        }
      }
    };

    const processedData = {
      frames: [
        {
          frame: 0,
          date: '2024-01-01',
          items: [
            { id: 'item1', name: 'Item 1', value: 100, rank: 1 },
            { id: 'item2', name: 'Item 2', value: 80, rank: 2 }
          ],
          maxValue: 100
        }
      ],
      totalFrames: 1,
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        categories: ['item1', 'item2'],
        maxGlobalValue: 100
      }
    };

    test('should render main composition', () => {
      const { container } = render(
        <BarChartRaceComposition
          config={validConfig}
          processedData={processedData}
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    test('should render all layers', () => {
      const { container } = render(
        <BarChartRaceComposition
          config={validConfig}
          processedData={processedData}
        />
      );
      
      // Check for background layer
      const backgroundLayer = container.querySelector('[data-testid="background-layer"]');
      expect(backgroundLayer).toBeTruthy();
      
      // Check for chart layer
      const chartLayer = container.querySelector('[data-testid="chart-layer"]');
      expect(chartLayer).toBeTruthy();
    });
  });
});