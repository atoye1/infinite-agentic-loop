/**
 * PerformanceProfiler - Advanced profiling tools for render pipeline optimization
 */

import { PerformanceMonitor } from './PerformanceMonitor';
import { performance, PerformanceObserver } from 'perf_hooks';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ProfileSection {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  children: ProfileSection[];
  metadata: Record<string, any>;
}

export interface BottleneckAnalysis {
  section: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  percentage: number;
  suggestions: string[];
}

export interface PerformanceFlameGraph {
  name: string;
  value: number;
  children: PerformanceFlameGraph[];
}

export class PerformanceProfiler {
  private monitor: PerformanceMonitor;
  private observer: PerformanceObserver;
  private profileSections: Map<string, ProfileSection> = new Map();
  private sectionStack: ProfileSection[] = [];
  private isActive = false;

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
    this.setupPerformanceObserver();
  }

  /**
   * Start profiling session
   */
  startProfiling(sessionName: string): void {
    if (this.isActive) {
      this.stopProfiling();
    }

    this.isActive = true;
    this.profileSections.clear();
    this.sectionStack = [];
    
    // Start root section
    this.startSection(sessionName, { type: 'root' });
    
    // Start performance observer
    this.observer.observe({ entryTypes: ['measure', 'mark'] });
  }

  /**
   * Stop profiling session
   */
  stopProfiling(): ProfileSection | null {
    if (!this.isActive) {
      return null;
    }

    this.isActive = false;
    this.observer.disconnect();

    // End all open sections
    while (this.sectionStack.length > 0) {
      this.endSection();
    }

    const rootSection = Array.from(this.profileSections.values())[0];
    return rootSection || null;
  }

  /**
   * Start a new profile section
   */
  startSection(name: string, metadata: Record<string, any> = {}): void {
    if (!this.isActive) {
      return;
    }

    const section: ProfileSection = {
      name,
      startTime: performance.now(),
      children: [],
      metadata,
    };

    // Add to parent's children if there's a parent
    if (this.sectionStack.length > 0) {
      const parent = this.sectionStack[this.sectionStack.length - 1];
      parent.children.push(section);
    }

    this.sectionStack.push(section);
    this.profileSections.set(name, section);

    // Create performance mark
    performance.mark(`${name}-start`);
  }

  /**
   * End current profile section
   */
  endSection(metadata: Record<string, any> = {}): ProfileSection | null {
    if (!this.isActive || this.sectionStack.length === 0) {
      return null;
    }

    const section = this.sectionStack.pop()!;
    section.endTime = performance.now();
    section.duration = section.endTime - section.startTime;
    section.metadata = { ...section.metadata, ...metadata };

    // Create performance mark and measure
    performance.mark(`${section.name}-end`);
    performance.measure(section.name, `${section.name}-start`, `${section.name}-end`);

    return section;
  }

  /**
   * Profile a function execution
   */
  async profileFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    this.startSection(name, metadata);
    
    try {
      const result = await fn();
      this.endSection({ success: true });
      return result;
    } catch (error) {
      this.endSection({ success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Analyze bottlenecks in profile data
   */
  analyzeBottlenecks(profileData: ProfileSection): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];
    const totalDuration = profileData.duration || 0;

    if (totalDuration === 0) {
      return bottlenecks;
    }

    // Recursive function to analyze sections
    const analyzeSections = (sections: ProfileSection[], parentName = '') => {
      sections.forEach(section => {
        if (!section.duration) return;

        const percentage = (section.duration / totalDuration) * 100;
        const fullName = parentName ? `${parentName}.${section.name}` : section.name;

        // Determine severity based on percentage and absolute time
        let severity: BottleneckAnalysis['severity'] = 'low';
        if (percentage > 30 || section.duration > 10000) {
          severity = 'critical';
        } else if (percentage > 20 || section.duration > 5000) {
          severity = 'high';
        } else if (percentage > 10 || section.duration > 2000) {
          severity = 'medium';
        }

        const suggestions = this.generateOptimizationSuggestions(section, percentage);

        if (severity !== 'low' || suggestions.length > 0) {
          bottlenecks.push({
            section: fullName,
            severity,
            duration: section.duration,
            percentage,
            suggestions,
          });
        }

        // Recursively analyze children
        if (section.children.length > 0) {
          analyzeSections(section.children, fullName);
        }
      });
    };

    analyzeSections([profileData]);
    
    // Sort by severity and duration
    bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.duration - a.duration;
    });

    return bottlenecks;
  }

  /**
   * Generate flame graph data
   */
  generateFlameGraph(profileData: ProfileSection): PerformanceFlameGraph {
    const generateNode = (section: ProfileSection): PerformanceFlameGraph => {
      return {
        name: section.name,
        value: section.duration || 0,
        children: section.children.map(generateNode),
      };
    };

    return generateNode(profileData);
  }

  /**
   * Generate detailed performance report
   */
  async generateDetailedReport(
    profileData: ProfileSection,
    outputPath: string
  ): Promise<void> {
    const bottlenecks = this.analyzeBottlenecks(profileData);
    const flameGraph = this.generateFlameGraph(profileData);
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalDuration: profileData.duration,
        totalSections: this.countSections(profileData),
        bottleneckCount: bottlenecks.length,
        criticalBottlenecks: bottlenecks.filter(b => b.severity === 'critical').length,
      },
      profileData,
      bottlenecks,
      flameGraph,
      optimizationSummary: this.generateOptimizationSummary(bottlenecks),
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  }

  /**
   * Generate HTML report with interactive visualizations
   */
  async generateHTMLReport(
    profileData: ProfileSection,
    outputPath: string
  ): Promise<void> {
    const bottlenecks = this.analyzeBottlenecks(profileData);
    const flameGraph = this.generateFlameGraph(profileData);
    
    const html = this.generateHTMLTemplate(profileData, bottlenecks, flameGraph);
    await fs.writeFile(outputPath, html);
  }

  /**
   * Compare two profile sessions
   */
  compareProfiles(
    profile1: ProfileSection,
    profile2: ProfileSection
  ): {
    improvements: Array<{ section: string; improvement: number; percentage: number }>;
    regressions: Array<{ section: string; regression: number; percentage: number }>;
    summary: {
      totalImprovement: number;
      totalRegression: number;
      netChange: number;
    };
  } {
    const improvements = [];
    const regressions = [];
    
    const compare = (section1: ProfileSection, section2: ProfileSection, path = '') => {
      const sectionPath = path ? `${path}.${section1.name}` : section1.name;
      
      if (section1.duration && section2.duration) {
        const diff = section1.duration - section2.duration;
        const percentage = (diff / section1.duration) * 100;
        
        if (diff > 0) {
          improvements.push({
            section: sectionPath,
            improvement: diff,
            percentage: Math.abs(percentage),
          });
        } else if (diff < 0) {
          regressions.push({
            section: sectionPath,
            regression: Math.abs(diff),
            percentage: Math.abs(percentage),
          });
        }
      }
      
      // Compare children
      const childMap1 = new Map(section1.children.map(c => [c.name, c]));
      const childMap2 = new Map(section2.children.map(c => [c.name, c]));
      
      for (const [name, child1] of childMap1) {
        const child2 = childMap2.get(name);
        if (child2) {
          compare(child1, child2, sectionPath);
        }
      }
    };
    
    compare(profile1, profile2);
    
    const totalImprovement = improvements.reduce((sum, imp) => sum + imp.improvement, 0);
    const totalRegression = regressions.reduce((sum, reg) => sum + reg.regression, 0);
    
    return {
      improvements: improvements.sort((a, b) => b.improvement - a.improvement),
      regressions: regressions.sort((a, b) => b.regression - a.regression),
      summary: {
        totalImprovement,
        totalRegression,
        netChange: totalImprovement - totalRegression,
      },
    };
  }

  /**
   * Setup performance observer
   */
  private setupPerformanceObserver(): void {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'measure') {
          // Additional processing for performance entries if needed
        }
      });
    });
  }

  /**
   * Generate optimization suggestions for a section
   */
  private generateOptimizationSuggestions(
    section: ProfileSection,
    percentage: number
  ): string[] {
    const suggestions = [];
    
    // Generic suggestions based on section name patterns
    if (section.name.includes('bundle')) {
      if (percentage > 20) {
        suggestions.push('Consider optimizing bundle size or using incremental bundling');
        suggestions.push('Enable webpack caching to speed up subsequent builds');
      }
    }
    
    if (section.name.includes('render')) {
      if (percentage > 40) {
        suggestions.push('Consider reducing render quality for faster processing');
        suggestions.push('Optimize component rendering or use frame skipping');
      }
    }
    
    if (section.name.includes('data')) {
      if (percentage > 15) {
        suggestions.push('Consider caching processed data or using streaming');
        suggestions.push('Optimize data transformation algorithms');
      }
    }
    
    if (section.name.includes('io') || section.name.includes('file')) {
      if (percentage > 10) {
        suggestions.push('Consider using faster storage or parallel I/O');
        suggestions.push('Implement data compression to reduce I/O overhead');
      }
    }
    
    // Suggestions based on duration
    if (section.duration && section.duration > 30000) {
      suggestions.push('Consider breaking this operation into smaller chunks');
      suggestions.push('Add progress reporting for long-running operations');
    }
    
    return suggestions;
  }

  /**
   * Count total sections in profile
   */
  private countSections(section: ProfileSection): number {
    let count = 1;
    section.children.forEach(child => {
      count += this.countSections(child);
    });
    return count;
  }

  /**
   * Generate optimization summary
   */
  private generateOptimizationSummary(bottlenecks: BottleneckAnalysis[]): {
    priorityActions: string[];
    estimatedImpact: string;
    focusAreas: string[];
  } {
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical');
    const highBottlenecks = bottlenecks.filter(b => b.severity === 'high');
    
    const priorityActions = [];
    const focusAreas = new Set<string>();
    
    criticalBottlenecks.forEach(bottleneck => {
      priorityActions.push(`CRITICAL: Optimize ${bottleneck.section} (${bottleneck.percentage.toFixed(1)}% of total time)`);
      focusAreas.add(bottleneck.section.split('.')[0]);
    });
    
    highBottlenecks.slice(0, 3).forEach(bottleneck => {
      priorityActions.push(`HIGH: Improve ${bottleneck.section} (${bottleneck.percentage.toFixed(1)}% of total time)`);
      focusAreas.add(bottleneck.section.split('.')[0]);
    });
    
    const estimatedImpact = criticalBottlenecks.length > 0 
      ? `Addressing critical bottlenecks could improve performance by ${criticalBottlenecks.reduce((sum, b) => sum + b.percentage, 0).toFixed(1)}%`
      : 'Performance appears to be well-optimized';
    
    return {
      priorityActions,
      estimatedImpact,
      focusAreas: Array.from(focusAreas),
    };
  }

  /**
   * Generate HTML template for interactive report
   */
  private generateHTMLTemplate(
    profileData: ProfileSection,
    bottlenecks: BottleneckAnalysis[],
    flameGraph: PerformanceFlameGraph
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Profile Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .critical { border-left: 5px solid #ff4444; }
        .high { border-left: 5px solid #ff8800; }
        .medium { border-left: 5px solid #ffaa00; }
        .low { border-left: 5px solid #88cc00; }
        .flame-graph { width: 100%; height: 400px; border: 1px solid #ccc; }
        .bottleneck { margin: 10px 0; padding: 10px; background: #f5f5f5; }
        .suggestions { margin: 10px 0; padding: 10px; background: #e8f4f8; }
        .suggestion { margin: 5px 0; padding: 5px; background: white; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Performance Profile Report</h1>
    <div class="section">
        <h2>Summary</h2>
        <p><strong>Total Duration:</strong> ${(profileData.duration || 0).toFixed(2)}ms</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Bottlenecks Found:</strong> ${bottlenecks.length}</p>
    </div>

    <div class="section">
        <h2>Bottleneck Analysis</h2>
        ${bottlenecks.map(bottleneck => `
            <div class="bottleneck ${bottleneck.severity}">
                <h3>${bottleneck.section}</h3>
                <p><strong>Duration:</strong> ${bottleneck.duration.toFixed(2)}ms (${bottleneck.percentage.toFixed(1)}%)</p>
                <p><strong>Severity:</strong> ${bottleneck.severity.toUpperCase()}</p>
                ${bottleneck.suggestions.length > 0 ? `
                    <div class="suggestions">
                        <h4>Suggestions:</h4>
                        ${bottleneck.suggestions.map(suggestion => `
                            <div class="suggestion">${suggestion}</div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Flame Graph</h2>
        <div class="flame-graph">
            <pre>${JSON.stringify(flameGraph, null, 2)}</pre>
        </div>
    </div>

    <div class="section">
        <h2>Raw Profile Data</h2>
        <details>
            <summary>Click to expand</summary>
            <pre>${JSON.stringify(profileData, null, 2)}</pre>
        </details>
    </div>
</body>
</html>
    `;
  }
}