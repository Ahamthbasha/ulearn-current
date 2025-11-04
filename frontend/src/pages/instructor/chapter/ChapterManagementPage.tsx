// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { PlusCircle } from "lucide-react";
// import EntityTable from "../../../components/common/EntityTable";
// import Card from "../../../components/common/Card";
// import { useDebounce } from "../../../hooks/UseDebounce";
// import {
//   getChaptersByCourse,
//   deleteChapter,
//   instructorGetCourseById,
// } from "../../../api/action/InstructorActionApi";
// import { type Chapter } from "../interface/instructorInterface";

// const ChapterManagementPage = () => {
//   const { courseId } = useParams<{ courseId: string }>();
//   const navigate = useNavigate();

//   const [courseName, setCourseName] = useState<string>("");
//   const [chapters, setChapters] = useState<Chapter[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [limit] = useState(5); 
//   const [total, setTotal] = useState(0);

//   // Debounce the search input
//   const debouncedSearch = useDebounce(search, 500);

//   const fetchChapters = async () => {
//     if (!courseId) return;
//     try {
//       setLoading(true);
//       const [courseRes, chapterRes] = await Promise.all([
//         instructorGetCourseById(courseId),
//         getChaptersByCourse(courseId, page, limit, debouncedSearch), // Use debounced search
//       ]);

//       setCourseName(courseRes?.data?.courseName || "");
//       setChapters(chapterRes?.data || []);
//       setTotal(chapterRes?.total || 0);
//     } catch (error) {
//       toast.error("Failed to fetch chapter data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchChapters();
//   }, [courseId, page, debouncedSearch]); // Depend on debouncedSearch instead of search

//   const handleEdit = (chapter: Chapter) => {
//     navigate(`/instructor/course/${courseId}/chapters/${chapter.chapterId}/edit`);
//   };

//   const handleDelete = async (chapter: Chapter) => {
//     try {
//       await deleteChapter(courseId!, chapter.chapterId);
//       toast.success("Chapter deleted");
//       fetchChapters(); // refresh
//     } catch {
//       toast.error("Failed to delete chapter");
//     }
//   };

//   const handleAddChapter = () => {
//     navigate(`/instructor/course/${courseId}/chapters/add`);
//   };

//   const totalPages = Math.ceil(total / limit);

//   return (
//     <div className="px-4 py-6">
//       <Card
//         title={`Chapters of "${courseName}"`}
//         padded
//         className="bg-white shadow-sm rounded-lg"
//       >
//         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
//           <input
//             type="text"
//             placeholder="Search chapters..."
//             value={search}
//             onChange={(e) => {
//               setPage(1); // reset page on search
//               setSearch(e.target.value);
//             }}
//             className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-64"
//           />
//           <button
//             onClick={handleAddChapter}
//             className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
//           >
//             <PlusCircle size={18} />
//             Add Chapter
//           </button>
//         </div>

//         {loading ? (
//           <p className="text-gray-500 text-center py-4">Loading chapters...</p>
//         ) : (
//           <EntityTable
//             title=""
//             data={chapters}
//             columns={[
//               { key: "chapterNumber", label: "Chapter" },
//               { key: "chapterTitle", label: "Title" },
//               { key: "videoUrl", label: "Video URL" },
//             ]}
//             onEdit={handleEdit}
//             onDelete={handleDelete}
//             emptyText="No chapters found for this course."
//           />
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="flex justify-center mt-4 flex-wrap gap-2">
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map(
//               (pageNumber) => (
//                 <button
//                   key={pageNumber}
//                   onClick={() => setPage(pageNumber)}
//                   className={`px-3 py-1 border rounded ${
//                     pageNumber === page
//                       ? "bg-blue-600 text-white"
//                       : "bg-white hover:bg-gray-100"
//                   }`}
//                 >
//                   {pageNumber}
//                 </button>
//               )
//             )}
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// };

// export default ChapterManagementPage;






































// pages/instructor/chapters/ChapterManagementPage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PlusCircle, ArrowLeft } from "lucide-react";
import EntityTable from "../../../components/common/EntityTable";
import Card from "../../../components/common/Card";
import { useDebounce } from "../../../hooks/UseDebounce";
import {
  getChaptersByModule,
  deleteChapter,
  getModuleById,
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

      setModuleTitle(moduleRes?.moduleTitle || "");
      setCourseId(moduleRes?.courseId || "");
      setChapters(chapterRes?.data || []);
      setTotal(chapterRes?.total || 0);
    } catch (error) {
      toast.error("Failed to fetch chapter data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [moduleId, page, debouncedSearch]);

  const handleEdit = (chapter: Chapter) => {
    navigate(`/instructor/modules/${moduleId}/chapters/${chapter.chapterId}/edit`);
  };

  const handleDelete = async (chapter: Chapter) => {
    try {
      await deleteChapter(chapter.chapterId);
      toast.success("Chapter deleted");
      fetchChapters();
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
    <div className="px-4 py-6">
      <Card
        title={`Chapters of "${moduleTitle}"`}
        padded
        className="bg-white shadow-sm rounded-lg"
      >
        <button
          onClick={handleBackToModules}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mb-4 text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back to Modules
        </button>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search chapters..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-64"
          />
          <button
            onClick={handleAddChapter}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            <PlusCircle size={18} />
            Add Chapter
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-4">Loading chapters...</p>
        ) : (
          <EntityTable
            title=""
            data={chapters}
            columns={[
              { key: "chapterNumber", label: "Chapter" },
              { key: "chapterTitle", label: "Title" },
              { key: "videoUrl", label: "Video URL" },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyText="No chapters found for this module."
          />
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

export default ChapterManagementPage;
