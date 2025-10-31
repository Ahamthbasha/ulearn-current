import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, {
  type Column,
  type ActionButton,
  type PaginationProps,
} from '../../../components/AdminComponents/DataTable';
import { type adminCouponDto,type CouponWithIndex } from '../../../types/interfaces/IAdminInterface';
import {
  getCoupon,
  deleteCoupon,
  toggleStatus,
} from '../../../api/action/AdminActionApi';
import {
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { useDebounce } from '../../../hooks/UseDebounce';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

const CouponManagementPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponWithIndex[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const navigate = useNavigate();

  const limit = 5;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [couponToToggle, setCouponToToggle] = useState<CouponWithIndex | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<CouponWithIndex | null>(null);

  const debouncedSearchValue = useDebounce(searchValue, 500);

  /* -------------------------- API -------------------------- */
  const fetchCoupons = useCallback(
    async (page: number, searchCode?: string) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getCoupon(page, limit, searchCode);
        const couponsData: adminCouponDto[] = Array.isArray(data.coupons)
          ? data.coupons
          : [];
        
        // Add index for serial number
        const couponsWithIndex: CouponWithIndex[] = couponsData.map((coupon, idx) => ({
          ...coupon,
          _index: (page - 1) * limit + idx + 1
        }));
        
        setCoupons(couponsWithIndex);
        setTotalPages(Math.ceil((data.total ?? 0) / limit));
      }
      catch (err: unknown) {
  let message = 'Failed to fetch coupons';
  if (err instanceof Error) {
    message = err.message;
  }
  setError(message);
  setCoupons([]);
}

      finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchCoupons(currentPage, debouncedSearchValue);
  }, [currentPage, debouncedSearchValue, fetchCoupons]);

  /* ----------------------- Handlers ----------------------- */
  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setCurrentPage(1);
  };

  const handleRetry = () => fetchCoupons(currentPage, debouncedSearchValue);

  /* ---------------------- Toggle ----------------------- */
  const openToggleModal = (coupon: CouponWithIndex) => {
    setCouponToToggle(coupon);
    setIsModalOpen(true);
  };

  const confirmToggle = async () => {
    if (!couponToToggle) return;
    const newStatus = !couponToToggle.status;

    // Optimistic UI
    setCoupons((prev) =>
      prev.map((c) =>
        c.couponId === couponToToggle.couponId
          ? { ...c, status: newStatus }
          : c
      )
    );

    try {
      const updated = await toggleStatus(couponToToggle.couponId, newStatus);
      setCoupons((prev) =>
        prev.map((c) => (c.couponId === updated.couponId ? { ...updated, _index: c._index } : c))
      );
    }
    catch (err: unknown) {
  // Revert
  setCoupons((prev) =>
    prev.map((c) =>
      c.couponId === couponToToggle.couponId
        ? { ...c, status: couponToToggle.status }
        : c
    )
  );

  let message = 'Failed to toggle coupon status';
  if (err instanceof Error) {
    message = err.message;
  }
  setError(message);
}
    finally {
      setIsModalOpen(false);
      setCouponToToggle(null);
    }
  };

  /* ---------------------- Delete ----------------------- */
  const openDeleteModal = (coupon: CouponWithIndex) => {
    setCouponToDelete(coupon);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;

    try {
      await deleteCoupon(couponToDelete.couponId);
      setCoupons((prev) =>
        prev.filter((c) => c.couponId !== couponToDelete.couponId)
      );

      // If the page becomes empty, go back one page
      if (coupons.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } 
    catch (err: unknown) {
  let message = 'Failed to delete coupon';
  if (err instanceof Error) {
    message = err.message;
  }
  setError(message);
}
    finally {
      setIsModalOpen(false);
      setCouponToDelete(null);
    }
  };

  const cancelModal = () => {
    setIsModalOpen(false);
    setCouponToToggle(null);
    setCouponToDelete(null);
  };

  /* ----------------------- Columns ----------------------- */
  const columns: Column<CouponWithIndex>[] = [
    {
      key: '_index',
      title: 'S.No.',
      render: (value) => <span>{value as number}</span>,
      width: '8%',
    },
    {
      key: 'code',
      title: 'Coupon Code',
      render: (value) => (
        <span className="font-medium text-blue-600 uppercase">{value as string}</span>
      ),
      width: '20%',
    },
    {
      key: 'discount',
      title: 'Discount (%)',
      render: (value) => (
        <span className="font-semibold text-green-600">{value as number}%</span>
      ),
      width: '15%',
    },
    {
      key: 'minPurchase',
      title: 'Min Purchase',
      render: (value) => (
        <span className="text-gray-700">₹{(value as number).toLocaleString()}</span>
      ),
      width: '15%',
    },
    {
      key: 'maxDiscount',
      title: 'Max Discount',
      render: (value) => (
        <span className="text-gray-700">₹{(value as number).toLocaleString()}</span>
      ),
      width: '15%',
    },
    {
      key: 'expiryDate',
      title: 'Expiry Date',
      render: (value) => {
        const dateStr = value as string;
        const [day, month, year] = dateStr.split('-');
        const date = new Date(`${year}-${month}-${day}`);
        const isExpired = date < new Date();
        return (
          <span className={isExpired ? 'text-red-500' : 'text-gray-700'}>
            {dateStr}
            {isExpired && (
              <span className="text-xs block text-red-400">Expired</span>
            )}
          </span>
        );
      },
      width: '15%',
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => {
        const isActive = value as boolean;
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
      width: '12%',
    },
  ];

  /* ----------------------- Actions ----------------------- */
  const actions: ActionButton<CouponWithIndex>[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Pencil size={16} />,
      onClick: (c) => navigate(`/admin/coupons/edit/${c.couponId}`),
      className:
        'bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200',
    },
    {
      key: 'toggle',
      label: (c) => (c.status ? 'Deactivate' : 'Activate'),
      icon: (c) => (c.status ? <ToggleLeft size={16} /> : <ToggleRight size={16} />),
      onClick: openToggleModal,
      className: (c) =>
        c.status
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white transition-colors duration-200'
          : 'bg-green-500 hover:bg-green-600 text-white transition-colors duration-200',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: openDeleteModal,
      className:
        'bg-red-500 hover:bg-red-600 text-white transition-colors duration-200',
    },
  ];

  const pagination: PaginationProps = {
    currentPage,
    totalPages,
    onPageChange: handlePageChange,
  };

  /* -------------------------- JSX -------------------------- */
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DataTable<CouponWithIndex>
        data={coupons}
        columns={columns}
        loading={loading}
        error={error}
        title="Coupon Management"
        description="Manage your e‑learning platform's discount coupons"
        actions={actions}
        onRetry={handleRetry}
        emptyStateIcon={<X size={48} className="text-gray-400" />}
        emptyStateTitle="No Coupons Found"
        emptyStateDescription={
          searchValue
            ? `No coupons found matching "${searchValue}". Try adjusting your search term or create a new coupon.`
            : 'Start by creating your first discount coupon to attract more customers.'
        }
        pagination={pagination}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by coupon code..."
        leftSideHeaderContent={
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/coupons/add')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
            >
              Add Coupon
            </button>
            {searchValue && (
              <button
                onClick={handleClearSearch}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm"
              >
                Clear Search
              </button>
            )}
          </div>
        }
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title={couponToToggle ? 'TOGGLE COUPON STATUS' : 'DELETE COUPON'}
        message={
          couponToToggle
            ? `Are you sure you want to ${
                couponToToggle.status ? 'deactivate' : 'activate'
              } this coupon?`
            : couponToDelete
            ? 'Are you sure you want to delete this coupon? This action cannot be undone.'
            : ''
        }
        confirmText={
          couponToToggle
            ? couponToToggle.status
              ? 'Deactivate'
              : 'Activate'
            : 'Delete'
        }
        cancelText="Cancel"
        onConfirm={couponToToggle ? confirmToggle : confirmDelete}
        onCancel={cancelModal}
      />
    </div>
  );
};

export default CouponManagementPage;