// import { Outlet, useNavigate } from "react-router-dom";
// import { useState } from "react";

// const InstructorHeader = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const navigate = useNavigate();

//   return (
//     <>
//       {/* Header */}
//       <header className="bg-orange-600 text-white p-4 shadow-md">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <h1
//             className="text-2xl font-bold cursor-pointer"
//           >
//             Instructor
//           </h1>

//           {/* Desktop Nav */}
//           <nav className="hidden md:flex space-x-6 font-semibold">
            
//             <button onClick={() => navigate("/instructor/login")} className="hover:text-gray-200">
//               login
//             </button>
//             <button onClick={() => navigate("/instructor/signUp")} className="hover:text-gray-200">
//               Sign Up
//             </button>
//           </nav>

//           {/* Mobile Menu Toggle */}
//           <div className="md:hidden">
//             <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth={2}
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M4 6h16M4 12h16M4 18h16"
//                 />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {isOpen && (
//           <div className="md:hidden mt-2 space-y-2 px-4 font-semibold">
//             <button
//               onClick={() => navigate("/instructor/login")}
//               className="block w-full text-left hover:text-gray-200"
//             >
//               login
//             </button>
//             <button
//               onClick={() => navigate("/instructor/signUp")}
//               className="block w-full text-left hover:text-gray-200"
//             >
//               Sign Up
//             </button>
//           </div>
//         )}
//       </header>

//       {/* Main content */}
//       <main className="max-w-7xl mx-auto p-4">
//         <Outlet /> {/* Nested routes render here */}
//       </main>
//     </>
//   );
// };

// export default InstructorHeader;


import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { toast } from "react-toastify";
import { logout } from "../../api/auth/InstructorAuthentication"; // adjust path
import { clearInstructorDetails } from "../../redux/slices/instructorSlice"; // adjust path

const InstructorHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const instructor = useSelector((state: RootState) => state.instructor);

  const handleLogout = async () => {
    try {
      await logout(); // call backend logout API
      dispatch(clearInstructorDetails());
      toast.success("Logged out successfully");
      navigate("/instructor/login");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <>
      <header className="bg-orange-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/")}>
            Instructor
          </h1>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 font-semibold">
            {!instructor.email ? (
              <>
                <button onClick={() => navigate("/instructor/login")} className="hover:text-gray-200">
                  Login
                </button>
                <button onClick={() => navigate("/instructor/signUp")} className="hover:text-gray-200">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <img
                  src={instructor.profilePicture || "/default-avatar.png"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span>{instructor.name}</span>
                <button onClick={handleLogout} className="hover:text-gray-200">
                  Logout
                </button>
              </>
            )}
          </nav>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden mt-2 space-y-2 px-4 font-semibold">
            {!instructor.email ? (
              <>
                <button onClick={() => navigate("/instructor/login")} className="block w-full text-left hover:text-gray-200">
                  Login
                </button>
                <button onClick={() => navigate("/instructor/signUp")} className="block w-full text-left hover:text-gray-200">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <img
                    src={instructor.profilePicture || "/default-avatar.png"}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{instructor.name}</span>
                </div>
                <button onClick={handleLogout} className="block w-full text-left hover:text-gray-200 mt-2">
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-4">
        <Outlet />
      </main>
    </>
  );
};

export default InstructorHeader;
