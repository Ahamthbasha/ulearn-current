import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  instructorGetWallet,
  instructorCreateWalletRechargeOrder,
  instructorVerifyPayment,
  instructorWalletTransactionHistory,
  instructorCreateWithdrawal,
  instructorGetWithdrawal,
  retryWithdrawal,
} from "../../../api/action/InstructorActionApi";
import Card from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import InputField from "../../../components/common/InputField";
import { type TransactionResponse, type WalletResponse , type Transaction, type IWithdrawalRequest  } from "../interface/instructorInterface";

export default function InstructorWalletPage() {
  const [wallet, setWallet] = useState<{ ownerId: string; balance: number } | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState<number>(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnPage, setTxnPage] = useState(1);
  const [txnTotalPages, setTxnTotalPages] = useState(1);
  const [withdrawalRequests, setWithdrawalRequests] = useState<IWithdrawalRequest[]>([]);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(1);
  const [showRetryModal, setShowRetryModal] = useState<{ show: boolean; requestId: string; currentAmount: number }>({
    show: false,
    requestId: "",
    currentAmount: 0,
  });
  const [retryAmount, setRetryAmount] = useState<number>(0);
  const limit = 5;

  const fetchWallet = async () => {
    try {
      const res: WalletResponse = await instructorGetWallet();
      setWallet(res.wallet);
    } catch (error: any) {
      toast.error(error.message || "Failed to load wallet");
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      const res: TransactionResponse = await instructorWalletTransactionHistory(page, limit);
      setTransactions(res.data.transactions || []);
      setTxnPage(res.data.currentPage || 1);
      setTxnTotalPages(res.data.totalPages || 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to load transactions");
    }
  };

  const fetchWithdrawalRequests = async (page = 1) => {
    try {
      const res = await instructorGetWithdrawal(page, limit);
      setWithdrawalRequests(res.transactions || []);
      setWithdrawalPage(res.currentPage || 1);
      setWithdrawalTotalPages(res.totalPages || 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to load withdrawal requests");
    }
  };

  const handleAddMoney = async () => {
    try {
      if (!rechargeAmount || rechargeAmount < 1) {
        toast.warning("Enter a valid recharge amount");
        return;
      }

      if(rechargeAmount > 50000){
        toast.warning("Enter an amount which is less than or equal to 50000")
        return;
      }
      setLoading(true);

      const orderData = await instructorCreateWalletRechargeOrder({ amount: rechargeAmount });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: "INR",
        name: "uLearn Instructor Wallet",
        description: "Wallet Recharge",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          try {
            await instructorVerifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: rechargeAmount,
            });
            toast.success("Wallet recharged successfully");
            setRechargeAmount(0);
            fetchWallet();
            fetchTransactions(1);
          } catch (error: any) {
            toast.error(error.message || "Payment verification failed");
          }
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWithdrawal = async () => {
    try {
      if (!withdrawalAmount || withdrawalAmount < 1) {
        toast.warning("Enter a valid withdrawal amount");
        return;
      }

      if(withdrawalAmount > 50000){
        toast.warning("Enter a withdrawal amount which is less than or equal to 5000")
        return;
      }
      if (!wallet || wallet.balance < withdrawalAmount) {
        toast.warning("Insufficient wallet balance");
        return;
      }

      setWithdrawalLoading(true);
      const response = await instructorCreateWithdrawal(withdrawalAmount);
      toast.success(response.message || "Withdrawal request created successfully");
      setWithdrawalAmount(0);
      fetchWallet();
      fetchWithdrawalRequests(1);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create withdrawal request";
      toast.error(errorMessage);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleRetryRequest = async () => {
    try {
      if (retryAmount <= 0) {
        toast.error("Invalid amount entered");
        return;
      }
      await retryWithdrawal(showRetryModal.requestId, retryAmount);
      toast.success("Withdrawal request retried successfully");
      fetchWallet();
      fetchWithdrawalRequests(withdrawalPage);
      setShowRetryModal({ show: false, requestId: "", currentAmount: 0 });
      setRetryAmount(0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to retry withdrawal request");
    }
  };

  const openRetryModal = (requestId: string, currentAmount: number) => {
    setShowRetryModal({ show: true, requestId, currentAmount });
    setRetryAmount(currentAmount);
  };

  const closeRetryModal = () => {
    setShowRetryModal({ show: false, requestId: "", currentAmount: 0 });
    setRetryAmount(0);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return "N/A";
    }
    // Check if date is already in the desired format (DD/MM/YYYY HH:MM AM/PM)
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} (AM|PM)$/)) {
      return dateString;
    }
    // Fallback for other date formats
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours() % 12 || 12;
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
      return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "pending":
      default:
        return "text-yellow-600";
    }
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    const bgColor = status.toLowerCase() === "approved" ? "bg-green-100" : 
                   status.toLowerCase() === "rejected" ? "bg-red-100" : "bg-yellow-100";
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color} ${bgColor} capitalize`}>
        {status}
      </span>
    );
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions(1);
    fetchWithdrawalRequests(1);
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Wallet</h1>
        <div className="text-sm text-gray-500">
          Instructor Dashboard
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card>
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-2">Available Balance</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-green-600">
              ₹{wallet?.balance.toFixed(2) || "0.00"}
            </h2>
          </div>

          {/* Action Buttons - Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Money Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">Add Money</h3>
              <div className="space-y-3">
                <InputField
                  type="number"
                  placeholder="Enter amount to add"
                  name="rechargeAmount"
                  label="Amount (₹)"
                  useFormik={false}
                  value={rechargeAmount || ""}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                />
                <Button 
                  onClick={handleAddMoney} 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Processing..." : "Add Money"}
                </Button>
              </div>
            </div>

            {/* Withdraw Money Section */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-3">Withdraw Money</h3>
              <div className="space-y-3">
                <InputField
                  type="number"
                  placeholder="Enter amount to withdraw"
                  name="withdrawalAmount"
                  label="Amount (₹)"
                  useFormik={false}
                  value={withdrawalAmount || ""}
                  onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                />
                <Button 
                  onClick={handleCreateWithdrawal} 
                  disabled={withdrawalLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {withdrawalLoading ? "Processing..." : "Request Withdrawal"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Retry Modal */}
      {showRetryModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Retry Withdrawal Request</h2>
            <p className="text-sm text-gray-600 mb-4">
              Current amount: ₹{showRetryModal.currentAmount.toFixed(2)}
            </p>
            <InputField
              type="number"
              placeholder="Enter new amount"
              name="retryAmount"
              label="New Amount (₹)"
              useFormik={false}
              value={retryAmount || ""}
              onChange={(e) => setRetryAmount(Number(e.target.value))}
            />
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                onClick={closeRetryModal}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRetryRequest}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <Card title="Transaction History">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Description
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length ? (
                transactions.map((txn, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-sm text-blue-600 font-mono break-all max-w-xs">
                      <div className="truncate" title={txn.txnId}>
                        {txn.txnId}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        txn.type === "credit" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {txn.type.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm font-semibold ${
                      txn.type === "credit" ? "text-green-600" : "text-red-600"
                    }`}>
                      {txn.type === "credit" ? "+" : "-"}₹{txn.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 hidden sm:table-cell max-w-xs">
                      <div className="truncate" title={txn.description}>
                        {txn.description}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(txn.date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-8 text-center text-gray-500" colSpan={5}>
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No transactions found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination for Transactions */}
        {txnTotalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
            {Array.from({ length: txnTotalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => fetchTransactions(pageNum)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  pageNum === txnPage 
                    ? "bg-indigo-600 text-white border-indigo-600" 
                    : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Withdrawal Request History */}
      <Card title="Withdrawal Request History">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Remarks
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawalRequests.length ? (
                withdrawalRequests.map((request, index) => (
                  <tr key={request.requestId || index} className="hover:bg-gray-50">
                    <td className="px-3 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                          {request.instructorName || "Unknown"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{request.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-700 hidden sm:table-cell max-w-xs">
                      <div className="truncate" title={request.reason || "No remarks"}>
                        {request.reason?.trim() ? request.reason : "No remarks"}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {request.status.toLowerCase() === "rejected" && request.requestId && (
                        <Button
                          onClick={() => openRetryModal(request.requestId!, request.amount || 0)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1"
                        >
                          Retry
                        </Button>
                      )}
                      {request.status.toLowerCase() === "rejected" && !request.requestId && (
                        <span className="text-xs text-gray-400">No retry</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-8 text-center text-gray-500" colSpan={6}>
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p>No withdrawal requests found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination for Withdrawal Requests */}
        {withdrawalTotalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
            {Array.from({ length: withdrawalTotalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => fetchWithdrawalRequests(pageNum)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  pageNum === withdrawalPage
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}