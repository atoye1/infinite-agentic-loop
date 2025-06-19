import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { BarChartRaceConfig, RawData, TimeSeries, FrameData, ProcessedData } from '../types';

export class DataProcessor {
  async processData(csvPath: string, config: BarChartRaceConfig): Promise<ProcessedData> {
    try {
      // Step 1: Parse CSV
      const rawData = await this.parseCSV(csvPath);
      
      // Step 2: Convert to time series
      const timeSeries = this.convertToTimeSeries(rawData, config);
      
      // Step 3: Interpolate frames
      const frameData = this.interpolateFrames(timeSeries, config);
      
      // Step 4: Calculate ranks
      const rankedFrameData = this.calculateRanks(frameData);
      
      // Step 5: Calculate metadata
      const maxValue = this.calculateMaxValue(rankedFrameData, config.layers.chart.chart.maxValue);
      
      return {
        frames: rankedFrameData,
        maxValue,
        totalFrames: rankedFrameData.length
      };
      
    } catch (error) {
      throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async parseCSV(filePath: string): Promise<RawData> {
    const resolvedPath = path.resolve(filePath);
    
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      let headers: string[] = [];
      
      fs.createReadStream(resolvedPath)
        .pipe(csv())
        .on('headers', (headerList: string[]) => {
          headers = headerList;
        })
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          resolve({
            headers,
            rows
          });
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }
  
  private convertToTimeSeries(rawData: RawData, config: BarChartRaceConfig): TimeSeries {
    const dates: Date[] = [];
    const data: Record<string, number[]> = {};
    
    // Initialize data structure
    config.data.valueColumns.forEach(column => {
      data[column] = [];
    });
    
    // Process each row
    rawData.rows.forEach(row => {
      // Parse date
      const dateString = row[config.data.dateColumn];
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateString}`);
      }
      
      dates.push(date);
      
      // Extract values
      config.data.valueColumns.forEach(column => {
        const value = parseFloat(row[column]);
        if (isNaN(value)) {
          data[column].push(0); // Use 0 for missing values
        } else {
          data[column].push(value);
        }
      });
    });
    
    return {
      dates,
      data
    };
  }
  
  private interpolateFrames(timeSeries: TimeSeries, config: BarChartRaceConfig): FrameData[] {
    const totalFrames = config.output.fps * config.output.duration;
    const frames: FrameData[] = [];
    
    // If we have fewer data points than frames, we need to interpolate
    const dataPoints = timeSeries.dates.length;
    
    for (let frame = 0; frame < totalFrames; frame++) {
      // Calculate which data point(s) this frame corresponds to
      const dataPosition = (frame / totalFrames) * (dataPoints - 1);
      const dataIndex = Math.floor(dataPosition);
      const nextIndex = Math.min(dataIndex + 1, dataPoints - 1);
      const interpolationFactor = dataPosition - dataIndex;
      
      // Interpolate date
      const currentDate = timeSeries.dates[dataIndex];
      const nextDate = timeSeries.dates[nextIndex];
      const interpolatedTime = currentDate.getTime() + 
        (nextDate.getTime() - currentDate.getTime()) * interpolationFactor;
      const frameDate = new Date(interpolatedTime);
      
      // Interpolate values for each column
      const items = config.data.valueColumns.map(column => {
        const currentValue = timeSeries.data[column][dataIndex];
        const nextValue = timeSeries.data[column][nextIndex];
        
        let interpolatedValue: number;
        
        switch (config.data.interpolation) {
          case 'linear':
            interpolatedValue = currentValue + (nextValue - currentValue) * interpolationFactor;
            break;
          case 'smooth':
            // Use eased interpolation for smoother transitions
            const easedFactor = this.easeInOutCubic(interpolationFactor);
            interpolatedValue = currentValue + (nextValue - currentValue) * easedFactor;
            break;
          case 'step':
            interpolatedValue = currentValue;
            break;
          default:
            interpolatedValue = currentValue;
        }
        
        return {
          id: column,
          value: Math.max(0, interpolatedValue), // Ensure non-negative values
          rank: 0 // Will be calculated later
        };
      });
      
      frames.push({
        date: frameDate,
        items
      });
    }
    
    return frames;
  }
  
  private calculateRanks(frames: FrameData[]): FrameData[] {
    return frames.map(frame => ({
      ...frame,
      items: frame.items
        .sort((a, b) => b.value - a.value) // Sort by value descending
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }))
    }));
  }
  
  private calculateMaxValue(frames: FrameData[], maxValueType: 'local' | 'global'): number {
    if (maxValueType === 'global') {
      // Find the maximum value across all frames
      let globalMax = 0;
      frames.forEach(frame => {
        frame.items.forEach(item => {
          globalMax = Math.max(globalMax, item.value);
        });
      });
      return globalMax;
    } else {
      // For local max, we'll calculate it per frame during rendering
      // Return a reasonable default for now
      return Math.max(...frames.map(frame => 
        Math.max(...frame.items.map(item => item.value))
      ));
    }
  }
  
  private easeInOutCubic(t: number): number {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}