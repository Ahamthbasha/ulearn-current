// src/utils/timezone.ts (FRONTEND - FIXED VERSION)
import { formatInTimeZone } from 'date-fns-tz';

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * ✅ CORRECT: Creates an ISO string representing the given date+time IN IST
 * Works correctly regardless of server timezone
 */
export const createISTDateTime = (dateStr: string, time24h: string): string => {
  const [hours, minutes] = time24h.split(':').map(Number);
  
  // Parse date parts explicitly to avoid timezone interpretation
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create the datetime string in IST timezone directly
  const istDateTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  // Format as ISO string with IST offset
  return formatInTimeZone(istDateTimeStr, IST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * ✅ CORRECT: Creates an ISO string for start/end of day IN IST
 */
export const createISTDateOnly = (dateStr: string, time: 'start' | 'end' = 'start'): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  const hours = time === 'start' ? 0 : 23;
  const minutes = time === 'start' ? 0 : 59;
  const seconds = time === 'start' ? 0 : 59;
  const ms = time === 'start' ? 0 : 999;
  
  // Create the datetime string in IST timezone
  const istDateTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  
  return formatInTimeZone(istDateTimeStr, IST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
};