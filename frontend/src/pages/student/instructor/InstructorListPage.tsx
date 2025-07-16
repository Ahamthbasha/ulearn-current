import { useEffect, useState } from "react";
import {
  listInstructors,
  getSkillAndExpertise,
} from "../../../api/action/StudentAction";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface Instructor {
  _id: string;
  username: string;
  profilePicUrl?: string;
  skills?: string[];
  expertise?: string[];
}

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

  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allExpertise, setAllExpertise] = useState<string[]>([]);

  const navigate = useNavigate();
  const instructorsPerPage = 5;

  // Fetch filters only once
  const fetchFilters = async () => {
    try {
      const response = await getSkillAndExpertise();
      console.log("Full response:", response); // Add this line
      console.log("Skills:", response.skills); // Add this line
      console.log("Expertise:", response.expertise); // Add this line
      setAllSkills(response.skills || []);
      setAllExpertise(response.expertise || []);
    } catch (error) {
      console.log("Error details:", error); // Make this more detailed
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
    fetchFilters(); // load skills and expertise only once
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Find Your Instructor
      </h2>

      {/* Search */}
      <div className="mb-10 flex justify-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search instructor by name..."
          className="px-4 py-2 w-full sm:w-2/3 md:w-1/2 border rounded-lg shadow-sm"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters */}
        <aside className="w-full lg:w-1/4 space-y-8">
          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Skills</h3>
            <ul className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <li
                  key={skill}
                  onClick={() => {
                    setSelectedSkill(skill);
                    setSelectedExpertise("");
                    setCurrentPage(1);
                  }}
                  className={`cursor-pointer px-3 py-1 rounded-full text-sm border hover:bg-gray-200 ${
                    selectedSkill === skill ? "bg-teal-600 text-white" : ""
                  }`}
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">
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
                  className={`cursor-pointer px-3 py-1 rounded-full text-sm border hover:bg-gray-200 ${
                    selectedExpertise === exp ? "bg-teal-600 text-white" : ""
                  }`}
                >
                  {exp}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Sort</h3>
            <ul className="space-y-2">
              <li
                className={`cursor-pointer ${
                  sortOrder === "asc" ? "font-bold" : ""
                }`}
                onClick={() => setSortOrder("asc")}
              >
                A - Z
              </li>
              <li
                className={`cursor-pointer ${
                  sortOrder === "desc" ? "font-bold" : ""
                }`}
                onClick={() => setSortOrder("desc")}
              >
                Z - A
              </li>
            </ul>
          </div>

          <button
            onClick={handleClearFilter}
            className="mt-4 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded shadow"
          >
            Clear Filter
          </button>
        </aside>

        {/* Instructor Cards */}
        <main className="w-full lg:w-3/4">
          <p className="mb-4">
            We found <strong>{instructors.length}</strong> instructors for you!
          </p>

          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : instructors.length === 0 ? (
            <div className="text-center text-gray-500">
              No instructors found.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {instructors.map((instructor) => (
                  <div
                    key={instructor._id}
                    className="border rounded-lg shadow hover:shadow-lg p-4 flex flex-col items-center text-center transition"
                  >
                    <img
                      src={instructor.profilePicUrl || "/default-avatar.png"}
                      alt={instructor.username}
                      className="w-24 h-24 rounded-full mb-3 object-contain bg-white border p-1"
                    />
                    <h3 className="text-lg font-semibold mb-1">
                      {instructor.username}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {instructor.skills?.join(", ") || "No skills listed"}
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/user/instructor/${instructor._id}`)
                      }
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-10 gap-2 flex-wrap">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1 rounded border text-sm ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700"
                      }`}
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
