import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  TreePine,
  Image,
  CreditCard,
  Crown,
  BadgePercent,
  ShieldCheck,
  ShoppingCart,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminLogout } from '../api/auth/AdminAuthentication';

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname.includes(path);
  
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard />, path: 'dashboard' },
    { name: 'Users', icon: <Users />, path: 'users' },
    { name: 'Instructors', icon: <GraduationCap />, path: 'instructors' },
    { name: 'Courses', icon: <BookOpen />, path: 'courses' },
    { name: 'Category', icon: <TreePine />, path: 'category' },
    { name: 'Banner', icon: <Image />, path: 'banner' },
    { name: 'Verification', icon: <ShieldCheck />, path: 'verification' },
    { name: 'Order Management', icon: <ShoppingCart />, path: 'orders' },
    { name: 'Wallet', icon: <CreditCard />, path: 'wallet' },
    { name: 'Membership', icon: <Crown />, path: 'membership' },
    { name: 'Coupon', icon: <BadgePercent />, path: 'coupon' }
  ];
  
  const handleLogout = async () => {
    try {
      const response = await adminLogout();
      if (response.success) {
        localStorage.removeItem("admin");
        toast.success("Logged out successfully");
        navigate("/admin/login");
      } else {
        toast.error(response.message || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.6);
          border-radius: 3px;
          transition: background 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.8);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(249, 115, 22, 0.6) rgba(59, 130, 246, 0.1);
        }
      `}</style>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Menu size={20} className="text-blue-700" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 shadow-2xl transition-all duration-300 flex flex-col
          ${
            // Mobile behavior
            mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
          } 
          lg:translate-x-0 lg:static
          ${
            // Desktop behavior
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
          }
        `}
      >
        {/* Header Section with Logo and Toggle */}
        <div className={`p-6 border-b border-blue-700/30 flex-shrink-0 transition-all duration-300 relative ${
          sidebarCollapsed ? 'lg:px-4' : ''
        }`}>
          {/* Logo */}
          <div className={`flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl font-bold text-white">U</span>
            </div>
            <div className={`transition-all duration-300 ${
              sidebarCollapsed ? 'lg:hidden lg:opacity-0' : 'lg:block lg:opacity-100'
            }`}>
              <h1 className="text-2xl font-bold text-white">
                ULearn
              </h1>
              <p className="text-blue-200 text-sm font-medium">E-Learning Platform</p>
            </div>
          </div>

          {/* Desktop Toggle Button - Positioned inside sidebar */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex absolute top-6 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-200 items-center justify-center backdrop-blur-sm border border-white/20 ${
              sidebarCollapsed ? 'lg:right-2' : ''
            }`}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} className="text-white" />
            ) : (
              <ChevronLeft size={16} className="text-white" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden absolute top-6 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Navigation - Scrollable Section */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={`/admin/${item.path}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center rounded-xl transition-all duration-200 hover:bg-white/10 hover:shadow-lg relative ${
                  sidebarCollapsed ? 'lg:justify-center lg:px-3 lg:py-4' : 'gap-3 px-4 py-3'
                } ${
                  isActive(item.path) 
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20' 
                    : 'text-blue-100 hover:text-white'
                }`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <span className={`transition-colors duration-200 flex-shrink-0 ${
                  isActive(item.path) ? 'text-orange-300' : 'text-blue-300 group-hover:text-orange-300'
                }`}>
                  {item.icon}
                </span>
                <span className={`font-medium transition-all duration-300 ${
                  sidebarCollapsed ? 'lg:hidden lg:opacity-0 lg:w-0' : 'lg:block lg:opacity-100'
                }`}>
                  {item.name}
                </span>
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-700/30 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl group relative ${
              sidebarCollapsed ? 'lg:justify-center lg:px-3 lg:py-4' : 'gap-3 px-4 py-3'
            }`}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`font-medium transition-all duration-300 ${
              sidebarCollapsed ? 'lg:hidden lg:opacity-0 lg:w-0' : 'lg:block lg:opacity-100'
            }`}>
              Logout
            </span>
            
            {/* Tooltip for collapsed state */}
            {sidebarCollapsed && (
              <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 min-h-screen overflow-y-auto custom-scrollbar transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;