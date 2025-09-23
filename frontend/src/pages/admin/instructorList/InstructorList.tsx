import React, { useState, useCallback, useEffect } from "react";
import DataTable, {
  type Column,
  type ActionButton,
} from "../../../components/AdminComponents/DataTable";
import {
  getAllInstructor,
  blockInstructor,
} from "../../../api/action/AdminActionApi";
import { UserX, UserCheck, Users } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type Instructors } from "../interface/adminInterface";

const InstructorList: React.FC = () => {
  const [users, setUsers] = useState<Instructors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Increased limit for better UX
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructors | null>(null);

  // Debounced search term
  const debouncedSearch = useDebounce(search, 500);

  const fetchUsers = useCallback(async () => {
    console.log("🔄 Fetching instructors with:", { page, limit, search: debouncedSearch });
    try {
      setLoading(true);
      setError(null);
      const response = await getAllInstructor(page, limit, debouncedSearch);
      console.log("✅ instructorList.tsx:=>", response);

      if (!response || !Array.isArray(response.instructors)) {
        throw new Error("Invalid instructor data received");
      }

      // Map backend response to Instructors interface
      const formattedUsers: Instructors[] = response.instructors.map(
        (user: any) => ({
          id: user.id,
          username: user.name || "N/A",
          email: user.email || "N/A",
          status: user.status ? "Blocked" : "Active",
          created: user.createdAt || "N/A",
          isBlocked: user.status || false,
        })
      );

      setUsers(formattedUsers);
      setTotal(response.total);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch instructors";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleConfirm = async () => {
    if (!selectedInstructor) return;

    try {
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.email === selectedInstructor.email
            ? {
                ...u,
                status: u.status === "Blocked" ? "Active" : "Blocked",
                isBlocked: !u.isBlocked,
              }
            : u
        )
      );

      const response = await blockInstructor(selectedInstructor.email);

      if (response.success) {
        toast.success(response.message);
      } else {
        // Revert optimistic update
        setUsers((prev) =>
          prev.map((u) =>
            u.email === selectedInstructor.email
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
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.email === selectedInstructor.email
            ? {
                ...u,
                status: u.status === "Blocked" ? "Active" : "Blocked",
                isBlocked: !u.isBlocked,
              }
            : u
        )
      );
      toast.error(error.message || "Error occurred while blocking instructor");
    } finally {
      setConfirmModalOpen(false);
      setSelectedInstructor(null);
    }
  };

  const handleBlockToggle = useCallback((user: Instructors) => {
    setSelectedInstructor(user);
    setConfirmModalOpen(true);
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: Column<Instructors>[] = [
    {
      key: "serialNo",
      title: "S.NO",
      width: "60px",
      minWidth: "50px",
      hideOnMobile: false,
      render: (_, __, index) => (
        <span className="text-xs sm:text-sm text-gray-900 font-medium">
          {(page - 1) * limit + index + 1}
        </span>
      ),
    },
    {
      key: "username",
      title: "Name",
      minWidth: "100px", // Reduced for better fit
      hideOnMobile: false,
      render: (value) => (
        <div
          className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-[150px]"
          title={value}
        >
          {value}
        </div>
      ),
    },
    {
      key: "email",
      title: "Email",
      minWidth: "120px", // Reduced for better responsiveness
      hideOnMobile: false,
      render: (value) => (
        <div
          className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-[200px]"
          title={value}
        >
          {value}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "100px",
      minWidth: "80px",
      hideOnMobile: false,
      render: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
            value === "Blocked"
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "created",
      title: "Created",
      width: "100px", // Adjusted width
      minWidth: "80px", // Reduced for better fit
      hideOnMobile: false, // Ensure visibility on all devices
      render: (value) => (
        <span className="text-xs sm:text-sm text-gray-900 whitespace-nowrap">
          {value}
        </span>
      ),
    },
  ];

  const actions: ActionButton<Instructors>[] = [
    {
      key: "block-toggle",
      label: (user) =>
        user.status === "Blocked" ? "Unblock Instructor" : "Block Instructor",
      icon: (user) =>
        user.status === "Blocked" ? (
          <UserCheck size={16} />
        ) : (
          <UserX size={16} />
        ),
      onClick: handleBlockToggle,
      className: (user) =>
        user.status === "Blocked"
          ? "bg-red-500 hover:bg-red-600 text-white transition-colors"
          : "bg-green-500 hover:bg-green-600 text-white transition-colors",
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-2 sm:p-4 lg:p-6 min-h-screen bg-gray-50 overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <DataTable
          data={users}
          columns={columns}
          actions={actions}
          loading={loading}
          error={error}
          title="Instructor List"
          description="Manage and monitor all registered instructors"
          onRetry={fetchUsers}
          emptyStateIcon={<Users size={48} className="text-gray-300" />}
          emptyStateTitle="No instructors available"
          emptyStateDescription="No instructors have been registered yet."
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by name or email"
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: handlePageChange,
          }}
        />

        <ConfirmationModal
          isOpen={confirmModalOpen}
          title="CONFIRM ACTION"
          message={`Do you want to ${
            selectedInstructor?.status === "Blocked" ? "unblock" : "block"
          } ${selectedInstructor?.username}? This action will ${
            selectedInstructor?.status === "Blocked"
              ? "restore the instructor's access to their account and allow them to create courses"
              : "prevent the instructor from accessing their account and disable their courses"
          }.`}
          confirmText={
            selectedInstructor?.status === "Blocked"
              ? "Unblock Instructor"
              : "Block Instructor"
          }
          cancelText="Cancel"
          onCancel={() => setConfirmModalOpen(false)}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};

export default InstructorList;