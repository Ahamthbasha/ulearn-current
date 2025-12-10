import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getDashboard,
  getCourseReport,
  getMembershipCourseReport,
  exportReport,
} from "../../../api/action/AdminActionApi";
import {
  FileText,
  Download,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";

import {
  type MembershipReportRow,
  type DashboardData,
  type CourseReportRow,
  type ReportFilter,
  type SalesData,
} from "../interface/adminInterface";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [courseReport, setCourseReport] = useState<CourseReportRow[]>([]);
  const [membershipReport, setMembershipReport] = useState<MembershipReportRow[]>([]);
  const [courseReportTotals, setCourseReportTotals] = useState<{
    totalAdminShare: number;
  }>({ totalAdminShare: 0 });
  const [membershipReportTotals, setMembershipReportTotals] = useState<{
    totalRevenue: number;
    totalSales: number;
  }>({ totalRevenue: 0, totalSales: 0 });
  const [filter, setFilter] = useState<ReportFilter>({ type: "monthly" });
  const [courseCurrentPage, setCourseCurrentPage] = useState<number>(1);
  const [courseTotalPages, setCourseTotalPages] = useState<number>(1);
  const [membershipCurrentPage, setMembershipCurrentPage] = useState<number>(1);
  const [membershipTotalPages, setMembershipTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showReports, setShowReports] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"course" | "membership">("course");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [dateValidationError, setDateValidationError] = useState<string>("");
  const limit = 1; // Fixed limit for pagination

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Date validation functions
  const validateDates = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) {
      return "Both start date and end date are required";
    }

    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Check if end date is in the future
    if (end > today) {
      return "End date cannot be in the future";
    }

    // Check if start date is in the future
    if (start > today) {
      return "Start date cannot be in the future";
    }

    // Check if start date is after end date
    if (start > end) {
      return "Start date cannot be after end date";
    }

    // Check if date range is too large (optional - you can adjust this)
    const daysDifference = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDifference > 365) {
      return "Date range cannot exceed 365 days";
    }

    return "";
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setCustomStartDate(newStartDate);

    if (newStartDate && customEndDate) {
      const validationError = validateDates(newStartDate, customEndDate);
      setDateValidationError(validationError);
    } else {
      setDateValidationError("");
    }
    setShowReports(false);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setCustomEndDate(newEndDate);

    if (customStartDate && newEndDate) {
      const validationError = validateDates(customStartDate, newEndDate);
      setDateValidationError(validationError);
    } else {
      setDateValidationError("");
    }
    setShowReports(false);
  };

  const isGenerateButtonDisabled = () => {
    if (reportLoading) return true;

    if (filter.type === "custom") {
      return !customStartDate || !customEndDate || !!dateValidationError;
    }

    return false;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboard();
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCourseReport = async (page: number = courseCurrentPage) => {
    try {
      setReportLoading(true);
      const reportFilter = {
        ...filter,
        ...(filter.type === "custom" && customStartDate && customEndDate
          ? {
              startDate: new Date(customStartDate),
              endDate: new Date(customEndDate),
            }
          : {}),
      };

      const courseRes = await getCourseReport(reportFilter, page, limit);

      if (courseRes.success) {
        setCourseReport(courseRes.data || []);
        setCourseReportTotals({ totalAdminShare: courseRes.adminShare || 0 });
        setCourseTotalPages(Math.ceil(courseRes.totalItems / limit));
      } else {
        throw new Error("Invalid course report response");
      }
    } catch (err) {
      console.error("Failed to generate course report:", err);
      setError("Failed to generate course report");
    } finally {
      setReportLoading(false);
    }
  };

  const generateMembershipReport = async (
    page: number = membershipCurrentPage
  ) => {
    try {
      setReportLoading(true);
      const reportFilter = {
        ...filter,
        ...(filter.type === "custom" && customStartDate && customEndDate
          ? {
              startDate: new Date(customStartDate),
              endDate: new Date(customEndDate),
            }
          : {}),
      };

      const membershipRes = await getMembershipCourseReport(
        reportFilter,
        page,
        limit
      );

      if (membershipRes.success) {
        setMembershipReport(membershipRes.data || []);
        setMembershipReportTotals({
          totalRevenue: membershipRes.totalRevenue || 0,
          totalSales: membershipRes.totalSales || 0,
        });
        setMembershipTotalPages(Math.ceil(membershipRes.totalItems / limit));
      } else {
        throw new Error("Invalid membership report response");
      }
    } catch (err) {
      console.error("Failed to generate membership report:", err);
      setError("Failed to generate membership report");
    } finally {
      setReportLoading(false);
    }
  };

  const generateReports = async () => {
    try {
      setReportLoading(true);
      await Promise.all([
        generateCourseReport(courseCurrentPage),
        generateMembershipReport(membershipCurrentPage),
      ]);
      setShowReports(true);
    } catch (err) {
      console.error("Failed to generate reports:", err);
      setError("Failed to generate reports");
    } finally {
      setReportLoading(false);
    }
  };

  const handleExport = async (
    reportType: "course" | "membership",
    format: "excel" | "pdf"
  ) => {
    try {
      setExportLoading(true);
      const reportFilter = {
        ...filter,
        ...(filter.type === "custom" && customStartDate && customEndDate
          ? {
              startDate: new Date(customStartDate),
              endDate: new Date(customEndDate),
            }
          : {}),
      };
      await exportReport(reportType, format, reportFilter);
      setError(null);
    } catch (err) {
      console.error("Failed to export report:", err);
      setError(
        `Failed to export ${reportType} report as ${format.toUpperCase()}`
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handleCoursePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= courseTotalPages) {
      setCourseCurrentPage(newPage);
      generateCourseReport(newPage);
    }
  };

  const handleMembershipPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= membershipTotalPages) {
      setMembershipCurrentPage(newPage);
      generateMembershipReport(newPage);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as ReportFilter["type"];
    setFilter({ type: selected });
    setShowReports(false);
    setCourseCurrentPage(1);
    setMembershipCurrentPage(1);

    // Reset custom dates and validation errors when switching away from custom
    if (selected !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
      setDateValidationError("");
    }
  };

  const formatGraphData = (sales: SalesData[]) =>
    sales.map((item) => ({
      name: `${monthNames[item.month - 1]} ${item.year}`,
      total: item.total,
    }));

  const getFilterDisplayName = () => {
    switch (filter.type) {
      case "daily":
        return "Today";
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      case "custom":
        return `${customStartDate} to ${customEndDate}`;
      default:
        return "";
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-8 lg:space-y-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Overview of your platform's performance and metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <Card
          title="Total Instructors"
          value={dashboardData?.instructorCount}
          icon="👨‍🏫"
        />
        <Card
          title="Total Mentors"
          value={dashboardData?.mentorCount}
          icon="🎓"
        />
        <Card
          title="Total Courses"
          value={dashboardData?.courseCount}
          icon="📚"
        />
        <Card
          title="Course Revenue"
          value={`₹${dashboardData?.courseRevenue.toLocaleString()}`}
          green
          icon="💰"
        />
        <Card
          title="Membership Revenue"
          value={`₹${dashboardData?.membershipRevenue.toLocaleString()}`}
          green
          icon="💳"
        />
      </div>

      {/* Top Courses and Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Top 3 Courses
          </h3>
          {dashboardData?.topCourses && dashboardData.topCourses.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {dashboardData.topCourses.map((course, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-blue-600 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base break-words">
                      {course.courseName}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 self-start sm:self-center">
                    {course.salesCount} sales
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm sm:text-base">No top courses data available</p>
          )}
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Top 3 Categories
          </h3>
          {dashboardData?.topCategories &&
          dashboardData.topCategories.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {dashboardData.topCategories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-green-600 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base break-words">
                      {category.categoryName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm sm:text-base">No top categories data available</p>
          )}
        </div>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Graph
          title="Monthly Course Sales"
          data={formatGraphData(dashboardData?.courseSalesGraph || [])}
          color="#3b82f6"
        />
        <Graph
          title="Monthly Membership Sales"
          data={formatGraphData(dashboardData?.membershipSalesGraph || [])}
          color="#10b981"
        />
      </div>

      {/* Report Generation Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Generate Reports
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Filter & Generate</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Report Type
              </label>
              <select
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filter.type}
                onChange={handleFilterChange}
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {filter.type === "custom" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      dateValidationError ? "border-red-300" : "border-gray-300"
                    }`}
                    value={customStartDate}
                    onChange={handleStartDateChange}
                    max={getTodayString()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      dateValidationError ? "border-red-300" : "border-gray-300"
                    }`}
                    value={customEndDate}
                    onChange={handleEndDateChange}
                    max={getTodayString()}
                    min={customStartDate || undefined}
                  />
                </div>
              </>
            )}

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={generateReports}
                disabled={isGenerateButtonDisabled()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                {reportLoading ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>
                  {reportLoading ? "Generating..." : "Generate Reports"}
                </span>
              </button>
            </div>
          </div>

          {/* Date Validation Error */}
          {dateValidationError && (
            <div className="flex items-start space-x-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{dateValidationError}</span>
            </div>
          )}

          {/* Date Selection Helper Text */}
          {filter.type === "custom" && !dateValidationError && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800 mb-1">
                    Date Selection Guidelines:
                  </p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• End date must be today or earlier</li>
                    <li>• Start date must be before or equal to end date</li>
                    <li>• Maximum date range: 365 days</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Status */}
        {!showReports && !reportLoading && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm sm:text-base">Click "Generate Reports" to view detailed sales data</p>
          </div>
        )}
      </div>

      {/* Reports Display */}
      {showReports && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          {/* Report Header with Period */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Sales Report
                </h3>
                <p className="text-blue-700 text-sm">
                  Period: {getFilterDisplayName()}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-blue-600">Generated on</p>
                <p className="font-semibold text-blue-900 text-sm">
                  {new Date().toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Report Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("course")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === "course"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Course Sales ({courseReport.length})
              </button>
              <button
                onClick={() => setActiveTab("membership")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === "membership"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Membership Sales ({membershipReport.length})
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport(activeTab, "excel")}
                disabled={
                  exportLoading ||
                  (activeTab === "course"
                    ? courseReport.length === 0
                    : membershipReport.length === 0)
                }
                className="flex items-center space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{exportLoading ? "Exporting..." : "Export Excel"}</span>
                <span className="sm:hidden">Excel</span>
              </button>
              <button
                onClick={() => handleExport(activeTab, "pdf")}
                disabled={
                  exportLoading ||
                  (activeTab === "course"
                    ? courseReport.length === 0
                    : membershipReport.length === 0)
                }
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{exportLoading ? "Exporting..." : "Export PDF"}</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>

          {/* Course Sales Report */}
          {activeTab === "course" && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">
                Course Sales Report
              </h3>
              {courseReport.length > 0 ? (
                <div>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-4 mb-4">
                    {courseReport.map((order) =>
                      order.courses.map((course, courseIdx) => (
                        <div
                          key={`${order.orderId}-${courseIdx}`}
                          className="bg-gray-50 rounded-lg p-4 space-y-2"
                        >
                          {courseIdx === 0 && (
                            <>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-gray-500">Order ID</span>
                                <span className="font-mono text-sm font-medium">
                                  {order.orderId}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-gray-500">Date</span>
                                <span className="text-sm">{order.date}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-gray-500">Course</span>
                            <span className="text-sm font-medium text-right max-w-[60%]">
                              {course.courseName}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-gray-500">Instructor</span>
                            <span className="text-sm text-right max-w-[60%]">
                              {course.instructorName}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-gray-500">Course Price</span>
                            <span className="text-sm font-semibold text-green-600">
                              ₹{(course.offerPrice != null ? course.offerPrice : course.coursePrice).toLocaleString()}
                            </span>
                          </div>
                          {courseIdx === order.courses.length - 1 && (
                            <>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-gray-500">Total Price</span>
                                <span className="text-sm font-semibold text-blue-600">
                                  ₹{order.totalPrice.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-gray-500">Admin Share</span>
                                <span className="text-sm font-semibold text-blue-600">
                                  ₹{order.totalAdminShare.toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto mb-4">
                    <table className="min-w-full table-auto border-collapse border border-gray-200 rounded-lg">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Order ID
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Date
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Course Name
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Instructor
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Course Price
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Coupon Used
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Discounted Price
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Admin Share
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Total Price
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Total Admin Share
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseReport.map((order) =>
                          order.courses.map((course, courseIdx) => (
                            <tr
                              key={`${order.orderId}-${courseIdx}`}
                              className={
                                courseIdx === order.courses.length - 1
                                  ? "bg-gray-100"
                                  : "hover:bg-gray-50 transition-colors"
                              }
                            >
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 font-mono text-xs sm:text-sm">
                                {courseIdx === 0 ? order.orderId : ""}
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 text-gray-600 text-xs sm:text-sm">
                                {courseIdx === 0 ? order.date : ""}
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 font-medium text-xs sm:text-sm">
                                <div className="break-words max-w-[150px] sm:max-w-none">
                                  {course.courseName}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 text-gray-600 text-xs sm:text-sm">
                                <div className="break-words max-w-[100px] sm:max-w-none">
                                  {course.instructorName}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 font-semibold text-green-600 text-xs sm:text-sm">
                                ₹{(course.offerPrice != null ? course.offerPrice : course.coursePrice).toLocaleString()}
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 text-xs sm:text-sm">
                                {courseIdx === 0 ? (
                                  order.couponCode ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      No
                                    </span>
                                  )
                                ) : (
                                  ""
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 font-semibold text-purple-600 text-xs sm:text-sm">
                                ₹{course.discountedPrice.toLocaleString()}
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 font-semibold text-orange-600 text-xs sm:text-sm">
                                ₹{course.adminShare.toLocaleString()}
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 font-semibold text-blue-600 text-xs sm:text-sm">
                                {courseIdx === order.courses.length - 1
                                  ? `₹${order.totalPrice.toLocaleString()}`
                                  : ""}
                              </td>
                              <td className="px-3 sm:px-4 py-3 border border-gray-200 font-semibold text-blue-600 text-xs sm:text-sm">
                                {courseIdx === order.courses.length - 1
                                  ? `₹${order.totalAdminShare.toLocaleString()}`
                                  : ""}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Course Pagination Controls */}
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                    <button
                      onClick={() =>
                        handleCoursePageChange(courseCurrentPage - 1)
                      }
                      disabled={courseCurrentPage === 1}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {courseCurrentPage} of {courseTotalPages}
                    </span>
                    <button
                      onClick={() =>
                        handleCoursePageChange(courseCurrentPage + 1)
                      }
                      disabled={courseCurrentPage === courseTotalPages}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                  </div>

                  {/* Course Report Totals */}
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900 text-sm sm:text-base">
                          Report Summary
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-blue-600">
                          Total Admin Revenue
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900">
                          ₹{courseReportTotals.totalAdminShare.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm sm:text-base">No course sales data found for the selected period</p>
                </div>
              )}
            </div>
          )}

          {/* Membership Report */}
          {activeTab === "membership" && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-green-600">
                Membership Report
              </h3>
              {membershipReport.length > 0 ? (
                <div>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-4 mb-4">
                    {membershipReport.map((row, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">Order ID</span>
                          <span className="font-mono text-sm font-medium">
                            {row.orderId}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">Plan</span>
                          <span className="text-sm font-semibold text-right max-w-[60%]">
                            {row.planName}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">Instructor</span>
                          <span className="text-sm text-right max-w-[60%]">
                            {row.instructorName}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">Price</span>
                          <span className="text-sm font-semibold text-green-600">
                            ₹{row.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">Date</span>
                          <span className="text-sm">{row.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto mb-4">
                    <table className="min-w-full table-auto border-collapse border border-gray-200 rounded-lg">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Order ID
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Plan
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Instructor
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Price
                          </th>
                          <th className="px-3 sm:px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700 text-xs sm:text-sm">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {membershipReport.map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 sm:px-4 py-3 border border-gray-200 font-mono text-xs sm:text-sm">
                              {row.orderId}
                            </td>
                            <td className="px-3 sm:px-4 py-3 border border-gray-200 font-semibold text-xs sm:text-sm">
                              <div className="break-words max-w-[120px] sm:max-w-none">
                                {row.planName}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 border border-gray-200 text-gray-600 text-xs sm:text-sm">
                              <div className="break-words max-w-[100px] sm:max-w-none">
                                {row.instructorName}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 border border-gray-200 font-semibold text-green-600 text-xs sm:text-sm">
                              ₹{row.price.toLocaleString()}
                            </td>
                            <td className="px-3 sm:px-4 py-3 border border-gray-200 text-gray-600 text-xs sm:text-sm">
                              {row.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Membership Pagination Controls */}
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                    <button
                      onClick={() =>
                        handleMembershipPageChange(membershipCurrentPage - 1)
                      }
                      disabled={membershipCurrentPage === 1}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {membershipCurrentPage} of {membershipTotalPages}
                    </span>
                    <button
                      onClick={() =>
                        handleMembershipPageChange(membershipCurrentPage + 1)
                      }
                      disabled={membershipCurrentPage === membershipTotalPages}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                  </div>

                  {/* Membership Report Totals */}
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900 text-sm sm:text-base">
                            Total Revenue
                          </span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-green-900 text-left sm:text-right">
                          ₹
                          {membershipReportTotals.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900 text-sm sm:text-base">
                            Total Sales
                          </span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-green-900 text-left sm:text-right">
                          {membershipReportTotals.totalSales.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm sm:text-base">No membership sales data found for the selected period</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Card Component
const Card = ({
  title,
  value,
  green = false,
  icon,
}: {
  title: string;
  value: any;
  green?: boolean;
  icon?: string;
}) => (
  <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</h3>
        <p
          className={`text-lg sm:text-2xl font-bold truncate ${
            green ? "text-green-600" : "text-gray-900"
          }`}
        >
          {value}
        </p>
      </div>
      {icon && <div className="text-xl sm:text-2xl opacity-50 flex-shrink-0 ml-2">{icon}</div>}
    </div>
  </div>
);

// Enhanced Graph Component
const Graph = ({
  title,
  data,
  color,
}: {
  title: string;
  data: any[];
  color: string;
}) => (
  <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100">
    <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">{title}</h3>
    <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          stroke="#6b7280"
          fontSize={10}
          className="sm:text-xs"
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis stroke="#6b7280" fontSize={10} className="sm:text-xs" />
        <Tooltip
          formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
          labelStyle={{ color: "#374151" }}
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="total" fill={color} radius={[2, 2, 0, 0]} className="sm:!rounded-[4px_4px_0_0]" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default AdminDashboard;