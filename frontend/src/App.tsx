import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { configureAxiosInterceptors } from "./service/axios";
import StudentRouter from "./routes/StudentRouter"; 
import InstructorRouter from "./routes/InstructorRouter"; 
import AdminRouter from "./routes/AdminRouter"; 

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Configure Axios interceptors
    configureAxiosInterceptors(dispatch, navigate);
  }, [dispatch, navigate]);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/*" element={<StudentRouter />} />
        <Route path="/instructor/*" element={<InstructorRouter />} />
        <Route path="/admin/*" element={<AdminRouter />} />
      </Routes>
    </>
  );
};

export default App;