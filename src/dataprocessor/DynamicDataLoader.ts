/**
 * DynamicDataLoader - 동적 CSV 파일 로딩 및 메타데이터 분석
 * data/ 폴더의 모든 CSV 파일을 자동으로 감지하고 분석하는 핵심 모듈
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface CSVMetadata {
  filename: string;
  filepath: string;
  columns: string[];
  dateColumn?: string;
  valueColumns: string[];
  rowCount: number;
  dataPreview: string[][];
  estimatedDateFormat?: string;
  hasHeaders: boolean;
}

export interface DataLoadResult {
  csvFiles: CSVMetadata[];
  totalFiles: number;
  validFiles: number;
  errors: string[];
}

export class DynamicDataLoader {
  private dataDirectory: string;
  
  constructor(dataDirectory: string = './data') {
    this.dataDirectory = path.resolve(dataDirectory);
  }

  /**
   * data/ 폴더의 모든 CSV 파일을 스캔하고 메타데이터를 추출
   */
  async scanCSVFiles(): Promise<DataLoadResult> {
    const result: DataLoadResult = {
      csvFiles: [],
      totalFiles: 0,
      validFiles: 0,
      errors: []
    };

    try {
      // data 디렉토리 존재 확인
      const dirExists = await this.directoryExists(this.dataDirectory);
      if (!dirExists) {
        result.errors.push(`Data directory not found: ${this.dataDirectory}`);
        return result;
      }

      // CSV 파일 목록 가져오기
      const files = await fs.readdir(this.dataDirectory);
      const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
      result.totalFiles = csvFiles.length;

      // 각 CSV 파일 분석
      for (const file of csvFiles) {
        try {
          const filepath = path.join(this.dataDirectory, file);
          const metadata = await this.analyzeCSVFile(filepath);
          result.csvFiles.push(metadata);
          result.validFiles++;
        } catch (error) {
          result.errors.push(`Failed to analyze ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 파일명으로 정렬
      result.csvFiles.sort((a, b) => a.filename.localeCompare(b.filename));

    } catch (error) {
      result.errors.push(`Failed to scan directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * 특정 CSV 파일 분석
   */
  private async analyzeCSVFile(filepath: string): Promise<CSVMetadata> {
    const filename = path.basename(filepath);
    const content = await fs.readFile(filepath, 'utf-8');
    
    // CSV 파싱
    const lines = content.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    // 헤더 추출
    const headers = this.parseCSVLine(lines[0]);
    const hasHeaders = this.detectHeaders(headers, lines);
    
    // 샘플 데이터 추출 (첫 5행)
    const dataPreview: string[][] = [];
    const startIndex = hasHeaders ? 1 : 0;
    const previewCount = Math.min(5, lines.length - startIndex);
    
    for (let i = 0; i < previewCount; i++) {
      const lineIndex = startIndex + i;
      if (lineIndex < lines.length) {
        dataPreview.push(this.parseCSVLine(lines[lineIndex]));
      }
    }

    // 컬럼 분석
    const columns = hasHeaders ? headers : this.generateColumnNames(headers.length);
    const { dateColumn, valueColumns } = this.analyzeColumns(columns, dataPreview);
    const estimatedDateFormat = dateColumn ? this.estimateDateFormat(dataPreview, columns.indexOf(dateColumn)) : undefined;

    return {
      filename,
      filepath,
      columns,
      dateColumn,
      valueColumns,
      rowCount: lines.length - (hasHeaders ? 1 : 0),
      dataPreview,
      estimatedDateFormat,
      hasHeaders
    };
  }

  /**
   * CSV 라인 파싱 (간단한 구현)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(cell => cell.replace(/^"|"$/g, ''));
  }

  /**
   * 헤더 존재 여부 감지
   */
  private detectHeaders(firstRow: string[], lines: string[]): boolean {
    if (lines.length < 2) return true;
    
    // 첫 번째 행이 모두 문자열이고, 두 번째 행에 숫자가 있으면 헤더로 판단
    const secondRow = this.parseCSVLine(lines[1]);
    
    const firstRowHasNumbers = firstRow.some(cell => !isNaN(Number(cell)) && cell.trim() !== '');
    const secondRowHasNumbers = secondRow.some(cell => !isNaN(Number(cell)) && cell.trim() !== '');
    
    return !firstRowHasNumbers && secondRowHasNumbers;
  }

  /**
   * 컬럼명 생성 (헤더가 없는 경우)
   */
  private generateColumnNames(count: number): string[] {
    const names = ['Date'];
    for (let i = 1; i < count; i++) {
      names.push(`Column${i}`);
    }
    return names;
  }

  /**
   * 컬럼 타입 분석 (날짜 컬럼과 값 컬럼 구분)
   */
  private analyzeColumns(columns: string[], dataPreview: string[][]): { dateColumn?: string; valueColumns: string[] } {
    if (dataPreview.length === 0) {
      return { valueColumns: columns };
    }

    let dateColumn: string | undefined;
    const valueColumns: string[] = [];

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const columnName = columns[colIndex];
      const sampleValues = dataPreview.map(row => row[colIndex]).filter(val => val);
      
      if (this.isDateColumn(columnName, sampleValues)) {
        dateColumn = columnName;
      } else if (this.isValueColumn(sampleValues)) {
        valueColumns.push(columnName);
      }
    }

    // 날짜 컬럼이 없으면 첫 번째 컬럼을 날짜로 가정
    if (!dateColumn && columns.length > 0) {
      dateColumn = columns[0];
      // 값 컬럼에서 날짜 컬럼 제거
      const dateIndex = valueColumns.indexOf(dateColumn);
      if (dateIndex !== -1) {
        valueColumns.splice(dateIndex, 1);
      }
    }

    return { dateColumn, valueColumns };
  }

  /**
   * 날짜 컬럼 여부 판단
   */
  private isDateColumn(columnName: string, sampleValues: string[]): boolean {
    // 컬럼명으로 판단
    const dateKeywords = ['date', 'time', 'year', 'month', 'day', '날짜', '시간'];
    const nameIndicatesDate = dateKeywords.some(keyword => 
      columnName.toLowerCase().includes(keyword)
    );

    if (nameIndicatesDate) return true;

    // 값으로 판단 (날짜 패턴 감지)
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{4}-\d{2}$/, // YYYY-MM
      /^\d{4}$/, // YYYY
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}\/\d{4}$/ // MM/YYYY
    ];

    return sampleValues.some(value => 
      datePatterns.some(pattern => pattern.test(value.trim()))
    );
  }

  /**
   * 값 컬럼 여부 판단
   */
  private isValueColumn(sampleValues: string[]): boolean {
    // 대부분이 숫자인지 확인
    const numericCount = sampleValues.filter(value => 
      !isNaN(Number(value.replace(/,/g, ''))) && value.trim() !== ''
    ).length;
    
    return numericCount >= sampleValues.length * 0.8; // 80% 이상이 숫자
  }

  /**
   * 날짜 형식 추정
   */
  private estimateDateFormat(dataPreview: string[][], dateColumnIndex: number): string {
    const dateValues = dataPreview
      .map(row => row[dateColumnIndex])
      .filter(val => val);

    if (dateValues.length === 0) return 'YYYY-MM-DD';

    const sampleValue = dateValues[0].trim();
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(sampleValue)) return 'YYYY-MM-DD';
    if (/^\d{4}-\d{2}$/.test(sampleValue)) return 'YYYY-MM';
    if (/^\d{4}$/.test(sampleValue)) return 'YYYY';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(sampleValue)) return 'MM/DD/YYYY';
    if (/^\d{2}\/\d{4}$/.test(sampleValue)) return 'MM/YYYY';
    
    return 'YYYY-MM-DD'; // 기본값
  }

  /**
   * 디렉토리 존재 확인
   */
  private async directoryExists(dir: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 특정 CSV 파일의 전체 내용 로드
   */
  async loadCSVContent(filepath: string): Promise<string> {
    return await fs.readFile(filepath, 'utf-8');
  }

  /**
   * 메타데이터 기반으로 파일 이름에서 템플릿 타입 추론
   */
  getTemplateTypeFromFilename(filename: string): string {
    const name = filename.toLowerCase();
    
    if (name.includes('social') || name.includes('instagram') || name.includes('tiktok')) {
      return 'social';
    }
    if (name.includes('business') || name.includes('sales') || name.includes('revenue')) {
      return 'business';
    }
    if (name.includes('sports') || name.includes('game') || name.includes('competition')) {
      return 'sports';
    }
    if (name.includes('education') || name.includes('school') || name.includes('university')) {
      return 'educational';
    }
    if (name.includes('test') || name.includes('sample') || name.includes('demo')) {
      return 'demo';
    }
    if (name.includes('dramatic') || name.includes('extreme')) {
      return 'gaming';
    }
    
    return 'default';
  }
}