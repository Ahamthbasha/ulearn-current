export type ReportFilter = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export function getDateRange(filter: ReportFilter, start?: string, end?: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (filter) {
    case "daily":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case "weekly":
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      startDate = firstDayOfWeek;

      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(startDate.getDate() + 6);
      lastDayOfWeek.setHours(23, 59, 59, 999);
      endDate = lastDayOfWeek;
      break;

    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    case "custom":
      if (!start || !end) throw new Error("Custom filter requires startDate and endDate");
      startDate = new Date(start);
      endDate = new Date(end);
      break;

    default:
      throw new Error("Invalid filter type");
  }

  return { startDate, endDate };
}