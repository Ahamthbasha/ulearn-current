import React, { useEffect, useState, useCallback } from "react";
import { UserX, UserCheck, Users } from "lucide-react";
import DataTable, {
  type Column,
  type ActionButton,
} from "../../../components/AdminComponents/DataTable";
import { getAllUser, blockUser } from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type UserListing } from "../interface/adminInterface";

const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Adjusted limit for better UX
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListing | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUser(page, limit, debouncedSearch);

      // Validate response structure
      if (!data || !data.success) {
        throw new Error(data?.message || "Failed to fetch users");
      }

      if (!Array.isArray(data.users)) {
        throw new Error("Invalid user data format received");
      }

      const formattedUsers: UserListing[] = data.users.map(
        (user: any, index: number) => ({
          id: user._id || `user-${index}`,
          username: user.name || "Unknown User",
          email: user.email || "No email provided",
          status: user.status ? "Blocked" : "Active",
          created: user.createdAt || "N/A",
          isBlocked: user.status || false,
        })
      );

      setUsers(formattedUsers);
      setTotal(data.total || data.users.length);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch users";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;

    try {
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.email === selectedUser.email
            ? {
                ...u,
                status: u.status === "Blocked" ? "Active" : "Blocked",
                isBlocked: !u.isBlocked,
              }
            : u
        )
      );

      const response = await blockUser(selectedUser.email);

      if (response.success) {
        toast.success(response.message);
      } else {
        // Revert optimistic update
        setUsers((prev) =>
          prev.map((u) =>
            u.email === selectedUser.email
              ? {
                  ...u,
                  status: u.status === "Blocked" ? "Active" : "Blocked",
                  isBlocked: !u.isBlocked,
                }
              : u
          )
        );
        toast.error(response.message);
      }
    } catch (error: any) {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u.email === selectedUser.email
            ? {
                ...u,
                status: u.status === "Blocked" ? "Active" : "Blocked",
                isBlocked: !u.isBlocked,
              }
            : u
        )
      );
      toast.error(error.message || "Error occurred while blocking user");
    } finally {
      setConfirmModalOpen(false);
      setSelectedUser(null);
    }
  };

  const actions: ActionButton<UserListing>[] = [
    {
      key: "block-toggle",
      label: (user) =>
        user.status === "Blocked" ? "Unblock User" : "Block User",
      icon: (user) =>
        user.status === "Blocked" ? (
          <UserCheck size={16} />
        ) : (
          <UserX size={16} />
        ),
      onClick: (user) => {
        setSelectedUser(user);
        setConfirmModalOpen(true);
      },
      className: (user) =>
        user.status === "Blocked"
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-red-500 hover:bg-red-600 text-white",
    },
  ];

  const formatDate = (dateString: string) => {
    if (dateString === "N/A") return dateString;
    // Assuming backend returns DD-MM-YYYY format, display as-is
    return dateString;
  };

  const columns: Column<UserListing>[] = [
    {
      key: "serialNo",
      title: "S.NO",
      minWidth: "60px",
      priority: 1,
      render: (_, __, index) => (
        <span className="text-sm font-medium text-gray-900">
          {(page - 1) * limit + index + 1}
        </span>
      ),
    },
    {
      key: "username",
      title: "Name",
      minWidth: "100px", // Reduced minWidth for better fit on smaller screens
      priority: 2,
      render: (value) => (
        <div
          className="text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-[150px]"
          title={value}
        >
          {value}
        </div>
      ),
    },
    {
      key: "email",
      title: "Email",
      minWidth: "150px", // Reduced minWidth for better responsiveness
      priority: 3,
      render: (value) => (
        <div
          className="text-sm text-gray-700 truncate max-w-[150px] sm:max-w-[200px]"
          title={value}
        >
          {value}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      minWidth: "80px", // Reduced minWidth
      priority: 4,
      render: (value) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
            value === "Blocked"
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-green-100 text-green-800 border border-green-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              value === "Blocked" ? "bg-red-500" : "bg-green-500"
            }`}
          ></span>
          {value}
        </span>
      ),
    },
    {
      key: "created",
      title: "Created",
      minWidth: "80px", // Reduced minWidth for better fit
      priority: 5,
      // Removed hideOnMobile to ensure visibility on all devices
      render: (value) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDate(value)}
        </span>
      ),
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="w-full overflow-x-auto">
      <DataTable
        data={users}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        title="User Management"
        description="Manage and monitor all registered users in the system"
        onRetry={fetchUsers}
        emptyStateIcon={<Users size={48} className="text-gray-400" />}
        emptyStateTitle="No users found"
        emptyStateDescription="No users have been registered yet or match your search criteria."
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or email..."
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          onPageChange: handlePageChange,
        }}
      />

      <ConfirmationModal
        isOpen={confirmModalOpen}
        title={selectedUser?.status === "Blocked" ? "UNBLOCK USER" : "BLOCK USER"}
        message={
          <div className="text-center space-y-3">
            <p className="text-gray-300">
              Are you sure you want to{" "}
              <span className="font-semibold text-white">
                {selectedUser?.status === "Blocked" ? "unblock" : "block"}
              </span>{" "}
              <span className="font-semibold text-blue-400">
                {selectedUser?.username}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-400">
              This will{" "}
              {selectedUser?.status === "Blocked"
                ? "restore the user's access to their account and all features"
                : "prevent the user from accessing their account and using the platform"}
              .
            </p>
          </div>
        }
        confirmText={
          selectedUser?.status === "Blocked" ? "Yes, Unblock" : "Yes, Block"
        }
        cancelText="Cancel"
        onCancel={() => {
          setConfirmModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default UserList;