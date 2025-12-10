import { useEffect, useState } from "react";
import {
  listInstructors,
  getSkillAndExpertise,
} from "../../../api/action/StudentAction";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { type Instructor } from "../interface/studentInterface";

const InstructorListPage = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allExpertise, setAllExpertise] = useState<string[]>([]);

  const navigate = useNavigate();
  const instructorsPerPage = 5;

  // Fetch filters only once
  const fetchFilters = async () => {
    try {
      const response = await getSkillAndExpertise();
      console.log("Full response:", response);
      console.log("Skills:", response.skills);
      console.log("Expertise:", response.expertise);
      setAllSkills(response.skills || []);
      setAllExpertise(response.expertise || []);
    } catch (error) {
      console.log("Error details:", error);
      toast.error("Failed to load filters");
    }
  };

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await listInstructors({
        page: currentPage,
        limit: instructorsPerPage,
        search: debouncedSearch,
        sort: sortOrder,
        skill: selectedSkill,
        expertise: selectedExpertise,
      });

      setInstructors(response.data);
      setTotalPages(Math.ceil(response.total / instructorsPerPage));
    } catch (error) {
      toast.error("Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    fetchInstructors();
  }, [
    currentPage,
    debouncedSearch,
    sortOrder,
    selectedSkill,
    selectedExpertise,
  ]);

  const handleClearFilter = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSortOrder("asc");
    setSelectedSkill("");
    setSelectedExpertise("");
    setCurrentPage(1);
    setIsSidebarOpen(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-4 sm:mb-6 md:mb-8 text-gray-800 text-center">
        Find Your Instructor
      </h2>

      {/* Search */}
      <div className="mb-6 sm:mb-8 flex justify-center">
        <div className="relative w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search instructor by name..."
            className="w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-all duration-200"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
              aria-label="Clear search"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Filters Toggle Button for Mobile */}
        <button
          className="lg:hidden mb-4 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Filters */}
        <aside
          className={`w-full lg:w-1/4 space-y-4 sm:space-y-6 transition-all duration-300 lg:block ${
            isSidebarOpen ? "block" : "hidden"
          }`}
        >
          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold border-b pb-1 sm:pb-2 mb-2 sm:mb-3 text-gray-800">
              Skills
            </h3>
            <ul className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <li
                  key={skill}
                  onClick={() => {
                    setSelectedSkill(skill);
                    setSelectedExpertise("");
                    setCurrentPage(1);
                  }}
                  className={`cursor-pointer px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border hover:bg-gray-200 transition-colors duration-200 ${
                    selectedSkill === skill ? "bg-teal-600 text-white" : "text-gray-700"
                  }`}
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold border-b pb-1 sm:pb-2 mb-2 sm:mb-3 text-gray-800">
              Expertise
            </h3>
            <ul className="flex flex-wrap gap-2">
              {allExpertise.map((exp) => (
                <li
                  key={exp}
                  onClick={() => {
                    setSelectedExpertise(exp);
                    setSelectedSkill("");
                    setCurrentPage(1);
                  }}
                  className={`cursor-pointer px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border hover:bg-gray-200 transition-colors duration-200 ${
                    selectedExpertise === exp ? "bg-teal-600 text-white" : "text-gray-700"
                  }`}
                >
                  {exp}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold border-b pb-1 sm:pb-2 mb-2 sm:mb-3 text-gray-800">
              Sort
            </h3>
            <ul className="space-y-1 sm:space-y-1.5">
              <li
                className={`cursor-pointer text-sm sm:text-base transition-colors duration-200 ${
                  sortOrder === "asc" ? "font-bold text-teal-600" : "text-gray-700 hover:text-gray-900"
                }`}
                onClick={() => setSortOrder("asc")}
              >
                A - Z
              </li>
              <li
                className={`cursor-pointer text-sm sm:text-base transition-colors duration-200 ${
                  sortOrder === "desc" ? "font-bold text-teal-600" : "text-gray-700 hover:text-gray-900"
                }`}
                onClick={() => setSortOrder("desc")}
              >
                Z - A
              </li>
            </ul>
          </div>
          <button
            onClick={handleClearFilter}
            className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Clear Filter
          </button>
        </aside>

        {/* Instructor Cards */}
        <main className="w-full lg:w-3/4">
          <p className="mb-2 sm:mb-4 text-sm sm:text-base text-gray-600">
            We found <strong>{instructors.length}</strong> instructors for you!
          </p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(instructorsPerPage)].map((_, index) => (
                <div
                  key={index}
                  className="border rounded-lg shadow p-4 animate-pulse bg-white flex flex-col items-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gray-200 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : instructors.length === 0 ? (
            <div className="text-center text-gray-500 text-sm sm:text-base py-8 sm:py-12">
              No instructors found.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {instructors.map((instructor) => (
                  <div
                    key={instructor._id}
                    className="border rounded-lg shadow hover:shadow-lg p-3 sm:p-4 flex flex-col items-center text-center transition duration-300 bg-white"
                  >
                    <img
                      src={instructor.profilePicUrl || "/default-avatar.png"}
                      alt={instructor.username}
                      className="w-20 sm:w-24 h-20 sm:h-24 rounded-full mb-2 sm:mb-3 object-cover bg-white border p-1"
                    />
                    <h3 className="text-base sm:text-lg font-semibold mb-1">
                      {instructor.username}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-1">
                      {instructor.skills?.join(", ") || "No skills listed"}
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/user/instructor/${instructor._id}`)
                      }
                      className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 sm:mt-8 md:mt-10 gap-2 sm:gap-3 flex-wrap">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-xs sm:text-sm transition-colors duration-200 ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default InstructorListPage;