import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getVerificationRequestByemail,
  updateVerificationStatus,
} from "../../../api/action/AdminActionApi";
import { Button } from "../../../components/common/Button";
import { Loader, X, ZoomIn, ZoomOut, Download } from "lucide-react";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"resume" | "certificate" | null>(null);
  const [zoom, setZoom] = useState(100);

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

  const handlePreview = (url: string, type: "resume" | "certificate") => {
    setPreviewUrl(url);
    setPreviewType(type);
    setZoom(100);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    setZoom(100);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const isPDF = (url: string) => {
    return url.toLowerCase().includes(".pdf");
  };

  const isWordDocument = (url: string) => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes(".doc") || lowerUrl.includes(".docx");
  };

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = previewType === "resume" ? "resume" : "certificate";
      if (isWordDocument(previewUrl)) {
        link.download += ".docx"; // Adjust based on actual file extension
      } else if (isPDF(previewUrl)) {
        link.download += ".pdf";
      }
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [email]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewUrl) {
        closePreview();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewUrl]);

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
          Instructor Verification Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            <button
              onClick={() => handlePreview(request.resumeUrl, "resume")}
              className="text-base sm:text-lg text-blue-600 hover:text-blue-800 underline transition-colors duration-200 text-left"
              aria-label={`Preview resume for ${request.username}`}
            >
              Preview Resume
            </button>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Degree Certificate</span>
            <button
              onClick={() => handlePreview(request.degreeCertificateUrl, "certificate")}
              className="text-base sm:text-lg text-blue-600 hover:text-blue-800 underline transition-colors duration-200 text-left"
              aria-label={`Preview degree certificate for ${request.username}`}
            >
              Preview Certificate
            </button>
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
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                disabled={updatingAction !== null}
                onClick={() => handleStatusUpdate("approved")}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Approve verification request"
              >
                {updatingAction === "approve" ? (
                  <span className="flex items-center justify-center">
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
                  <span className="flex items-center justify-center">
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

      {/* Enhanced Document Viewer Modal - Support for Word Documents */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 sm:p-4"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-[95vw] h-[95vh] sm:max-w-[90vw] sm:h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-wrap gap-2 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate flex-1 min-w-0">
                {previewType === "resume" ? "Resume Preview" : "Degree Certificate Preview"}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Zoom out"
                  title="Zoom out"
                  disabled={zoom <= 50 || isWordDocument(previewUrl)}
                >
                  <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Zoom in"
                  title="Zoom in"
                  disabled={zoom >= 200 || isWordDocument(previewUrl)}
                >
                  <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  aria-label="Download document"
                  title="Download"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  aria-label="Close preview"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </button>
              </div>
            </div>

            {/* Enhanced Document Content with Proper Centering and Zoom */}
            <div className="flex-1 overflow-auto bg-gray-100">
              <div
                className="min-h-full flex items-center justify-center p-4"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isPDF(previewUrl) ? (
                  <div
                    style={{
                      width: `${zoom}%`,
                      height: "auto",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "width 0.3s ease",
                    }}
                  >
                    <iframe
                      src={`${previewUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=1`}
                      className="w-full bg-white shadow-lg rounded"
                      style={{
                        height: "80vh",
                        minHeight: "500px",
                        border: "none",
                      }}
                      title={`${previewType} preview`}
                    />
                  </div>
                ) : isWordDocument(previewUrl) ? (
                  <div className="text-center">
                    <p className="text-gray-700 mb-4">
                      Word documents (.doc, .docx) cannot be previewed directly. Please download the file to view.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Download {previewType === "resume" ? "Resume" : "Certificate"}
                    </button>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt={`${previewType} preview`}
                    className="rounded shadow-lg"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "80vh",
                      objectFit: "contain",
                      width: `${zoom}%`,
                      height: "auto",
                      transition: "width 0.3s ease",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
              <div className="flex justify-center items-center gap-3">
                <button
                  onClick={closePreview}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationDetailsPage;