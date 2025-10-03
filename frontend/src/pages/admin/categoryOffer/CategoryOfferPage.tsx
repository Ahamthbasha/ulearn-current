import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import DataTable, { type Column, type ActionButton } from "../../../components/AdminComponents/DataTable";
import type { ICategoryOffer } from "../../../types/interfaces/IAdminInterface";
import {
  getCategoryOffers,
  toggleCategoryOfferActive,
  deleteCategoryOffer,
} from "../../../api/action/AdminActionApi";
import { useDebounce } from "../../../hooks/UseDebounce"; 
import ConfirmationModal from "../../../components/common/ConfirmationModal";

const CategoryOfferPage: React.FC = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<ICategoryOffer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal visibility
  const [offerToToggle, setOfferToToggle] = useState<ICategoryOffer | null>(null); // Track the offer to toggle
  const [offerToDelete, setOfferToDelete] = useState<ICategoryOffer | null>(null); // Track the offer to delete

  const limit = 10;
  const debouncedSearch = useDebounce(search, 500);

  const fetchOffers = async (page: number, search?: string) => {
    setLoading(true);
    try {
      const response = await getCategoryOffers(page, limit, search);
      setOffers(response.data);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handleToggle = (offer: ICategoryOffer) => {
    setOfferToToggle(offer);
    setIsModalOpen(true);
  };

  const confirmToggle = async () => {
    if (offerToToggle) {
      try {
        await toggleCategoryOfferActive(offerToToggle._id);
        fetchOffers(currentPage, debouncedSearch);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsModalOpen(false);
        setOfferToToggle(null);
      }
    }
  };

  const handleDelete = (offer: ICategoryOffer) => {
    setOfferToDelete(offer);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (offerToDelete) {
      try {
        await deleteCategoryOffer(offerToDelete._id);
        fetchOffers(currentPage, debouncedSearch);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsModalOpen(false);
        setOfferToDelete(null);
      }
    }
  };

  const cancelAction = () => {
    setIsModalOpen(false);
    setOfferToToggle(null);
    setOfferToDelete(null);
  };

  const handleEdit = (offer: ICategoryOffer) => {
    navigate(`/admin/editCategoryOffer/${offer._id}`);
  };

  const columns: Column<ICategoryOffer>[] = [
    {
      key: "serialNo",
      title: "S.No.",
      render: (_value, _record, index) => (currentPage - 1) * limit + index + 1,
    },
    {
      key: "categoryId",
      title: "Category",
      render: (_value, record: ICategoryOffer) => record.categoryId.categoryName,
    },
    {
      key: "discountPercentage",
      title: "Discount (%)",
      render: (value: number) => `${value}%`,
    },
    {
      key: "startDate",
      title: "Start Date",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "endDate",
      title: "End Date",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "isActive",
      title: "Status",
      render: (value: boolean) => (
        <span className={value ? "text-green-500" : "text-red-500"}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const actions: ActionButton<ICategoryOffer>[] = [
    {
      key: "toggle",
      label: (record) => (record.isActive ? "Deactivate" : "Activate"),
      icon: (record) => (record.isActive ? <ToggleLeft size={18} /> : <ToggleRight size={18} />),
      onClick: handleToggle,
      className: (record) =>
        record.isActive
          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
          : "bg-green-500 hover:bg-green-600 text-white",
    },
    {
      key: "edit",
      label: "Edit",
      icon: <Edit2 size={18} />,
      onClick: handleEdit,
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 size={18} />,
      onClick: handleDelete,
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <DataTable
        data={offers}
        columns={columns}
        loading={loading}
        error={error}
        title="Category Offers"
        description="Manage category offers for your platform."
        actions={actions}
        onRetry={() => fetchOffers(currentPage, debouncedSearch)}
        emptyStateIcon={<div className="text-gray-400">📊</div>}
        emptyStateTitle="No Category Offers"
        emptyStateDescription="No category offers have been created yet."
        pagination={{
          currentPage,
          totalPages,
          onPageChange: (page) => setCurrentPage(page),
        }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search category offers..."
        leftSideHeaderContent={
          <button
            onClick={() => navigate("/admin/addCategoryOffer")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Add Category Offer
          </button>
        }
      />
      <ConfirmationModal
        isOpen={isModalOpen}
        message={
          offerToToggle
            ? `Are you sure you want to ${offerToToggle.isActive ? 'deactivate' : 'activate'} this category offer?`
            : offerToDelete
            ? 'Are you sure you want to delete this category offer? This action cannot be undone.'
            : ''
        }
        title={offerToToggle ? 'TOGGLE CATEGORY OFFER' : 'DELETE CATEGORY OFFER'}
        confirmText={offerToToggle ? (offerToToggle.isActive ? 'Deactivate' : 'Activate') : 'Delete'}
        cancelText="Cancel"
        onConfirm={offerToToggle ? confirmToggle : confirmDelete}
        onCancel={cancelAction}
      />
    </div>
  );
};

export default CategoryOfferPage;