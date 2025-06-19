/**
 * Integration tests for the rendering pipeline
 */

import { RenderPipeline } from '../RenderPipeline';
import { OutputManager } from '../OutputManager';
import { BatchConfigBuilder, ExampleConfigs } from '../BatchConfig';
import { BarChartRaceRenderer } from '../BarChartRaceRenderer';
import { existsSync, promises as fs } from 'fs';
import * as path from 'path';

describe('Render Pipeline Integration', () => {
  const testOutputDir = path.join(__dirname, '../../test-output');
  
  beforeAll(async () => {
    // Clean up test directory
    if (existsSync(testOutputDir)) {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    // Clean up after tests
    if (existsSync(testOutputDir)) {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('RenderPipeline', () => {
    let pipeline: RenderPipeline;

    beforeEach(() => {
      pipeline = new RenderPipeline();
    });

    test('should get available compositions', async () => {
      const compositions = await pipeline.getAvailableCompositions();
      expect(compositions).toBeDefined();
      expect(Array.isArray(compositions)).toBe(true);
      expect(compositions.length).toBeGreaterThan(0);
      
      const firstComp = compositions[0];
      expect(firstComp).toHaveProperty('id');
      expect(firstComp).toHaveProperty('durationInFrames');
      expect(firstComp).toHaveProperty('fps');
      expect(firstComp).toHaveProperty('width');
      expect(firstComp).toHaveProperty('height');
    });

    test('should validate render configuration', () => {
      const validConfig = {
        compositionId: 'BarChartRace',
        outputPath: './test.mp4',
        format: 'mp4' as const,
        quality: 'medium' as const,
      };
      
      const errors = RenderPipeline.validateConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    test('should catch invalid configurations', () => {
      const invalidConfigs = [
        { compositionId: '', outputPath: './test.mp4', format: 'mp4', quality: 'medium' },
        { compositionId: 'Test', outputPath: '', format: 'mp4', quality: 'medium' },
        { compositionId: 'Test', outputPath: './test.mp4', format: 'avi', quality: 'medium' },
        { compositionId: 'Test', outputPath: './test.mp4', format: 'mp4', quality: 'ultra' },
      ];

      invalidConfigs.forEach(config => {
        const errors = RenderPipeline.validateConfig(config as any);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    test('should estimate file size correctly', () => {
      const testCases = [
        { frames: 150, fps: 30, quality: 'low', minSize: 0.5, maxSize: 5 },
        { frames: 150, fps: 30, quality: 'medium', minSize: 1, maxSize: 10 },
        { frames: 150, fps: 30, quality: 'high', minSize: 2, maxSize: 20 },
        { frames: 150, fps: 30, quality: 'max', minSize: 5, maxSize: 50 },
      ];

      testCases.forEach(({ frames, fps, quality, minSize, maxSize }) => {
        const size = RenderPipeline.estimateFileSize(frames, fps, quality as any);
        expect(size).toBeGreaterThan(minSize * 1024 * 1024); // MB to bytes
        expect(size).toBeLessThan(maxSize * 1024 * 1024);
      });
    });

    test('should create output paths correctly', () => {
      const outputPath = RenderPipeline.createOutputPath('./output', 'test', 'mp4', 'high');
      
      expect(outputPath).toContain('test');
      expect(outputPath).toContain('high');
      expect(outputPath).toEndWith('.mp4');
      expect(outputPath).toMatch(/test_high_\d{8}_\d{6}\.mp4$/);
    });

    test('should handle different formats in output path', () => {
      const formats = ['mp4', 'webm', 'gif'];
      formats.forEach(format => {
        const path = RenderPipeline.createOutputPath('./output', 'test', format, 'medium');
        expect(path).toEndWith(`.${format}`);
      });
    });
  });

  describe('OutputManager', () => {
    let outputManager: OutputManager;

    beforeEach(async () => {
      outputManager = new OutputManager(testOutputDir);
      await outputManager.initialize('Test Project');
    });

    test('should initialize directory structure', async () => {
      expect(existsSync(testOutputDir)).toBe(true);
      expect(existsSync(path.join(testOutputDir, 'renders.json'))).toBe(true);
    });

    test('should suggest unique paths', () => {
      const path1 = outputManager.getSuggestedPath('test', 'mp4', 'medium');
      const path2 = outputManager.getSuggestedPath('test', 'mp4', 'medium');
      
      expect(path1).not.toBe(path2);
      expect(path1).toContain('test');
      expect(path1).toContain('medium');
    });

    test('should track render statistics', async () => {
      const stats = await outputManager.getRenderStats();
      
      expect(stats).toHaveProperty('totalRenders');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('totalDuration');
      expect(stats).toHaveProperty('averageRenderTime');
      expect(stats).toHaveProperty('formatBreakdown');
      expect(stats).toHaveProperty('qualityBreakdown');
    });

    test('should generate reports', async () => {
      const report = await outputManager.generateReport();
      
      expect(report).toContain('Bar Chart Race Render Report');
      expect(report).toContain('Project:');
      expect(report).toContain('Statistics');
      expect(report).toContain('Total Renders:');
    });

    test('should organize files by date', async () => {
      // Simulate saving render info
      await outputManager.saveRenderInfo('test.mp4', {
        compositionId: 'Test',
        format: 'mp4',
        quality: 'high',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 150,
        renderTime: 5000,
        fileSize: 10 * 1024 * 1024
      });

      const stats = await outputManager.getRenderStats();
      expect(stats.totalRenders).toBe(1);
      expect(stats.formatBreakdown.mp4).toBe(1);
      expect(stats.qualityBreakdown.high).toBe(1);
    });
  });

  describe('BatchConfig', () => {
    test('should build batch configurations', () => {
      const config = new BatchConfigBuilder('Test Batch')
        .addRender({
          compositionId: 'BarChartRace',
          format: 'mp4',
          quality: 'medium',
        })
        .addRender({
          compositionId: 'BarChartRace',
          format: 'webm',
          quality: 'high',
        })
        .build();

      expect(config.name).toBe('Test Batch');
      expect(config.renders).toHaveLength(2);
      expect(config.renders[0].format).toBe('mp4');
      expect(config.renders[1].format).toBe('webm');
    });

    test('should add quality variants', () => {
      const config = new BatchConfigBuilder('Quality Test')
        .addQualityVariants('BarChartRace', 'mp4', ['low', 'medium', 'high'])
        .build();

      expect(config.renders).toHaveLength(3);
      expect(config.renders.map(r => r.quality)).toEqual(['low', 'medium', 'high']);
    });

    test('should add format variants', () => {
      const config = new BatchConfigBuilder('Format Test')
        .addFormatVariants('BarChartRace', ['mp4', 'webm'], 'high')
        .build();

      expect(config.renders).toHaveLength(2);
      expect(config.renders.map(r => r.format)).toEqual(['mp4', 'webm']);
    });

    test('should create example configurations', () => {
      const qualityConfig = ExampleConfigs.qualityComparison('BarChartRace');
      expect(qualityConfig.renders).toHaveLength(4);
      expect(qualityConfig.renders.map(r => r.quality)).toEqual(['low', 'medium', 'high', 'max']);

      const formatConfig = ExampleConfigs.formatComparison('BarChartRace');
      expect(formatConfig.renders).toHaveLength(2);
      expect(formatConfig.renders.map(r => r.format)).toEqual(['mp4', 'webm']);

      const productionConfig = ExampleConfigs.production('BarChartRace');
      expect(productionConfig.renders.every(r => r.quality === 'high')).toBe(true);
    });
  });

  describe('BarChartRaceRenderer', () => {
    let renderer: BarChartRaceRenderer;

    beforeEach(async () => {
      renderer = new BarChartRaceRenderer(path.join(testOutputDir, 'renderer'));
      await renderer.initialize('Test Renderer');
    });

    test('should initialize renderer', () => {
      expect(existsSync(path.join(testOutputDir, 'renderer'))).toBe(true);
    });

    test('should get compositions', async () => {
      const compositions = await renderer.getCompositions();
      expect(Array.isArray(compositions)).toBe(true);
      expect(compositions.length).toBeGreaterThan(0);
    });

    test('should estimate render requirements', async () => {
      const estimation = await renderer.estimateRender('BarChartRace', 'medium');
      
      expect(estimation).toHaveProperty('estimatedTime');
      expect(estimation).toHaveProperty('estimatedSize');
      expect(estimation).toHaveProperty('recommendedSettings');
      
      expect(estimation.estimatedTime).toBeGreaterThan(0);
      expect(estimation.estimatedSize).toBeGreaterThan(0);
    });

    test('should create batch builders', () => {
      const builder = renderer.createBatchBuilder('Test Batch');
      expect(builder).toBeDefined();
      
      const config = builder
        .addRender({ compositionId: 'BarChartRace', format: 'mp4', quality: 'medium' })
        .build();
      
      expect(config.name).toBe('Test Batch');
      expect(config.renders).toHaveLength(1);
    });

    test('should get statistics', async () => {
      const stats = await renderer.getStatistics();
      
      expect(stats).toHaveProperty('totalRenders');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('totalDuration');
    });
  });

  describe('End-to-End Pipeline', () => {
    test('should validate complete pipeline flow', async () => {
      // 1. Create renderer
      const renderer = new BarChartRaceRenderer(path.join(testOutputDir, 'e2e'));
      await renderer.initialize('E2E Test');

      // 2. Get available compositions
      const compositions = await renderer.getCompositions();
      expect(compositions.length).toBeGreaterThan(0);

      // 3. Create batch configuration
      const batchConfig = renderer.createBatchBuilder('E2E Batch')
        .addRender({
          compositionId: compositions[0].id,
          format: 'mp4',
          quality: 'low',
        })
        .build();

      expect(batchConfig.renders).toHaveLength(1);

      // 4. Estimate requirements
      const estimation = await renderer.estimateRender(compositions[0].id, 'low');
      expect(estimation.estimatedTime).toBeGreaterThan(0);

      // 5. Validate configuration
      const pipeline = new RenderPipeline();
      const errors = RenderPipeline.validateConfig({
        compositionId: compositions[0].id,
        outputPath: './test.mp4',
        format: 'mp4',
        quality: 'low',
      });
      expect(errors).toHaveLength(0);

      // 6. Check statistics
      const stats = await renderer.getStatistics();
      expect(stats.totalRenders).toBe(0); // No actual renders performed
    });
  });
});