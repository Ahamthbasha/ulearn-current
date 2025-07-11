import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API } from '../../service/axios';
import { useDispatch } from 'react-redux';
import { clearInstructorDetails } from '../../redux/slices/instructorSlice';
import { toast } from 'react-toastify';

const InstructorAuthValidator = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const validate = async () => {
      const instructor = JSON.parse(localStorage.getItem('instructor') || 'null');

      if (instructor?.role !== 'instructor') return;

      try {
        const res = await API.get('/api/instructor/statusCheck');
        
        console.log(res)
        
        const { isBlocked } = res.data?.data;

        if (isBlocked) {
          toast.error('🚫 You have been blocked by the admin.');
          await API.post('/api/instructor/logout'); // Optional
          dispatch(clearInstructorDetails());
          navigate('/instructor/login');
        }

        // Don't redirect if not blocked — proceed normally
      } catch (err: any) {
        toast.error('⚠️ Authentication failed.');
        dispatch(clearInstructorDetails());
        navigate('/instructor/login');
      }
    };

    validate();
  }, [location.pathname]);

  return null;
};

export default InstructorAuthValidator;
