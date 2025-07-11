import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { specificCourseDashboard } from "../../../api/action/InstructorActionApi";
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
import { DollarSign, Users, Tag } from "lucide-react";
import { toast } from "react-toastify";

interface MonthlyData {
  month: number;
  year: number;
  totalSales: number;
}

const monthMap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SpecificDashboardPage = () => {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<null | {
    revenue: number;
    enrollments: number;
    category: string | null;
    monthlyPerformance: MonthlyData[];
  }>(null);

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

  const { revenue, enrollments, category, monthlyPerformance } = dashboard;

  const formattedData = monthlyPerformance.map((item) => ({
    name: `${monthMap[item.month - 1]} ${item.year}`,
    revenue: item.totalSales
  }));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Course Dashboard</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
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

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Monthly Revenue Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
  <BarChart
    data={formattedData}
    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis tickFormatter={(value) => `₹${value}`} />
    <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]} />
    <Legend />
    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>

        </div>
      </div>
    </div>
  );
};

export default SpecificDashboardPage;
