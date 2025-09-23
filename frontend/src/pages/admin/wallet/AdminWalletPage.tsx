import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getWallet,
  createWalletRechargeOrder,
  verifyPayment,
  adminWalletTransactionHistory,
} from "../../../api/action/AdminActionApi";
import Card from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import InputField from "../../../components/common/InputField";
import { type Wallet, type Transaction } from "../interface/adminInterface";


export default function AdminWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingTransactions, setFetchingTransactions] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const fetchWallet = async () => {
    try {
      const data = await getWallet();
      setWallet(data.wallet);
    } catch (error) {
      toast.error("Failed to load wallet", { autoClose: 3000 });
    }
  };

  const fetchTransactions = async (page = 1) => {
    setFetchingTransactions(true);
    try {
      const res = await adminWalletTransactionHistory(page, limit);
      setTransactions(res.data.transactions);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error("Failed to load transactions", { autoClose: 3000 });
    } finally {
      setFetchingTransactions(false);
    }
  };

  const handleAddMoney = async () => {
    if (!amount || amount < 1) return toast.warning("Enter a valid amount", { autoClose: 3000 });

    try {
      setLoading(true);
      const orderData = await createWalletRechargeOrder({ amount });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: "INR",
        name: "uLearn Admin Wallet",
        description: "Wallet Recharge",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyData = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
            });

            console.log("✅ Admin Wallet Verified:", verifyData);
            toast.success("Wallet recharged successfully", { autoClose: 3000 });
            setAmount(0);
            fetchWallet();
            fetchTransactions(1);
          } catch (err) {
            toast.error("Payment verification failed", { autoClose: 3000 });
          }
        },
        theme: { color: "#9333ea" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Failed to initiate payment", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions(1);
  }, []);

  // Generate pagination buttons (show current, ±2, first, last on mobile)
  const getPaginationButtons = () => {
    const maxButtons = 5; // Limit for mobile
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-[50vh] bg-gray-50">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">Admin Wallet</h1>

      {/* Wallet Balance Card */}
      <Card
        className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-100"
        withShadow
        padded
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Current Balance</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
              ₹{wallet?.balance.toFixed(2) || "0.00"}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center w-full sm:w-auto">
            <div className="w-full sm:w-40">
              <InputField
                type="number"
                placeholder="Enter amount"
                name="walletAmount"
                label="Add Amount"
                useFormik={false}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                // Removed className to avoid TS2322; styling handled by wrapper
              />
            </div>
            <Button
              onClick={handleAddMoney}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-purple-500"
            >
              {loading ? "Processing..." : "Add Money"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions */}
      <Card
        title="Transaction History"
        className="bg-gradient-to-r from-gray-50 to-blue-50/20 border border-gray-100"
        withShadow
        padded
      >
        {fetchingTransactions ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-purple-600 border-t-transparent" />
            <p className="ml-3 text-sm sm:text-base text-gray-600">Loading transactions...</p>
          </div>
        ) : (
          <>
            {/* Desktop: Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm text-left border border-gray-200 rounded-md">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="py-2 sm:py-3 px-2 sm:px-4">Txn ID</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4">Type</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4">Amount</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4">Description</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length ? (
                    transactions.map((txn, index) => (
                      <tr
                        key={txn.txnId}
                        className={`border-b transition-all duration-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-purple-50`}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-blue-600 font-mono truncate max-w-[100px] sm:max-w-[150px]">
                          {txn.txnId}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 capitalize font-medium">
                          {txn.type}
                        </td>
                        <td
                          className={`py-2 sm:py-3 px-2 sm:px-4 font-semibold ${
                            txn.type === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ₹{txn.amount.toFixed(2)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 truncate max-w-[120px] sm:max-w-[200px]">
                          {txn.description}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-500 text-xs sm:text-sm">
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }).format(new Date(txn.date))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-4 px-4 text-center text-gray-500" colSpan={5}>
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card View */}
            <div className="block sm:hidden space-y-3">
              {transactions.length ? (
                transactions.map((txn) => (
                  <div
                    key={txn.txnId}
                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:bg-purple-50 transition-all duration-200"
                  >
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Txn ID: </span>
                        <span className="text-blue-600 font-mono break-all">{txn.txnId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type: </span>
                        <span className="capitalize font-medium">{txn.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Amount: </span>
                        <span
                          className={`font-semibold ${
                            txn.type === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ₹{txn.amount.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Description: </span>
                        <span className="text-gray-600">{txn.description}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date: </span>
                        <span className="text-gray-500">
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }).format(new Date(txn.date))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No transactions found.
                </div>
              )}
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 sm:gap-2 mt-4 flex-wrap">
            {getPaginationButtons().map((pageNum, index) =>
              pageNum === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                  aria-hidden="true"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => fetchTransactions(Number(pageNum))}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md border text-sm sm:text-base ${
                    pageNum === currentPage
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-purple-50 hover:border-purple-400"
                  } transition-all duration-200 focus:ring-2 focus:ring-purple-500`}
                  aria-label={`Go to page ${pageNum}`}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>
        )}
      </Card>
    </div>
  );
}