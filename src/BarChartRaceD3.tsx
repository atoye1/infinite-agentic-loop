import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import * as d3 from 'd3';
import { z } from 'zod';
import { BuildTimeDataLoader } from './dataprocessor/BuildTimeDataLoader';

// ===========================
// Type Definitions
// ===========================

interface D3DataPoint {
  date: Date;
  name: string;
  value: number;
  rank: number;
  category?: string;
  color?: string;
}

interface D3Keyframe {
  date: Date;
  data: D3DataPoint[];
}

interface D3Config {
  data: {
    csvPath: string;
    dateColumn: string;
    dateFormat: string;
    valueColumns: string[];
  };
  animation: {
    duration: number;
    interpolationFrames: number;
    easing: string;
  };
  chart: {
    visibleBars: number;
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    barSize: number;
  };
  styling: {
    background: string;
    colorScheme: string;
    fontSize: number;
    fontFamily: string;
  };
}

interface D3RawDataPoint {
  date: string;
  [key: string]: string | number;
}

interface D3ProcessedData {
  keyframes: D3Keyframe[];
  dateRange: {
    start: Date;
    end: Date;
  };
  valueColumns: string[];
  maxValue: number;
  categories: Set<string>;
}

interface D3Scales {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleBand<string>;
  color: d3.ScaleOrdinal<string, string>;
}

interface D3BarChartRaceProps {
  config: D3Config;
}

// ===========================
// Zod Schema
// ===========================

export const d3BarChartRaceSchema = z.object({
  config: z.object({
    data: z.object({
      csvPath: z.string(),
      dateColumn: z.string().default('Date'),
      dateFormat: z.string().default('YYYY-MM'),
      valueColumns: z.array(z.string()),
    }),
    animation: z.object({
      duration: z.number().default(250),
      interpolationFrames: z.number().default(10),
      easing: z.string().default('linear'),
    }),
    chart: z.object({
      visibleBars: z.number().default(12),
      margins: z.object({
        top: z.number().default(16),
        right: z.number().default(6),
        bottom: z.number().default(6),
        left: z.number().default(0),
      }),
      barSize: z.number().default(48),
    }),
    styling: z.object({
      background: z.string().default('#ffffff'),
      colorScheme: z.string().default('tableau10'),
      fontSize: z.number().default(12),
      fontFamily: z.string().default('sans-serif'),
    }),
  }),
});

// ===========================
// Default Configuration
// ===========================

export const defaultD3Config: D3Config = {
  data: {
    csvPath: '/data/sample-data.csv',
    dateColumn: 'Date',
    dateFormat: 'YYYY-MM',
    valueColumns: ['YouTube', 'Netflix', 'Disney+', 'HBO Max', 'Amazon Prime'],
  },
  animation: {
    duration: 250,
    interpolationFrames: 20,
    easing: 'linear',
  },
  chart: {
    visibleBars: 12,
    margins: { top: 16, right: 6, bottom: 6, left: 0 },
    barSize: 48,
  },
  styling: {
    background: '#ffffff',
    colorScheme: 'tableau10',
    fontSize: 12,
    fontFamily: 'sans-serif',
  },
};

// ===========================
// Utility Functions (All Inline)
// ===========================

function parseCSVToD3Format(csvContent: string, config: D3Config): D3RawDataPoint[] {
  try {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const dateColumnIndex = headers.indexOf(config.data.dateColumn);
    
    if (dateColumnIndex === -1) {
      throw new Error(`Date column '${config.data.dateColumn}' not found in headers: ${headers.join(', ')}`);
    }

    const valueColumnIndices = config.data.valueColumns.map(col => {
      const index = headers.indexOf(col);
      if (index === -1) {
        console.warn(`Value column '${col}' not found in headers`);
      }
      return { column: col, index };
    }).filter(item => item.index !== -1);

    const rawData: D3RawDataPoint[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const dateStr = values[dateColumnIndex];
      
      if (!dateStr) continue;

      const dataPoint: D3RawDataPoint = {
        date: dateStr,
      };

      valueColumnIndices.forEach(({ column, index }) => {
        const value = parseFloat(values[index]) || 0;
        dataPoint[column] = value;
      });

      rawData.push(dataPoint);
    }

    return rawData;
  } catch (error) {
    console.error('Error parsing CSV to D3 format:', error);
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseDateD3(dateStr: string, format: string): Date {
  if (format === 'YYYY-MM') {
    const [year, month] = dateStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  } else if (format === 'YYYY-MM-DD') {
    return new Date(dateStr);
  } else if (format === 'MM/DD/YYYY') {
    const [month, day, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback to JavaScript Date parsing
  return new Date(dateStr);
}

function generateKeyframes(rawData: D3RawDataPoint[], config: D3Config): D3Keyframe[] {
  const keyframes: D3Keyframe[] = [];
  const dateFormat = config.data.dateFormat;
  const valueColumns = config.data.valueColumns;
  
  // Group data by date
  const dataByDate = new Map<string, D3RawDataPoint>();
  rawData.forEach(row => {
    dataByDate.set(row.date, row);
  });
  
  // Sort dates
  const sortedDates = Array.from(dataByDate.keys()).sort((a, b) => {
    const dateA = parseDateD3(a, dateFormat);
    const dateB = parseDateD3(b, dateFormat);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Create keyframes for each date
  sortedDates.forEach(dateStr => {
    const dateObj = parseDateD3(dateStr, dateFormat);
    const rawRow = dataByDate.get(dateStr);
    
    if (!rawRow) return;
    
    const data: D3DataPoint[] = [];
    
    valueColumns.forEach((column, index) => {
      const value = typeof rawRow[column] === 'number' ? rawRow[column] as number : 0;
      
      data.push({
        date: dateObj,
        name: column,
        value: Math.max(0, value),
        rank: 0, // Will be set by rank function
        category: column,
        color: getD3Color(column, index),
      });
    });
    
    // Sort by value and assign ranks
    data.sort((a, b) => b.value - a.value);
    data.forEach((item, index) => {
      item.rank = index;
    });
    
    keyframes.push({
      date: dateObj,
      data: data.slice(0, config.chart.visibleBars)
    });
  });
  
  return keyframes;
}

function interpolateKeyframes(keyframes: D3Keyframe[], interpolationFrames: number): D3Keyframe[] {
  if (keyframes.length < 2) return keyframes;
  
  const interpolatedKeyframes: D3Keyframe[] = [];
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    const currentKeyframe = keyframes[i];
    const nextKeyframe = keyframes[i + 1];
    
    // Add the current keyframe
    interpolatedKeyframes.push(currentKeyframe);
    
    // Create interpolated frames between current and next
    for (let j = 1; j < interpolationFrames; j++) {
      const t = j / interpolationFrames;
      const interpolatedDate = new Date(
        currentKeyframe.date.getTime() + 
        (nextKeyframe.date.getTime() - currentKeyframe.date.getTime()) * t
      );
      
      const interpolatedData: D3DataPoint[] = [];
      
      // Get all unique names from both keyframes
      const allNames = new Set([
        ...currentKeyframe.data.map(d => d.name),
        ...nextKeyframe.data.map(d => d.name)
      ]);
      
      allNames.forEach(name => {
        const currentItem = currentKeyframe.data.find(d => d.name === name);
        const nextItem = nextKeyframe.data.find(d => d.name === name);
        
        const currentValue = currentItem?.value || 0;
        const nextValue = nextItem?.value || 0;
        const interpolatedValue = currentValue + (nextValue - currentValue) * t;
        
        interpolatedData.push({
          date: interpolatedDate,
          name,
          value: interpolatedValue,
          rank: 0, // Will be recalculated
          category: currentItem?.category || nextItem?.category || name,
          color: currentItem?.color || nextItem?.color || getD3Color(name, 0),
        });
      });
      
      // Sort and assign ranks
      interpolatedData.sort((a, b) => b.value - a.value);
      interpolatedData.forEach((item, index) => {
        item.rank = index;
      });
      
      interpolatedKeyframes.push({
        date: interpolatedDate,
        data: interpolatedData
      });
    }
  }
  
  // Add the last keyframe
  interpolatedKeyframes.push(keyframes[keyframes.length - 1]);
  
  return interpolatedKeyframes;
}

function formatD3Number(value: number): string {
  if (value >= 1e9) {
    return (value / 1e9).toFixed(1) + 'B';
  } else if (value >= 1e6) {
    return (value / 1e6).toFixed(1) + 'M';
  } else if (value >= 1e3) {
    return (value / 1e3).toFixed(1) + 'K';
  }
  return value.toLocaleString();
}

function getD3Color(name: string, _index: number): string {
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
  ];
  
  // Use name hash for consistent coloring
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function createD3ColorScale(colorScheme: string): d3.ScaleOrdinal<string, string> {
  switch (colorScheme) {
    case 'tableau10':
      return d3.scaleOrdinal(d3.schemeTableau10);
    case 'category10':
      return d3.scaleOrdinal(d3.schemeCategory10);
    case 'set3':
      return d3.scaleOrdinal(d3.schemeSet3);
    default:
      return d3.scaleOrdinal(d3.schemeTableau10);
  }
}

function calculateD3Scales(
  keyframe: D3Keyframe,
  config: D3Config,
  width: number,
  height: number
): D3Scales {
  const { margins, visibleBars } = config.chart;
  
  const maxValue = d3.max(keyframe.data, d => d.value) || 1;
  
  const xScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([margins.left, width - margins.right]);
  
  const yScale = d3.scaleBand()
    .domain(d3.range(visibleBars).map(String))
    .range([margins.top, height - margins.bottom])
    .padding(0.1);
  
  const colorScale = createD3ColorScale(config.styling.colorScheme);
  
  return { x: xScale, y: yScale, color: colorScale };
}

async function loadAndProcessData(config: D3Config): Promise<D3ProcessedData> {
  try {
    console.log(`Loading D3 CSV data for: ${config.data.csvPath}`);
    
    const loader = new BuildTimeDataLoader();
    const csvContent = await loader.loadCSVContent(config.data.csvPath);
    
    console.log(`Loaded D3 CSV content, length: ${csvContent.length}`);
    
    const rawData = parseCSVToD3Format(csvContent, config);
    console.log(`Parsed ${rawData.length} raw data points for D3`);
    
    const keyframes = generateKeyframes(rawData, config);
    console.log(`Generated ${keyframes.length} keyframes for D3`);
    
    const interpolatedKeyframes = interpolateKeyframes(keyframes, config.animation.interpolationFrames);
    console.log(`Created ${interpolatedKeyframes.length} interpolated keyframes for D3`);
    
    const dateRange = {
      start: keyframes[0]?.date || new Date(),
      end: keyframes[keyframes.length - 1]?.date || new Date()
    };
    
    const maxValue = d3.max(interpolatedKeyframes, kf => d3.max(kf.data, d => d.value)) || 0;
    
    const categories = new Set<string>();
    interpolatedKeyframes.forEach(kf => {
      kf.data.forEach(d => {
        if (d.category) categories.add(d.category);
      });
    });
    
    return {
      keyframes: interpolatedKeyframes,
      dateRange,
      valueColumns: config.data.valueColumns,
      maxValue,
      categories
    };
  } catch (error) {
    console.error('Failed to load and process D3 data:', error);
    throw error;
  }
}

// ===========================
// D3 Rendering Functions (All Inline)
// ===========================

function createBarsRenderer(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  _config: D3Config
) {
  const barsGroup = svg.select('.bars-group');
  
  return function updateBars(keyframe: D3Keyframe, scales: D3Scales) {
    // Data join
    const bars = barsGroup
      .selectAll<SVGRectElement, D3DataPoint>('.bar')
      .data(keyframe.data, d => d.name);
    
    // Enter selection
    const barsEnter = bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', scales.x(0))
      .attr('y', d => scales.y(String(d.rank)) || 0)
      .attr('width', 0)
      .attr('height', scales.y.bandwidth())
      .attr('fill', d => d.color || scales.color(d.name))
      .attr('rx', 4)
      .attr('ry', 4);
    
    // Update selection
    const barsUpdate = barsEnter.merge(bars);
    
    barsUpdate
      .attr('x', scales.x(0))
      .attr('y', d => scales.y(String(d.rank)) || 0)
      .attr('width', d => Math.max(0, scales.x(d.value) - scales.x(0)))
      .attr('height', scales.y.bandwidth())
      .attr('fill', d => d.color || scales.color(d.name));
    
    // Exit selection
    bars.exit().remove();
    
    return barsUpdate;
  };
}

function createLabelsRenderer(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  config: D3Config
) {
  const labelsGroup = svg.select('.labels-group');
  
  return function updateLabels(keyframe: D3Keyframe, scales: D3Scales) {
    const { fontSize, fontFamily } = config.styling;
    
    // Name labels
    const nameLabels = labelsGroup
      .selectAll<SVGTextElement, D3DataPoint>('.name-label')
      .data(keyframe.data, d => d.name);
    
    const nameLabelsEnter = nameLabels.enter()
      .append('text')
      .attr('class', 'name-label')
      .attr('x', scales.x(0) - 6)
      .attr('y', d => (scales.y(String(d.rank)) || 0) + scales.y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-family', fontFamily)
      .style('font-size', `${fontSize}px`)
      .style('font-weight', 'bold')
      .style('fill', '#333');
    
    const nameLabelsUpdate = nameLabelsEnter.merge(nameLabels);
    
    nameLabelsUpdate
      .text(d => d.name)
      .attr('x', scales.x(0) - 6)
      .attr('y', d => (scales.y(String(d.rank)) || 0) + scales.y.bandwidth() / 2);
    
    nameLabels.exit().remove();
    
    // Value labels
    const valueLabels = labelsGroup
      .selectAll<SVGTextElement, D3DataPoint>('.value-label')
      .data(keyframe.data, d => d.name);
    
    const valueLabelsEnter = valueLabels.enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => scales.x(d.value) + 6)
      .attr('y', d => (scales.y(String(d.rank)) || 0) + scales.y.bandwidth() / 2)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
      .style('font-family', fontFamily)
      .style('font-size', `${fontSize}px`)
      .style('font-weight', 'bold')
      .style('fill', '#333');
    
    const valueLabelsUpdate = valueLabelsEnter.merge(valueLabels);
    
    valueLabelsUpdate
      .text(d => formatD3Number(d.value))
      .attr('x', d => scales.x(d.value) + 6)
      .attr('y', d => (scales.y(String(d.rank)) || 0) + scales.y.bandwidth() / 2);
    
    valueLabels.exit().remove();
    
    return { nameLabels: nameLabelsUpdate, valueLabels: valueLabelsUpdate };
  };
}

function createAxisRenderer(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  config: D3Config
) {
  const axisGroup = svg.select('.axis-group');
  
  return function updateAxis(keyframe: D3Keyframe, scales: D3Scales) {
    const axis = d3.axisTop(scales.x)
      .tickSize(-(config.chart.margins.top + config.chart.margins.bottom))
      .tickFormat(d => formatD3Number(d as number))
      .ticks(5);
    
    axisGroup
      .attr('transform', `translate(0, ${config.chart.margins.top})`)
      .call(axis);
    
    // Style the axis
    axisGroup.selectAll('.domain').style('stroke', 'none');
    axisGroup.selectAll('.tick line')
      .style('stroke', '#ddd')
      .style('stroke-width', 1);
    axisGroup.selectAll('.tick text')
      .style('font-family', config.styling.fontFamily)
      .style('font-size', `${config.styling.fontSize}px`)
      .style('fill', '#666');
  };
}

function createTickerRenderer(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  config: D3Config,
  width: number,
  height: number
) {
  const tickerGroup = svg.select('.ticker-group');
  
  return function updateTicker(keyframe: D3Keyframe) {
    const formatDate = d3.timeFormat('%B %Y');
    const formattedDate = formatDate(keyframe.date);
    
    let ticker = tickerGroup.select('.date-ticker');
    
    if (ticker.empty()) {
      ticker = tickerGroup
        .append('text')
        .attr('class', 'date-ticker')
        .attr('x', width - config.chart.margins.right)
        .attr('y', height - config.chart.margins.bottom)
        .attr('text-anchor', 'end')
        .style('font-family', config.styling.fontFamily)
        .style('font-size', `${config.styling.fontSize * 2}px`)
        .style('font-weight', 'bold')
        .style('fill', '#999')
        .style('opacity', 0.7);
    }
    
    ticker.text(formattedDate);
  };
}

// ===========================
// Main Component
// ===========================

export const BarChartRaceD3: React.FC<D3BarChartRaceProps> = ({ config }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  
  // Merge with default configuration
  const finalConfig = useMemo(() => ({
    ...defaultD3Config,
    ...config,
    data: { ...defaultD3Config.data, ...config.data },
    animation: { ...defaultD3Config.animation, ...config.animation },
    chart: { 
      ...defaultD3Config.chart, 
      ...config.chart,
      margins: { ...defaultD3Config.chart.margins, ...config.chart?.margins }
    },
    styling: { ...defaultD3Config.styling, ...config.styling },
  }), [config]);
  
  // Load and process data
  const [processedData, setProcessedData] = useState<D3ProcessedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading D3 data from:', finalConfig.data.csvPath);
        const data = await loadAndProcessData(finalConfig);
        console.log('D3 data loaded:', data);
        
        if (mounted) {
          setProcessedData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('D3 data loading error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [finalConfig.data.csvPath, finalConfig.data.dateColumn, finalConfig.data.dateFormat, finalConfig.data.valueColumns]);
  
  // Smooth interpolated keyframe calculation
  const currentKeyframe = useMemo(() => {
    if (!processedData || !processedData.keyframes.length) return null;
    
    const progress = interpolate(
      frame,
      [0, durationInFrames - 1],
      [0, processedData.keyframes.length - 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    
    const keyframeIndex = Math.floor(progress);
    const nextKeyframeIndex = Math.min(keyframeIndex + 1, processedData.keyframes.length - 1);
    const t = progress - keyframeIndex;
    
    const currentKf = processedData.keyframes[keyframeIndex];
    const nextKf = processedData.keyframes[nextKeyframeIndex];
    
    if (!currentKf || t === 0 || keyframeIndex === nextKeyframeIndex) {
      return currentKf;
    }
    
    // Create smooth interpolated keyframe
    const interpolatedData: D3DataPoint[] = [];
    const allNames = new Set([
      ...currentKf.data.map(d => d.name),
      ...nextKf.data.map(d => d.name)
    ]);
    
    // Use easing function for smoother transitions
    const easedT = t * t * (3 - 2 * t); // smoothstep easing
    
    allNames.forEach(name => {
      const currentItem = currentKf.data.find(d => d.name === name);
      const nextItem = nextKf.data.find(d => d.name === name);
      
      const currentValue = currentItem?.value || 0;
      const nextValue = nextItem?.value || 0;
      const interpolatedValue = currentValue + (nextValue - currentValue) * easedT;
      
      interpolatedData.push({
        date: new Date(currentKf.date.getTime() + (nextKf.date.getTime() - currentKf.date.getTime()) * easedT),
        name,
        value: interpolatedValue,
        rank: 0,
        category: currentItem?.category || nextItem?.category || name,
        color: currentItem?.color || nextItem?.color
      });
    });
    
    // Sort and assign ranks
    interpolatedData.sort((a, b) => b.value - a.value);
    interpolatedData.forEach((item, index) => {
      item.rank = index;
    });
    
    return {
      date: new Date(currentKf.date.getTime() + (nextKf.date.getTime() - currentKf.date.getTime()) * easedT),
      data: interpolatedData.slice(0, finalConfig.chart.visibleBars)
    };
  }, [frame, durationInFrames, processedData, finalConfig.chart.visibleBars]);
  
  // Main D3 rendering effect
  useEffect(() => {
    if (!svgRef.current || !currentKeyframe || !processedData) {
      console.log('D3 render skipped:', { svgRef: !!svgRef.current, currentKeyframe: !!currentKeyframe, processedData: !!processedData });
      return;
    }
    
    console.log('D3 rendering frame:', frame, 'with data:', currentKeyframe.data.length, 'items');
    
    const svg = d3.select(svgRef.current);
    
    // Clear previous content
    svg.selectAll('*').remove();
    
    // Set up SVG
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .style('background-color', finalConfig.styling.background);
    
    // Calculate scales
    const margins = finalConfig.chart.margins;
    const maxValue = d3.max(currentKeyframe.data, d => d.value) || 1;
    
    const xScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([margins.left, width - margins.right]);
      
    const yScale = d3.scaleBand()
      .domain(d3.range(finalConfig.chart.visibleBars).map(String))
      .range([margins.top, height - margins.bottom])
      .padding(0.1);
      
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    
    // Take top N items
    const topItems = currentKeyframe.data.slice(0, finalConfig.chart.visibleBars);
    
    // Create smooth Y positioning based on rank
    const yPosition = (rank: number) => {
      const baseY = margins.top + rank * (yScale.bandwidth() + (yScale.bandwidth() * yScale.paddingInner()));
      return baseY;
    };
    
    // Draw bars with smooth transitions
    const bars = svg.selectAll('.bar')
      .data(topItems, (d: any) => d.name)
      .join(
        enter => enter.append('rect')
          .attr('class', 'bar')
          .attr('x', margins.left)
          .attr('y', d => yPosition(d.rank))
          .attr('width', 0)
          .attr('height', yScale.bandwidth())
          .attr('fill', d => colorScale(d.name))
          .attr('rx', 4)
          .attr('ry', 4),
        update => update,
        exit => exit.remove()
      )
      .attr('x', margins.left)
      .attr('y', d => yPosition(d.rank))
      .attr('width', d => Math.max(0, xScale(d.value) - margins.left))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.name));
    
    // Draw labels with smooth positioning
    const labels = svg.selectAll('.label')
      .data(topItems, (d: any) => d.name)
      .join(
        enter => enter.append('text')
          .attr('class', 'label')
          .attr('x', margins.left - 10)
          .attr('y', d => yPosition(d.rank) + yScale.bandwidth() / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .style('font-family', finalConfig.styling.fontFamily)
          .style('font-size', `${finalConfig.styling.fontSize}px`)
          .style('font-weight', '600')
          .style('fill', '#333')
          .text(d => d.name),
        update => update,
        exit => exit.remove()
      )
      .attr('x', margins.left - 10)
      .attr('y', d => yPosition(d.rank) + yScale.bandwidth() / 2)
      .text(d => d.name);
    
    // Draw values with smooth positioning
    const values = svg.selectAll('.value')
      .data(topItems, (d: any) => d.name)
      .join(
        enter => enter.append('text')
          .attr('class', 'value')
          .attr('x', d => xScale(d.value) + 5)
          .attr('y', d => yPosition(d.rank) + yScale.bandwidth() / 2)
          .attr('dy', '0.35em')
          .style('font-family', finalConfig.styling.fontFamily)
          .style('font-size', `${finalConfig.styling.fontSize}px`)
          .style('font-weight', '500')
          .style('fill', '#333')
          .text(d => d3.format(',.0f')(d.value)),
        update => update,
        exit => exit.remove()
      )
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => yPosition(d.rank) + yScale.bandwidth() / 2)
      .text(d => d3.format(',.0f')(d.value));
    
    // Add rank numbers
    const ranks = svg.selectAll('.rank')
      .data(topItems, (d: any) => d.name)
      .join(
        enter => enter.append('text')
          .attr('class', 'rank')
          .attr('x', margins.left - 25)
          .attr('y', d => yPosition(d.rank) + yScale.bandwidth() / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .style('font-family', finalConfig.styling.fontFamily)
          .style('font-size', `${finalConfig.styling.fontSize}px`)
          .style('font-weight', 'bold')
          .style('fill', '#666')
          .text(d => d.rank + 1),
        update => update,
        exit => exit.remove()
      )
      .attr('x', margins.left - 25)
      .attr('y', d => yPosition(d.rank) + yScale.bandwidth() / 2)
      .text(d => d.rank + 1);
    
    // Draw X-axis
    const xAxis = d3.axisTop(xScale)
      .ticks(5)
      .tickFormat(d3.format(',.0f'))
      .tickSizeOuter(0)
      .tickSizeInner(-height + margins.top + margins.bottom);
    
    svg.selectAll('.x-axis').remove();
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${margins.top})`)
      .call(xAxis)
      .selectAll('line')
      .style('stroke', '#e0e0e0')
      .style('stroke-width', 0.5);
    
    svg.select('.x-axis .domain').remove();
    svg.selectAll('.x-axis text')
      .style('font-family', finalConfig.styling.fontFamily)
      .style('font-size', `${finalConfig.styling.fontSize}px`)
      .style('fill', '#666');
    
    // Draw date ticker with better styling
    svg.selectAll('.date-ticker').remove();
    svg.append('text')
      .attr('class', 'date-ticker')
      .attr('x', width - margins.right - 10)
      .attr('y', height - margins.bottom + 10)
      .attr('text-anchor', 'end')
      .style('font-family', finalConfig.styling.fontFamily)
      .style('font-size', `${finalConfig.styling.fontSize * 1.8}px`)
      .style('font-weight', 'bold')
      .style('fill', '#999')
      .style('opacity', 0.8)
      .text(d3.timeFormat('%Y-%m')(currentKeyframe.date));
    
    // Add subtle background
    svg.selectAll('.background').remove();
    svg.insert('rect', ':first-child')
      .attr('class', 'background')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', finalConfig.styling.background)
      .style('opacity', 0.95);
    
  }, [currentKeyframe, finalConfig, width, height, processedData, frame]);
  
  // Render loading state
  if (loading) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: finalConfig.styling.background,
          justifyContent: 'center',
          alignItems: 'center',
          color: '#333',
          fontSize: 24,
          fontFamily: finalConfig.styling.fontFamily,
        }}
      >
        Loading D3 data...
      </AbsoluteFill>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: finalConfig.styling.background,
          justifyContent: 'center',
          alignItems: 'center',
          color: '#d32f2f',
          fontSize: 18,
          fontFamily: finalConfig.styling.fontFamily,
          padding: 40,
          textAlign: 'center',
        }}
      >
        <div>
          <h2 style={{ marginBottom: 20, color: '#d32f2f' }}>D3 Data Loading Error</h2>
          <p>{error}</p>
          <p style={{ fontSize: 14, color: '#666', marginTop: 20 }}>
            Please check your CSV file path and format.
          </p>
        </div>
      </AbsoluteFill>
    );
  }
  
  // Render no data state
  if (!processedData || !processedData.keyframes.length) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: finalConfig.styling.background,
          justifyContent: 'center',
          alignItems: 'center',
          color: '#666',
          fontSize: 18,
          fontFamily: finalConfig.styling.fontFamily,
        }}
      >
        No D3 data available
      </AbsoluteFill>
    );
  }
  
  // Main SVG render
  return (
    <AbsoluteFill
      style={{
        backgroundColor: finalConfig.styling.background,
      }}
    >
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </AbsoluteFill>
  );
};

