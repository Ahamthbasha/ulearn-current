// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { format } from "date-fns";
// import {
//   membershipDetail,
//   downloadReceiptForMembership,
// } from "../../../api/action/InstructorActionApi";
// import { Download } from "lucide-react";
// // import fileDownload from "js-file-download";

// interface MembershipPlan {
//   name: string;
//   durationInDays: number;
//   description?: string;
//   benefits?: string[];
// }

// interface InstructorInfo {
//   username: string;
//   email: string;
// }

// interface MembershipOrder {
//   membershipPlanId: MembershipPlan;
//   instructorId: InstructorInfo;
//   price: number;
//   paymentStatus: "pending" | "paid";
//   txnId: string;
//   startDate: string;
//   endDate: string;
//   createdAt: string;
// }

// const MembershipOrderDetail = () => {
//   const { txnId } = useParams<{ txnId: string }>();
//   const [order, setOrder] = useState<MembershipOrder | null>(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchOrder = async () => {
//       try {
//         if (!txnId) return;
//         const data = await membershipDetail(txnId);
//         setOrder(data);
//       } catch (err) {
//         toast.error("Failed to load membership order.");
//         navigate("/instructor/purchaseHistory");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchOrder();
//   }, [txnId, navigate]);

//   if (loading) return <p className="p-6">Loading...</p>;
//   if (!order) return <p className="p-6">Order not found.</p>;

//   const plan = order.membershipPlanId;
//   const instructor = order.instructorId;
//   const isWalletPayment = order.txnId.startsWith("wallet_");

//   const handleDownload = async () => {
//     try {
//       await downloadReceiptForMembership(order.txnId);
//       toast.success("Receipt downloaded successfully!");
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to download receipt.");
//     }
//   };

//   return (
//     <div className="p-6 max-w-4xl mx-auto space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-2xl font-bold">Membership Order Details</h2>
//           <p className="text-sm text-gray-500 mt-1">
//             Order placed on{" "}
//             {format(new Date(order.createdAt), "MMMM d, yyyy 'at' hh:mm a")}
//           </p>
//         </div>

//         {order.paymentStatus === "paid" && (
//           <button
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
//             onClick={handleDownload}
//           >
//             <Download size={16} />
//             Download Receipt
//           </button>
//         )}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="border rounded p-4">
//           <p className="text-gray-500 text-sm">Customer</p>
//           <p className="font-semibold">{instructor.username}</p>
//           <p className="text-sm text-gray-600">{instructor.email}</p>
//         </div>
//         <div className="border rounded p-4">
//           <p className="text-gray-500 text-sm">Payment</p>
//           <p className="font-semibold">
//             {isWalletPayment ? "Wallet" : "Razorpay"}
//           </p>
//           <p className="font-semibold text-lg">₹{order.price}</p>
//         </div>
//         <div className="border rounded p-4">
//           <p className="text-gray-500 text-sm">Status</p>
//           <p
//             className={`inline-block font-semibold text-sm px-2 py-1 rounded ${
//               order.paymentStatus === "paid"
//                 ? "bg-green-100 text-green-700"
//                 : "bg-yellow-100 text-yellow-700"
//             }`}
//           >
//             {order.paymentStatus.toUpperCase()}
//           </p>
//           <p className="text-xs text-gray-600 mt-1">Txn ID: {order.txnId}</p>
//         </div>
//       </div>

//       <div className="border rounded p-4">
//         <p className="text-lg font-semibold mb-2">Membership Plan</p>
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//           <div>
//             <p className="text-gray-500 text-sm">Plan Name</p>
//             <p className="font-semibold">{plan.name}</p>
//           </div>
//           <div>
//             <p className="text-gray-500 text-sm">Duration</p>
//             <p className="font-semibold">{plan.durationInDays} days</p>
//           </div>
//           <div>
//             <p className="text-gray-500 text-sm">Start Date</p>
//             <p className="font-semibold">
//               {format(new Date(order.startDate), "dd MMM yyyy")}
//             </p>
//           </div>
//           <div>
//             <p className="text-gray-500 text-sm">End Date</p>
//             <p className="font-semibold">
//               {format(new Date(order.endDate), "dd MMM yyyy")}
//             </p>
//           </div>
//         </div>
//       </div>

//       {plan.description && (
//         <div className="border rounded p-4">
//           <p className="text-gray-500 text-sm mb-1">Description</p>
//           <p className="text-gray-800">{plan.description}</p>
//         </div>
//       )}

//       {Array.isArray(plan.benefits) && plan.benefits.length > 0 && (
//         <div className="border rounded p-4">
//           <p className="text-gray-500 text-sm mb-1">Benefits</p>
//           <ul className="list-disc pl-6 text-gray-800">
//             {plan.benefits.map((b, i) => (
//               <li key={i}>{b}</li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MembershipOrderDetail;





























import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  membershipDetail,
  downloadReceiptForMembership,
} from "../../../api/action/InstructorActionApi";
import { Download } from "lucide-react";

interface MembershipPlan {
  name: string;
  durationInDays: number;
  description?: string;
  benefits?: string[];
}

interface InstructorInfo {
  name: string;
  email: string;
}

interface MembershipOrder {
  instructor: InstructorInfo; // Updated from instructorId
  membershipPlan: MembershipPlan; // Updated from membershipPlanId
  price: number;
  paymentStatus: "pending" | "paid" | "failed"; // Added "failed" for consistency
  txnId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const MembershipOrderDetail = () => {
  const { txnId } = useParams<{ txnId: string }>();
  const [order, setOrder] = useState<MembershipOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!txnId) return;
        const data = await membershipDetail(txnId);
        setOrder(data);
      } catch (err) {
        toast.error("Failed to load membership order.");
        navigate("/instructor/purchaseHistory");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [txnId, navigate]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!order) return <p className="p-6">Order not found.</p>;

  const plan = order.membershipPlan; // Updated from membershipPlanId
  const instructor = order.instructor; // Updated from instructorId
  const isWalletPayment = order.txnId.startsWith("wallet_");

  const handleDownload = async () => {
    try {
      await downloadReceiptForMembership(order.txnId);
      toast.success("Receipt downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download receipt.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Membership Order Details</h2>
          <p className="text-sm text-gray-500 mt-1">
            Order placed on{" "}
            {format(new Date(order.createdAt), "MMMM d, yyyy 'at' hh:mm a")}
          </p>
        </div>

        {order.paymentStatus === "paid" && (
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
            onClick={handleDownload}
          >
            <Download size={16} />
            Download Receipt
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <p className="text-gray-500 text-sm">Customer</p>
          <p className="font-semibold">{instructor.name}</p>
          <p className="text-sm text-gray-600">{instructor.email}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-gray-500 text-sm">Payment</p>
          <p className="font-semibold">
            {isWalletPayment ? "Wallet" : "Razorpay"}
          </p>
          <p className="font-semibold text-lg">₹{order.price}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-gray-500 text-sm">Status</p>
          <p
            className={`inline-block font-semibold text-sm px-2 py-1 rounded ${
              order.paymentStatus === "paid"
                ? "bg-green-100 text-green-700"
                : order.paymentStatus === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {order.paymentStatus.toUpperCase()}
          </p>
          <p className="text-xs text-gray-600 mt-1">Txn ID: {order.txnId}</p>
        </div>
      </div>

      <div className="border rounded p-4">
        <p className="text-lg font-semibold mb-2">Membership Plan</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Plan Name</p>
            <p className="font-semibold">{plan.name}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Duration</p>
            <p className="font-semibold">{plan.durationInDays} days</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Start Date</p>
            <p className="font-semibold">
              {format(new Date(order.startDate), "dd MMM yyyy")}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">End Date</p>
            <p className="font-semibold">
              {format(new Date(order.endDate), "dd MMM yyyy")}
            </p>
          </div>
        </div>
      </div>

      {plan.description && (
        <div className="border rounded p-4">
          <p className="text-gray-500 text-sm mb-1">Description</p>
          <p className="text-gray-800">{plan.description}</p>
        </div>
      )}

      {Array.isArray(plan.benefits) && plan.benefits.length > 0 && (
        <div className="border rounded p-4">
          <p className="text-gray-500 text-sm mb-1">Benefits</p>
          <ul className="list-disc pl-6 text-gray-800">
            {plan.benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MembershipOrderDetail;