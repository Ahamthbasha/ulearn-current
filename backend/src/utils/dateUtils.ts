import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatDate(
  date: Date | string,
  tz: string = "Asia/Kolkata",
): string {
  return dayjs(date).tz(tz).format("DD-MM-YYYY hh:mm A");
}
