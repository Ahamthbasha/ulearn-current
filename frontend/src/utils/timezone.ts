// src/utils/timezone.ts
import { formatInTimeZone } from 'date-fns-tz';

export const IST_TIMEZONE = 'Asia/Kolkata';

export const createISTDateTime = (dateStr: string, time24h: string): string => {
  const [hours, minutes] = time24h.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);

  return formatInTimeZone(date, IST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

export const createISTDateOnly = (dateStr: string, time: 'start' | 'end' = 'start'): string => {
  const date = new Date(dateStr);
  if (time === 'start') {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return formatInTimeZone(date, IST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
};