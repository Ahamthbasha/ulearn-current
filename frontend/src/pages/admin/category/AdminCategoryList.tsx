import { useEffect, useState } from 'react';
import { Pencil, ShieldX, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type Column, type ActionButton } from '../../../components/AdminComponents/DataTable';
import { getAllCategories, toggleCategoryStatus } from '../../../api/action/AdminActionApi';
import ConfirmationModal from '../../../components/common/ConfirmationModal'; // ✅ Import it

const AdminCategoryListPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(5); // ✅ Adjusted limit
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const navigate = useNavigate();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getAllCategories(currentPage, limit, searchTerm);
      if (!response || !Array.isArray(response.data)) throw new Error("Invalid category data received");
      setCategories(response.data);
      setTotal(response.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm]);

  const openModalForToggle = (record: any) => {
    setSelectedCategory(record);
    setModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (selectedCategory) {
      try {
        await toggleCategoryStatus(selectedCategory._id);
        fetchCategories();
      } catch (error) {
        console.error(error);
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
    navigate('/admin/addCategory');
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
      key: 'serialNo',
      title: 'S.NO',
      render: (_value, _record, index) => (
        <span className="text-sm text-gray-900">
          {(currentPage - 1) * limit + index + 1}
        </span>
      ),
    },
    { key: 'categoryName', title: 'Category Name' },
    {
      key: 'isListed',
      title: 'Listed',
      render: (value) => (
        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  const actions: ActionButton[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Pencil size={16} />,
      onClick: (record) => navigate(`/admin/category/edit/${record._id}`),
    },
    {
      key: 'toggle',
      label: (record) => (record.isListed ? 'Unlist' : 'List'),
      icon: (record) => (record.isListed ? <ShieldX size={16} /> : <ShieldCheck size={16} />),
      onClick: openModalForToggle, // ✅ Trigger modal instead
      className: (record) =>
        record.isListed
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-green-500 hover:bg-green-600 text-white',
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

      {/* ✅ Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        title="Confirm Action"
        message={`Do you want to ${selectedCategory?.isListed ? 'unlist' : 'list'} ${selectedCategory?.categoryName}?`}
        confirmText={selectedCategory?.isListed ? 'Unlist' : 'List'}
        cancelText="Cancel"
        onConfirm={handleConfirmToggle}
        onCancel={handleCancelToggle}
      />
    </>
  );
};

export default AdminCategoryListPage;
