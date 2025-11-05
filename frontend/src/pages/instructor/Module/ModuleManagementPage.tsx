import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PlusCircle, GripVertical, Edit2, Trash2, BookOpen } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import Card from "../../../components/common/Card";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { useDebounce } from "../../../hooks/UseDebounce";
import {
  getModulesByCourse,
  deleteModule,
  instructorGetCourseById,
  reorderModules,
} from "../../../api/action/InstructorActionApi";
import { type Module } from "../interface/instructorInterface";

const ModuleManagementPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const fetchModules = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const [courseRes, moduleRes] = await Promise.all([
        instructorGetCourseById(courseId),
        getModulesByCourse(courseId, page, limit, debouncedSearch),
      ]);

      setCourseName(courseRes?.data?.courseName || "Unknown Course");
      const mappedModules: Module[] = (moduleRes?.data || []).map((m: any) => ({
        ...m,
        _id: String(m._id),
      }));
      setModules(mappedModules);
      setTotal(moduleRes?.total || 0);
    } catch {
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [courseId, page, debouncedSearch]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !courseId) return;

    // Optimistic UI
    const items = Array.from(modules);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setModules(items);

    const orderedIds = items
      .map(m => m._id)
      .filter((id): id is string => typeof id === "string");

    try {
      const response = await reorderModules(courseId, orderedIds);

      const updatedModules: Module[] = (response.data || []).map((m: any) => ({
        ...m,
        _id: String(m._id),
      }));

      setModules(updatedModules);
      setTotal(response.total || updatedModules.length);
      toast.success("Order saved!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save order");
      await fetchModules(); // Revert
    }
  };

  const handleEdit = (module: Module) => {
    if (!module._id) return;
    navigate(`/instructor/course/${courseId}/modules/${module._id}/edit`);
  };

  // FIXED: 'endpoint' → 'module'
  const handleDelete = (module: Module) => {
    setModuleToDelete(module);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!moduleToDelete?._id) return;

    try {
      await deleteModule(moduleToDelete._id);
      toast.success("Module deleted");
      await fetchModules();
    } catch {
      toast.error("Failed to delete module");
    } finally {
      setShowDeleteModal(false);
      setModuleToDelete(null);
    }
  };

  const handleViewChapters = (module: Module) => {
    if (!module._id) return;
    navigate(`/instructor/modules/${module._id}/chapters`);
  };

  const handleAddModule = () => {
    navigate(`/instructor/course/${courseId}/modules/add`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Modules of <span className="text-blue-600">"{courseName}"</span>
            </h1>
            <button
              onClick={handleAddModule}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline">Add Module</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Search modules..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>

        <div className="p-5 md:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-lg">No modules yet. Create your first one!</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="modules">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {modules.map((module, index) => (
                      <Draggable
                        key={module._id}
                        draggableId={module._id ?? `fallback-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              transform: snapshot.isDragging
                                ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                : provided.draggableProps.style?.transform,
                            }}
                            className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${
                              snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3 p-4">
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical size={20} />
                              </div>

                              {/* Module Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                  {/* Module Number */}
                                  <div className="flex-shrink-0">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-sm">
                                      {module.moduleNumber}
                                    </span>
                                  </div>

                                  {/* Title & Description */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                      {module.moduleTitle}
                                    </h3>
                                    <p className="text-sm text-gray-600 truncate mt-0.5">
                                      {module.description || "No description"}
                                    </p>
                                  </div>

                                  {/* Actions - Desktop */}
                                  <div className="hidden sm:flex items-center gap-2">
                                    <button
                                      onClick={() => handleEdit(module)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleViewChapters(module)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                      title="View Chapters"
                                    >
                                      <BookOpen size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(module)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Mobile Actions */}
                              <div className="sm:hidden flex items-center gap-1">
                                <button
                                  onClick={() => handleEdit(module)}
                                  className="p-1.5 text-blue-600"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleViewChapters(module)}
                                  className="p-1.5 text-green-600"
                                >
                                  <BookOpen size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(module)}
                                  className="p-1.5 text-red-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-10 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    page === pageNum
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Module"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-blue-600">"{moduleToDelete?.moduleTitle}"</strong>?
            <br />
            <span className="text-xs text-red-500 block mt-2">
              This action cannot be undone.
            </span>
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default ModuleManagementPage;