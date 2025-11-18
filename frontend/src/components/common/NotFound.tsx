import React  from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = () => {
    const path = location.pathname.toLowerCase();

    if (path.startsWith("/user")) return "/user/dashboard";         // student
    if (path.startsWith("/instructor")) return "/instructor/dashboard"; // instructor
    if (path.startsWith("/admin")) return "/admin/dashboard";            // admin
    return "/";
  };

  const handleRedirect = () => {
    const path = getRedirectPath();
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-6">
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-6">Sorry, the page you're looking for doesn’t exist.</p>
      <button
        onClick={handleRedirect}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go to Home
      </button>
    </div>
  );
};

export default NotFound;
