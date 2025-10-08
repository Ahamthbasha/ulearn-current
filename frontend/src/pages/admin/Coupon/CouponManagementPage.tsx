import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type Column, type ActionButton, type PaginationProps } from '../../../components/AdminComponents/DataTable';
import { type adminCouponDto } from "../../../types/interfaces/IAdminInterface"
import { getCoupon, deleteCoupon, toggleStatus } from '../../../api/action/AdminActionApi';
import { Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useDebounce } from '../../../hooks/UseDebounce';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

const CouponListPage: React.FC = () => {
  const [coupons, setCoupons] = useState<adminCouponDto[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const navigate = useNavigate();
  const limit = 5;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [couponToToggle, setCouponToToggle] = useState<adminCouponDto | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<adminCouponDto | null>(null);

  const debouncedSearchValue = useDebounce(searchValue, 500);

  const fetchCoupons = useCallback(async (page: number, searchCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCoupon(page, limit, searchCode);
      const couponsData = Array.isArray(response.data.coupons) ? response.data.coupons : [];
      setCoupons(couponsData);
      setTotalPages(Math.ceil((response.data.total || 0) / limit));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleToggleStatus = (coupon: adminCouponDto) => {
    setCouponToToggle(coupon);
    setIsModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (couponToToggle) {
      const newStatus = !couponToToggle.status;
      setCoupons((prev) =>
        prev.map((c) =>
          c.couponId === couponToToggle.couponId ? { ...c, status: newStatus } : c
        )
      );

      try {
        const updatedCoupon = await toggleStatus(couponToToggle.couponId, newStatus);
        setCoupons((prev) =>
          prev.map((c) => (c.couponId === updatedCoupon.couponId ? updatedCoupon : c))
        );
      } catch (err: any) {
        setCoupons((prev) =>
          prev.map((c) =>
            c.couponId === couponToToggle.couponId ? { ...c, status: couponToToggle.status } : c
          )
        );
        setError(err.message || 'Failed to toggle coupon status');
      } finally {
        setIsModalOpen(false);
        setCouponToToggle(null);
      }
    }
  };

  const handleDelete = (coupon: adminCouponDto) => {
    setCouponToDelete(coupon);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (couponToDelete) {
      try {
        await deleteCoupon(couponToDelete.couponId);
        setCoupons((prev) => prev.filter((c) => c.couponId !== couponToDelete.couponId));
        const remainingCoupons = coupons.length - 1;
        if (remainingCoupons === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete coupon');
      } finally {
        setIsModalOpen(false);
        setCouponToDelete(null);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setCurrentPage(1);
  };

  const handleRetry = () => {
    fetchCoupons(currentPage, debouncedSearchValue);
  };

  useEffect(() => {
    fetchCoupons(currentPage, debouncedSearchValue);
  }, [currentPage, debouncedSearchValue, fetchCoupons]);

  const columns: Column<adminCouponDto>[] = [
    {
      key: 'sno',
      title: 'S.No.',
      render: (_, __, index) => (currentPage - 1) * limit + index + 1,
      width: '8%',
    },
    {
      key: 'code',
      title: 'Coupon Code',
      render: (value: string) => (
        <span className="font-medium text-blue-600 uppercase">{value}</span>
      ),
      width: '20%',
    },
    {
      key: 'discount',
      title: 'Discount (%)',
      render: (value: number) => (
        <span className="font-semibold text-green-600">{value}%</span>
      ),
      width: '15%',
    },
    {
      key: 'minPurchase',
      title: 'Min Purchase',
      render: (value: number) => (
        <span className="text-gray-700">₹{value.toLocaleString()}</span>
      ),
      width: '15%',
    },
    {
      key: 'maxDiscount',
      title: 'Max Discount',
      render: (value: number) => (
        <span className="text-gray-700">₹{value.toLocaleString()}</span>
      ),
      width: '15%',
    },
    {
      key: 'expiryDate',
      title: 'Expiry Date',
      render: (value: string) => {
        const [day, month, year] = value.split('-');
        const date = new Date(`${year}-${month}-${day}`);
        const isExpired = date < new Date();
        return (
          <span className={`${isExpired ? 'text-red-500' : 'text-gray-700'}`}>
            {value}
            {isExpired && <span className="text-xs block text-red-400">Expired</span>}
          </span>
        );
      },
      width: '15%',
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
      width: '12%',
    },
  ];

  const actions: ActionButton<adminCouponDto>[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Pencil size={16} />,
      onClick: (coupon) => navigate(`/admin/coupons/edit/${coupon.couponId}`),
      className: 'bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200',
    },
    {
      key: 'toggle',
      label: (record: adminCouponDto) => (record.status ? 'Deactivate' : 'Activate'),
      icon: (record: adminCouponDto) => (record.status ? <ToggleLeft size={16} /> : <ToggleRight size={16} />),
      onClick: handleToggleStatus,
      className: (record: adminCouponDto) =>
        record.status
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white transition-colors duration-200'
          : 'bg-green-500 hover:bg-green-600 text-white transition-colors duration-200',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      className: 'bg-red-500 hover:bg-red-600 text-white transition-colors duration-200',
    },
  ];

  const pagination: PaginationProps = {
    currentPage,
    totalPages,
    onPageChange: handlePageChange,
  };

  const cancelAction = () => {
    setIsModalOpen(false);
    setCouponToToggle(null);
    setCouponToDelete(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DataTable
        data={coupons}
        columns={columns}
        loading={loading}
        error={error}
        title="Coupon Management"
        description="Manage your e-learning platform's discount coupons"
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
      <ConfirmationModal
        isOpen={isModalOpen}
        message={
          couponToToggle
            ? `Are you sure you want to ${couponToToggle.status ? 'deactivate' : 'activate'} this coupon?`
            : couponToDelete
            ? 'Are you sure you want to delete this coupon? This action cannot be undone.'
            : ''
        }
        title={couponToToggle ? 'TOGGLE COUPON STATUS' : 'DELETE COUPON'}
        confirmText={couponToToggle ? (couponToToggle.status ? 'Deactivate' : 'Activate') : 'Delete'}
        cancelText="Cancel"
        onConfirm={couponToToggle ? confirmToggleStatus : confirmDelete}
        onCancel={cancelAction}
      />
    </div>
  );
};

export default CouponListPage;