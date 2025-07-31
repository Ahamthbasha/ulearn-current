export type ReportFilter = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export function getDateRange(
  type: ReportFilter,
  startDate?: string,
  endDate?: string
): { startDate: Date; endDate: Date } {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now.setHours(23, 59, 59, 999));

  switch (type) {
    case "daily":
      start = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "weekly":
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (!startDate || !endDate) {
        throw new Error("Custom filter requires both startDate and endDate");
      }
      try {
        start = new Date(startDate);
        end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error("Invalid date format for custom range");
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        if (start > end) {
          throw new Error("startDate cannot be after endDate");
        }
      } catch (error:any) {
        throw new Error(`Invalid custom date range: ${error.message}`);
      }
      break;
    default:
      throw new Error("Invalid filter type");
  }

  return { startDate: start, endDate: end };
}