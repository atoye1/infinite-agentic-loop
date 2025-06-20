/**
 * CompositionFactory - 동적 Remotion 컴포지션 생성 및 관리
 * CSV 파일별로 최적화된 컴포지션을 자동 생성하는 팩토리 패턴 구현
 */

import React from 'react';
import { z } from 'zod';
import { BuildTimeDataLoader, CSVMetadata } from '../dataprocessor/BuildTimeDataLoader.ts';
import { ConfigGenerator } from '../config/ConfigGenerator.ts';
import { DataProcessor } from '../dataprocessor/DataProcessor.ts';
import { BarChartRaceConfig, ProcessedData, barChartRaceSchema } from '../BarChartRace.tsx';

export interface CompositionMetadata {
  id: string;
  displayName: string;
  description: string;
  csvFile: string;
  config: BarChartRaceConfig;
  processedData: ProcessedData;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  schema: z.ZodType<any>;
}

export interface CompositionFactoryResult {
  compositions: CompositionMetadata[];
  totalCompositions: number;
  successCount: number;
  errors: string[];
}

export class CompositionFactory {
  private dataLoader: BuildTimeDataLoader;

  constructor() {
    this.dataLoader = new BuildTimeDataLoader();
  }

  /**
   * 모든 CSV 파일에 대해 동적으로 컴포지션 생성
   */
  async generateCompositions(): Promise<CompositionFactoryResult> {
    const result: CompositionFactoryResult = {
      compositions: [],
      totalCompositions: 0,
      successCount: 0,
      errors: []
    };

    try {
      console.log('CompositionFactory: Starting composition generation...');
      
      // 1. CSV 파일 스캔
      const scanResult = await this.dataLoader.scanCSVFiles();
      console.log(`CompositionFactory: Found ${scanResult.validFiles} valid CSV files`);
      result.totalCompositions = scanResult.validFiles;

      if (scanResult.errors.length > 0) {
        console.error('CompositionFactory: Scan errors:', scanResult.errors);
        result.errors.push(...scanResult.errors);
      }

      // 2. 각 CSV 파일에 대해 컴포지션 생성
      for (const csvMetadata of scanResult.csvFiles) {
        console.log(`CompositionFactory: Creating composition for ${csvMetadata.filename}...`);
        try {
          const composition = await this.createComposition(csvMetadata);
          result.compositions.push(composition);
          result.successCount++;
          console.log(`CompositionFactory: Successfully created composition for ${csvMetadata.filename}`);
        } catch (error) {
          const errorMsg = `Failed to create composition for ${csvMetadata.filename}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          console.error(`CompositionFactory: ${errorMsg}`, error);
          result.errors.push(errorMsg);
        }
      }

      // 3. 컴포지션 정렬 (파일명 순)
      result.compositions.sort((a, b) => a.csvFile.localeCompare(b.csvFile));
      
      console.log(`CompositionFactory: Generated ${result.successCount}/${result.totalCompositions} compositions successfully`);

    } catch (error) {
      const errorMsg = `Factory initialization failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(`CompositionFactory: ${errorMsg}`, error);
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * 단일 CSV 파일에 대해 컴포지션 생성
   */
  private async createComposition(csvMetadata: CSVMetadata): Promise<CompositionMetadata> {
    try {
      console.log(`CompositionFactory: Loading CSV content for ${csvMetadata.filename}...`);
      
      // 1. CSV 내용 로드
      const csvContent = await this.dataLoader.loadCSVContent(csvMetadata.filepath);
      console.log(`CompositionFactory: Loaded ${csvContent.length} characters from ${csvMetadata.filename}`);

      // 2. 템플릿 타입 결정
      const templateType = this.dataLoader.getTemplateTypeFromFilename(csvMetadata.filename);
      console.log(`CompositionFactory: Using template type '${templateType}' for ${csvMetadata.filename}`);

      // 3. 설정 생성
      const config = await this.generateConfigForCSV(csvMetadata, templateType);

      // 4. 데이터 처리
      console.log(`CompositionFactory: Processing CSV data for ${csvMetadata.filename}...`);
      const processedData = await this.processCSVData(csvContent, csvMetadata, config);
      console.log(`CompositionFactory: Processed ${processedData.totalFrames} frames for ${csvMetadata.filename}`);

      // 5. 컴포지션 메타데이터 생성
      const compositionId = this.generateCompositionId(csvMetadata.filename);
      const displayName = this.generateDisplayName(csvMetadata.filename);
      const description = this.generateDescription(csvMetadata, templateType);

      console.log(`CompositionFactory: Created composition '${compositionId}' for ${csvMetadata.filename}`);

      return {
        id: compositionId,
        displayName,
        description,
        csvFile: csvMetadata.filename,
        config,
        processedData,
        durationInFrames: config.output.duration * config.output.fps,
        fps: config.output.fps,
        width: config.output.width,
        height: config.output.height,
        schema: barChartRaceSchema
      };
    } catch (error) {
      console.error(`CompositionFactory: Error in createComposition for ${csvMetadata.filename}:`, error);
      throw error;
    }
  }

  /**
   * CSV 메타데이터 기반 설정 생성
   */
  private async generateConfigForCSV(
    csvMetadata: CSVMetadata, 
    templateType: string
  ): Promise<BarChartRaceConfig> {
    // 기본 템플릿 로드
    const baseConfig = this.getBaseConfigForTemplate(templateType);

    // CSV 특성에 맞게 설정 조정
    const customizedConfig: BarChartRaceConfig = {
      ...baseConfig,
      data: {
        ...baseConfig.data,
        csvPath: csvMetadata.filepath,
        dateColumn: csvMetadata.dateColumn || 'Date',
        dateFormat: csvMetadata.estimatedDateFormat || 'YYYY-MM-DD',
        valueColumns: csvMetadata.valueColumns,
      },
      layers: {
        ...baseConfig.layers,
        title: {
          ...baseConfig.layers.title!,
          text: this.generateTitleFromFilename(csvMetadata.filename)
        }
      }
    };

    // 색상 자동 생성 (값 컬럼 개수에 맞춰)
    if (customizedConfig.layers.chart.bar.colors === 'auto') {
      customizedConfig.layers.chart.bar.colors = this.generateColors(
        csvMetadata.valueColumns.length,
        templateType
      );
    }

    return customizedConfig;
  }

  /**
   * 템플릿 타입별 기본 설정 반환
   */
  private getBaseConfigForTemplate(templateType: string): BarChartRaceConfig {
    const baseConfig: BarChartRaceConfig = {
      output: {
        filename: "auto-generated.mp4",
        format: "mp4",
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 10,
        quality: "high",
      },
      data: {
        csvPath: "",
        dateColumn: "Date",
        dateFormat: "YYYY-MM-DD",
        valueColumns: [],
        interpolation: "smooth",
      },
      layers: {
        background: {
          color: "#1a1a2e",
          opacity: 100,
        },
        chart: {
          position: { top: 120, right: 80, bottom: 120, left: 80 },
          chart: { visibleItemCount: 10, maxValue: "local", itemSpacing: 15 },
          animation: { type: "continuous", overtakeDuration: 0.8 },
          bar: { colors: "auto", cornerRadius: 8, opacity: 90 },
          labels: {
            title: {
              show: true,
              fontSize: 22,
              fontFamily: "Inter, Arial, sans-serif",
              color: "#ffffff",
              position: "outside",
            },
            value: {
              show: true,
              fontSize: 18,
              fontFamily: "Inter, Arial, sans-serif",
              color: "#ffffff",
              format: "{value:,.0f}",
            },
            rank: {
              show: true,
              fontSize: 16,
              backgroundColor: "#0f3460",
              textColor: "#ffffff",
            },
          },
        },
        title: {
          text: "Bar Chart Race",
          position: { top: 40, align: "center" },
          style: {
            fontSize: 42,
            fontFamily: "Inter, Arial, sans-serif",
            color: "#ffffff",
            opacity: 100,
          },
          timeline: { startTime: 0, duration: 10 },
        },
        date: {
          position: { bottom: 40, right: 80 },
          format: { pattern: "MMMM YYYY", locale: "en-US" },
          style: {
            fontSize: 28,
            fontFamily: "Inter, Arial, sans-serif",
            color: "#ffffff",
            opacity: 85,
          },
          animation: { type: "continuous", duration: 0.5 },
        },
      },
    };

    // 템플릿별 커스터마이징
    switch (templateType) {
      case 'social':
        baseConfig.output.width = 1080;
        baseConfig.output.height = 1920; // 세로 포맷
        baseConfig.output.duration = 30;
        baseConfig.layers.background.color = "#FF6B6B";
        break;
      
      case 'business':
        baseConfig.layers.background.color = "#2C3E50";
        baseConfig.output.duration = 15;
        baseConfig.layers.chart.labels.value.format = "${value:,.0f}";
        break;
      
      case 'sports':
        baseConfig.layers.background.color = "#27AE60";
        baseConfig.output.fps = 60;
        baseConfig.layers.chart.animation.overtakeDuration = 0.5;
        break;
      
      case 'gaming':
        baseConfig.layers.background.color = "#8E44AD";
        baseConfig.output.fps = 60;
        baseConfig.output.duration = 20;
        break;
      
      case 'educational':
        baseConfig.layers.background.color = "#3498DB";
        baseConfig.output.duration = 25;
        break;
    }

    return baseConfig;
  }

  /**
   * CSV 데이터 처리
   */
  private async processCSVData(
    csvContent: string,
    csvMetadata: CSVMetadata,
    config: BarChartRaceConfig
  ): Promise<ProcessedData> {
    const processor = new DataProcessor({
      dateColumn: config.data.dateColumn,
      valueColumns: config.data.valueColumns,
      dateFormat: csvMetadata.estimatedDateFormat || 'YYYY-MM' as any,
      interpolationMethod: config.data.interpolation as any,
      fps: config.output.fps,
      topN: config.layers.chart.chart.visibleItemCount
    });

    processor.parseCSV(csvContent);
    processor.transformData();
    const frameData = processor.generateFrameData(config.output.duration);

    return frameData;
  }

  /**
   * 컴포지션 ID 생성
   */
  private generateCompositionId(filename: string): string {
    const baseName = filename.replace(/\.csv$/i, '');
    const cleanName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `BarChartRace-${cleanName}`;
  }

  /**
   * 표시명 생성
   */
  private generateDisplayName(filename: string): string {
    const baseName = filename.replace(/\.csv$/i, '');
    
    // 케밥 케이스를 타이틀 케이스로 변환
    return baseName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * 설명 생성
   */
  private generateDescription(csvMetadata: CSVMetadata, templateType: string): string {
    const { valueColumns, rowCount } = csvMetadata;
    const dataDescription = `${rowCount} data points across ${valueColumns.length} categories`;
    const templateDescription = this.getTemplateDescription(templateType);
    
    return `${templateDescription} - ${dataDescription}`;
  }

  /**
   * 템플릿별 설명 반환
   */
  private getTemplateDescription(templateType: string): string {
    switch (templateType) {
      case 'social': return 'Social Media Optimized';
      case 'business': return 'Business Presentation Style';
      case 'sports': return 'Sports Competition Format';
      case 'gaming': return 'Gaming/Entertainment Style';
      case 'educational': return 'Educational Content';
      case 'demo': return 'Demo/Test Configuration';
      default: return 'Standard Bar Chart Race';
    }
  }

  /**
   * 파일명에서 제목 생성
   */
  private generateTitleFromFilename(filename: string): string {
    const baseName = filename.replace(/\.csv$/i, '');
    
    // 특별한 키워드 처리
    const specialTitles: Record<string, string> = {
      'sample-data': 'Streaming Platforms Race',
      'animation-trigger-data': 'Platform Growth Animation',
      'animation-trigger-data-dramatic': 'Dramatic Platform Battle',
      'animation-trigger-data-extreme': 'Extreme Competition Race',
      'test-data': 'Test Data Visualization'
    };

    if (specialTitles[baseName]) {
      return specialTitles[baseName];
    }

    // 일반적인 변환
    return baseName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') + ' Race';
  }

  /**
   * 템플릿별 색상 생성
   */
  private generateColors(count: number, templateType: string): string[] {
    const colorSchemes: Record<string, string[]> = {
      social: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
      business: ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'],
      sports: ['#27AE60', '#E67E22', '#3498DB', '#E74C3C', '#9B59B6', '#F1C40F'],
      gaming: ['#8E44AD', '#E74C3C', '#F39C12', '#27AE60', '#3498DB', '#E67E22'],
      educational: ['#3498DB', '#2ECC71', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C'],
      default: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    };

    const scheme = colorSchemes[templateType] || colorSchemes.default;
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      colors.push(scheme[i % scheme.length]);
    }

    return colors;
  }
}