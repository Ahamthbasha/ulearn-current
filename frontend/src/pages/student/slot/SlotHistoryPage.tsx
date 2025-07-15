import { useEffect, useState } from "react";
import { bookingHistory } from "../../../api/action/StudentAction";
import { format } from "date-fns";
import EntityTable from "../../../components/common/EntityTable";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
}

interface Instructor {
  _id: string;
  username: string;
  email: string;
}

interface Booking {
  _id: string;
  slotId: Slot;
  instructorId: Instructor;
  txnId?: string;
  paymentStatus: "paid" | "pending" | "failed";
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
}

const SlotHistoryPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await bookingHistory();
        setBookings(res.data || []);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const columns = [
    {
      key: "slotId" as keyof Booking,
      label: "Date",
      render: (value: Slot) =>
        value?.startTime ? format(new Date(value.startTime), "dd-MM-yyyy") : "N/A",
    },
    {
      key: "slotId" as keyof Booking,
      label: "Start Time",
      render: (value: Slot) =>
        value?.startTime ? format(new Date(value.startTime), "hh:mm a") : "N/A",
    },
    {
      key: "slotId" as keyof Booking,
      label: "End Time",
      render: (value: Slot) =>
        value?.endTime ? format(new Date(value.endTime), "hh:mm a") : "N/A",
    },
    {
      key: "slotId" as keyof Booking,
      label: "Price",
      render: (value: Slot) => `₹${value?.price || 0}`,
    },
  ];

  const handleViewDetails = (booking: Booking) => {
    navigate(`/user/slotHistory/${booking._id}`);
  };

  return (
    <div className="min-h-screen bg-white px-6 py-10 md:px-20">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📖 Slot Booking History</h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <EntityTable
            title="Your Booked Slots"
            data={bookings}
            columns={columns}
            onAction={handleViewDetails}
            actionLabel="View"
            emptyText="No bookings found"
          />
        )}
      </div>
    </div>
  );
};

export default SlotHistoryPage;
