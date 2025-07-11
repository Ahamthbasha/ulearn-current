import { useNavigate } from 'react-router-dom';

const EnrollPage = () => {
  const navigate = useNavigate()
  return (
    <>

      <main>
        <h1 className="bg-blue-500 text-white font-bold text-center py-10 text-xl sm:text-2xl">
          Enroll as your need
        </h1>

        {/* Cards Section */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 px-4 py-10">
          
          {/* Student Card */}
          <div className="flex flex-col items-center space-y-4 text-center max-w-xs">
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-blue-400 rounded-full"></div>
            <button onClick={()=>navigate("/user/signUp")} className="bg-blue-600 text-white rounded px-4 py-2 font-bold hover:bg-blue-700">
              Enroll as Student
            </button>
            <p className="text-sm text-gray-400">
              Enroll as a student to explore courses, gain knowledge and receive assistance.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 text-center max-w-xs">
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-blue-400 rounded-full"></div>
            <button onClick={()=>navigate("/instructor/signUp")} className="bg-blue-600 text-white rounded px-4 py-2 font-bold hover:bg-blue-700">
              Enroll as Instructor
            </button>
            <p className="text-sm text-gray-400">
              Enroll as a instructor to guide learners, publish courses, and offer slots for sessions.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default EnrollPage;