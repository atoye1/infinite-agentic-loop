/**
 * BuildTimeDataLoader - Uses pre-generated CSV manifest from build time
 * This approach allows us to use the existing DynamicDataLoader logic
 * while being compatible with browser environments
 */

// Dynamic import for CSV manifest to avoid build issues
let csvManifest: any = null;

async function loadCSVManifest() {
  if (csvManifest === null) {
    try {
      // Try dynamic import first
      csvManifest = await import('../generated/csv-manifest.json', { with: { type: 'json' } }).then(m => m.default);
    } catch {
      // Fallback to fetch for browser environment
      try {
        const response = await fetch('/src/generated/csv-manifest.json');
        csvManifest = await response.json();
      } catch {
        // Final fallback - empty manifest
        csvManifest = { csvFiles: [], totalFiles: 0, validFiles: 0, errors: [] };
      }
    }
  }
  return csvManifest;
}

export interface CSVMetadata {
  filename: string;
  filepath: string;
  content?: string;  // CSV content embedded in manifest
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

export class BuildTimeDataLoader {
  
  /**
   * Load CSV metadata from pre-generated manifest
   * This replaces the file system scanning with build-time data
   */
  async scanCSVFiles(): Promise<DataLoadResult> {
    // Return the pre-generated manifest data
    const manifest = await loadCSVManifest();
    return {
      csvFiles: manifest.csvFiles as CSVMetadata[],
      totalFiles: manifest.totalFiles,
      validFiles: manifest.validFiles,
      errors: manifest.errors
    };
  }

  /**
   * Load CSV content from embedded data or via fetch
   */
  async loadCSVContent(filepath: string): Promise<string> {
    // First, try to find the content in the manifest
    const manifest = await loadCSVManifest();
    const csvMetadata = (manifest.csvFiles as CSVMetadata[]).find(
      csv => csv.filepath === filepath || csv.filename === filepath
    );
    
    if (csvMetadata && csvMetadata.content) {
      // Use embedded content from manifest
      return csvMetadata.content;
    }
    
    // Fallback to fetch if content not embedded
    try {
      const response = await fetch(filepath);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Could not load CSV from ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Infer template type from filename
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

  /**
   * Get all available CSV files
   */
  async getAvailableFiles(): Promise<CSVMetadata[]> {
    const manifest = await loadCSVManifest();
    return manifest.csvFiles as CSVMetadata[];
  }

  /**
   * Get CSV metadata by filename
   */
  async getCSVMetadata(filename: string): Promise<CSVMetadata | undefined> {
    const manifest = await loadCSVManifest();
    return (manifest.csvFiles as CSVMetadata[]).find(csv => csv.filename === filename);
  }

  /**
   * Check if manifest was generated successfully
   */
  async isManifestValid(): Promise<boolean> {
    const manifest = await loadCSVManifest();
    return manifest.validFiles > 0;
  }

  /**
   * Get manifest generation timestamp
   */
  async getManifestTimestamp(): Promise<Date> {
    const manifest = await loadCSVManifest();
    return new Date(manifest.generated);
  }
}