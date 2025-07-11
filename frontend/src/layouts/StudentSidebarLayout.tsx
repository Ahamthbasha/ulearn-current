import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { toast } from "react-toastify";
import { clearUserDetails } from "../redux/slices/userSlice";
import { logout } from "../api/auth/UserAuthentication";

const navItems = [
  { name: "Dashboard", path: "/user/dashboard", icon: "📊" },
  { name: "Courses", path: "/user/enrolled", icon: "📚" },
  { name: "Meetings", path: "/user/meetings", icon: "🎥" },
  { name: "Wishlist", path: "/user/wishlist", icon: "❤️" },
  { name: "Cart", path: "/user/cart", icon: "🛒" },
  { name: "Settings", path: "/user/profile", icon: "⚙️" },
  {name:"Wallet",path:"/user/wallet",icon:"💵"},
  {name:"Order",path:"/user/order",icon:"📦"}
];

const StudentSidebarLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white shadow-xl flex flex-col relative overflow-hidden transition-all duration-300 ease-in-out`}>
        {/* Decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>

        {/* Logo Header */}
        <div className="relative flex items-center justify-center h-20 border-b border-gray-100 cursor-pointer" onClick={()=>navigate('/')}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            {!isCollapsed && (
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
                ULearn
              </span>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <div className="absolute top-6 right-4 z-10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <svg 
              className={`w-5 h-5 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300 bg-white flex-shrink-0">
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
                <p className="font-semibold text-gray-800 truncate">{username}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 flex-1">
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
                  `group flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:transform hover:scale-105"
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.name : ''}
              >
                {({ isActive }) => (
                  <>
                    <span className="text-xl group-hover:animate-pulse flex-shrink-0">
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="font-medium">{item.name}</span>
                        <div
                          className={`ml-auto w-2 h-2 rounded-full transition-all duration-200 ${
                            isActive
                              ? "bg-white"
                              : "bg-transparent group-hover:bg-blue-400"
                          }`}
                        />
                      </>
                    )}
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
            <div className="bg-gradient-to-r from-blue-50 to-purple-100 rounded-xl p-4">
              <p className="italic text-gray-600 text-sm">
                "The beautiful thing about learning is that no one can take it
                away from you."
              </p>
              <p className="text-right mt-2 text-xs text-gray-500">– B.B. King</p>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-2 px-4 rounded-lg transition duration-200 ${
              isCollapsed ? 'text-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            {isCollapsed ? '🚪' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentSidebarLayout;