import { format, parseISO } from 'date-fns';

/**
 * Check if a date is valid
 * @param date - The date to check
 * @returns true if the date is valid, false otherwise
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safely formats a date value, handling invalid dates gracefully
 * @param dateValue - The date value to format (string, Date, or null/undefined)
 * @param formatString - The format string for date-fns
 * @param fallback - Fallback text for invalid dates (default: 'Invalid date')
 * @returns Formatted date string or fallback text
 */
export function safeFormatDate(
  dateValue: string | Date | null | undefined,
  formatString: string,
  fallback: string = 'Invalid date'
): string {
  if (!dateValue) {
    return fallback;
  }

  try {
    let date: Date;
    
    if (typeof dateValue === 'string') {
      // Try to parse ISO string first, then fall back to regular Date constructor
      date = parseISO(dateValue);
      if (!isValidDate(date)) {
        date = new Date(dateValue);
      }
    } else {
      date = dateValue;
    }

    if (!isValidDate(date)) {
      console.warn(`Invalid date value detected:`, dateValue);
      return fallback;
    }

    return format(date, formatString);
  } catch (error) {
    console.warn(`Date formatting error for value "${dateValue}":`, error);
    return fallback;
  }
}