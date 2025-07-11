import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getVerificationRequestByemail,
  updateVerificationStatus,
} from "../../../api/action/AdminActionApi";
import { Button } from "../../../components/common/Button";
import { Loader } from "lucide-react";
import { toast } from "react-toastify";

interface VerificationRequest {
  _id: string;
  username: string;
  email: string;
  status: string;
  resumeUrl: string;
  degreeCertificateUrl: string;
  reviewedAt?: Date;
}

const VerificationDetailsPage = () => {
  const { email } = useParams<{ email: string }>();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAction, setUpdatingAction] = useState<"approve" | "reject" | null>(null);
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
      <div className="flex justify-center mt-10">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center text-red-500 mt-10">
        Request not found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-2xl font-semibold mb-4">
        Instructor Verification Details
      </h2>

      <div className="space-y-3">
        <div>
          <strong>Name:</strong> {request.username}
        </div>
        <div>
          <strong>Email:</strong> {request.email}
        </div>
        <div>
          <strong>Status:</strong>{" "}
          <span
            className={`font-semibold ${
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
        <div>
          <strong>Resume:</strong>{" "}
          <a
            href={request.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View Resume
          </a>
        </div>
        <div>
          <strong>Degree Certificate:</strong>{" "}
          <a
            href={request.degreeCertificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View Certificate
          </a>
        </div>
        {request.reviewedAt && (
          <div>
            <strong>Reviewed At:</strong>{" "}
            {new Date(request.reviewedAt).toLocaleString()}
          </div>
        )}
      </div>

      {request.status === "pending" && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-4">
            <Button
              disabled={updatingAction !== null}
              onClick={() => handleStatusUpdate("approved")}
              className="bg-green-600 hover:bg-green-700"
            >
              {updatingAction === "approve" ? "Processing..." : "Approve"}
            </Button>
            <Button
              disabled={updatingAction !== null}
              onClick={() => handleStatusUpdate("rejected")}
              className="bg-red-600 hover:bg-red-700"
            >
              {updatingAction === "reject" ? "Processing..." : "Reject"}
            </Button>
          </div>

          <div>
            <label className="block font-medium text-sm text-gray-700 mb-1">
              Reason for Rejection (optional):
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-red-500"
              placeholder="E.g. Missing documents, blurry resume, etc."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationDetailsPage;
