/**
 * Security & Input Validation Utilities for Elysium
 */

/**
 * Validates whether a given string is a valid EVM address (40 hex characters prefixed by 0x)
 */
export function isValidElysiumAddress(address: string | null | undefined): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

/**
 * Validates whether a given string is a valid EVM transaction hash (64 hex characters prefixed by 0x)
 */
export function isValidTxHash(hash: string | null | undefined): boolean {
  if (!hash || typeof hash !== 'string') return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash.trim());
}

/**
 * Validates HTTP/HTTPS URLs and prevents javascript: or data: injection
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes user-supplied text to prevent script injection
 */
export function sanitizeText(text: string | null | undefined, maxLength = 2000): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // strip angle brackets
}
