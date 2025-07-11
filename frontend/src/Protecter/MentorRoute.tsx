import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { isMentorOrNot } from "../api/action/InstructorActionApi";
import { toast } from "react-toastify";

const MentorRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isMentor, setIsMentor] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const hasChecked = useRef(false); // Prevents double execution

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkMentor = async () => {
      try {
        const response = await isMentorOrNot();
        if (!response.isMentor) {
          toast.info("You must be a mentor to access this feature.");
          setIsMentor(false);

          setTimeout(() => {
            navigate("/instructor/membership", { replace: true });
          }, 2000);
        } else {
          setIsMentor(true);
        }
      } catch (err) {
        toast.error("Failed to verify mentor status.");
        setTimeout(() => {
          navigate("/instructor/membership", { replace: true });
        }, 1000);
      } finally {
        setLoading(false);
      }
    };

    checkMentor();
  }, [location.pathname, navigate]);

  if (loading) return <p className="text-center mt-10">Checking mentor status...</p>;

  return isMentor ? <Outlet /> : null;
};

export default MentorRoute;
