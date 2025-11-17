// src/utils/timezone.ts
import { fromZonedTime } from 'date-fns-tz';

const IST = 'Asia/Kolkata';

/**
 * Converts YYYY-MM-DD string (meant as IST date) → correct UTC range for MongoDB
 * Works perfectly on US servers, India, Docker, anywhere
 */
export const getISTDayRangeUTC = (dateStr: string): { startUTC: Date; endUTC: Date } => {
  const [year, month, day] = dateStr.split('-').map(Number);

  // Create date in IST context (00:00 and 23:59:59.999 IST)
  const startIST = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endIST = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    startUTC: fromZonedTime(startIST, IST),
    endUTC: fromZonedTime(endIST, IST),
  };
};