import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { instructorDetailsById } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { type InstructorDetail } from "../interface/studentInterface";

const InstructorDetailPage = () => {
  const { instructorId } = useParams<{ instructorId: string }>();
  const [instructor, setInstructor] = useState<InstructorDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchInstructor = async () => {
    try {
      setLoading(true);
      const response = await instructorDetailsById(instructorId!);
      setInstructor(response.data);
    } catch (err) {
      toast.error("Failed to load instructor details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instructorId) {
      fetchInstructor();
    }
  }, [instructorId]);

  if (loading) {
    return <div className="p-4 sm:p-6 md:p-8 text-center text-gray-600 text-sm sm:text-base">Loading...</div>;
  }

  if (!instructor) {
    return (
      <div className="p-4 sm:p-6 md:p-8 text-center text-gray-500 text-sm sm:text-base">Instructor not found.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-10">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Profile Image */}
        <div className="w-full md:w-48 h-40 sm:h-48 md:h-48 bg-gray-100 border rounded-xl flex items-center justify-center overflow-hidden">
          <img
            src={instructor.profilePicUrl || "/default-avatar.png"}
            alt={instructor.username}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Instructor Info */}
        <div className="flex-1 space-y-2 sm:space-y-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            {instructor.username}
          </h2>
          <p className="text-gray-700 text-sm sm:text-base">
            <strong>Email:</strong> {instructor.email}
          </p>
          {instructor.mobileNo && (
            <p className="text-gray-700 text-sm sm:text-base">
              <strong>Mobile:</strong> {instructor.mobileNo}
            </p>
          )}
          <div>
            <strong className="block text-gray-800 text-sm sm:text-base mb-1">Skills:</strong>
            {instructor.skills && instructor.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {instructor.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-800 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm sm:text-base">No skills listed</p>
            )}
          </div>

          <div>
            <strong className="block text-gray-800 text-sm sm:text-base mb-1">Expertise:</strong>
            {instructor.expertise && instructor.expertise.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 text-sm sm:text-base">
                {instructor.expertise.map((exp, index) => (
                  <li key={index}>{exp}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm sm:text-base">No expertise provided</p>
            )}
          </div>

          {/* Book Appointment */}
          <button
            onClick={() => navigate(`/user/instructor/${instructor._id}/slots`)}
            className="mt-4 sm:mt-6 inline-block bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded hover:bg-blue-700 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Book an Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorDetailPage;