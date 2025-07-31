import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { toast } from "react-toastify";
import { clearInstructorDetails } from "../redux/slices/instructorSlice";
import { logout } from "../api/auth/InstructorAuthentication";

const navItems = [
  { name: "Dashboard", path: "/instructor/dashboard", icon: "📊" },
  { name: "Create Course", path: "/instructor/createCourse", icon: "📚" },
  { name: "My Courses", path: "/instructor/courses", icon: "📖" },
  { name: "Slots", path: "/instructor/slots", icon: "📅" },
  { name: "Wallet", path: "/instructor/wallet", icon: "💵" },
  { name: "Settings", path: "/instructor/profile", icon: "⚙️" },
  { name: "Memberships", path: "/instructor/membership", icon: "🏅" },
  { name: "PurchaseHistory", path: "/instructor/purchaseHistory", icon: "🧾" },
];

const InstructorSidebarLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const instructor = JSON.parse(localStorage.getItem("instructor") || "{}");

  console.log("instructor sidebar layout", instructor);
  const username = (instructor?.name || "Instructor").toUpperCase();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(clearInstructorDetails());
      toast.success("Logged out successfully");
      navigate("/instructor/login");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-80" : "w-20"
        } bg-white shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 border-r border-gray-100`}
      >
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/10 to-orange-500/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-purple-500/10 rounded-full blur-lg"></div>
        </div>

        {/* Header with Toggle */}
        <div className="relative z-10 flex items-center justify-between h-24 px-6 border-b border-gray-100/50 bg-gradient-to-r from-white/80 to-gray-50/50 backdrop-blur-sm">
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="group relative p-3 hover:bg-amber-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-amber-200"
            aria-label="Toggle Sidebar"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
              <div
                className={`w-5 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 ${
                  isSidebarOpen ? "rotate-45 translate-y-2" : ""
                }`}
              ></div>
              <div
                className={`w-4 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 ${
                  isSidebarOpen ? "opacity-0 scale-0" : ""
                }`}
              ></div>
              <div
                className={`w-5 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 ${
                  isSidebarOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              ></div>
            </div>
          </button>

          {/* Logo */}
          <div
            className={`flex items-center transition-all duration-300 ${
              isSidebarOpen ? "space-x-4" : "justify-center"
            }`}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">U</span>
              </div>
            </div>
            {isSidebarOpen && (
              <div>
                <span className="text-3xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent tracking-tight">
                  ULearn
                </span>
                <div className="text-xs text-gray-500 font-medium tracking-widest">
                  INSTRUCTOR PORTAL
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div
          className={`relative z-10 p-6 border-b border-gray-100/50 ${
            isSidebarOpen ? "" : "px-3"
          }`}
        >
          <div
            className={`flex items-center ${
              isSidebarOpen ? "space-x-4" : "justify-center"
            }`}
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg border-2 border-white">
                {instructor?.profilePicture ? (
                  <img
                    src={instructor.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">👨‍🏫</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            {isSidebarOpen && (
              <div>
                <p className="font-bold text-gray-800 text-lg">{username}</p>
                <p className="text-sm text-gray-500 font-medium">
                  Senior Instructor
                </p>
                <div className="flex items-center mt-1 space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">
                    Online
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div
          className={`relative z-10 flex-1 py-6 ${
            isSidebarOpen ? "px-6" : "px-3"
          }`}
        >
          {isSidebarOpen && (
            <div className="mb-8">
              <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest font-bold">
                Navigation
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
            </div>
          )}
          <nav className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center ${
                    isSidebarOpen
                      ? "space-x-4 px-5 py-4"
                      : "justify-center px-3 py-4"
                  } rounded-2xl transition-colors duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/25"
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:text-amber-700 hover:shadow-lg"
                  }`
                }
                title={!isSidebarOpen ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative flex items-center justify-center w-8 h-8">
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    {isSidebarOpen && (
                      <>
                        <span className="font-semibold text-base tracking-wide">
                          {item.name}
                        </span>
                        <div className="ml-auto flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                              isActive
                                ? "bg-white shadow-lg"
                                : "bg-transparent group-hover:bg-amber-400"
                            }`}
                          />
                          {isActive && (
                            <div className="w-1 h-6 bg-white/30 rounded-full"></div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div
          className={`relative z-10 p-6 border-t border-gray-100/50 space-y-4 bg-gradient-to-r from-gray-50/50 to-white/50 backdrop-blur-sm ${
            isSidebarOpen ? "" : "px-3"
          }`}
        >
          {/* Motivational Quote - only show when expanded */}
          {isSidebarOpen && (
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-5 border border-amber-100 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white text-sm">💡</span>
                </div>
                <div>
                  <p className="italic text-gray-700 text-sm font-medium leading-relaxed">
                    "Teaching is the profession that teaches all the other
                    professions."
                  </p>
                  <p className="text-right mt-3 text-xs text-amber-600 font-semibold">
                    – Unknown
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`group w-full font-semibold text-red-600 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border border-red-200 hover:border-red-300 ${
              isSidebarOpen ? "py-3 px-5" : "py-3 px-3"
            } rounded-2xl transition-colors duration-200 hover:shadow-lg relative overflow-hidden`}
            title={!isSidebarOpen ? "Logout" : undefined}
          >
            <div className="relative flex items-center justify-center space-x-2">
              <span className="text-lg">🚪</span>
              {isSidebarOpen && <span>Logout</span>}
            </div>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto bg-gradient-to-br from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default InstructorSidebarLayout;
