// pages/instructor/modules/ModuleManagementPage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PlusCircle } from "lucide-react";
import EntityTable from "../../../components/common/EntityTable";
import Card from "../../../components/common/Card";
import { useDebounce } from "../../../hooks/UseDebounce";
import {
  getModulesByCourse,
  deleteModule,
  instructorGetCourseById,
} from "../../../api/action/InstructorActionApi";
import {type Module } from "../interface/instructorInterface";

const ModuleManagementPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 500);

  const fetchModules = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const [courseRes, moduleRes] = await Promise.all([
        instructorGetCourseById(courseId),
        getModulesByCourse(courseId, page, limit, debouncedSearch),
      ]);

      setCourseName(courseRes?.data?.courseName || "");
      setModules(moduleRes?.data || []);
      setTotal(moduleRes?.total || 0);
    } catch (error) {
      toast.error("Failed to fetch module data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [courseId, page, debouncedSearch]);

  const handleEdit = (module: Module) => {
    navigate(`/instructor/course/${courseId}/modules/${module.moduleId}/edit`);
  };

  const handleDelete = async (module: Module) => {
    try {
      await deleteModule(module.moduleId);
      toast.success("Module deleted successfully");
      fetchModules();
    } catch {
      toast.error("Failed to delete module");
    }
  };

  const handleViewChapters = (module: Module) => {
    navigate(`/instructor/modules/${module.moduleId}/chapters`);
  };

  const handleAddModule = () => {
    navigate(`/instructor/course/${courseId}/modules/add`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="px-4 py-6">
      <Card
        title={`Modules of "${courseName}"`}
        padded
        className="bg-white shadow-sm rounded-lg"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-64"
          />
          <button
            onClick={handleAddModule}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            <PlusCircle size={18} />
            Add Module
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-4">Loading modules...</p>
        ) : (
          <>
            <EntityTable<Module>
              title=""
              data={modules}
              columns={[
                { key: "moduleNumber", label: "Module #" },
                { key: "moduleTitle", label: "Title" },
                { key: "description", label: "Description" },
              ]}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAction={handleViewChapters}
              actionLabel="📚 Chapters"
              emptyText="No modules found for this course."
            />
          </>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-4 flex-wrap gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`px-3 py-1 border rounded ${
                    pageNumber === page
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              )
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModuleManagementPage;
