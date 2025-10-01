import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  specificCourseDashboard,
  specificCourseReport,
  exportSpecificCourseReport,
} from "../../../api/action/InstructorActionApi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { DollarSign, Users, Tag, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { type MonthlyData, type ReportItem } from "../interface/instructorInterface";

const monthMap = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SpecificDashboardPage = () => {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<null | {
    fullPrice: number;
    revenue: number;
    enrollments: number;
    category: string | null;
    monthlyPerformance: MonthlyData[];
  }>(null);

  const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>("yearly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [reportLoading, setReportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState({ pdf: false, excel: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(5);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        const response = await specificCourseDashboard(courseId);
        setDashboard(response.data);
      } catch (err) {
        toast.error("Failed to load course dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleGenerateReport = async (page: number = 1) => {
    try {
      if (!courseId) return;

      if (filter === "custom") {
        if (!startDate || !endDate) {
          toast.error("Please select both start and end dates.");
          return;
        }

        const today = new Date().toISOString().split('T')[0];

        if (startDate > today) {
          toast.error("Start date cannot be in the future.");
          return;
        }

        if (endDate > today) {
          toast.error("End date cannot be in the future.");
          return;
        }

        if (startDate > endDate) {
          toast.error("Start date cannot be later than end date.");
          return;
        }
      }

      setReportLoading(true);
      const response = await specificCourseReport(courseId, filter, startDate, endDate, page, limit);

      console.log("Raw Response:", JSON.stringify(response, null, 2));
      console.log("Response Data:", JSON.stringify(response.data, null, 2));

      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }

      let reportItems: ReportItem[];
      let total: number;

      if (Array.isArray(response.data)) {
        reportItems = response.data;
        total = reportItems.length;
      } else {
        const { success, data, total: responseTotal, message } = response.data;
        if (!success) {
          throw new Error(message || "Server returned an error");
        }
        if (!Array.isArray(data)) {
          throw new Error("Report data is not an array");
        }
        reportItems = data;
        total = responseTotal || data.length;
      }

      setReportData(reportItems);
      setTotalRecords(total);
      setCurrentPage(page);

      const calculatedTotalRevenue = reportItems.reduce(
        (sum: number, item: ReportItem) => sum + item.instructorRevenue,
        0
      );
      setTotalRevenue(calculatedTotalRevenue);

      if (reportItems.length === 0) {
        toast.info("No data found for the selected period.");
      } else {
        toast.success(`Report generated with ${reportItems.length} records.`);
      }
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      if (!courseId) return;

      if (reportData.length === 0) {
        toast.error("Please generate a report before exporting.");
        return;
      }

      setExportLoading((prev) => ({ ...prev, [format]: true }));
      await exportSpecificCourseReport(courseId, filter, startDate, endDate, format);
      toast.success(`Report exported successfully as ${format.toUpperCase()}.`);
    } catch (error) {
      console.error(`Failed to export ${format} report:`, error);
      toast.error(`Failed to export ${format.toUpperCase()} report`);
    } finally {
      setExportLoading((prev) => ({ ...prev, [format]: false }));
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalRecords / limit)) return;
    handleGenerateReport(newPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        No data found.
      </div>
    );
  }

  const { fullPrice, revenue, enrollments, category, monthlyPerformance } = dashboard;

  const formattedData = monthlyPerformance.map((item) => ({
    name: `${monthMap[item.month - 1]} ${item.year}`,
    revenue: item.totalSales,
  }));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Course Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Course Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{fullPrice.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <BookOpen className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Instructor Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{revenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{enrollments}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="text-xl font-semibold text-gray-900">{category || "N/A"}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Tag className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border mb-10">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Monthly Instructor Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Generate Revenue Report</h2>
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as typeof filter);
                setCurrentPage(1);
              }}
              className="border px-3 py-2 rounded-md"
              disabled={reportLoading}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>

            {filter === "custom" && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={getTodayDate()}
                  className="border px-3 py-2 rounded-md"
                  disabled={reportLoading}
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  max={getTodayDate()}
                  className="border px-3 py-2 rounded-md"
                  disabled={reportLoading}
                />
              </>
            )}

            <button
              onClick={() => handleGenerateReport(1)}
              disabled={reportLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {reportLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              {reportLoading ? "Generating..." : "Create Report"}
            </button>

            {reportData.length > 0 && (
              <>
                <button
                  onClick={() => handleExportReport('pdf')}
                  disabled={exportLoading.pdf || reportLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {exportLoading.pdf && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  )}
                  {exportLoading.pdf ? "Exporting..." : "Export PDF"}
                </button>
                <button
                  onClick={() => handleExportReport('excel')}
                  disabled={exportLoading.excel || reportLoading}
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {exportLoading.excel && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  )}
                  {exportLoading.excel ? "Exporting..." : "Export Excel"}
                </button>
              </>
            )}
          </div>

          {reportData.length > 0 && (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-sm border-t">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Course Name</th>
                    <th className="p-3">Original Price</th>
                    <th className="p-3">Coupon Used</th>
                    <th className="p-3">Discount Amount</th>
                    <th className="p-3">Final Price</th>
                    <th className="p-3">Instructor Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item) => (
                    <tr key={item.orderId} className="border-b">
                      <td className="p-3 text-blue-600">#{item.orderId}</td>
                      <td className="p-3">{format(new Date(item.purchaseDate), "dd-MM-yyyy")}</td>
                      <td className="p-3">{item.courseName}</td>
                      <td className="p-3">₹{item.originalCoursePrice.toLocaleString()}</td>
                      <td className="p-3">
                        {item.couponUsed ? (
                          <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            No
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-orange-600">
                        {item.couponUsed ? `₹${item.couponDeductionAmount.toLocaleString()}` : '₹0'}
                      </td>
                      <td className="p-3 text-green-600 font-semibold">₹{item.finalCoursePrice.toLocaleString()}</td>
                      <td className="p-3 text-green-700 font-bold">₹{item.instructorRevenue.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={7} className="p-3 text-right">Total Instructor Revenue</td>
                    <td className="p-3 text-green-700 font-bold">₹{totalRevenue.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={7} className="p-3 text-right">Total Enrollments</td>
                    <td className="p-3 text-green-700 font-bold">{reportData.length}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-center justify-between mt-4 px-3 pb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || reportLoading}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium">
                    Page {currentPage} of {Math.ceil(totalRecords / limit)}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalRecords / limit) || reportLoading}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {reportData.length === 0 && !reportLoading && (
            <div className="text-center py-8 text-gray-500">
              <p>No report data available. Click "Create Report" to generate a report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecificDashboardPage;