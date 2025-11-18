import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EntityTable from '../../../components/common/EntityTable';
import type { LearningPathListDTO } from '../../../types/interfaces/IStudentInterface';
import {
  getStudentLearningPaths,
  deleteLearningPath,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isItemInWishlist,
  getCart,
} from '../../../api/action/StudentAction';
import { Search, Heart, ShoppingCart } from 'lucide-react';
import { useDebounce } from '../../../hooks/UseDebounce';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import type { EntityTableProps } from '../../../components/common/interface/commonComponent';
import { toast } from 'react-toastify';
import { isStudentLoggedIn } from '../../../utils/auth';
import { type CartItemDTO } from '../../../types/interfaces/IStudentInterface';
type ExtendedLearningPathListDTO = LearningPathListDTO & Record<string, unknown>;

const LearningPathListTable: React.FC = () => {
  const navigate = useNavigate();
  const [learningPaths, setLearningPaths] = useState<LearningPathListDTO[]>([]);
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
  const [totalItems, setTotalItems] = useState<number>(0);

  const debouncedSearch = useDebounce(search, 500);

  const fetchLearningPaths = useCallback(
    async (page: number, searchQuery?: string) => {
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
            acc[path.learningPathId] = cart.some(
              (item: CartItemDTO) => item.itemId === path.learningPathId && item.type === 'learningPath'
            );
            return acc;
          }, {} as Record<string, boolean>);
          setWishlistStates(newWishlistStates);
          setCartStates(newCartStates);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch learning paths';
        setError(errorMessage);
        setLearningPaths([]);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchLearningPaths(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchLearningPaths]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleAction = (
    action: 'delete' | 'view' | 'addToCart' | 'addToWishlist' | 'removeFromWishlist',
    id: string
  ) => {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add learning path to cart';
      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to wishlist';
      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      const res = await removeFromWishlist(itemId, 'learningPath');
      setWishlistStates((prev) => ({ ...prev, [itemId]: false }));
      toast.success(res.message || 'Removed from wishlist', { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from wishlist';
      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${modalAction} learning path`;
      setError(errorMessage);
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

  const handleEdit = (path: LearningPathListDTO) => {
    navigate(`/user/learningPath/edit/${path.learningPathId}`);
  };

  // Table Columns
  const tableColumns: EntityTableProps<ExtendedLearningPathListDTO>['columns'] = [
    {
      key: 'learningPathId',
      label: 'S.No.',
      render: (_value, record) => {
        const path = record as LearningPathListDTO;
        return <span>{(currentPage - 1) * limit + learningPaths.indexOf(path) + 1}</span>;
      },
    },
    {
      key: 'title',
      label: 'Title',
      render: (value) => (
        <span className="font-medium text-blue-600">{String(value)}</span>
      ),
    },
    {
      key: 'thumbnailUrl',
      label: 'Thumbnail',
      render: (value) => (
        value ? (
          <img src={String(value)} alt="Thumbnail" className="w-16 h-16 object-cover rounded" />
        ) : (
          <span className="text-gray-600">N/A</span>
        )
      ),
    },
    {
      key: 'learningPathId',
      label: 'Actions',
      render: (_value, record) => {
        const path = record as LearningPathListDTO;
        const isPurchased = path.isPurchased;

        return (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Always show View */}
            <button
              onClick={() => handleAction('view', path.learningPathId)}
              className="text-blue-600 hover:text-blue-700 font-medium py-1 px-2 rounded transition-colors"
            >
              View Details
            </button>

            {/* Purchased State */}
            {isPurchased ? (
              <span
                className="bg-green-100 text-green-800 font-semibold px-2.5 py-1 rounded-full text-xs"
                title="This learning path has been purchased"
              >
                Already Purchased
              </span>
            ) : (
              <>
                {/* Add to Cart */}
                {cartStates[path.learningPathId] ? (
                  <button
                    onClick={() => navigate('/user/cart')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-2 py-1 rounded flex items-center gap-1 transition-colors"
                  >
                    <ShoppingCart size={14} />
                    Go to Cart
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction('addToCart', path.learningPathId)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-2 py-1 rounded flex items-center gap-1 transition-colors"
                  >
                    <ShoppingCart size={14} />
                    Add to Cart
                  </button>
                )}

                {/* Wishlist */}
                <button
                  onClick={() =>
                    handleAction(
                      wishlistStates[path.learningPathId] ? 'removeFromWishlist' : 'addToWishlist',
                      path.learningPathId
                    )
                  }
                  className={`p-1.5 rounded-full transition-colors ${
                    wishlistStates[path.learningPathId]
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                  title={
                    wishlistStates[path.learningPathId]
                      ? 'Remove from Wishlist'
                      : 'Add to Wishlist'
                  }
                >
                  <Heart size={18} fill={wishlistStates[path.learningPathId] ? 'currentColor' : 'none'} />
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleEdit(path)}
                  className="text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleAction('delete', path.learningPathId)}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const tableData = learningPaths as ExtendedLearningPathListDTO[];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Learning Paths</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
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

      <EntityTable<ExtendedLearningPathListDTO>
        title=""
        data={tableData}
        columns={tableColumns}
        emptyText={
          search
            ? `No learning paths found matching "${search}". Try adjusting your search term or create a new learning path.`
            : 'Start by creating your first learning path to organize your courses.'
        }
        pagination={{
          currentPage,
          totalItems,
          pageSize: limit,
          onPageChange: setCurrentPage,
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
          <button onClick={handleRetry} className="ml-2 text-blue-500 hover:underline">
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningPathListTable;