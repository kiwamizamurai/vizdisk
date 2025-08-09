import { describe, expect, it } from 'vitest';
import { formatDuration, formatFileSize, formatNumber, formatPercentage } from './formatters';

describe('formatters', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0.00 B');
      expect(formatFileSize(512)).toBe('512.00 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
      expect(formatFileSize(1099511627776)).toBe('1.00 TB');
    });

    it('should handle large numbers', () => {
      expect(formatFileSize(5368709120)).toBe('5.00 GB');
      expect(formatFileSize(2147483648)).toBe('2.00 GB');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousands separator', () => {
      expect(formatNumber(1000)).toContain('000');
      expect(formatNumber(1000000)).toContain('000');
      expect(formatNumber(123)).toBe('123');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
      expect(formatDuration(1000)).toBe('1.00s');
      expect(formatDuration(1500)).toBe('1.50s');
      expect(formatDuration(60000)).toBe('60.00s');
    });
  });

  describe('formatPercentage', () => {
    it('should calculate and format percentages correctly', () => {
      expect(formatPercentage(0, 100)).toBe('0.0%');
      expect(formatPercentage(50, 100)).toBe('50.0%');
      expect(formatPercentage(33, 100)).toBe('33.0%');
      expect(formatPercentage(100, 100)).toBe('100.0%');
    });

    it('should handle division by zero', () => {
      expect(formatPercentage(5, 0)).toBe('0%');
    });
  });
});
