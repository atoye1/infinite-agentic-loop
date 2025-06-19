/**
 * PerformanceDashboard - Real-time performance monitoring and analytics dashboard
 */

import { EventEmitter } from 'events';
import { PerformanceMonitor, PerformanceMetrics, PerformanceAlert } from './PerformanceMonitor';
import { PerformanceProfiler, ProfileSection } from './PerformanceProfiler';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as http from 'http';
import * as WebSocket from 'ws';

export interface DashboardConfig {
  port?: number;
  updateInterval?: number;
  historyLimit?: number;
  enableWebInterface?: boolean;
  enableWebSocket?: boolean;
}

export interface DashboardMetrics {
  timestamp: number;
  system: {
    cpu: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  rendering: {
    activeRenders: number;
    queuedRenders: number;
    completedRenders: number;
    failedRenders: number;
    averageRenderTime: number;
    averageFrameRate: number;
  };
  performance: {
    bottlenecks: number;
    criticalAlerts: number;
    optimizationOpportunities: number;
    overallScore: number;
  };
}

export interface RenderJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  config: any;
  startTime?: number;
  endTime?: number;
  progress: number;
  metrics?: PerformanceMetrics;
  error?: string;
}

export class PerformanceDashboard extends EventEmitter {
  private monitor: PerformanceMonitor;
  private profiler: PerformanceProfiler;
  private optimizer: PerformanceOptimizer;
  private config: DashboardConfig;
  
  private server?: http.Server;
  private wss?: WebSocket.Server;
  private updateTimer?: NodeJS.Timeout;
  
  private metricsHistory: DashboardMetrics[] = [];
  private renderJobs: Map<string, RenderJob> = new Map();
  private alerts: PerformanceAlert[] = [];
  private isRunning = false;

  constructor(
    monitor: PerformanceMonitor,
    profiler: PerformanceProfiler,
    optimizer: PerformanceOptimizer,
    config: DashboardConfig = {}
  ) {
    super();
    this.monitor = monitor;
    this.profiler = profiler;
    this.optimizer = optimizer;
    this.config = {
      port: 3001,
      updateInterval: 1000,
      historyLimit: 1000,
      enableWebInterface: true,
      enableWebSocket: true,
      ...config,
    };

    this.setupEventListeners();
  }

  /**
   * Start the dashboard
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Start performance monitoring
    this.monitor.startMonitoring(this.config.updateInterval);

    // Start web server if enabled
    if (this.config.enableWebInterface) {
      await this.startWebServer();
    }

    // Start metrics collection
    this.startMetricsCollection();

    this.emit('dashboard:started');
  }

  /**
   * Stop the dashboard
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop monitoring
    this.monitor.stopMonitoring();

    // Stop timers
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    // Stop web server
    if (this.server) {
      this.server.close();
    }

    // Stop WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    this.emit('dashboard:stopped');
  }

  /**
   * Add a render job to tracking
   */
  addRenderJob(job: Omit<RenderJob, 'progress'>): void {
    const fullJob: RenderJob = {
      ...job,
      progress: 0,
    };
    
    this.renderJobs.set(job.id, fullJob);
    this.broadcastUpdate('job:added', fullJob);
  }

  /**
   * Update render job progress
   */
  updateRenderJob(id: string, updates: Partial<RenderJob>): void {
    const job = this.renderJobs.get(id);
    if (!job) {
      return;
    }

    Object.assign(job, updates);
    this.renderJobs.set(id, job);
    this.broadcastUpdate('job:updated', job);
  }

  /**
   * Get current dashboard state
   */
  getCurrentState(): {
    metrics: DashboardMetrics;
    jobs: RenderJob[];
    alerts: PerformanceAlert[];
    optimizationSuggestions: any[];
  } {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const jobs = Array.from(this.renderJobs.values());
    const optimizationSuggestions = this.optimizer.getOptimizationSuggestions();

    return {
      metrics: latestMetrics || this.createEmptyMetrics(),
      jobs,
      alerts: this.alerts.slice(-50), // Last 50 alerts
      optimizationSuggestions,
    };
  }

  /**
   * Generate performance summary report
   */
  async generateSummaryReport(outputPath: string): Promise<void> {
    const state = this.getCurrentState();
    const stats = this.monitor.getStats();
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalRenderJobs: this.renderJobs.size,
        completedJobs: Array.from(this.renderJobs.values()).filter(j => j.status === 'completed').length,
        failedJobs: Array.from(this.renderJobs.values()).filter(j => j.status === 'failed').length,
        averageRenderTime: this.calculateAverageRenderTime(),
        totalAlerts: this.alerts.length,
        criticalAlerts: this.alerts.filter(a => a.level === 'critical').length,
      },
      currentState: state,
      performanceStats: stats,
      recommendations: this.generateRecommendations(),
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    this.emit('report:generated', outputPath);
  }

  /**
   * Export dashboard data
   */
  exportData(): {
    metricsHistory: DashboardMetrics[];
    renderJobs: RenderJob[];
    alerts: PerformanceAlert[];
    config: DashboardConfig;
  } {
    return {
      metricsHistory: [...this.metricsHistory],
      renderJobs: Array.from(this.renderJobs.values()),
      alerts: [...this.alerts],
      config: this.config,
    };
  }

  /**
   * Import dashboard data
   */
  importData(data: {
    metricsHistory?: DashboardMetrics[];
    renderJobs?: RenderJob[];
    alerts?: PerformanceAlert[];
  }): void {
    if (data.metricsHistory) {
      this.metricsHistory = data.metricsHistory;
    }
    if (data.renderJobs) {
      this.renderJobs.clear();
      data.renderJobs.forEach(job => this.renderJobs.set(job.id, job));
    }
    if (data.alerts) {
      this.alerts = data.alerts;
    }
    
    this.emit('data:imported');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.monitor.on('metrics:recorded', (metrics: PerformanceMetrics) => {
      this.updateMetricsHistory(metrics);
    });

    this.monitor.on('alert', (alert: PerformanceAlert) => {
      this.alerts.push(alert);
      this.broadcastUpdate('alert:new', alert);
    });

    this.profiler.on('profile:ended', (profile: ProfileSection) => {
      this.analyzeProfile(profile);
    });
  }

  /**
   * Start web server
   */
  private async startWebServer(): Promise<void> {
    this.server = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    if (this.config.enableWebSocket) {
      this.wss = new WebSocket.Server({ server: this.server });
      this.setupWebSocketHandlers();
    }

    return new Promise((resolve, reject) => {
      this.server!.listen(this.config.port, () => {
        console.log(`Performance Dashboard running on http://localhost:${this.config.port}`);
        resolve();
      });

      this.server!.on('error', reject);
    });
  }

  /**
   * Handle HTTP requests
   */
  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url || '/';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    switch (url) {
      case '/':
        this.serveMainPage(res);
        break;
      case '/api/state':
        this.serveApiState(res);
        break;
      case '/api/metrics':
        this.serveApiMetrics(res);
        break;
      case '/api/jobs':
        this.serveApiJobs(res);
        break;
      case '/api/alerts':
        this.serveApiAlerts(res);
        break;
      default:
        res.writeHead(404);
        res.end('Not Found');
    }
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss!.on('connection', (ws) => {
      // Send initial state
      ws.send(JSON.stringify({
        type: 'initial-state',
        data: this.getCurrentState(),
      }));

      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'get-state':
        ws.send(JSON.stringify({
          type: 'state-update',
          data: this.getCurrentState(),
        }));
        break;
      case 'clear-alerts':
        this.alerts = [];
        this.broadcastUpdate('alerts:cleared', null);
        break;
      case 'export-data':
        ws.send(JSON.stringify({
          type: 'data-export',
          data: this.exportData(),
        }));
        break;
    }
  }

  /**
   * Broadcast update to all WebSocket clients
   */
  private broadcastUpdate(type: string, data: any): void {
    if (!this.wss) {
      return;
    }

    const message = JSON.stringify({ type, data });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.updateTimer = setInterval(() => {
      this.collectAndUpdateMetrics();
    }, this.config.updateInterval);
  }

  /**
   * Collect and update metrics
   */
  private collectAndUpdateMetrics(): void {
    const metrics = this.createCurrentMetrics();
    this.metricsHistory.push(metrics);

    // Trim history if too long
    if (this.metricsHistory.length > this.config.historyLimit!) {
      this.metricsHistory = this.metricsHistory.slice(-this.config.historyLimit!);
    }

    this.broadcastUpdate('metrics:update', metrics);
  }

  /**
   * Create current metrics snapshot
   */
  private createCurrentMetrics(): DashboardMetrics {
    const jobs = Array.from(this.renderJobs.values());
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const renderTimes = completedJobs
      .filter(j => j.startTime && j.endTime)
      .map(j => j.endTime! - j.startTime!);

    return {
      timestamp: Date.now(),
      system: {
        cpu: process.cpuUsage().user / 1000000, // Simplified CPU usage
        memory: {
          used: process.memoryUsage().rss,
          total: require('os').totalmem(),
          percentage: (process.memoryUsage().rss / require('os').totalmem()) * 100,
        },
        disk: {
          used: 0, // Would need disk usage calculation
          total: 0,
          percentage: 0,
        },
      },
      rendering: {
        activeRenders: jobs.filter(j => j.status === 'running').length,
        queuedRenders: jobs.filter(j => j.status === 'queued').length,
        completedRenders: completedJobs.length,
        failedRenders: jobs.filter(j => j.status === 'failed').length,
        averageRenderTime: renderTimes.length > 0 
          ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
          : 0,
        averageFrameRate: this.calculateAverageFrameRate(),
      },
      performance: {
        bottlenecks: 0, // Would be calculated from profiler data
        criticalAlerts: this.alerts.filter(a => a.level === 'critical').length,
        optimizationOpportunities: this.optimizer.getOptimizationSuggestions().length,
        overallScore: this.calculateOverallPerformanceScore(),
      },
    };
  }

  /**
   * Update metrics history
   */
  private updateMetricsHistory(metrics: PerformanceMetrics): void {
    // Convert performance metrics to dashboard metrics format
    const dashboardMetrics: DashboardMetrics = {
      timestamp: metrics.timestamp,
      system: {
        cpu: metrics.cpuUsage,
        memory: {
          used: metrics.memoryUsage.rss,
          total: require('os').totalmem(),
          percentage: (metrics.memoryUsage.rss / require('os').totalmem()) * 100,
        },
        disk: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      },
      rendering: {
        activeRenders: 1, // Assuming this metrics is from an active render
        queuedRenders: 0,
        completedRenders: this.renderJobs.size,
        failedRenders: 0,
        averageRenderTime: metrics.renderTime,
        averageFrameRate: metrics.framesPerSecond,
      },
      performance: {
        bottlenecks: 0,
        criticalAlerts: this.alerts.filter(a => a.level === 'critical').length,
        optimizationOpportunities: 0,
        overallScore: this.calculateOverallPerformanceScore(),
      },
    };

    this.metricsHistory.push(dashboardMetrics);
  }

  /**
   * Analyze profile data
   */
  private analyzeProfile(profile: ProfileSection): void {
    const bottlenecks = this.profiler.analyzeBottlenecks(profile);
    
    // Generate alerts for critical bottlenecks
    bottlenecks.filter(b => b.severity === 'critical').forEach(bottleneck => {
      const alert: PerformanceAlert = {
        level: 'critical',
        message: `Critical bottleneck detected in ${bottleneck.section}`,
        metric: 'profileTime',
        value: bottleneck.duration,
        threshold: 10000, // 10 seconds
        timestamp: Date.now(),
      };
      
      this.alerts.push(alert);
      this.broadcastUpdate('alert:new', alert);
    });
  }

  /**
   * Serve main dashboard page
   */
  private serveMainPage(res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(this.generateMainPageHTML());
  }

  /**
   * Serve API state
   */
  private serveApiState(res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.getCurrentState()));
  }

  /**
   * Serve API metrics
   */
  private serveApiMetrics(res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metricsHistory));
  }

  /**
   * Serve API jobs
   */
  private serveApiJobs(res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Array.from(this.renderJobs.values())));
  }

  /**
   * Serve API alerts
   */
  private serveApiAlerts(res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.alerts));
  }

  /**
   * Generate main page HTML
   */
  private generateMainPageHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Bar Chart Race Performance Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { margin: 10px 0; }
        .metric-label { font-weight: bold; color: #555; }
        .metric-value { font-size: 1.2em; color: #333; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .alert.critical { background: #ffebee; border-left: 4px solid #f44336; }
        .alert.warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .alert.info { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .job { padding: 10px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; }
        .job.running { border-left: 4px solid #4caf50; }
        .job.completed { border-left: 4px solid #2196f3; }
        .job.failed { border-left: 4px solid #f44336; }
        .progress-bar { width: 100%; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #4caf50; transition: width 0.3s; }
    </style>
</head>
<body>
    <h1>Bar Chart Race Performance Dashboard</h1>
    <div class="dashboard">
        <div class="card">
            <h2>System Metrics</h2>
            <div id="system-metrics"></div>
        </div>
        <div class="card">
            <h2>Rendering Status</h2>
            <div id="rendering-status"></div>
        </div>
        <div class="card">
            <h2>Active Jobs</h2>
            <div id="active-jobs"></div>
        </div>
        <div class="card">
            <h2>Recent Alerts</h2>
            <div id="recent-alerts"></div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:${this.config.port}');
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleUpdate(message);
        };

        function handleUpdate(message) {
            switch (message.type) {
                case 'initial-state':
                case 'state-update':
                    updateDashboard(message.data);
                    break;
                case 'job:updated':
                    updateJob(message.data);
                    break;
                case 'alert:new':
                    addAlert(message.data);
                    break;
            }
        }

        function updateDashboard(state) {
            updateSystemMetrics(state.metrics);
            updateRenderingStatus(state.metrics);
            updateActiveJobs(state.jobs);
            updateAlerts(state.alerts);
        }

        function updateSystemMetrics(metrics) {
            const container = document.getElementById('system-metrics');
            container.innerHTML = \`
                <div class="metric">
                    <div class="metric-label">CPU Usage</div>
                    <div class="metric-value">\${metrics.system.cpu.toFixed(1)}%</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Memory Usage</div>
                    <div class="metric-value">\${metrics.system.memory.percentage.toFixed(1)}%</div>
                </div>
            \`;
        }

        function updateRenderingStatus(metrics) {
            const container = document.getElementById('rendering-status');
            container.innerHTML = \`
                <div class="metric">
                    <div class="metric-label">Active Renders</div>
                    <div class="metric-value">\${metrics.rendering.activeRenders}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Completed</div>
                    <div class="metric-value">\${metrics.rendering.completedRenders}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Average Frame Rate</div>
                    <div class="metric-value">\${metrics.rendering.averageFrameRate.toFixed(2)} fps</div>
                </div>
            \`;
        }

        function updateActiveJobs(jobs) {
            const container = document.getElementById('active-jobs');
            container.innerHTML = jobs.slice(0, 5).map(job => \`
                <div class="job \${job.status}">
                    <strong>\${job.id}</strong> - \${job.status}
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${job.progress}%"></div>
                    </div>
                </div>
            \`).join('');
        }

        function updateAlerts(alerts) {
            const container = document.getElementById('recent-alerts');
            container.innerHTML = alerts.slice(-5).reverse().map(alert => \`
                <div class="alert \${alert.level}">
                    <strong>\${alert.level.toUpperCase()}</strong>: \${alert.message}
                </div>
            \`).join('');
        }

        // Request initial state
        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'get-state' }));
        };
    </script>
</body>
</html>
    `;
  }

  /**
   * Create empty metrics for initialization
   */
  private createEmptyMetrics(): DashboardMetrics {
    return {
      timestamp: Date.now(),
      system: {
        cpu: 0,
        memory: { used: 0, total: 0, percentage: 0 },
        disk: { used: 0, total: 0, percentage: 0 },
      },
      rendering: {
        activeRenders: 0,
        queuedRenders: 0,
        completedRenders: 0,
        failedRenders: 0,
        averageRenderTime: 0,
        averageFrameRate: 0,
      },
      performance: {
        bottlenecks: 0,
        criticalAlerts: 0,
        optimizationOpportunities: 0,
        overallScore: 0,
      },
    };
  }

  /**
   * Calculate average render time
   */
  private calculateAverageRenderTime(): number {
    const completedJobs = Array.from(this.renderJobs.values())
      .filter(j => j.status === 'completed' && j.startTime && j.endTime);
    
    if (completedJobs.length === 0) {
      return 0;
    }

    const totalTime = completedJobs.reduce((sum, job) => 
      sum + (job.endTime! - job.startTime!), 0);
    
    return totalTime / completedJobs.length;
  }

  /**
   * Calculate average frame rate
   */
  private calculateAverageFrameRate(): number {
    const jobsWithMetrics = Array.from(this.renderJobs.values())
      .filter(j => j.metrics?.framesPerSecond);
    
    if (jobsWithMetrics.length === 0) {
      return 0;
    }

    const totalFrameRate = jobsWithMetrics.reduce((sum, job) => 
      sum + job.metrics!.framesPerSecond, 0);
    
    return totalFrameRate / jobsWithMetrics.length;
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformanceScore(): number {
    const criticalAlerts = this.alerts.filter(a => a.level === 'critical').length;
    const warningAlerts = this.alerts.filter(a => a.level === 'warning').length;
    
    let score = 100;
    score -= criticalAlerts * 20;
    score -= warningAlerts * 5;
    
    return Math.max(0, score);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations = [];
    const state = this.getCurrentState();

    if (state.metrics.system.memory.percentage > 80) {
      recommendations.push('High memory usage detected. Consider reducing concurrency or batch size.');
    }

    if (state.metrics.system.cpu < 50) {
      recommendations.push('Low CPU utilization. Consider increasing concurrency for better performance.');
    }

    if (state.metrics.rendering.averageRenderTime > 300000) {
      recommendations.push('Long render times detected. Consider using lower quality settings.');
    }

    const criticalAlerts = this.alerts.filter(a => a.level === 'critical').length;
    if (criticalAlerts > 0) {
      recommendations.push(`${criticalAlerts} critical performance issues require immediate attention.`);
    }

    return recommendations;
  }
}