import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { RenderResult, RenderConfig } from './RenderPipeline';

export interface RenderMetadata {
  id: string;
  timestamp: string;
  compositionId: string;
  outputPath: string;
  format: string;
  quality: string;
  fileSize: number;
  duration: number;
  renderTime: number;
  success: boolean;
  error?: string;
  props?: Record<string, any>;
}

export interface ProjectMetadata {
  projectName: string;
  version: string;
  created: string;
  lastRender: string;
  totalRenders: number;
  renders: RenderMetadata[];
}

export class OutputManager {
  private outputDir: string;
  private metadataPath: string;

  constructor(outputDir: string = './output') {
    this.outputDir = path.resolve(outputDir);
    this.metadataPath = path.join(this.outputDir, '.metadata.json');
  }

  /**
   * Initialize output directory and metadata
   */
  async initialize(projectName: string = 'Bar Chart Race'): Promise<void> {
    // Create output directory if it doesn't exist
    if (!existsSync(this.outputDir)) {
      await fs.mkdir(this.outputDir, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['production', 'test', 'drafts', 'batch'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(this.outputDir, subdir);
      if (!existsSync(subdirPath)) {
        await fs.mkdir(subdirPath, { recursive: true });
      }
    }

    // Initialize metadata file if it doesn't exist
    if (!existsSync(this.metadataPath)) {
      const initialMetadata: ProjectMetadata = {
        projectName,
        version: '1.0.0',
        created: new Date().toISOString(),
        lastRender: new Date().toISOString(),
        totalRenders: 0,
        renders: [],
      };
      await this.saveMetadata(initialMetadata);
    }
  }

  /**
   * Record a render result in metadata
   */
  async recordRender(
    config: RenderConfig,
    result: RenderResult,
    renderTime: number
  ): Promise<void> {
    const metadata = await this.loadMetadata();
    
    const renderMetadata: RenderMetadata = {
      id: this.generateRenderId(),
      timestamp: new Date().toISOString(),
      compositionId: config.compositionId,
      outputPath: config.outputPath,
      format: config.format,
      quality: config.quality,
      fileSize: result.fileSize || 0,
      duration: result.duration || 0,
      renderTime,
      success: result.success,
      error: result.error?.message,
      props: config.props,
    };

    metadata.renders.unshift(renderMetadata); // Add to beginning
    metadata.totalRenders++;
    metadata.lastRender = renderMetadata.timestamp;

    // Keep only last 100 renders to prevent metadata from growing too large
    if (metadata.renders.length > 100) {
      metadata.renders = metadata.renders.slice(0, 100);
    }

    await this.saveMetadata(metadata);
  }

  /**
   * Get render history
   */
  async getRenderHistory(limit: number = 10): Promise<RenderMetadata[]> {
    const metadata = await this.loadMetadata();
    return metadata.renders.slice(0, limit);
  }

  /**
   * Get render statistics
   */
  async getRenderStats(): Promise<{
    totalRenders: number;
    successfulRenders: number;
    failedRenders: number;
    totalFileSize: number;
    totalRenderTime: number;
    averageRenderTime: number;
    qualityBreakdown: Record<string, number>;
    formatBreakdown: Record<string, number>;
  }> {
    const metadata = await this.loadMetadata();
    const successfulRenders = metadata.renders.filter(r => r.success);
    const failedRenders = metadata.renders.filter(r => !r.success);
    
    const totalFileSize = successfulRenders.reduce((sum, r) => sum + r.fileSize, 0);
    const totalRenderTime = metadata.renders.reduce((sum, r) => sum + r.renderTime, 0);
    const averageRenderTime = metadata.renders.length > 0 ? totalRenderTime / metadata.renders.length : 0;

    const qualityBreakdown = metadata.renders.reduce((acc, r) => {
      acc[r.quality] = (acc[r.quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const formatBreakdown = metadata.renders.reduce((acc, r) => {
      acc[r.format] = (acc[r.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRenders: metadata.totalRenders,
      successfulRenders: successfulRenders.length,
      failedRenders: failedRenders.length,
      totalFileSize,
      totalRenderTime,
      averageRenderTime,
      qualityBreakdown,
      formatBreakdown,
    };
  }

  /**
   * Clean up old renders
   */
  async cleanup(options: {
    keepDays?: number;
    keepSuccessful?: number;
    deleteFailed?: boolean;
  } = {}): Promise<{
    filesDeleted: number;
    spaceFreed: number;
  }> {
    const {
      keepDays = 30,
      keepSuccessful = 50,
      deleteFailed = true,
    } = options;

    const metadata = await this.loadMetadata();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    let filesDeleted = 0;
    let spaceFreed = 0;
    const updatedRenders: RenderMetadata[] = [];

    for (const render of metadata.renders) {
      const renderDate = new Date(render.timestamp);
      const shouldKeep = (
        // Keep if within date range
        renderDate > cutoffDate ||
        // Keep successful renders up to limit
        (render.success && updatedRenders.filter(r => r.success).length < keepSuccessful) ||
        // Keep failed renders if not deleting them
        (!render.success && !deleteFailed)
      );

      if (shouldKeep) {
        updatedRenders.push(render);
      } else {
        // Delete the file if it exists
        if (existsSync(render.outputPath)) {
          try {
            const stats = await fs.stat(render.outputPath);
            await fs.unlink(render.outputPath);
            filesDeleted++;
            spaceFreed += stats.size;
          } catch (error) {
            // File might already be deleted, continue
          }
        }
      }
    }

    metadata.renders = updatedRenders;
    await this.saveMetadata(metadata);

    return { filesDeleted, spaceFreed };
  }

  /**
   * Generate render report
   */
  async generateReport(): Promise<string> {
    const stats = await this.getRenderStats();
    const recentRenders = await this.getRenderHistory(5);
    
    const formatFileSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const formatTime = (ms: number): string => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    };

    return `
Bar Chart Race - Render Report
==============================
Generated: ${new Date().toLocaleString()}

📊 Statistics
-------------
Total Renders: ${stats.totalRenders}
Successful: ${stats.successfulRenders}
Failed: ${stats.failedRenders}
Success Rate: ${((stats.successfulRenders / stats.totalRenders) * 100).toFixed(1)}%

💾 Storage
----------
Total File Size: ${formatFileSize(stats.totalFileSize)}
Total Render Time: ${formatTime(stats.totalRenderTime)}
Average Render Time: ${formatTime(stats.averageRenderTime)}

🎨 Quality Breakdown
--------------------
${Object.entries(stats.qualityBreakdown)
  .map(([quality, count]) => `${quality}: ${count}`)
  .join('\n')}

📁 Format Breakdown
-------------------
${Object.entries(stats.formatBreakdown)
  .map(([format, count]) => `${format.toUpperCase()}: ${count}`)
  .join('\n')}

🕐 Recent Renders
-----------------
${recentRenders.map(render => 
  `${render.timestamp.slice(0, 19).replace('T', ' ')} - ${render.compositionId} (${render.format}, ${render.quality}) ${render.success ? '✅' : '❌'}`
).join('\n')}
`;
  }

  /**
   * Export render data as CSV
   */
  async exportToCsv(filePath?: string): Promise<string> {
    const metadata = await this.loadMetadata();
    const outputPath = filePath || path.join(this.outputDir, 'render-history.csv');

    const headers = [
      'ID',
      'Timestamp',
      'Composition',
      'Format',
      'Quality',
      'File Size',
      'Duration',
      'Render Time',
      'Success',
      'Error',
    ];

    const rows = metadata.renders.map(render => [
      render.id,
      render.timestamp,
      render.compositionId,
      render.format,
      render.quality,
      render.fileSize.toString(),
      render.duration.toString(),
      render.renderTime.toString(),
      render.success.toString(),
      render.error || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    await fs.writeFile(outputPath, csvContent);
    return outputPath;
  }

  /**
   * Get suggested output path for a new render
   */
  getSuggestedPath(
    compositionId: string,
    format: 'mp4' | 'webm',
    quality: string,
    category: 'production' | 'test' | 'draft' = 'production'
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${compositionId}_${quality}_${timestamp}.${format}`;
    return path.join(this.outputDir, category, filename);
  }

  /**
   * Load metadata from file
   */
  private async loadMetadata(): Promise<ProjectMetadata> {
    try {
      const content = await fs.readFile(this.metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Return default metadata if file doesn't exist or is corrupted
      return {
        projectName: 'Bar Chart Race',
        version: '1.0.0',
        created: new Date().toISOString(),
        lastRender: new Date().toISOString(),
        totalRenders: 0,
        renders: [],
      };
    }
  }

  /**
   * Save metadata to file
   */
  private async saveMetadata(metadata: ProjectMetadata): Promise<void> {
    await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Generate unique render ID
   */
  private generateRenderId(): string {
    return `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}