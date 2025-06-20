/**
 * Config Module - 설정 관리 핵심 모듈
 * CLI와 GUI 양쪽에서 공통으로 사용되는 설정 생성 및 관리 기능
 */

export { ConfigTemplates } from './ConfigTemplates';
export { ConfigValidator } from './ConfigValidator';
export { ConfigGenerator } from './ConfigGenerator';

// Re-export types for convenience
export type {
  SimpleBarChartRaceConfig,
  AdvancedBarChartRaceConfig
} from '../types/SimpleConfig';

export type {
  BarChartRaceConfig
} from '../types/config';