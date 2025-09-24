import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  adminGetWithdrawalRequestById,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
} from "../../../api/action/AdminActionApi";
import Card from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { type IWithdrawalRequestDetail } from "../interface/adminInterface";

export default function WithdrawalDetailsPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [withdrawalRequest, setWithdrawalRequest] = useState<IWithdrawalRequestDetail | null>(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [remarksError, setRemarksError] = useState<string | null>(null);

  const fetchWithdrawalRequest = async () => {
    if (!requestId) {
      toast.error("Invalid request ID");
      navigate("/admin/withdrawal");
      return;
    }

    try {
      setPageLoading(true);
      const response = await adminGetWithdrawalRequestById(requestId);
      setWithdrawalRequest(response.data as IWithdrawalRequestDetail);
      setRemarks(response.data.remarks || "");
    } catch (error: any) {
      toast.error(error.message || "Failed to load withdrawal request");
      navigate("/admin/withdrawal");
    } finally {
      setPageLoading(false);
    }
  };

  const validateRemarks = (value: string) => {
    if (!value.trim()) {
      return "Remarks are required when rejecting a withdrawal request";
    }
    const letterCount = (value.match(/[A-Za-z]/g) || []).length;
    if (letterCount < 5) {
      return "Remarks must contain at least 5 alphabet letters";
    }
    if (value.length > 300) {
      return "Remarks must not exceed 300 characters";
    }
    if (!/^[A-Za-z0-9\s-.]+$/.test(value)) {
      return "Remarks can only contain letters, numbers, spaces, hyphens, or periods";
    }
    return null;
  };

  const handleApprove = async () => {
    if (!withdrawalRequest) return;

    try {
      setLoading(true);
      const response = await adminApproveWithdrawal(withdrawalRequest.requestId, remarks);
      toast.success(response.message || "Withdrawal request approved successfully");
      fetchWithdrawalRequest();
    } catch (error: any) {
      toast.error("instructor has insufficient wallet balance");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!withdrawalRequest) return;

    const validationError = validateRemarks(remarks);
    if (validationError) {
      setRemarksError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);
      setRemarksError(null);
      const response = await adminRejectWithdrawal(withdrawalRequest.requestId, remarks);
      toast.success(response.message || "Withdrawal request rejected successfully");
      fetchWithdrawalRequest();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  useEffect(() => {
    fetchWithdrawalRequest();
  }, [requestId]);

  if (pageLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading withdrawal request details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!withdrawalRequest) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <p className="text-gray-600">Withdrawal request not found.</p>
          <Button
            onClick={() => navigate("/admin/withdrawal")}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Withdrawals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Withdrawal Request Details</h1>
          <p className="text-sm text-gray-600 mt-1">Request ID: {withdrawalRequest.requestId}</p>
        </div>
        <Button
          onClick={() => navigate("/admin/withdrawal")}
          className="bg-gray-600 hover:bg-gray-700"
        >
          ← Back to List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructor Information */}
        <Card title="Instructor Information">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-lg font-semibold text-gray-900">{withdrawalRequest.instructorName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900">{withdrawalRequest.instructorEmail}</p>
            </div>
          </div>
        </Card>

        {/* Request Information */}
        <Card title="Request Information">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Amount</label>
              <p className="text-2xl font-bold text-green-600">₹{withdrawalRequest.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Requested Date</label>
              <p className="text-gray-900">{formatDate(withdrawalRequest.requestDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Bank Account Status</label>
              <p className="text-gray-900">{withdrawalRequest.bankAccountLinked}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Remarks Section */}
      <Card title="Remarks">
        <div className="space-y-4">
          {withdrawalRequest.remarks && (
            <div>
              <label className="text-sm font-medium text-gray-600">Current Remarks</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{withdrawalRequest.remarks}</p>
            </div>
          )}

          {/* Only show input if no decision made yet */}
          {!withdrawalRequest.remarks && (
            <div>
              <label htmlFor="remarks" className="block text-gray-800 text-xs sm:text-sm font-semibold mb-1">
                ADMIN REMARKS
              </label>
              <textarea
                className={`w-full px-3 py-2 rounded-lg font-medium border-2 ${
                  remarksError ? "border-red-500" : "border-transparent"
                } bg-gray-100`}
                placeholder="Enter remarks (required for rejection, at least 5 letters)"
                id="remarks"
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  setRemarksError(null);
                }}
                disabled={loading}
                rows={4}
              />
              {remarksError && (
                <span className="text-xs font-semibold text-red-500 mt-1">{remarksError}</span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      {!withdrawalRequest.remarks && (
        <Card title="Actions">
          <div className="flex gap-4">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 flex-1 py-3"
            >
              {loading ? "Processing..." : "✓ Approve Request"}
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 flex-1 py-3"
            >
              {loading ? "Processing..." : "✗ Reject Request"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}