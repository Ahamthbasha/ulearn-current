import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseOfferDetail, verifyCourseOfferRequest } from "../../../api/action/AdminActionApi";
import Card from "../../../components/common/Card";
import { toast } from "react-toastify";
import { Check, X } from "lucide-react";
import ConfirmationModal from "../../../components/common/ConfirmationModal"; // Adjust path as needed
import type { IAdminCourseOfferDetail } from "../../../types/interfaces/IAdminInterface";

const AdminCourseOfferDetailPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<IAdminCourseOfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    if (!offerId) return;
    getCourseOfferDetail(offerId)
      .then(response => {
        setOffer(response.data);
      })
      .catch((e) => toast.error(e.message || "Failed to load offer"))
      .finally(() => setLoading(false));
  }, [offerId]);

  const handleVerify = async (approve: boolean) => {
    if (!offerId) return;

    if (!approve && !rejectReason.trim()) {
      toast.info("Rejection reason is required");
      return;
    }

    setVerifying(true);
    try {
      await verifyCourseOfferRequest({
        offerId,
        status: approve ? "approved" : "rejected",
        reviews: approve ? "" : rejectReason,
      });
      toast.success(`Offer ${approve ? "approved" : "rejected"} successfully`);
      navigate("/admin/courseOffers");
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
    } finally {
      setVerifying(false);
      setIsModalOpen(false);
    }
  };

  const openModal = (action: "approve" | "reject") => {
    setModalAction(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalAction(null);
  };

  if (loading) return <div className="p-6 text-center">Loading offer details...</div>;
  if (!offer) return <div className="p-6 text-center text-red-500">Offer not found.</div>;

  return (
    <>
      <Card title="Course Offer Detail" className="max-w-xl mx-auto my-5">
        <p><strong>Course:</strong> {offer.courseName || "N/A"}</p>
        <p><strong>Instructor:</strong> {offer.instructorName || "N/A"}</p>
        <p><strong>Discount:</strong> {offer.discount}%</p>
        <p><strong>Course Price:</strong> ₹{offer.coursePrice || "N/A"}</p>
        <p><strong>Discounted Price:</strong> ₹{offer.discountedPrice || "N/A"}</p>
        <p>
          <strong>Duration:</strong> {offer.startDate} - {offer.endDate}
        </p>
        <p>
          <strong>Status:</strong> {offer.status ? offer.status.charAt(0).toUpperCase() + offer.status.slice(1) : "N/A"}
        </p>
        <p><strong>Admin Reviews:</strong> {offer.review || "No reviews"}</p>

        {offer.status === "pending" && (
          <div className="mt-4">
            <div className="mb-4">
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700">
                Rejection Reason (required for rejection)
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                rows={4}
                placeholder="Enter reason for rejection (required)"
              />
            </div>
            <div className="flex space-x-3">
              <button
                disabled={verifying}
                onClick={() => openModal("approve")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center space-x-2"
              >
                <Check size={20} />
                <span>Approve</span>
              </button>
              <button
                disabled={verifying || !rejectReason.trim()}
                onClick={() => openModal("reject")}
                className={`bg-red-600 text-white px-4 py-2 rounded flex items-center space-x-2 ${
                  !rejectReason.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
                }`}
              >
                <X size={20} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmationModal
        isOpen={isModalOpen}
        title={modalAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
        message={`Are you sure you want to ${modalAction === "approve" ? "approve" : "reject"} this offer?`}
        confirmText={modalAction === "approve" ? "Approve" : "Reject"}
        cancelText="Cancel"
        onConfirm={() => handleVerify(modalAction === "approve")}
        onCancel={closeModal}
      />
    </>
  );
};

export default AdminCourseOfferDetailPage;