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
import { BookOpen, DollarSign, Award, Target, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getDashboard,
  getRevenueDashboard,
  exportRevenueReport,
} from "../../api/action/InstructorActionApi";

import type { IDashboardData,IRevenueReportItem } from "../../types/interfaces/IdashboardTypes";


const InstructorDashboard = () => {
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportRange, setReportRange] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "custom"
  >("daily");
  const [reportData, setReportData] = useState<IRevenueReportItem[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(5); // Matches backend default limit
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const fetchReport = async (page: number = 1) => {
    if (
      reportRange === "custom" &&
      (!startDate || !endDate || new Date(startDate) > new Date(endDate))
    ) {
      alert(
        "Please provide a valid date range. Start date must be before or equal to end date."
      );
      return;
    }

    try {
      setReportLoading(true);
      const response = await getRevenueDashboard(
        reportRange,
        page,
        limit,
        startDate,
        endDate
      );
      setReportData(response?.data || []);
      setTotalRecords(response?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch report:", error);
      setError("Failed to fetch revenue report");
    } finally {
      setReportLoading(false);
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

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalRecords / limit)) return;
    fetchReport(newPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 sm:mt-4 text-gray-600 text-base sm:text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-gray-400 mb-2 sm:mb-4">
            <BookOpen size={48} className="mx-auto sm:size-64" />
          </div>
          <p className="text-gray-600 text-base sm:text-lg">{error || "No Data Found"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 sm:mt-4 px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    topCourses,
    categorySales,
    monthlySales,
    totalRevenue,
    totalCourseSales,
    publishedCourses,
    categoryWiseCount,
  } = dashboardData;

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

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Instructor Dashboard
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Overview of your teaching performance and earnings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  ₹{totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Course Sales
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {totalCourseSales}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Published Courses
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {publishedCourses}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Categories Used
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {categoryWiseCount}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Report Generator */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100 mb-4 sm:mb-6 md:mb-8">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">
            Generate Revenue Report
          </h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-end">
            <select
              value={reportRange}
              onChange={(e) => {
                setReportRange(e.target.value as any);
                setCurrentPage(1); // Reset to page 1 on range change
              }}
              className="border rounded px-2 sm:px-3 py-1 sm:py-2 w-full sm:w-auto"
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
                  max={new Date().toISOString().split("T")[0]}
                  className="border rounded px-2 sm:px-3 py-1 sm:py-2 w-full sm:w-auto"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="border rounded px-2 sm:px-3 py-1 sm:py-2 w-full sm:w-auto"
                />
              </>
            )}

            <button
              onClick={() => fetchReport(1)}
              disabled={
                reportLoading ||
                (reportRange === "custom" &&
                  (!startDate ||
                    !endDate ||
                    new Date(startDate) > new Date(endDate)))
              }
              className={`${
                reportLoading ||
                (reportRange === "custom" &&
                  (!startDate ||
                    !endDate ||
                    new Date(startDate) > new Date(endDate)))
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } text-white px-2 sm:px-4 py-1 sm:py-2 rounded transition w-full sm:w-auto`}
            >
              {reportLoading ? "Loading..." : "Create Report"}
            </button>
          </div>

          {reportData.length > 0 ? (
            <div className="mt-2 sm:mt-4 md:mt-6 overflow-x-auto">
              {/* Export Buttons */}
              <div className="flex justify-end gap-2 sm:gap-4 mb-2 sm:mb-4">
                <button
                  onClick={() =>
                    exportRevenueReport(
                      reportRange,
                      "excel",
                      startDate,
                      endDate
                    )
                  }
                  className="bg-blue-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto"
                >
                  Export Excel
                </button>
                <button
                  onClick={() =>
                    exportRevenueReport(reportRange, "pdf", startDate, endDate)
                  }
                  className="bg-red-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-red-700 transition w-full sm:w-auto"
                >
                  Export PDF
                </button>
              </div>

              {/* Report Table */}
              <table className="w-full border rounded shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm">Order ID</th>
                    <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm">Date</th>
                    <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm">Courses</th>
                    <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm">Total Order Amount</th>
                    <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm">Instructor Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">#{item.orderId}</td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">{item.orderDate}</td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                        <ul className="list-disc list-inside">
                          {item.courses.map((course, courseIdx) => (
                            <li key={courseIdx} className="mb-1">
                              <span className="font-medium">{course.courseName}</span>
                              <br />
                              Original: ₹{course.courseOriginalPrice.toFixed(2)}, Offer: ₹{course.courseOfferPrice.toFixed(2)}
                              <br />
                              Coupon: {course.couponCode} ({course.couponDiscount}%), Discount: ₹{course.couponDiscountAmount.toFixed(2)}
                              <br />
                              Final Price: ₹{course.finalCoursePrice.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">₹{item.totalOrderAmount.toFixed(2)}</td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-green-700">₹{item.instructorEarning.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={4} className="px-2 sm:px-4 py-1 sm:py-2 text-right text-xs sm:text-sm">
                      Total Instructor Earnings
                    </td>
                    <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-green-700">
                      ₹{reportData.reduce((sum, item) => sum + item.instructorEarning, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-2 sm:mt-4">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || reportLoading}
                    className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400 text-xs sm:text-sm"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <span className="text-xs sm:text-sm font-medium">
                    Page {currentPage} of {Math.ceil(totalRecords / limit)}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      currentPage >= Math.ceil(totalRecords / limit) || reportLoading
                    }
                    className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400 text-xs sm:text-sm"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 mt-2 sm:mt-4 text-sm sm:text-base">
              {reportLoading
                ? "Loading report..."
                : "No data available. Please generate a report."}
            </p>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Monthly Performance
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
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

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Category Distribution
            </h3>
            <div className="flex flex-col sm:flex-row items-center">
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} sales`, "Sales"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 mt-2 sm:mt-0 sm:ml-2 sm:ml-4 space-y-1 sm:space-y-2">
                {categoryData.map((entry, index) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                      <span className="font-medium text-gray-700">
                        {entry.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {entry.value}
                      </div>
                      <div className="text-gray-500">
                        {entry.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Courses */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">
            Top Selling Courses
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {topCourses.length > 0 ? (
              topCourses.map((course, index) => (
                <div
                  key={course._id}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.courseName}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = "none";
                        const fallback =
                          target.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg hidden items-center justify-center">
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight sm:leading-5">
                      {course.courseName}
                    </h4>
                    <div className="flex items-center space-x-1 mt-0.5 sm:mt-1">
                      <span className="text-xs sm:text-sm text-gray-500">
                        {course.count} sales
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full">
                      <span className="text-xs sm:text-sm font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 sm:py-6">
                <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No courses found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;