import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInstructorCourseOfferById, deleteInstructorCourseOffer } from "../../../api/action/InstructorActionApi";
import Card from "../../../components/common/Card";
import ConfirmationModal from "../../../components/common/ConfirmationModal"; 
import { toast } from "react-toastify";
import type { ICourseOfferDetails } from "../interface/instructorInterface";

const OfferDetailsPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<ICourseOfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!offerId) {
      setError("No offer ID provided");
      setLoading(false);
      toast.error("No offer ID provided");
      return;
    }

    console.log("Fetching offer with ID:", offerId);

    const fetchOffer = async () => {
      try {
        const response = await getInstructorCourseOfferById(offerId);
        console.log("API Response:", response);

        // Handle different response structures
        if (response && 'success' in response && response.success && response.data) {
          setOffer(response.data as ICourseOfferDetails);
        } else if (response && 'courseOfferId' in response) {
          // Handle case where API returns data directly
          setOffer(response as ICourseOfferDetails);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (e: any) {
        console.error("Error fetching offer:", e);
        setError(e.message || "Failed to load offer");
        toast.error(e.message || "Failed to load offer");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId]);

  const handleDeleteClick = () => {
    if (!offerId) {
      toast.error("No offer ID provided");
      return;
    }
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteInstructorCourseOffer(offerId!);
      toast.success("Offer deleted");
      setIsModalOpen(false);
      navigate("/instructor/courseOffers");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete offer");
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error || !offer) return <div className="p-6 text-center text-red-500">{error || "Offer not found"}</div>;

  return (
    <div>
      <Card title="Course Offer Details" className="max-w-xl mx-auto my-6">
        <p><strong>Course:</strong> {offer.courseName || "N/A"}</p>
        <p><strong>Original Price:</strong> ₹{offer.courseOriginalPrice}</p>
        <p><strong>Discount:</strong> {offer.discount}%</p>
        <p><strong>Discounted Price:</strong> ₹{offer.courseDiscountPrice}</p>
        <p><strong>Start Date:</strong> {offer.startDate}</p>
        <p><strong>End Date:</strong> {offer.endDate}</p>
        <p><strong>Status:</strong> {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}</p>
        {offer.reviews && <p><strong>Admin Reviews:</strong> {offer.reviews}</p>}
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={handleDeleteClick} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete</button>
          <button onClick={() => navigate(`/instructor/editCourseOffer/${offer.courseOfferId}`)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Edit</button>
        </div>
      </Card>
      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this course offer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default OfferDetailsPage;