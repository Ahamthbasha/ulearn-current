import { useEffect, useState } from "react";
import { slotHistory } from "../../../api/action/InstructorActionApi";
import EntityTable from "../../../components/common/EntityTable";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "react-toastify";

interface SlotStat {
  date: string;
  totalSlots: number;
  bookedSlots: number;
}

const SlotHistoryPage = () => {
  const currentDate = new Date();
  const [stats, setStats] = useState<SlotStat[]>([]);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"monthly" | "yearly" | "custom">("monthly");
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSlotStats = async () => {
    try {
      if (
        (mode === "monthly" && (!month || !year)) ||
        (mode === "yearly" && !year) ||
        (mode === "custom" && (!startDate || !endDate))
      ) {
        setStats([]);
        return; // skip fetch if filters incomplete
      }

      setLoading(true);

      const params: Record<string, any> = {};
      if (mode === "monthly") {
        params.month = month;
        params.year = year;
      } else if (mode === "yearly") {
        params.year = year;
      } else if (mode === "custom") {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const res = await slotHistory(mode, params);
      setStats(res.data);
    } catch (error) {
      toast.error("Failed to fetch slot stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, month, year, startDate, endDate]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Slot History</h2>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Mode</label>
          <select
            className="w-full border p-2 rounded"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {mode === "monthly" && (
          <>
            <div>
              <label className="block text-sm font-medium">Month</label>
              <input
                type="number"
                min="1"
                max="12"
                className="w-full border p-2 rounded"
                value={month || ""}
                onChange={(e) =>
                  setMonth(e.target.value === "" ? 0 : Number(e.target.value))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Year</label>
              <input
                type="number"
                min="1900"
                max="2100"
                className="w-full border p-2 rounded"
                value={year || ""}
                onChange={(e) =>
                  setYear(e.target.value === "" ? 0 : Number(e.target.value))
                }
              />
            </div>
          </>
        )}

        {mode === "yearly" && (
          <div>
            <label className="block text-sm font-medium">Year</label>
            <input
              type="number"
              min="1900"
              max="2100"
              className="w-full border p-2 rounded"
              value={year || ""}
              onChange={(e) =>
                setYear(e.target.value === "" ? 0 : Number(e.target.value))
              }
            />
          </div>
        )}

        {mode === "custom" && (
          <>
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Table or Loading */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Loading slot stats...
        </div>
      ) : (
        <EntityTable
          title=""
          data={stats}
          emptyText="No slot activity found"
          columns={[
            {
              key: "date",
              label: "Date",
              render: (value: string) => {
                const parsed = parseISO(value);
                return isValid(parsed)
                  ? format(parsed, "dd-MM-yyyy")
                  : "Invalid date";
              },
            },
            {
              key: "totalSlots",
              label: "Total Slots",
            },
            {
              key: "bookedSlots",
              label: "Booked Slots",
            },
          ]}
        />
      )}
    </div>
  );
};

export default SlotHistoryPage;
