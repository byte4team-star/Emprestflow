/**
 * Date utility functions to handle timezone issues
 * 
 * Problem: When parsing dates with `new Date('2024-03-15')`, JavaScript
 * assumes it's UTC and converts to local timezone, which can shift the day
 * backward (e.g., 2024-03-15 becomes 2024-03-14 in UTC-3).
 * 
 * Solution: Always force time to 12:00:00 (noon) to prevent day shifts.
 */

/**
 * Safely parse a date string avoiding timezone issues
 * Forces time to 12:00:00 to prevent date shifts
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object with time set to noon
 */
export function parseDateSafe(dateString: string): Date {
  if (!dateString) return new Date();
  
  const dateOnly = dateString.split('T')[0]; // Get only YYYY-MM-DD
  return new Date(`${dateOnly}T12:00:00`); // Force noon time
}

/**
 * Format date as DD/MM/YYYY manually to avoid timezone issues
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return '-';
  
  const dateOnly = dateString.split('T')[0]; // Get YYYY-MM-DD
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Format date as DD/MM/YYYY HH:mm
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string with time
 */
export function formatDateTimeBR(dateString: string): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Get month name in Portuguese (short)
 * 
 * @param dateString - Date string
 * @returns Month name (e.g., "Jan", "Fev")
 */
export function getMonthNameShort(dateString: string): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const date = parseDateSafe(dateString);
  return months[date.getMonth()];
}

/**
 * Get month name in Portuguese (full)
 * 
 * @param dateString - Date string
 * @returns Month name (e.g., "Janeiro", "Fevereiro")
 */
export function getMonthNameFull(dateString: string): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const date = parseDateSafe(dateString);
  return months[date.getMonth()];
}

/**
 * Calculate days between two dates
 * 
 * @param fromDate - Start date
 * @param toDate - End date
 * @returns Number of days
 */
export function daysBetween(fromDate: string, toDate: string): number {
  const from = parseDateSafe(fromDate);
  const to = parseDateSafe(toDate);
  
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  
  const diffTime = to.getTime() - from.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is in the past
 * 
 * @param dateString - Date string to check
 * @returns true if date is in the past
 */
export function isPast(dateString: string): boolean {
  const date = parseDateSafe(dateString);
  const today = new Date();
  
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return date < today;
}

/**
 * Check if a date is today
 * 
 * @param dateString - Date string to check
 * @returns true if date is today
 */
export function isToday(dateString: string): boolean {
  const date = parseDateSafe(dateString);
  const today = new Date();
  
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
