import { fromZonedTime } from 'date-fns-tz';

const IST = 'Asia/Kolkata';

export const getISTDayRangeUTC = (dateStr: string): { startUTC: Date; endUTC: Date } => {
  const [year, month, day] = dateStr.split('-').map(Number);

  const startIST = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endIST = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    startUTC: fromZonedTime(startIST, IST),
    endUTC: fromZonedTime(endIST, IST),
  };
};