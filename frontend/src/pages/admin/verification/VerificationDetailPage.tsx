import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getVerificationRequestByemail,
  updateVerificationStatus,
} from "../../../api/action/AdminActionApi";
import { Button } from "../../../components/common/Button";
import { Loader } from "lucide-react";
import { toast } from "react-toastify";
import { type VerificationRequest } from "../interface/adminInterface";

const VerificationDetailsPage = () => {
  const { email } = useParams<{ email: string }>();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAction, setUpdatingAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequest = async () => {
    try {
      const res = await getVerificationRequestByemail(email!);
      setRequest(res?.data);
    } catch (err) {
      toast.error("Failed to load verification details.");
      console.error("Error fetching request details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    try {
      setUpdatingAction(status === "approved" ? "approve" : "reject");
      await updateVerificationStatus(email!, status, rejectionReason);
      toast.success(
        status === "approved"
          ? "Verification approved successfully."
          : "Verification rejected successfully."
      );
      setRequest((prev) => (prev ? { ...prev, status } : prev));
    } catch (err) {
      toast.error("Failed to update verification status.");
      console.error("Error updating status", err);
    } finally {
      setUpdatingAction(null);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [email]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-gray-600">Loading verification details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-600 text-lg font-medium bg-red-50 p-4 rounded-lg">
          Request not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
          Instructor Verification Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Name</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              {request.username}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Email</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              {request.email}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <span
              className={`text-base sm:text-lg font-semibold capitalize ${
                request.status === "approved"
                  ? "text-green-600"
                  : request.status === "rejected"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {request.status}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Resume</span>
            <a
              href={request.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base sm:text-lg text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
              aria-label={`View resume for ${request.username}`}
            >
              View Resume
            </a>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Degree Certificate</span>
            <a
              href={request.degreeCertificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base sm:text-lg text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
              aria-label={`View degree certificate for ${request.username}`}
            >
              View Certificate
            </a>
          </div>
          {request.reviewedAt && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">Reviewed At</span>
              <span className="text-base sm:text-lg font-semibold text-gray-900">
                {new Date(request.reviewedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {request.status === "pending" && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                disabled={updatingAction !== null}
                onClick={() => handleStatusUpdate("approved")}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Approve verification request"
              >
                {updatingAction === "approve" ? (
                  <span className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  "Approve"
                )}
              </Button>
              <Button
                disabled={updatingAction !== null}
                onClick={() => handleStatusUpdate("rejected")}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Reject verification request"
              >
                {updatingAction === "reject" ? (
                  <span className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  "Reject"
                )}
              </Button>
            </div>

            <div>
              <label
                htmlFor="rejectionReason"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Reason for Rejection (optional)
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-y"
                placeholder="E.g., Missing documents, blurry resume, etc."
                aria-describedby="rejectionReasonHelp"
              />
              <p id="rejectionReasonHelp" className="text-xs text-gray-500 mt-1">
                Provide a reason if rejecting the verification request.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationDetailsPage;