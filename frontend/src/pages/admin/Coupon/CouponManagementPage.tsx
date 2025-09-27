import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type Column, type ActionButton, type PaginationProps } from '../../../components/AdminComponents/DataTable';
import { type ICoupon } from '../../../types/interfaces/IAdminInterface';
import { getCoupon, deleteCoupon, toggleStatus } from '../../../api/action/AdminActionApi';
import { Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useDebounce } from '../../../hooks/UseDebounce';

const CouponListPage: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const navigate = useNavigate();
  const limit = 5;


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

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle delete with proper error handling and UI updates
  const handleDelete = async (coupon: ICoupon) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(coupon._id);
        
        // Remove the deleted coupon from local state
        setCoupons((prev) => prev.filter((c) => c._id !== coupon._id));
        
        // Check if current page becomes empty after deletion
        const remainingCoupons = coupons.length - 1;
        if (remainingCoupons === 0 && currentPage > 1) {
          // If current page is empty and not the first page, go to previous page
          const newPage = currentPage - 1;
          setCurrentPage(newPage);
        } else if (remainingCoupons === 0) {
          // If we're on the first page and no coupons left, will be handled by useEffect
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete coupon');
      }
    }
  };

  // Handle toggle status with optimistic updates
  const handleToggleStatus = async (coupon: ICoupon) => {
    // Optimistic update
    const newStatus = !coupon.status;
    setCoupons((prev) =>
      prev.map((c) => 
        c._id === coupon._id 
          ? { ...c, status: newStatus } 
          : c
      )
    );

    try {
      const updatedCoupon = await toggleStatus(coupon._id, newStatus);
      // Update with server response
      setCoupons((prev) =>
        prev.map((c) => (c._id === updatedCoupon._id ? updatedCoupon : c))
      );
    } catch (err: any) {
      // Revert optimistic update on error
      setCoupons((prev) =>
        prev.map((c) => 
          c._id === coupon._id 
            ? { ...c, status: coupon.status } 
            : c
        )
      );
      setError(err.message || 'Failed to toggle coupon status');
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchValue('');
    setCurrentPage(1);
  };

  // Retry function for error handling
  const handleRetry = () => {
    fetchCoupons(currentPage, debouncedSearchValue);
  };

  // Effect to fetch data when debounced search value changes or page changes
  useEffect(() => {
    fetchCoupons(currentPage, debouncedSearchValue);
  }, [currentPage, debouncedSearchValue, fetchCoupons]);

  // Define table columns with improved rendering
  const columns: Column<ICoupon>[] = [
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
        <span className="text-gray-700">₹{value?.toLocaleString() || '0'}</span>
      ),
      width: '15%',
    },
    {
      key: 'maxDiscount',
      title: 'Max Discount',
      render: (value: number) => (
        <span className="text-gray-700">₹{value?.toLocaleString() || '0'}</span>
      ),
      width: '15%',
    },
    {
      key: 'expiryDate',
      title: 'Expiry Date',
      render: (value: string) => {
        const date = new Date(value);
        const isExpired = date < new Date();
        return (
          <span className={`${isExpired ? 'text-red-500' : 'text-gray-700'}`}>
            {date.toLocaleDateString()}
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
      width: '12%',
    },
  ];

  // Define action buttons with improved styling
  const actions: ActionButton<ICoupon>[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Pencil size={16} />,
      onClick: (coupon) => navigate(`/admin/coupons/edit/${coupon._id}`),
      className: 'bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200',
    },
    {
      key: 'toggle',
      label: (record: ICoupon) => (record.status ? 'Deactivate' : 'Activate'),
      icon: (record: ICoupon) => (record.status ? <ToggleLeft size={16} /> : <ToggleRight size={16} />),
      onClick: handleToggleStatus,
      className: (record: ICoupon) =>
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

  // Pagination props
  const pagination: PaginationProps = {
    currentPage,
    totalPages,
    onPageChange: handlePageChange,
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
            : "Start by creating your first discount coupon to attract more customers."
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
    </div>
  );
};

export default CouponListPage;