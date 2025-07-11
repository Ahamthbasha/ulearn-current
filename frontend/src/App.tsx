import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import StudentRouter from './routes/StudentRouter';
import InstructorRouter from './routes/InstructorRouter';
import AdminRouter from './routes/AdminRouter';
import StudentAuthValidator from './components/StudentComponents/StudentAuthValidator';
import InstructorAuthValidator from './components/InstructorComponents/InstructorAuthValidator';

const App = () => {
  const location = useLocation();

  // Determine which validator to use based on URL
  const isInstructorPath = location.pathname.startsWith('/instructor');
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <>
      <ToastContainer />
      
      {!isAdminPath && (
        <>
          {isInstructorPath ? <InstructorAuthValidator /> : <StudentAuthValidator />}
        </>
      )}

      <Routes>
        <Route path="/*" element={<StudentRouter />} />
        <Route path="instructor/*" element={<InstructorRouter />} />
        <Route path="admin/*" element={<AdminRouter />} />
      </Routes>
    </>
  );
};

export default App;
