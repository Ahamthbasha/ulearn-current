import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EntityTable from '../../../components/common/EntityTable';
import type { LearningPathListDTO } from '../../../types/interfaces/IStudentInterface';
import { getStudentLearningPaths, deleteLearningPath, addToCart, addToWishlist, removeFromWishlist, isItemInWishlist, getCart } from '../../../api/action/StudentAction';
import { Search } from 'lucide-react';
import { useDebounce } from '../../../hooks/UseDebounce';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import type { EntityTableProps } from '../../../components/common/interface/commonComponent';
import { toast } from 'react-toastify';
import { isStudentLoggedIn } from '../../../utils/auth';
import { Heart, ShoppingCart } from 'lucide-react';
import { type CartItemDTO } from '../../../types/interfaces/IStudentInterface';

const LearningPathListTable: React.FC = () => {
  const navigate = useNavigate();
  const [learningPaths, setLearningPaths] = useState<LearningPathListDTO[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<'delete' | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [wishlistStates, setWishlistStates] = useState<Record<string, boolean>>({});
  const [cartStates, setCartStates] = useState<Record<string, boolean>>({});

  const debouncedSearch = useDebounce(search, 500);

  const fetchLearningPaths = useCallback(async (page: number, searchQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStudentLearningPaths(page, limit, searchQuery);
      const pathsData = Array.isArray(response.data) ? response.data : [];
      setLearningPaths(pathsData);
      setTotalItems(response.total || 0);

      if (isStudentLoggedIn()) {
        // Fetch wishlist and cart status
        const wishlistChecks = await Promise.all(
          pathsData.map((path) => isItemInWishlist(path.learningPathId, 'learningPath'))
        );
        const cart = await getCart();
        const newWishlistStates = pathsData.reduce((acc, path, index) => {
          acc[path.learningPathId] = wishlistChecks[index].exists || false;
          return acc;
        }, {} as Record<string, boolean>);
        const newCartStates = pathsData.reduce((acc, path) => {
          acc[path.learningPathId] = cart.some((item: CartItemDTO) => item.itemId === path.learningPathId && item.type === 'learningPath');
          return acc;
        }, {} as Record<string, boolean>);
        setWishlistStates(newWishlistStates);
        setCartStates(newCartStates);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch learning paths');
      setLearningPaths([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLearningPaths(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchLearningPaths]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleAction = (action: 'delete' | 'view' | 'addToCart' | 'addToWishlist' | 'removeFromWishlist', id: string) => {
    if (action === 'delete') {
      setModalAction(action);
      setSelectedPathId(id);
      setIsModalOpen(true);
    } else if (action === 'view') {
      navigate(`/user/learningPathDetails/${id}`);
    } else if (action === 'addToCart') {
      handleAddToCart(id);
    } else if (action === 'addToWishlist') {
      handleAddToWishlist(id);
    } else if (action === 'removeFromWishlist') {
      handleRemoveFromWishlist(id);
    }
  };

  const handleAddToCart = async (itemId: string) => {
    if (!isStudentLoggedIn()) {
      toast.info('Please log in to add learning paths to your cart');
      return;
    }

    try {
      await addToCart(itemId, 'learningPath');
      setCartStates((prev) => ({ ...prev, [itemId]: true }));
      toast.success('Learning path added to cart!', { position: 'top-right', autoClose: 3000 });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add learning path to cart', { position: 'top-right', autoClose: 5000 });
    }
  };

  const handleAddToWishlist = async (itemId: string) => {
    if (!isStudentLoggedIn()) {
      toast.info('Please log in to use the wishlist');
      return;
    }

    try {
      const res = await addToWishlist(itemId, 'learningPath');
      setWishlistStates((prev) => ({ ...prev, [itemId]: true }));
      toast.success(res.message || 'Added to wishlist', { position: 'top-right', autoClose: 3000 });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to wishlist', { position: 'top-right', autoClose: 5000 });
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      const res = await removeFromWishlist(itemId, 'learningPath');
      setWishlistStates((prev) => ({ ...prev, [itemId]: false }));
      toast.success(res.message || 'Removed from wishlist', { position: 'top-right', autoClose: 3000 });
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove from wishlist', { position: 'top-right', autoClose: 5000 });
    }
  };

  const confirmAction = async () => {
    if (!selectedPathId || !modalAction) return;
    try {
      if (modalAction === 'delete') {
        await deleteLearningPath(selectedPathId);
        setLearningPaths((prev) => prev.filter((path) => path.learningPathId !== selectedPathId));
        if (learningPaths.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }
      fetchLearningPaths(currentPage, debouncedSearch);
    } catch (err: any) {
      setError(err.message || `Failed to ${modalAction} learning path`);
    } finally {
      setIsModalOpen(false);
      setModalAction(null);
      setSelectedPathId(null);
    }
  };

  const cancelAction = () => {
    setIsModalOpen(false);
    setModalAction(null);
    setSelectedPathId(null);
  };

  const handleRetry = () => {
    fetchLearningPaths(currentPage, debouncedSearch);
  };

  const columns: EntityTableProps<LearningPathListDTO>['columns'] = [
    {
      key: 'learningPathId' as keyof LearningPathListDTO,
      label: 'S.No.',
      render: (_value: any, record: LearningPathListDTO) => (
        <span>{(currentPage - 1) * limit + learningPaths.indexOf(record) + 1}</span>
      ),
    },
    {
      key: 'title' as keyof LearningPathListDTO,
      label: 'Title',
      render: (value: string) => (
        <span className="font-medium text-blue-600">{value}</span>
      ),
    },
    {
      key: 'thumbnailUrl' as keyof LearningPathListDTO,
      label: 'Thumbnail',
      render: (value: string | undefined) => (
        value ? (
          <img src={value} alt="Thumbnail" className="w-16 h-16 object-cover rounded" />
        ) : (
          <span className="text-gray-600">N/A</span>
        )
      ),
    },
    {
      key: 'learningPathId' as keyof LearningPathListDTO,
      label: 'Actions',
      render: (_value: any, record: LearningPathListDTO) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleAction('view', record.learningPathId)}
            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium py-1 px-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Details
          </button>
          {cartStates[record.learningPathId] ? (
            <button
              onClick={() => navigate('/user/cart')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs sm:text-sm font-medium px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={false} // No loading state here, adjust if needed
            >
              <ShoppingCart size={16} />
              Go to Cart
            </button>
          ) : (
            <button
              onClick={() => handleAction('addToCart', record.learningPathId)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={false} // No loading state here, adjust if needed
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          )}
          <button
            onClick={() => handleAction(wishlistStates[record.learningPathId] ? 'removeFromWishlist' : 'addToWishlist', record.learningPathId)}
            className={`text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 ${wishlistStates[record.learningPathId] ? 'text-red-500 hover:text-red-600' : ''}`}
            title={wishlistStates[record.learningPathId] ? 'Remove from Wishlist' : 'Add to Wishlist'}
            disabled={false} // No loading state here, adjust if needed
          >
            <Heart size={20} fill={wishlistStates[record.learningPathId] ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => handleAction('delete', record.learningPathId)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => handleEdit(record)}
            className="text-yellow-500 hover:text-yellow-700 text-sm"
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  const handleEdit = (path: LearningPathListDTO) => {
    navigate(`/user/learningPath/edit/${path.learningPathId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Learning Paths</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-64">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search learning paths..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-3 py-2 rounded-lg border-2 border-gray-300 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              />
            </div>
          </div>
          <button
            onClick={() => navigate('/user/learningPath/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm w-full sm:w-auto"
          >
            Create New
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      )}
      <EntityTable<LearningPathListDTO>
        title=""
        data={learningPaths}
        columns={columns}
        
        emptyText={
          search
            ? `No learning paths found matching "${search}". Try adjusting your search term or create a new learning path.`
            : 'Start by creating your first learning path to organize your courses.'
        }
        pagination={{
          currentPage,
          totalItems,
          pageSize: limit,
          onPageChange: handlePageChange,
        }}
      />
      <ConfirmationModal
        isOpen={isModalOpen}
        message="Are you sure you want to delete this learning path? This action cannot be undone."
        title="DELETE LEARNING PATH"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
      {error && (
        <div className="mt-4 text-red-500 text-sm text-center">
          {error}
          <button
            onClick={handleRetry}
            className="ml-2 text-blue-500 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningPathListTable;