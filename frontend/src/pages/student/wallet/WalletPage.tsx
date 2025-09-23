import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getWallet,
  createWalletRechargeOrder,
  verifyPayment,
  walletTransactionHistory,
} from "../../../api/action/StudentAction";
import Card from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import InputField from "../../../components/common/InputField";

import { type Transaction, type Wallet } from "../interface/studentInterface";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const limit = 5;

  // Date formatting function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = hours.toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  // Format date for mobile (shorter version)
  const formatDateMobile = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const fetchWallet = async () => {
    try {
      const data = await getWallet();
      setWallet(data.wallet);
    } catch (error) {
      toast.error("Failed to load wallet");
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      const res = await walletTransactionHistory(page, limit);
      setTransactions(res.data.transactions);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
      setTotalTransactions(res.data.total || res.data.transactions.length);
    } catch {
      toast.error("Failed to load transactions");
    }
  };

  const handleAddMoney = async () => {
    try {
      if (!amount || amount < 1) return toast.warning("Enter valid amount (minimum ₹1)");
      if (amount > 50000) return toast.warning("Maximum amount allowed is ₹50,000");
      
      setLoading(true);

      const orderData = await createWalletRechargeOrder({ amount });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: "INR",
        name: "uLearn Wallet",
        description: "Wallet Recharge",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
            });
            toast.success("Wallet recharged successfully");
            setAmount(0);
            fetchWallet();
            fetchTransactions(1);
          } catch {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      toast.error("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  // Quick amount selection
  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount);
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions(1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-sm text-gray-500 hidden sm:block">Manage your wallet balance and transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Balance Display */}
              <div className="text-center sm:text-left">
                <p className="text-green-100 text-sm sm:text-base font-medium">Current Balance</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2">
                  ₹{wallet?.balance.toFixed(2) || "0.00"}
                </h2>
              </div>

              {/* Quick Stats - Hidden on mobile */}
              <div className="hidden lg:flex bg-white/10 rounded-lg p-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{totalTransactions}</div>
                  <div className="text-green-100 text-sm">Total Transactions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Money Section */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Money to Wallet
            </h3>

            <div className="space-y-6">
              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Quick Select</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => handleQuickAmount(quickAmount)}
                      className={`p-2 sm:p-3 text-sm sm:text-base font-medium rounded-lg border-2 transition-all ${
                        amount === quickAmount
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      ₹{quickAmount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <InputField
                    type="number"
                    placeholder="Enter custom amount"
                    name="walletAmount"
                    label="Custom Amount"
                    useFormik={false}
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
          
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum: ₹1, Maximum: ₹50,000</p>
                </div>
                <div>
                  <Button 
                    onClick={handleAddMoney} 
                    disabled={loading || !amount || amount < 1}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Add Money"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <Card>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Transaction History
              </h3>
              <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                {transactions.length > 0 && `Showing ${transactions.length} of ${totalTransactions} transactions`}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length ? (
                    transactions.map((txn, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {txn.txnId.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            txn.type === "credit"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {txn.type === "credit" ? "+" : "-"} {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                          </span>
                        </td>
                        <td className={`py-4 px-6 font-semibold ${
                          txn.type === "credit" ? "text-green-600" : "text-red-600"
                        }`}>
                          ₹{txn.amount.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-gray-900">{txn.description}</td>
                        <td className="py-4 px-6 text-gray-500">{formatDate(txn.date)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-12 px-6 text-center text-gray-500" colSpan={5}>
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium">No transactions found</p>
                          <p className="text-sm">Your transaction history will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {transactions.length ? (
                transactions.map((txn, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        txn.type === "credit"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {txn.type === "credit" ? "+" : "-"} {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      </span>
                      <span className={`text-lg font-semibold ${
                        txn.type === "credit" ? "text-green-600" : "text-red-600"
                      }`}>
                        ₹{txn.amount.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Transaction ID</p>
                        <p className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                          {txn.txnId.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="text-sm font-medium text-gray-900">{txn.description}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Date & Time</p>
                        <p className="text-sm text-gray-500">{formatDateMobile(txn.date)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900">No transactions found</p>
                  <p className="text-sm text-gray-500">Your transaction history will appear here</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchTransactions(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchTransactions(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            pageNum === currentPage
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => fetchTransactions(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}