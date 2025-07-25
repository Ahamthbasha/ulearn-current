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

interface Transaction {
  amount: number;
  type: "credit" | "debit";
  description: string;
  txnId: string;
  date: string;
}

interface Wallet {
  balance: number;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

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
    } catch {
      toast.error("Failed to load transactions");
    }
  };

  const handleAddMoney = async () => {
    try {
      if (!amount || amount < 1) return toast.warning("Enter valid amount");
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

  useEffect(() => {
    fetchWallet();
    fetchTransactions(1);
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">My Wallet</h1>

      {/* Wallet Balance */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <h2 className="text-3xl font-bold text-green-600">
              ₹{wallet?.balance.toFixed(2) || "0.00"}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <InputField
              type="number"
              placeholder="Enter amount"
              name="walletAmount"
              label="Add Amount"
              useFormik={false}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <Button onClick={handleAddMoney} disabled={loading}>
              {loading ? "Processing..." : "Add Money"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card title="Transaction History">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-200 rounded-md overflow-hidden">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length ? (
                transactions.map((txn, index) => (
                  <tr
                    key={index}
                    className={`border-b transition-all duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-indigo-50`}
                  >
                    <td className="py-3 px-4 text-blue-600 font-mono break-all">
                      {txn.txnId}
                    </td>
                    <td className="py-3 px-4 capitalize font-medium">
                      {txn.type}
                    </td>
                    <td
                      className={`py-3 px-4 font-semibold ${
                        txn.type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{txn.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">{txn.description}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(txn.date).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="py-4 px-4 text-center text-gray-500"
                    colSpan={5}
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchTransactions(page)}
                className={`px-3 py-1 rounded-md border ${
                  page === currentPage
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-indigo-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
