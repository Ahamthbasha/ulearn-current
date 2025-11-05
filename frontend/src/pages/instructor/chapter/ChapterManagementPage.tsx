// pages/instructor/chapter/ChapterManagementPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PlusCircle, ArrowLeft, GripVertical, Edit2, Trash2, BookOpen } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import Card from "../../../components/common/Card";
import { useDebounce } from "../../../hooks/UseDebounce";
import {
  getChaptersByModule,
  deleteChapter,
  getModuleById,
  reorderChapters,
} from "../../../api/action/InstructorActionApi";
import { type Chapter } from "../interface/instructorInterface";

const ChapterManagementPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const [moduleTitle, setModuleTitle] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 500);

  const fetchChapters = async () => {
    if (!moduleId) return;

    try {
      setLoading(true);
      const [moduleRes, chapterRes] = await Promise.all([
        getModuleById(moduleId),
        getChaptersByModule(moduleId, page, limit, debouncedSearch),
      ]);

      setModuleTitle(moduleRes?.moduleTitle || "Unknown Module");
      setCourseId(moduleRes?.courseId || "");
      setChapters(chapterRes?.data || []);
      setTotal(chapterRes?.total || 0);
    } catch {
      toast.error("Failed to load chapters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [moduleId, page, debouncedSearch]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !moduleId) return;

    const items = Array.from(chapters);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setChapters(items);

    const orderedIds = items.map((c) => c.chapterId);

    try {
      const response = await reorderChapters(moduleId, orderedIds);
      setChapters(response.data);
      setTotal(response.total);
      toast.success("Order saved!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save order");
      await fetchChapters();
    }
  };

  const handleEdit = (chapter: Chapter) => {
    navigate(`/instructor/modules/${moduleId}/chapters/${chapter.chapterId}/edit`);
  };

  const handleDelete = async (chapter: Chapter) => {
    try {
      await deleteChapter(chapter.chapterId);
      toast.success("Chapter deleted");
      await fetchChapters();
    } catch {
      toast.error("Failed to delete chapter");
    }
  };

  const handleAddChapter = () => {
    navigate(`/instructor/modules/${moduleId}/chapters/add`);
  };

  const handleBackToModules = () => {
    navigate(`/instructor/course/${courseId}/modules`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-200">
          <button
            onClick={handleBackToModules}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mb-3 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Back to Modules
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Chapters of <span className="text-blue-600">"{moduleTitle}"</span>
            </h1>
            <button
              onClick={handleAddChapter}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline">Add Chapter</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Search chapters..."
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
          ) : chapters.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-lg">No chapters yet. Create your first one!</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="chapters">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {chapters.map((chapter, index) => (
                      <Draggable
                        key={chapter.chapterId}
                        draggableId={chapter.chapterId}
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

                              {/* Chapter Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                  {/* Chapter Number */}
                                  <div className="flex-shrink-0">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-600 text-white font-bold text-sm shadow-sm">
                                      {chapter.chapterNumber}
                                    </span>
                                  </div>

                                  {/* Title */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                      {chapter.chapterTitle}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate mt-0.5">
                                      {chapter.videoUrl.split("/").pop() || "Video file"}
                                    </p>
                                  </div>

                                  {/* Actions - Desktop */}
                                  <div className="hidden sm:flex items-center gap-2">
                                    <button
                                      onClick={() => handleEdit(chapter)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(chapter)}
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
                                  onClick={() => handleEdit(chapter)}
                                  className="p-1.5 text-blue-600"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(chapter)}
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
    </div>
  );
};

export default ChapterManagementPage;