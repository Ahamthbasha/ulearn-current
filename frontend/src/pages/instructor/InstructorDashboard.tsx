import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  BookOpen,
  DollarSign,
  Award,
  Target,
} from "lucide-react";
import { getDashboard, getRevenueDashboard,exportRevenueReport } from "../../api/action/InstructorActionApi";
import { type IDashboardData } from "../../types/interfaces/IdashboardTypes";

const InstructorDashboard = () => {
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reportRange, setReportRange] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "custom"
  >("daily");
  const [reportData, setReportData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

const fetchReport = async () => {
  if (
    reportRange === "custom" &&
    (!startDate || !endDate || new Date(startDate) > new Date(endDate))
  ) {
    alert("Please provide a valid date range. Start date must be before or equal to end date.");
    return;
  }

  try {
    const data = await getRevenueDashboard(reportRange, startDate, endDate);
    setReportData(data?.data || []);
  } catch (error) {
    console.error("Failed to fetch report:", error);
  }
};


  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await getDashboard();
        setDashboardData(data);
        setError(null);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <BookOpen size={64} className="mx-auto" />
          </div>
          <p className="text-gray-600 text-lg">{error || "No Data Found"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { topCourses, categorySales, monthlySales, totalRevenue, totalCourseSales } = dashboardData;

  const monthlyData = monthlySales.map((item) => ({
    month: `${item.month}/${item.year}`,
    sales: item.totalSales,
    revenue: item.totalRevenue,
  }));

  const categoryData = categorySales.map((item) => ({
    name: item.categoryName,
    value: item.totalSales,
    percentage: Math.round((item.totalSales / totalCourseSales) * 100),
  }));

  const totalCategories = categorySales.length;

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Dashboard</h1>
          <p className="text-gray-600">Overview of your teaching performance and earnings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Course Sales</p>
                <p className="text-2xl font-bold text-gray-900">{totalCourseSales}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{topCourses.length}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Report Generator */}
        {/* Revenue Report Generator */}
<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Revenue Report</h3>
  <div className="flex flex-wrap gap-4 items-end">
    <select
      value={reportRange}
      onChange={(e) => setReportRange(e.target.value as any)}
      className="border rounded px-3 py-2"
    >
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
      <option value="yearly">Yearly</option>
      <option value="custom">Custom</option>
    </select>

    {reportRange === "custom" && (
  <>
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      max={new Date().toISOString().split("T")[0]} // ✅ max today
      className="border rounded px-3 py-2"
    />
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      max={new Date().toISOString().split("T")[0]} // ✅ max today
      className="border rounded px-3 py-2"
    />
  </>
)}

<button
  onClick={fetchReport}
  disabled={
    reportRange === "custom" &&
    (!startDate || !endDate || new Date(startDate) > new Date(endDate))
  }
  className={`${
    reportRange === "custom" &&
    (!startDate || !endDate || new Date(startDate) > new Date(endDate))
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-emerald-600 hover:bg-emerald-700"
  } text-white px-4 py-2 rounded transition`}
>
  Create Report
</button>

  </div>

  {reportData.length > 0 ? (
  <div className="mt-6 overflow-x-auto">
    {/* Export Buttons */}
    <div className="flex justify-end gap-4 mb-4">
      <button
        onClick={() =>
          exportRevenueReport(reportRange, "excel", startDate, endDate)
        }
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Export Excel
      </button>
      <button
        onClick={() =>
          exportRevenueReport(reportRange, "pdf", startDate, endDate)
        }
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        Export PDF
      </button>
    </div>

    {/* Report Table */}
    <table className="w-full border rounded shadow-sm">
  <thead className="bg-gray-100">
    <tr>
      <th className="px-4 py-2 text-left">Order ID</th>
      <th className="px-4 py-2 text-left">Date</th>
      <th className="px-4 py-2 text-left">Courses</th>
      <th className="px-4 py-2 text-left">Total Price</th>
      <th className="px-4 py-2 text-left">Instructor Revenue</th>
    </tr>
  </thead>
  <tbody>
    {Object.entries(
      reportData.reduce<Record<
        string,
        {
          date: string;
          courses: string[];
          totalPrice: number;
          totalInstructorEarning: number;
        }
      >>((acc, curr) => {
        const orderId = curr._id.toString();

        if (!acc[orderId]) {
          acc[orderId] = {
            date: curr.createdAt,
            courses: [],
            totalPrice: 0,
            totalInstructorEarning: 0,
          };
        }

        acc[orderId].courses.push(curr.courseName);
        acc[orderId].totalPrice += curr.coursePrice;
        acc[orderId].totalInstructorEarning += curr.instructorEarning;

        return acc;
      }, {})
    ).map(([orderId, data], idx) => (
      <tr key={idx} className="border-t">
        <td className="px-4 py-2">#{orderId}</td>
        <td className="px-4 py-2">
          {new Date(data.date).toLocaleDateString()}
        </td>
        <td className="px-4 py-2">{data.courses.join(", ")}</td>
        <td className="px-4 py-2">₹{data.totalPrice.toFixed(2)}</td>
        <td className="px-4 py-2 text-green-700">
          ₹{data.totalInstructorEarning.toFixed(2)}
        </td>
      </tr>
    ))}
  </tbody>

  <tfoot>
    <tr className="bg-gray-100 font-semibold">
      <td colSpan={4} className="px-4 py-2 text-right">Total Instructor Revenue</td>
      <td className="px-4 py-2 text-green-700">
  ₹{(
    Object.values(
      reportData.reduce((acc, curr) => {
        const orderId = curr._id.toString();
        acc[orderId] = acc[orderId] || 0;
        acc[orderId] += curr.instructorEarning;
        return acc;
      }, {} as Record<string, number>)
    ) as number[]
  ).reduce((sum, val) => sum + val, 0).toFixed(2)}
</td>

    </tr>
  </tfoot>
</table>

  </div>
) : (
  <p className="text-gray-500 mt-4">
    No data available. Please generate a report.
  </p>
)}


</div>


        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "sales" ? value : `₹${value}`,
                    name === "sales" ? "Sales" : "Revenue",
                  ]}
                />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
            <div className="flex flex-col lg:flex-row items-center">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} sales`, "Sales"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 mt-4 lg:mt-0 lg:ml-4 space-y-3">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{entry.value}</div>
                      <div className="text-xs text-gray-500">{entry.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Courses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Courses</h3>
          <div className="space-y-4">
            {topCourses.length > 0 ? (
              topCourses.map((course, index) => (
                <div
                  key={course._id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.courseName}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="w-16 h-16 bg-gray-200 rounded-lg hidden items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm leading-5">
                      {course.courseName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">{course.count} sales</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No courses found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;