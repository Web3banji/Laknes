/**
 * Data formatters for LAKNES Discovery
 * Strictly follows the Data Integrity Rule: never invent or fake values.
 */

export function formatCurrency(
  value?: number | null,
  options: { decimals?: number; fallback?: string } = {}
): string {
  const { decimals = 2, fallback = '—' } = options;
  if (value === undefined || value === null || isNaN(value)) {
    return fallback;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(
  value?: number | null,
  options: { fallback?: string } = {}
): { formatted: string; isPositive: boolean; isNegative: boolean } {
  const { fallback = '—' } = options;
  if (value === undefined || value === null || isNaN(value)) {
    return { formatted: fallback, isPositive: false, isNegative: false };
  }
  const isPositive = value > 0;
  const isNegative = value < 0;
  const prefix = isPositive ? '+' : '';
  return {
    formatted: `${prefix}${value.toFixed(2)}%`,
    isPositive,
    isNegative,
  };
}

export function formatNumber(
  value?: number | null,
  options: { fallback?: string; notation?: 'standard' | 'compact' } = {}
): string {
  const { fallback = '—', notation = 'compact' } = options;
  if (value === undefined || value === null || isNaN(value)) {
    return fallback;
  }
  return new Intl.NumberFormat('en-US', {
    notation,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatAddress(address?: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}…${address.slice(-end)}`;
}
