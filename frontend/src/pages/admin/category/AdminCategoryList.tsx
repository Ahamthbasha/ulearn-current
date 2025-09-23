import { useEffect, useState, useCallback } from "react";
import { Pencil, ShieldX, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable, {
  type Column,
  type ActionButton,
} from "../../../components/AdminComponents/DataTable";
import {
  getAllCategories,
  toggleCategoryStatus,
} from "../../../api/action/AdminActionApi";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { useDebounce } from "../../../hooks/UseDebounce"; 

const AdminCategoryListPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const navigate = useNavigate();

  // ✅ Use debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ✅ Memoize fetchCategories to prevent unnecessary re-renders
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllCategories(currentPage, limit, debouncedSearchTerm);
      if (!response || !Array.isArray(response.data))
        throw new Error("Invalid category data received");
      setCategories(response.data);
      setTotal(response.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearchTerm]);

  // ✅ Effect depends on fetchCategories function
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModalForToggle = (record: any) => {
    setSelectedCategory(record);
    setModalOpen(true);
  };

  // ✅ Optimized toggle handler with local state update
  const handleConfirmToggle = async () => {
    if (selectedCategory) {
      try {
        // ✅ Optimistic update - Update UI immediately
        setCategories(prev => 
          prev.map(category => 
            category._id === selectedCategory._id 
              ? { ...category, isListed: !category.isListed }
              : category
          )
        );

        await toggleCategoryStatus(selectedCategory._id);
        
        // ✅ Optional: Refresh data to ensure consistency
        // fetchCategories();
        
      } catch (error) {
        console.error("Toggle failed:", error);
        
        // ✅ Revert optimistic update on error
        setCategories(prev => 
          prev.map(category => 
            category._id === selectedCategory._id 
              ? { ...category, isListed: !category.isListed }
              : category
          )
        );
        
        // ✅ Show error message if needed
        setError("Failed to update category status");
      } finally {
        setModalOpen(false);
        setSelectedCategory(null);
      }
    }
  };

  const handleCancelToggle = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };

  const handleAddCategory = () => {
    navigate("/admin/addCategory");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns: Column[] = [
    {
      key: "serialNo",
      title: "S.NO",
      render: (_value, _record, index) => (
        <span className="text-sm text-gray-900">
          {(currentPage - 1) * limit + index + 1}
        </span>
      ),
    },
    { key: "categoryName", title: "Category Name" },
    {
      key: "isListed",
      title: "Listed",
      render: (value) => (
        <span
          className={`inline-block px-2 py-1 text-xs rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  const actions: ActionButton[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (record) => navigate(`/admin/category/edit/${record._id}`),
    },
    {
      key: "toggle",
      label: (record) => (record.isListed ? "Unlist" : "List"),
      icon: (record) =>
        record.isListed ? (
          <ShieldX size={16} color="white" />
        ) : (
          <ShieldCheck size={16} color="white" />
        ),
      onClick: openModalForToggle,
      className: (record) =>
        record.isListed
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-red-500 hover:bg-red-600 text-white",
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <DataTable
        title="Categories"
        description="View, edit, or toggle category status."
        data={categories}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        onRetry={fetchCategories}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: handlePageChange,
        }}
        leftSideHeaderContent={
          <button
            onClick={handleAddCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Category
          </button>
        }
      />

      <ConfirmationModal
        isOpen={modalOpen}
        title="Confirm Action"
        message={`Do you want to ${
          selectedCategory?.isListed ? "unlist" : "list"
        } ${selectedCategory?.categoryName}?`}
        confirmText={selectedCategory?.isListed ? "Unlist" : "List"}
        cancelText="Cancel"
        onConfirm={handleConfirmToggle}
        onCancel={handleCancelToggle}
      />
    </>
  );
};

export default AdminCategoryListPage;