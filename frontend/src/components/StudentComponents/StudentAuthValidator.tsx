import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API } from '../../service/axios';
import { useDispatch } from 'react-redux';
import { clearUserDetails } from '../../redux/slices/userSlice';
import { toast } from 'react-toastify';

const StudentAuthValidator = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const validate = async () => {
      const student = JSON.parse(localStorage.getItem('user') || 'null');

      if (student?.role !== 'student') return;

      try {
        const res = await API.get('/api/student/statusCheck');

        const { isBlocked } = res.data?.data;

        if (isBlocked) {
          toast.error('🚫 You have been blocked by the admin.');
          await API.post('/api/student/logout'); // optional
          dispatch(clearUserDetails());
          navigate('/user/login');
        }

        // If not blocked, do nothing — allow normal flow
      } catch (err) {
        toast.error('⚠️ Authentication failed.');
        dispatch(clearUserDetails());
        navigate('/user/login');
      }
    };

    validate();
  }, [location.pathname]);

  return null;
};

export default StudentAuthValidator;
