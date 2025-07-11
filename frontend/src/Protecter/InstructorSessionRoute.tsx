import { Navigate, Outlet } from "react-router-dom";

const InstructorSessionRoute = () => {
  const instructor = JSON.parse(localStorage.getItem("instructor") || "null");

  if (instructor) {
    if (instructor.isVerified) {
      return <Navigate to="/instructor/dashboard" replace />;
    }
    return <Navigate to={`/instructor/verificationStatus/${instructor.email}`} replace />;
  }

  return <Outlet />;
};

export default InstructorSessionRoute;
