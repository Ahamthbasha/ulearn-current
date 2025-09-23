import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { toast } from "react-toastify";
import { clearUserDetails } from "../redux/slices/userSlice";
import { logout } from "../api/auth/UserAuthentication";

const navItems = [
  { name: "Dashboard", path: "/user/dashboard", icon: "📊" },
  { name: "Courses", path: "/user/enrolled", icon: "📚" },
  { name: "slotsHistory", path: "/user/slotsHistory", icon: "📅" },
  { name: "Wishlist", path: "/user/wishlist", icon: "❤️" },
  { name: "Cart", path: "/user/cart", icon: "🛒" },
  { name: "Settings", path: "/user/profile", icon: "⚙️" },
  { name: "Wallet", path: "/user/wallet", icon: "💵" },
  { name: "Order", path: "/user/order", icon: "📦" },
];

const StudentSidebarLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = (user?.name || "Guest").toUpperCase();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(clearUserDetails());
      toast.success("Logged out successfully");
      navigate("/user/login");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Menu Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <svg
          className={`w-6 h-6 transition-transform duration-300 ${
            isMobileMenuOpen ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } bg-white shadow-2xl flex flex-col fixed md:static inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:flex-shrink-0 ${
          isCollapsed ? "md:w-20" : "md:w-72"
        } border-r border-gray-200`}
      >
        {/* Decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 opacity-5 rounded-tl-2xl"></div>

        {/* Header with Logo and Toggle */}
        <div className="relative flex items-center justify-between h-20 px-6 border-b border-gray-100">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            {!isCollapsed && (
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
                ULearn
              </span>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={`w-5 h-5 transform transition-transform duration-300 group-hover:scale-110 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-100">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 bg-white flex-shrink-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">👤</span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate text-sm">
                  {username}
                </p>
                <p className="text-xs text-gray-500 mt-1">Student</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!isCollapsed && (
            <h2 className="text-xs text-gray-400 uppercase mb-6 tracking-widest font-semibold">
              Navigation
            </h2>
          )}
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center px-4 py-3 rounded-xl transition-all duration-200 ease-in-out overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700"
                  } ${isCollapsed ? "justify-center" : "space-x-4"}`
                }
                title={isCollapsed ? item.name : ""}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {/* Background animation */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-transform duration-300 ${
                        isActive ? "transform scale-100" : "transform scale-0 group-hover:scale-100"
                      } rounded-xl`}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center w-full">
                      <span className={`text-xl flex-shrink-0 transition-transform duration-200 ${
                        isActive || !isCollapsed ? "" : "group-hover:scale-110"
                      }`}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <>
                          <span className="font-medium ml-4 flex-1">{item.name}</span>
                          <div
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              isActive
                                ? "bg-white opacity-100"
                                : "bg-blue-400 opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        </>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-6 border-t border-gray-100 space-y-4">
          {/* Motivational Quote */}
          {!isCollapsed && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <p className="italic text-gray-600 text-sm leading-relaxed">
                "The beautiful thing about learning is that no one can take it away from you."
              </p>
              <p className="text-right mt-2 text-xs text-gray-500 font-medium">
                – B.B. King
              </p>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full group relative overflow-hidden text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg ${
              isCollapsed ? "text-center" : ""
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">
              {isCollapsed ? "🚪" : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🚪</span>
                  <span>Logout</span>
                </div>
              )}
            </span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:ml-0" : "md:ml-0"
        } pt-16 md:pt-0 overflow-auto`}
      >
        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden backdrop-blur-sm"
          onClick={toggleMobileMenu}
        ></div>
      )}
    </div>
  );
};

export default StudentSidebarLayout;