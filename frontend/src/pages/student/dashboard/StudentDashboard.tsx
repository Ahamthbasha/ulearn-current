// import { useEffect, useState, useCallback } from "react";
// import {
//   dashboard,
//   courseReport,
//   slotReport,
//   exportCourseReport,
//   exportSlotReport,
// } from "../../../api/action/StudentAction";
// import {
//   Calendar,
//   FileText,
//   Filter,
//   Search,
//   RefreshCw,
//   TrendingUp,
//   DollarSign,
//   BookOpen,
//   Clock,
//   Download,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   ResponsiveContainer,
//   Legend,
// } from "recharts";
// import { Component } from "react";

// interface ErrorBoundaryProps {
//   children: React.ReactNode;
// }

// class ErrorBoundary extends Component<ErrorBoundaryProps> {
//   state = { hasError: false, error: null as Error | null };

//   static getDerivedStateFromError(error: Error) {
//     return { hasError: true, error };
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="text-red-600 text-center p-6 bg-red-50 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold">Something Went Wrong</h3>
//           <p>{this.state.error?.message || "An unexpected error occurred."}</p>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// interface MonthlyPerformanceItem {
//   month: number | null;
//   year: number | null;
//   count: number;
//   totalAmount: number;
// }

// interface DashboardData {
//   totalCoursesPurchased: number;
//   totalCoursesCompleted: number;
//   totalCoursesNotCompleted: number;
//   totalCoursePurchaseCost: number;
//   totalSlotBookings: number;
//   totalSlotBookingCost: number;
//   coursePerformance: MonthlyPerformanceItem[];
//   slotPerformance: MonthlyPerformanceItem[];
// }

// interface IStudentCourseReportItem {
//   orderId: string;
//   date: string;
//   courseName: string[] | string;
//   price: number[] | number;
//   totalCost: number;
// }

// interface IStudentSlotReportItem {
//   bookingId: string;
//   date: string;
//   slotTime: {
//     startTime: string;
//     endTime: string;
//   };
//   instructorName: string;
//   price: number;
//   totalPrice: number;
// }

// interface ReportFilter {
//   type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
//   startDate?: string;
//   endDate?: string;
//   page: number;
// }

// const StudentDashboard = () => {
//   const [data, setData] = useState<DashboardData | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [courseReportData, setCourseReportData] = useState<IStudentCourseReportItem[]>([]);
//   const [slotReportData, setSlotReportData] = useState<IStudentSlotReportItem[]>([]);
//   const [courseReportTotals, setCourseReportTotals] = useState<{
//     totalCost: number;
//     totalOrders: number;
//   }>({ totalCost: 0, totalOrders: 0 });
//   const [slotReportTotals, setSlotReportTotals] = useState<{
//     totalCost: number;
//     totalBookings: number;
//   }>({ totalCost: 0, totalBookings: 0 });
//   const [courseFilter, setCourseFilter] = useState<ReportFilter>({ type: "monthly", page: 1 });
//   const [slotFilter, setSlotFilter] = useState<ReportFilter>({ type: "monthly", page: 1 });
//   const [reportLoading, setReportLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [showReports, setShowReports] = useState<boolean>(false);
//   const [activeTab, setActiveTab] = useState<"course" | "slot">("course");
//   const [customStartDate, setCustomStartDate] = useState<string>("");
//   const [customEndDate, setCustomEndDate] = useState<string>("");

//   const fetchDashboardData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await dashboard();
//       setData(res.data);
//       setError(null);
//     } catch (err) {
//       console.error("Failed to load dashboard:", err);
//       setError("Failed to load dashboard data");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const generateReports = useCallback(
//     async (reportType: "course" | "slot" | "both", page: number = 1) => {
//       try {
//         setReportLoading(true);
//         setError(null);

//         const reportFilter = (filter: ReportFilter) => ({
//           type: filter.type,
//           page,
//           ...(filter.type === "custom" && customStartDate && customEndDate
//             ? {
//                 startDate: new Date(customStartDate).toISOString().split("T")[0],
//                 endDate: new Date(customEndDate).toISOString().split("T")[0],
//               }
//             : {}),
//         });

//         if (reportType === "course" || reportType === "both") {
//           const courseFilterData = reportFilter(courseFilter);
//           console.log("Fetching course report with filter:", courseFilterData);
//           const courseRes = await courseReport(courseFilterData);
//           const courseData = courseRes.data || [];
//           console.log("Course report data:", courseData);
//           setCourseReportData(courseData);
//           const courseTotalCost = courseData.reduce(
//             (sum: number, item: IStudentCourseReportItem) => sum + item.totalCost,
//             0
//           );
//           setCourseReportTotals({
//             totalCost: courseTotalCost,
//             totalOrders: courseData.length,
//           });
//         }

//         if (reportType === "slot" || reportType === "both") {
//           const slotFilterData = reportFilter(slotFilter);
//           console.log("Fetching slot report with filter:", slotFilterData);
//           const slotRes = await slotReport(slotFilterData);
//           const slotData = slotRes.data || [];
//           console.log("Slot report data:", slotData);
//           setSlotReportData(slotData);
//           const slotTotalCost = slotData.reduce(
//             (sum: number, item: IStudentSlotReportItem) => sum + item.price,
//             0
//           );
//           setSlotReportTotals({
//             totalCost: slotTotalCost,
//             totalBookings: slotData.length,
//           });
//         }

//         setShowReports(true);
//       } catch (err) {
//         console.error("Failed to generate reports:", err);
//         setError("Failed to generate reports");
//       } finally {
//         setReportLoading(false);
//       }
//     },
//     [courseFilter, slotFilter, customStartDate, customEndDate]
//   );

//   useEffect(() => {
//     fetchDashboardData();
//   }, [fetchDashboardData]);

//   const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selected = e.target.value as ReportFilter["type"];
//     setCourseFilter({ type: selected, page: 1 });
//     setSlotFilter({ type: selected, page: 1 });
//     setShowReports(false);
//   };

//   const handlePageChange = useCallback(
//     (newPage: number) => {
//       if (newPage < 1) return;
//       if (activeTab === "course") {
//         setCourseFilter((prev) => ({ ...prev, page: newPage }));
//         generateReports("course", newPage);
//       } else {
//         setSlotFilter((prev) => ({ ...prev, page: newPage }));
//         generateReports("slot", newPage);
//       }
//     },
//     [activeTab, generateReports]
//   );

//   const formatChartData = (performance: MonthlyPerformanceItem[]) => {
//     return performance.map((item) => ({
//       name:
//         typeof item.month === "number" && typeof item.year === "number"
//           ? `${item.month.toString().padStart(2, "0")}/${item.year}`
//           : "Unknown",
//       count: item.count,
//       totalAmount: item.totalAmount,
//     }));
//   };

//   const getFilterDisplayName = () => {
//     const filter = activeTab === "course" ? courseFilter : slotFilter;
//     switch (filter.type) {
//       case "daily":
//         return "Today";
//       case "weekly":
//         return "This Week";
//       case "monthly":
//         return "This Month";
//       case "yearly":
//         return "This Year";
//       case "custom":
//         return customStartDate && customEndDate
//           ? `${new Date(customStartDate).toLocaleDateString()} to ${new Date(
//               customEndDate
//             ).toLocaleDateString()}`
//           : "Custom Range";
//       default:
//         return "";
//     }
//   };

//   const formatTime = (timeString: string) => {
//     const date = new Date(timeString);
//     return date.toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     }).toUpperCase();
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
//           <p className="text-gray-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error && !data) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <p className="text-red-600 mb-4">{error}</p>
//           <button
//             onClick={fetchDashboardData}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="text-gray-500 text-center mt-10 text-xl">
//         No data available
//       </div>
//     );
//   }

//   return (
//     <ErrorBoundary>
//       <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
//         {/* Header */}
//         <div className="bg-white rounded-xl shadow-sm p-6">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Student Dashboard
//           </h1>
//           <p className="text-gray-600">
//             Overview of your learning journey and booking activities
//           </p>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
//           <Card
//             title="Courses Purchased"
//             value={data.totalCoursesPurchased}
//             icon="📚"
//           />
//           <Card
//             title="Courses Completed"
//             value={data.totalCoursesCompleted}
//             icon="✅"
//             green
//           />
//           <Card
//             title="Courses Pending"
//             value={data.totalCoursesNotCompleted}
//             icon="⏳"
//           />
//           <Card
//             title="Course Investment"
//             value={`₹${data.totalCoursePurchaseCost.toLocaleString()}`}
//             icon="💰"
//             green
//           />
//           <Card
//             title="Slots Booked"
//             value={data.totalSlotBookings}
//             icon="🎯"
//           />
//           <Card
//             title="Slot Investment"
//             value={`₹${data.totalSlotBookingCost.toLocaleString()}`}
//             icon="💳"
//             green
//           />
//         </div>

//         {/* Charts */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <Graph
//             title="Monthly Course Purchases"
//             data={formatChartData(data.coursePerformance)}
//             color="#3b82f6"
//           />
//           <Graph
//             title="Monthly Slot Bookings"
//             data={formatChartData(data.slotPerformance)}
//             color="#10b981"
//           />
//         </div>

//         {/* Report Generation Section */}
//         <div className="bg-white rounded-xl shadow-sm p-6">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center space-x-3">
//               <FileText className="h-6 w-6 text-blue-600" />
//               <h2 className="text-2xl font-bold text-gray-900">
//                 Generate Reports
//               </h2>
//             </div>
//             <div className="flex items-center space-x-2">
//               <Filter className="h-5 w-5 text-gray-500" />
//               <span className="text-sm text-gray-600">Filter & Generate</span>
//             </div>
//           </div>

//           {/* Filter Controls */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <Calendar className="inline h-4 w-4 mr-1" />
//                 Report Type
//               </label>
//               <select
//                 className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={courseFilter.type}
//                 onChange={handleFilterChange}
//               >
//                 <option value="daily">Daily Report</option>
//                 <option value="weekly">Weekly Report</option>
//                 <option value="monthly">Monthly Report</option>
//                 <option value="yearly">Yearly Report</option>
//                 <option value="custom">Custom Range</option>
//               </select>
//             </div>

//             {courseFilter.type === "custom" && (
//               <>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Start Date
//                   </label>
//                   <input
//                     type="date"
//                     className="w-full border border-gray-200 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     value={customStartDate}
//                     onChange={(e) => setCustomStartDate(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     End Date
//                   </label>
//                   <input
//                     type="date"
//                     className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     value={customEndDate}
//                     onChange={(e) => setCustomEndDate(e.target.value)}
//                   />
//                 </div>
//               </>
//             )}

//             <div className="flex items-end">
//               <button
//                 onClick={() => generateReports("both", 1)}
//                 disabled={
//                   reportLoading ||
//                   (courseFilter.type === "custom" &&
//                     (!customStartDate || !customEndDate))
//                 }
//                 className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
//               >
//                 {reportLoading ? (
//                   <RefreshCw className="animate-spin h-4 w-4" />
//                 ) : (
//                   <Search className="h-4 w-4" />
//                 )}
//                 <span>
//                   {reportLoading ? "Generating..." : "Generate Reports"}
//                 </span>
//               </button>
//             </div>
//           </div>

//           {/* Report Status */}
//           {!showReports && !reportLoading && (
//             <div className="text-center py-8 text-gray-500">
//               <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//               <p>Click "Generate Reports" to view detailed activity data</p>
//             </div>
//           )}

//           {error && (
//             <div className="text-red-600 text-center mt-4 bg-red-50 p-3 rounded-lg border border-red-200">
//               {error}
//             </div>
//           )}
//         </div>

//         {/* Reports Display */}
//         {showReports && (
//           <div className="bg-white rounded-xl shadow-sm p-6">
//             {/* Report Header with Period */}
//             <div className="mb-6 p-4 bg-blue-50 rounded-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-blue-900">
//                     Activity Report
//                   </h3>
//                   <p className="text-blue-700">
//                     Period: {getFilterDisplayName()}
//                   </p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-sm text-blue-600">Generated on</p>
//                   <p className="font-semibold text-blue-900">
//                     {new Date().toLocaleDateString("en-GB")}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Report Tabs */}
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
//                 <button
//                   onClick={() => setActiveTab("course")}
//                   className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
//                     activeTab === "course"
//                       ? "bg-white text-blue-600 shadow-sm"
//                       : "text-gray-600 hover:text-gray-900"
//                   }`}
//                 >
//                   Course Purchases ({courseReportData.length})
//                 </button>
//                 <button
//                   onClick={() => setActiveTab("slot")}
//                   className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
//                     activeTab === "slot"
//                       ? "bg-white text-green-600 shadow-sm"
//                       : "text-gray-600 hover:text-gray-900"
//                   }`}
//                 >
//                   Slot Bookings ({slotReportData.length})
//                 </button>
//               </div>
//               {activeTab === "course" && courseReportData.length > 0 && (
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={() =>
//                       exportCourseReport("excel", {
//                         type: courseFilter.type,
//                         startDate: courseFilter.startDate,
//                         endDate: courseFilter.endDate,
//                         page: courseFilter.page,
//                       })
//                     }
//                     className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors flex items-center"
//                   >
//                     <Download className="h-4 w-4 mr-1" /> Excel
//                   </button>
//                   <button
//                     onClick={() =>
//                       exportCourseReport("pdf", {
//                         type: courseFilter.type,
//                         startDate: courseFilter.startDate,
//                         endDate: courseFilter.endDate,
//                         page: courseFilter.page,
//                       })
//                     }
//                     className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors flex items-center"
//                   >
//                     <Download className="h-4 w-4 mr-1" /> PDF
//                   </button>
//                 </div>
//               )}
//               {activeTab === "slot" && slotReportData.length > 0 && (
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={() =>
//                       exportSlotReport("excel", {
//                         type: slotFilter.type,
//                         startDate: slotFilter.startDate,
//                         endDate: slotFilter.endDate,
//                         page: slotFilter.page,
//                       })
//                     }
//                     className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors flex items-center"
//                   >
//                     <Download className="h-4 w-4 mr-1" /> Excel
//                   </button>
//                   <button
//                     onClick={() =>
//                       exportSlotReport("pdf", {
//                         type: slotFilter.type,
//                         startDate: slotFilter.startDate,
//                         endDate: slotFilter.endDate,
//                         page: slotFilter.page,
//                       })
//                     }
//                     className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors flex items-center"
//                   >
//                     <Download className="h-4 w-4 mr-1" /> PDF
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Course Report */}
//             {activeTab === "course" && (
//               <div>
//                 <h3 className="text-xl font-semibold mb-4 text-blue-600 flex items-center">
//                   <BookOpen className="h-5 w-5 mr-2" />
//                   Course Purchase Report
//                 </h3>
//                 {courseReportData.length > 0 ? (
//                   <div>
//                     <div className="space-y-6 mb-6">
//                       {courseReportData.map((item) => {
//                         const courses = Array.isArray(item.courseName)
//                           ? item.courseName
//                           : [item.courseName || ""];
//                         const prices = Array.isArray(item.price)
//                           ? item.price
//                           : [item.price || 0];

//                         return (
//                           <div
//                             key={item.orderId}
//                             className="border border-gray-200 rounded-lg overflow-hidden"
//                           >
//                             <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
//                               <div className="flex justify-between items-center">
//                                 <div>
//                                   <span className="text-sm font-medium text-blue-600">
//                                     Order ID:{" "}
//                                   </span>
//                                   <span className="text-sm font-bold text-blue-900">
//                                     {item.orderId}
//                                   </span>
//                                 </div>
//                                 <div>
//                                   <span className="text-sm font-medium text-blue-600">
//                                     Date:{" "}
//                                   </span>
//                                   <span className="text-sm font-bold text-blue-900">
//                                     {new Date(item.date).toLocaleDateString(
//                                       "en-GB"
//                                     )}
//                                   </span>
//                                 </div>
//                               </div>
//                             </div>

//                             <table className="w-full">
//                               <thead className="bg-gray-50">
//                                 <tr>
//                                   <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                     Course Name
//                                   </th>
//                                   <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                     Price
//                                   </th>
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {courses.map((course, index) => (
//                                   <tr
//                                     key={`${item.orderId}-${index}`}
//                                     className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
//                                   >
//                                     <td className="px-4 py-3 text-sm text-gray-800 font-medium">
//                                       {course}
//                                     </td>
//                                     <td className="px-4 py-3 text-sm text-green-600 font-semibold">
//                                       ₹{(prices[index] || 0).toLocaleString()}
//                                     </td>
//                                   </tr>
//                                 ))}
//                               </tbody>
//                             </table>

//                             <div className="bg-blue-50 px-4 py-3 border-t border-blue-200">
//                               <div className="text-right">
//                                 <span className="text-lg font-bold text-blue-600">
//                                   Total Cost: ₹{item.totalCost.toLocaleString()}
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>

//                     {/* Pagination Controls for Course Report */}
//                     <div className="flex items-center justify-between mt-4">
//                       <div className="flex items-center space-x-2">
//                         <button
//                           onClick={() => handlePageChange(courseFilter.page - 1)}
//                           disabled={courseFilter.page === 1 || reportLoading}
//                           className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
//                         >
//                           <ChevronLeft className="h-4 w-4" />
//                         </button>
//                         <span className="text-sm font-medium">
//                           Page {courseFilter.page}
//                         </span>
//                         <button
//                           onClick={() => handlePageChange(courseFilter.page + 1)}
//                           disabled={courseReportData.length < 5 || reportLoading}
//                           className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
//                         >
//                           <ChevronRight className="h-4 w-4" />
//                         </button>
//                       </div>
//                     </div>

//                     {/* Course Report Totals */}
//                     <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mt-4">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-2">
//                             <DollarSign className="h-5 w-5 text-blue-600" />
//                             <span className="font-semibold text-blue-900">
//                               Total Investment
//                             </span>
//                           </div>
//                           <p className="text-xl font-bold text-blue-900">
//                             ₹{courseReportTotals.totalCost.toLocaleString()}
//                           </p>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-2">
//                             <TrendingUp className="h-5 w-5 text-blue-600" />
//                             <span className="font-semibold text-blue-900">
//                               Total Orders
//                             </span>
//                           </div>
//                           <p className="text-xl font-bold text-blue-900">
//                             {courseReportTotals.totalOrders}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-gray-500">
//                     <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//                     <p>No course purchase data found for the selected period</p>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Slot Report */}
//             {activeTab === "slot" && (
//               <div>
//                 <h3 className="text-xl font-semibold mb-4 text-green-600 flex items-center">
//                   <Clock className="h-5 w-5 mr-2" />
//                   Slot Booking Report
//                 </h3>
//                 {slotReportData.length > 0 ? (
//                   <div>
//                     <div className="overflow-x-auto mb-6">
//                       <table className="min-w-full table-auto border-collapse border border-gray-200 rounded-lg">
//                         <thead className="bg-green-50">
//                           <tr>
//                             <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
//                               Booking ID
//                             </th>
//                             <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
//                               Date
//                             </th>
//                             <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
//                               Instructor
//                             </th>
//                             <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
//                               Slot Time
//                             </th>
//                             <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
//                               Price
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {slotReportData.map((item, idx) => (
//                             <tr
//                               key={idx}
//                               className="hover:bg-gray-50 transition-colors"
//                             >
//                               <td className="px-4 py-3 border border-gray-200 font-mono text-sm">
//                                 {item.bookingId}
//                               </td>
//                               <td className="px-4 py-3 border border-gray-200 text-gray-600">
//                                 {new Date(item.date).toLocaleDateString("en-GB")}
//                               </td>
//                               <td className="px-4 py-3 border border-gray-200 font-medium">
//                                 {item.instructorName}
//                               </td>
//                               <td className="px-4 py-3 border border-gray-200 text-gray-600">
//                                 {`${formatTime(item.slotTime.startTime)} to ${formatTime(
//                                   item.slotTime.endTime
//                                 )}`}
//                               </td>
//                               <td className="px-4 py-3 border border-gray-200 font-semibold text-green-600">
//                                 ₹{item.price.toLocaleString()}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>

//                     {/* Pagination Controls for Slot Report */}
//                     <div className="flex items-center justify-between mt-4">
//                       <div className="flex items-center space-x-2">
//                         <button
//                           onClick={() => handlePageChange(slotFilter.page - 1)}
//                           disabled={slotFilter.page === 1 || reportLoading}
//                           className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
//                         >
//                           <ChevronLeft className="h-4 w-4" />
//                         </button>
//                         <span className="text-sm font-medium">
//                           Page {slotFilter.page}
//                         </span>
//                         <button
//                           onClick={() => handlePageChange(slotFilter.page + 1)}
//                           disabled={slotReportData.length < 5 || reportLoading}
//                           className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
//                         >
//                           <ChevronRight className="h-4 w-4" />
//                         </button>
//                       </div>
//                     </div>

//                     {/* Slot Report Totals */}
//                     <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 mt-4">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-2">
//                             <DollarSign className="h-5 w-5 text-green-600" />
//                             <span className="font-semibold text-green-900">
//                               Total Investment
//                             </span>
//                           </div>
//                           <p className="text-xl font-bold text-green-900">
//                             ₹{slotReportTotals.totalCost.toLocaleString()}
//                           </p>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-2">
//                             <TrendingUp className="h-5 w-5 text-green-600" />
//                             <span className="font-semibold text-green-900">
//                               Total Bookings
//                             </span>
//                           </div>
//                           <p className="text-xl font-bold text-green-900">
//                             {slotReportTotals.totalBookings}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-gray-500">
//                     <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//                     <p>No slot booking data found for the selected period</p>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </ErrorBoundary>
//   );
// };

// // Enhanced Card Component
// const Card = ({
//   title,
//   value,
//   green = false,
//   icon,
// }: {
//   title: string;
//   value: any;
//   green?: boolean;
//   icon?: string;
// }) => (
//   <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
//     <div className="flex items-center justify-between">
//       <div>
//         <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
//         <p
//           className={`text-2xl font-bold ${
//             green ? "text-green-600" : "text-gray-900"
//           }`}
//         >
//           {value}
//         </p>
//       </div>
//       {icon && <div className="text-2xl opacity-50">{icon}</div>}
//     </div>
//   </div>
// );

// // Enhanced Graph Component
// const Graph = ({
//   title,
//   data,
//   color,
// }: {
//   title: string;
//   data: any[];
//   color: string;
// }) => (
//   <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
//     <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
//     <ResponsiveContainer width="100%" height={300}>
//       <BarChart data={data}>
//         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//         <XAxis
//           dataKey="name"
//           stroke="#6b7280"
//           fontSize={12}
//           angle={-45}
//           textAnchor="end"
//           height={80}
//         />
//         <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
//         <Tooltip
//           formatter={(value: any, name: any) =>
//             name === "totalAmount"
//               ? [`₹${value.toLocaleString()}`, "Amount"]
//               : [value, "Count"]
//           }
//           labelStyle={{ color: "#374151" }}
//           contentStyle={{
//             backgroundColor: "#ffffff",
//             border: "1px solid #e5e7eb",
//             borderRadius: "8px",
//           }}
//         />
//         <Legend />
//         <Bar dataKey="count" fill={color} name="Count" radius={[4, 4, 0, 0]} />
//         <Bar
//           dataKey="totalAmount"
//           fill="#d1d5db"
//           name="Total Amount"
//           radius={[4, 4, 0, 0]}
//         />
//       </BarChart>
//     </ResponsiveContainer>
//   </div>
// );

// export default StudentDashboard;










































































import { useEffect, useState, useCallback } from "react";
import {
  dashboard,
  courseReport,
  slotReport,
  exportCourseReport,
  exportSlotReport,
} from "../../../api/action/StudentAction";
import {
  Calendar,
  FileText,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  DollarSign,
  BookOpen,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Component } from "react";
import { toast } from "react-toastify"; // Import toast for user feedback (ensure react-toastify is installed)

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-600 text-center p-6 bg-red-50 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Something Went Wrong</h3>
          <p>{this.state.error?.message || "An unexpected error occurred."}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface MonthlyPerformanceItem {
  month: number | null;
  year: number | null;
  count: number;
  totalAmount: number;
}

interface DashboardData {
  totalCoursesPurchased: number;
  totalCoursesCompleted: number;
  totalCoursesNotCompleted: number;
  totalCoursePurchaseCost: number;
  totalSlotBookings: number;
  totalSlotBookingCost: number;
  coursePerformance: MonthlyPerformanceItem[];
  slotPerformance: MonthlyPerformanceItem[];
}

interface IStudentCourseReportItem {
  orderId: string;
  date: string;
  courseName: string[] | string;
  price: number[] | number;
  totalCost: number;
}

interface IStudentSlotReportItem {
  bookingId: string;
  date: string;
  slotTime: {
    startTime: string;
    endTime: string;
  };
  instructorName: string;
  price: number;
  totalPrice: number;
}

interface ReportFilter {
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  startDate?: string;
  endDate?: string;
  page: number;
}

const StudentDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [courseReportData, setCourseReportData] = useState<IStudentCourseReportItem[]>([]);
  const [slotReportData, setSlotReportData] = useState<IStudentSlotReportItem[]>([]);
  const [courseReportTotals, setCourseReportTotals] = useState<{
    totalCost: number;
    totalOrders: number;
  }>({ totalCost: 0, totalOrders: 0 });
  const [slotReportTotals, setSlotReportTotals] = useState<{
    totalCost: number;
    totalBookings: number;
  }>({ totalCost: 0, totalBookings: 0 });
  const [courseFilter, setCourseFilter] = useState<ReportFilter>({ type: "monthly", page: 1 });
  const [slotFilter, setSlotFilter] = useState<ReportFilter>({ type: "monthly", page: 1 });
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showReports, setShowReports] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"course" | "slot">("course");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const today = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboard();
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReports = useCallback(
    async (reportType: "course" | "slot" | "both", page: number = 1) => {
      try {
        setReportLoading(true);
        setError(null);

        // Validate custom dates
        if (courseFilter.type === "custom" && (!customStartDate || !customEndDate)) {
          setError("Please select both start and end dates for custom range");
          toast.error("Please select both start and end dates for custom range");
          return;
        }

        const reportFilter = (filter: ReportFilter) => ({
          type: filter.type,
          page,
          ...(filter.type === "custom" && customStartDate && customEndDate
            ? {
                startDate: new Date(customStartDate).toISOString().split("T")[0],
                endDate: new Date(customEndDate).toISOString().split("T")[0],
              }
            : {}),
        });

        if (reportType === "course" || reportType === "both") {
          const courseFilterData = reportFilter(courseFilter);
          console.log("Fetching course report with filter:", courseFilterData);
          const courseRes = await courseReport(courseFilterData);
          const courseData = courseRes.data || [];
          console.log("Course report data:", courseData);
          setCourseReportData(courseData);
          const courseTotalCost = courseData.reduce(
            (sum: number, item: IStudentCourseReportItem) => sum + item.totalCost,
            0
          );
          setCourseReportTotals({
            totalCost: courseTotalCost,
            totalOrders: courseData.length,
          });
        }

        if (reportType === "slot" || reportType === "both") {
          const slotFilterData = reportFilter(slotFilter);
          console.log("Fetching slot report with filter:", slotFilterData);
          const slotRes = await slotReport(slotFilterData);
          const slotData = slotRes.data || [];
          console.log("Slot report data:", slotData);
          setSlotReportData(slotData);
          const slotTotalCost = slotData.reduce(
            (sum: number, item: IStudentSlotReportItem) => sum + item.price,
            0
          );
          setSlotReportTotals({
            totalCost: slotTotalCost,
            totalBookings: slotData.length,
          });
        }

        setShowReports(true);
      } catch (err) {
        console.error("Failed to generate reports:", err);
        setError("Failed to generate reports");
        toast.error("Failed to generate reports");
      } finally {
        setReportLoading(false);
      }
    },
    [courseFilter, slotFilter, customStartDate, customEndDate]
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as ReportFilter["type"];
    setCourseFilter({ type: selected, page: 1 });
    setSlotFilter({ type: selected, page: 1 });
    setShowReports(false);
    if (selected !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1) return;
      if (activeTab === "course") {
        setCourseFilter((prev) => ({ ...prev, page: newPage }));
        generateReports("course", newPage);
      } else {
        setSlotFilter((prev) => ({ ...prev, page: newPage }));
        generateReports("slot", newPage);
      }
    },
    [activeTab, generateReports]
  );

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    // Prevent selecting dates after today
    if (selectedDate <= today) {
      setCustomStartDate(selectedDate);
      // If endDate is before startDate, reset endDate
      if (customEndDate && selectedDate > customEndDate) {
        setCustomEndDate("");
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    // Prevent selecting dates after today or before startDate
    if (selectedDate <= today && (!customStartDate || selectedDate >= customStartDate)) {
      setCustomEndDate(selectedDate);
    }
  };

  const formatChartData = (performance: MonthlyPerformanceItem[]) => {
    return performance.map((item) => ({
      name:
        typeof item.month === "number" && typeof item.year === "number"
          ? `${item.month.toString().padStart(2, "0")}/${item.year}`
          : "Unknown",
      count: item.count,
      totalAmount: item.totalAmount,
    }));
  };

  const getFilterDisplayName = () => {
    const filter = activeTab === "course" ? courseFilter : slotFilter;
    switch (filter.type) {
      case "daily":
        return "Today";
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      case "yearly":
        return "This Year";
      case "custom":
        return customStartDate && customEndDate
          ? `${new Date(customStartDate).toLocaleDateString()} to ${new Date(
              customEndDate
            ).toLocaleDateString()}`
          : "Custom Range";
      default:
        return "";
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
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
  }

  if (!data) {
    return (
      <div className="text-gray-500 text-center mt-10 text-xl">
        No data available
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600">
            Overview of your learning journey and booking activities
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <Card
            title="Courses Purchased"
            value={data.totalCoursesPurchased}
            icon="📚"
          />
          <Card
            title="Courses Completed"
            value={data.totalCoursesCompleted}
            icon="✅"
            green
          />
          <Card
            title="Courses Pending"
            value={data.totalCoursesNotCompleted}
            icon="⏳"
          />
          <Card
            title="Course Investment"
            value={`₹${data.totalCoursePurchaseCost.toLocaleString()}`}
            icon="💰"
            green
          />
          <Card
            title="Slots Booked"
            value={data.totalSlotBookings}
            icon="🎯"
          />
          <Card
            title="Slot Investment"
            value={`₹${data.totalSlotBookingCost.toLocaleString()}`}
            icon="💳"
            green
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Graph
            title="Monthly Course Purchases"
            data={formatChartData(data.coursePerformance)}
            color="#3b82f6"
          />
          <Graph
            title="Monthly Slot Bookings"
            data={formatChartData(data.slotPerformance)}
            color="#10b981"
          />
        </div>

        {/* Report Generation Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Generate Reports
              </h2>
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
                value={courseFilter.type}
                onChange={handleFilterChange}
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {courseFilter.type === "custom" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={customStartDate}
                    onChange={handleStartDateChange}
                    max={today}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={customEndDate}
                    onChange={handleEndDateChange}
                    min={customStartDate}
                    max={today}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={() => generateReports("both", 1)}
                disabled={
                  reportLoading ||
                  (courseFilter.type === "custom" &&
                    (!customStartDate || !customEndDate))
                }
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
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

          {/* Report Status */}
          {!showReports && !reportLoading && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Click "Generate Reports" to view detailed activity data</p>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center mt-4 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
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
                  <h3 className="text-lg font-semibold text-blue-900">
                    Activity Report
                  </h3>
                  <p className="text-blue-700">
                    Period: {getFilterDisplayName()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">Generated on</p>
                  <p className="font-semibold text-blue-900">
                    {new Date().toLocaleDateString("en-GB")}
                  </p>
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
                  Course Purchases ({courseReportData.length})
                </button>
                <button
                  onClick={() => setActiveTab("slot")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "slot"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Slot Bookings ({slotReportData.length})
                </button>
              </div>
              {activeTab === "course" && courseReportData.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      exportCourseReport(
                        "excel",
                        {
                          type: courseFilter.type,
                          startDate: courseFilter.startDate,
                          endDate: courseFilter.endDate,
                          page: courseFilter.page,
                        },
                        customStartDate,
                        customEndDate
                      )
                    }
                    disabled={
                      courseFilter.type === "custom" &&
                      (!customStartDate || !customEndDate)
                    }
                    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" /> Excel
                  </button>
                  <button
                    onClick={() =>
                      exportCourseReport(
                        "pdf",
                        {
                          type: courseFilter.type,
                          startDate: courseFilter.startDate,
                          endDate: courseFilter.endDate,
                          page: courseFilter.page,
                        },
                        customStartDate,
                        customEndDate
                      )
                    }
                    disabled={
                      courseFilter.type === "custom" &&
                      (!customStartDate || !customEndDate)
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </button>
                </div>
              )}
              {activeTab === "slot" && slotReportData.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      exportSlotReport(
                        "excel",
                        {
                          type: slotFilter.type,
                          startDate: slotFilter.startDate,
                          endDate: slotFilter.endDate,
                          page: slotFilter.page,
                        },
                        customStartDate,
                        customEndDate
                      )
                    }
                    disabled={
                      slotFilter.type === "custom" &&
                      (!customStartDate || !customEndDate)
                    }
                    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" /> Excel
                  </button>
                  <button
                    onClick={() =>
                      exportSlotReport(
                        "pdf",
                        {
                          type: slotFilter.type,
                          startDate: slotFilter.startDate,
                          endDate: slotFilter.endDate,
                          page: slotFilter.page,
                        },
                        customStartDate,
                        customEndDate
                      )
                    }
                    disabled={
                      slotFilter.type === "custom" &&
                      (!customStartDate || !customEndDate)
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </button>
                </div>
              )}
            </div>

            {/* Course Report */}
            {activeTab === "course" && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-600 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Course Purchase Report
                </h3>
                {courseReportData.length > 0 ? (
                  <div>
                    <div className="space-y-6 mb-6">
                      {courseReportData.map((item) => {
                        const courses = Array.isArray(item.courseName)
                          ? item.courseName
                          : [item.courseName || ""];
                        const prices = Array.isArray(item.price)
                          ? item.price
                          : [item.price || 0];

                        return (
                          <div
                            key={item.orderId}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="text-sm font-medium text-blue-600">
                                    Order ID:{" "}
                                  </span>
                                  <span className="text-sm font-bold text-blue-900">
                                    {item.orderId}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-blue-600">
                                    Date:{" "}
                                  </span>
                                  <span className="text-sm font-bold text-blue-900">
                                    {new Date(item.date).toLocaleDateString(
                                      "en-GB"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                    Course Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                    Price
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {courses.map((course, index) => (
                                  <tr
                                    key={`${item.orderId}-${index}`}
                                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                                  >
                                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                      {course}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                                      ₹{(prices[index] || 0).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="bg-blue-50 px-4 py-3 border-t border-blue-200">
                              <div className="text-right">
                                <span className="text-lg font-bold text-blue-600">
                                  Total Cost: ₹{item.totalCost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls for Course Report */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(courseFilter.page - 1)}
                          disabled={courseFilter.page === 1 || reportLoading}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium">
                          Page {courseFilter.page}
                        </span>
                        <button
                          onClick={() => handlePageChange(courseFilter.page + 1)}
                          disabled={courseReportData.length < 5 || reportLoading}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Course Report Totals */}
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-blue-900">
                              Total Investment
                            </span>
                          </div>
                          <p className="text-xl font-bold text-blue-900">
                            ₹{courseReportTotals.totalCost.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-blue-900">
                              Total Orders
                            </span>
                          </div>
                          <p className="text-xl font-bold text-blue-900">
                            {courseReportTotals.totalOrders}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No course purchase data found for the selected period</p>
                  </div>
                )}
              </div>
            )}

            {/* Slot Report */}
            {activeTab === "slot" && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-600 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Slot Booking Report
                </h3>
                {slotReportData.length > 0 ? (
                  <div>
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full table-auto border-collapse border border-gray-200 rounded-lg">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
                              Booking ID
                            </th>
                            <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
                              Date
                            </th>
                            <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
                              Instructor
                            </th>
                            <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
                              Slot Time
                            </th>
                            <th className="px-4 py-3 border border-gray-200 text-left font-semibold text-gray-700">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {slotReportData.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 border border-gray-200 font-mono text-sm">
                                {item.bookingId}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-gray-600">
                                {new Date(item.date).toLocaleDateString("en-GB")}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 font-medium">
                                {item.instructorName}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-gray-600">
                                {`${formatTime(item.slotTime.startTime)} to ${formatTime(
                                  item.slotTime.endTime
                                )}`}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 font-semibold text-green-600">
                                ₹{item.price.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls for Slot Report */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(slotFilter.page - 1)}
                          disabled={slotFilter.page === 1 || reportLoading}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium">
                          Page {slotFilter.page}
                        </span>
                        <button
                          onClick={() => handlePageChange(slotFilter.page + 1)}
                          disabled={slotReportData.length < 5 || reportLoading}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Slot Report Totals */}
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-900">
                              Total Investment
                            </span>
                          </div>
                          <p className="text-xl font-bold text-green-900">
                            ₹{slotReportTotals.totalCost.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-900">
                              Total Bookings
                            </span>
                          </div>
                          <p className="text-xl font-bold text-green-900">
                            {slotReportTotals.totalBookings}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No slot booking data found for the selected period</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
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
  <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p
          className={`text-2xl font-bold ${
            green ? "text-green-600" : "text-gray-900"
          }`}
        >
          {value}
        </p>
      </div>
      {icon && <div className="text-2xl opacity-50">{icon}</div>}
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
        <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
        <Tooltip
          formatter={(value: any, name: any) =>
            name === "totalAmount"
              ? [`₹${value.toLocaleString()}`, "Amount"]
              : [value, "Count"]
          }
          labelStyle={{ color: "#374151" }}
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="count" fill={color} name="Count" radius={[4, 4, 0, 0]} />
        <Bar
          dataKey="totalAmount"
          fill="#d1d5db"
          name="Total Amount"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default StudentDashboard;