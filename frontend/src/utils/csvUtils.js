import { formatDateLocal } from './dateUtils';

/**
 * Calculates the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates string similarity between 0 and 1.
 */
export function stringSimilarity(a, b) {
  if (!a || !b) return 0;
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return (maxLength - distance) / maxLength;
}

/**
 * Normalizes a date string into ISO format (YYYY-MM-DD).
 * Handles DD/M/YY, DD/MM/YYYY, etc.
 */
export function normalizeDate(dateStr, format) {
  if (!dateStr) return null;
  
  // DD/M/YY or DD/MM/YYYY
  if (format?.includes('/') || dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let day = parts[0].padStart(2, '0');
      let month = parts[1].padStart(2, '0');
      let year = parts[2];
      
      if (year.length === 2) {
        year = '20' + year; // Assumes 21st century
      }
      
      return `${year}-${month}-${day}`;
    }
  }
  
  // Try native parsing as fallback
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return formatDateLocal(d);
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

/**
 * Resolves attendance status to boolean.
 */
export function resolveStatus(value, convention) {
  if (value === null || value === undefined || value === '') return null;
  
  const v = String(value).trim().toUpperCase();
  
  if (['TRUE', '1', 'P', 'PRESENT', 'Y', 'YES'].includes(v)) return true;
  if (['FALSE', '0', 'A', 'ABSENT', 'N', 'NO'].includes(v)) return false;
  
  return null;
}
