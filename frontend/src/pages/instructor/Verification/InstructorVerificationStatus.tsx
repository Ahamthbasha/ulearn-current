import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getVerificationRequestByemail } from "../../../api/action/InstructorActionApi";
import { Loader } from "lucide-react";
import { Button } from "../../../components/common/Button";
import type { IVerificationRequest } from "../../../types/IVerificationRequest";

const InstructorVerificationStatus = () => {
  const { email } = useParams<{ email: string }>(); // 👈 extract from URL
  const [request, setRequest] = useState<IVerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStatus = async () => {
    if (!email) return;

    try {
      const res = await getVerificationRequestByemail(email);
      setRequest(res?.data);
    } catch (error) {
      console.error("Failed to fetch verification status", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [email]);

  if (loading) {
    return <div className="flex justify-center mt-10"><Loader className="animate-spin" /></div>;
  }

  if (!request) {
    return <div className="text-center text-red-500 mt-10">No request found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Verification Status</h2>

      <p><strong>Status:</strong> {request.status}</p>

      {request.status === "pending" && (
        <p className="text-yellow-500 mt-2">Your request is being reviewed.</p>
      )}

      {request.status === "rejected" && (
        <>
          <p className="text-red-600 mt-2">Rejected: {request.rejectionReason || "No reason provided."}</p>
          <Button onClick={() => navigate("/instructor/reverify")}>
            Re-verify
          </Button>
        </>
      )}

      {request.status === "approved" && (
        <>
          <p className="text-green-600 mt-2">✅ You are now a verified instructor on uLearn!</p>
          <Button onClick={() => navigate("/instructor/dashboard")}>
            Go to Dashboard
          </Button>
        </>
      )}
    </div>
  );
};

export default InstructorVerificationStatus;
