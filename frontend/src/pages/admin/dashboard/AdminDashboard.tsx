import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  getDashboard,
  getCourseReport,
  getMembershipCourseReport
} from "../../../api/action/AdminActionApi";
import { FileText, Download, Calendar, RefreshCw, Filter, Search, TrendingUp, DollarSign } from 'lucide-react';

interface SalesData {
  month: number;
  year: number;
  total: number;
}

interface DashboardData {
  instructorCount: number;
  mentorCount: number;
  courseCount: number;
  courseRevenue: number;
  membershipRevenue: number;
  courseSalesGraph: SalesData[];
  membershipSalesGraph: SalesData[];
}

interface ReportFilter {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
}

interface CourseReportRow {
  orderId: string;
  courseName: string;
  instructorName: string;
  coursePrice: number;
  adminShare: number;
  date: string;
}

interface MembershipReportRow {
  orderId: string;
  planName: string;
  instructorName: string;
  price: number;
  date: string;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [courseReport, setCourseReport] = useState<CourseReportRow[]>([]);
  const [membershipReport, setMembershipReport] = useState<MembershipReportRow[]>([]);
  const [courseReportTotals, setCourseReportTotals] = useState<{ totalAdminShare: number }>({ totalAdminShare: 0 });
  const [membershipReportTotals, setMembershipReportTotals] = useState<{ totalRevenue: number; totalSales: number }>({ totalRevenue: 0, totalSales: 0 });
  const [filter, setFilter] = useState<ReportFilter>({ type: "monthly" });
  const [loading, setLoading] = useState<boolean>(true);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showReports, setShowReports] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"course" | "membership">("course");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

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

  const generateReports = async () => {
    try {
      setReportLoading(true);
      
      // Prepare filter with custom dates if selected
      const reportFilter = {
        ...filter,
        ...(filter.type === "custom" && customStartDate && customEndDate 
          ? { startDate: new Date(customStartDate), endDate: new Date(customEndDate) }
          : {}
        )
      };

      const [courseRes, membershipRes] = await Promise.all([
        getCourseReport(reportFilter),
        getMembershipCourseReport(reportFilter),
      ]);

      console.log("Course Report:", courseRes);
      console.log("Membership Report:", membershipRes);
      
      // Validate and handle course report response
      if (courseRes.success) {
        setCourseReport(courseRes.data || []);
        setCourseReportTotals({ totalAdminShare: courseRes.adminShare || 0 });
      } else {
        throw new Error("Invalid course report response");
      }
      
      // Validate and handle membership report response
      if (membershipRes.success) {
        setMembershipReport(membershipRes.data || []);
        setMembershipReportTotals({ 
          totalRevenue: membershipRes.totalRevenue || 0,
          totalSales: membershipRes.totalSales || 0
        });
      } else {
        throw new Error("Invalid membership report response");
      }
      
      setShowReports(true);
    } catch (err) {
      console.error("Failed to generate reports:", err);
      setError("Failed to generate reports");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as ReportFilter["type"];
    setFilter({ type: selected });
    // Hide reports when filter changes, requiring regeneration
    setShowReports(false);
  };

  const formatGraphData = (sales: SalesData[]) =>
    sales.map((item) => ({
      name: `${monthNames[item.month - 1]} ${item.year}`,
      total: item.total,
    }));

  const exportToCSV = (data: any[], filename: string, totals?: any) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    let csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ];

    // Add totals row if provided
    if (totals) {
      csvContent.push(''); // Empty row
      if (filename.includes('course')) {
        csvContent.push(`Total Admin Share,,,₹${totals.totalAdminShare.toLocaleString()},`);
      } else {
        csvContent.push(`Total Revenue,,₹${totals.totalRevenue.toLocaleString()},,`);
        csvContent.push(`Total Sales,,${totals.totalSales},,`);
      }
    }
    
    const csvString = csvContent.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFilterDisplayName = () => {
    switch (filter.type) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
      case "custom": return `${customStartDate} to ${customEndDate}`;
      default: return "";
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
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
    <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your platform's performance and metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <Card title="Total Instructors" value={dashboardData?.instructorCount} icon="👨‍🏫" />
        <Card title="Total Mentors" value={dashboardData?.mentorCount} icon="🎓" />
        <Card title="Total Courses" value={dashboardData?.courseCount} icon="📚" />
        <Card title="Course Revenue" value={`₹${dashboardData?.courseRevenue.toLocaleString()}`} green icon="💰" />
        <Card title="Membership Revenue" value={`₹${dashboardData?.membershipRevenue.toLocaleString()}`} green icon="💳" />
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Graph title="Monthly Course Sales" data={formatGraphData(dashboardData?.courseSalesGraph || [])} color="#3b82f6" />
        <Graph title="Monthly Membership Sales" data={formatGraphData(dashboardData?.membershipSalesGraph || [])} color="#10b981" />
      </div>

      {/* Report Generation Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Generate Reports</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Filter & Generate</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Report Type
            </label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={generateReports}
              disabled={reportLoading || (filter.type === "custom" && (!customStartDate || !customEndDate))}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {reportLoading ? (
                <RefreshCw className="animate-spin h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>{reportLoading ? "Generating..." : "Generate Reports"}</span>
            </button>
          </div>
        </div>

        {/* Report Status */}
        {!showReports && !reportLoading && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Click "Generate Reports" to view detailed sales data</p>
          </div>
        )}
      </div>

      {/* Reports Display */}
      {showReports && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Report Header with Period */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Sales Report</h3>
                <p className="text-blue-700">Period: {getFilterDisplayName()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Generated on</p>
                <p className="font-semibold text-blue-900">{new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          </div>

          {/* Report Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("course")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "course"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Course Sales ({courseReport.length})
              </button>
              <button
                onClick={() => setActiveTab("membership")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "membership"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Membership Sales ({membershipReport.length})
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={() => {
                if (activeTab === "course") {
                  exportToCSV(courseReport, "course_report", courseReportTotals);
                } else {
                  exportToCSV(membershipReport, "membership_report", membershipReportTotals);
                }
              }}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Course Sales Report */}
          {activeTab === "course" && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-600">Course Sales Report</h3>
              {courseReport.length > 0 ? (
                <div>
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full table-auto border-collapse border border-gray-200 rounded-lg">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Order ID</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Course</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Instructor</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Price</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Admin Share</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseReport.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 border border-gray-200 font-mono text-sm">{row.orderId}</td>
                            <td className="px-4 py-3 border border-gray-200 font-medium">{row.courseName}</td>
                            <td className="px-4 py-3 border border-gray-200 text-gray-600">{row.instructorName}</td>
                            <td className="px-4 py-3 border border-gray-200 font-semibold text-green-600">₹{row.coursePrice.toLocaleString()}</td>
                            <td className="px-4 py-3 border border-gray-200 font-semibold text-blue-600">₹{row.adminShare.toLocaleString()}</td>
                            <td className="px-4 py-3 border border-gray-200 text-gray-600">
                              {new Date(row.date).toLocaleDateString("en-GB").replace(/\//g, "-")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Course Report Totals */}
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Report Summary</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-600">Total Admin Revenue</p>
                        <p className="text-2xl font-bold text-blue-900">₹{courseReportTotals.totalAdminShare.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No course sales data found for the selected period</p>
                </div>
              )}
            </div>
          )}

          {/* Membership Report */}
          {activeTab === "membership" && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-600">Membership Report</h3>
              {membershipReport.length > 0 ? (
                <div>
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full table-auto border-collapse border border-gray-200 rounded-lg">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Order ID</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Plan</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Instructor</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Price</th>
                          <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membershipReport.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 border border-gray-200 font-mono text-sm">{row.orderId}</td>
                            <td className="px-4 py-3 border border-gray-200 font-semibold">{row.planName}</td>
                            <td className="px-4 py-3 border border-gray-200 text-gray-600">{row.instructorName}</td>
                            <td className="px-4 py-3 border border-gray-200 font-semibold text-green-600">₹{row.price.toLocaleString()}</td>
                            <td className="px-4 py-3 border border-gray-200 text-gray-600">
                              {new Date(row.date).toLocaleDateString("en-GB").replace(/\//g, "-")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Membership Report Totals */}
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900">Total Revenue</span>
                        </div>
                        <p className="text-xl font-bold text-green-900">₹{membershipReportTotals.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900">Total Sales</span>
                        </div>
                        <p className="text-xl font-bold text-green-900">{membershipReportTotals.totalSales.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No membership sales data found for the selected period</p>
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
const Card = ({ title, value, green = false, icon }: { title: string; value: any; green?: boolean; icon?: string }) => (
  <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className={`text-2xl font-bold ${green ? "text-green-600" : "text-gray-900"}`}>{value}</p>
      </div>
      {icon && (
        <div className="text-2xl opacity-50">
          {icon}
        </div>
      )}
    </div>
  </div>
);

// Enhanced Graph Component
const Graph = ({ title, data, color }: { title: string; data: any[]; color: string }) => (
  <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="name" 
          stroke="#6b7280"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip 
          formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
          labelStyle={{ color: '#374151' }}
          contentStyle={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
        <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default AdminDashboard;
