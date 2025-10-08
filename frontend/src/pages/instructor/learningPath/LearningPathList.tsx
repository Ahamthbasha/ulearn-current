import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorDataTable from '../../../components/InstructorComponents/InstructorDataTable';
import type { LearningPathListDTO } from '../../../types/interfaces/IInstructorInterface';
import { getInstructorLearningPaths, deleteLearningPath, submitLearningPathVerification, resubmitLearningPathVerification } from '../../../api/action/InstructorActionApi';
import { Eye, Pencil, Trash2, Send, RotateCcw, X, Search } from 'lucide-react';
import { useDebounce } from '../../../hooks/UseDebounce';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import type { Column, ActionButton } from '../../../components/InstructorComponents/interface/instructorComponentInterface';

const LearningPathListPage: React.FC = () => {
  const navigate = useNavigate();
  const [learningPaths, setLearningPaths] = useState<LearningPathListDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<'delete' | 'submit' | 'resubmit' | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const fetchLearningPaths = useCallback(async (page: number, searchQuery?: string, statusFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInstructorLearningPaths(page, limit, searchQuery, statusFilter);
      const pathsData = Array.isArray(response.data) ? response.data : [];
      setLearningPaths(pathsData);
      setTotalPages(Math.ceil((response.total || 0) / limit));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch learning paths');
      setLearningPaths([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLearningPaths(currentPage, debouncedSearch, status);
  }, [currentPage, debouncedSearch, status, fetchLearningPaths]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleAction = (action: 'delete' | 'submit' | 'resubmit', id: string) => {
    setModalAction(action);
    setSelectedPathId(id);
    setIsModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedPathId || !modalAction) return;
    try {
      switch (modalAction) {
        case 'delete':
          await deleteLearningPath(selectedPathId);
          setLearningPaths((prev) => prev.filter((path) => path.learningPathId !== selectedPathId));
          if (learningPaths.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
          break;
        case 'submit':
          await submitLearningPathVerification(selectedPathId);
          break;
        case 'resubmit':
          await resubmitLearningPathVerification(selectedPathId);
          break;
      }
      fetchLearningPaths(currentPage, debouncedSearch, status);
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
    fetchLearningPaths(currentPage, debouncedSearch, status);
  };

  const columns: Column<LearningPathListDTO>[] = [
    {
      key: 'sno',
      title: 'S.No.',
      render: (_value: any, _record: LearningPathListDTO, index: number) => (currentPage - 1) * limit + index + 1,
      width: '8%',
    },
    {
      key: 'title',
      title: 'Title',
      render: (value: string) => (
        <span className="font-medium text-blue-600">{value}</span>
      ),
      width: '40%',
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => {
        const statusStyles: Record<string, string> = {
          draft: 'bg-gray-100 text-gray-800',
          pending: 'bg-yellow-100 text-yellow-800',
          accepted: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[value] || 'bg-gray-100 text-gray-800'}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      },
      width: '20%',
    },
    {
      key: 'thumbnailUrl',
      title: 'Thumbnail',
      render: (value: string | undefined) => (
        value ? (
          <img src={value} alt="Thumbnail" className="w-16 h-16 object-cover rounded" />
        ) : (
          <span className="text-gray-600">N/A</span>
        )
      ),
      width: '32%',
    },
  ];

  const actions: ActionButton<LearningPathListDTO>[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye size={16} />,
      onClick: (path: LearningPathListDTO) => navigate(`/instructor/learningPath/${path.learningPathId}`),
      className: 'bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200',
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Pencil size={16} />,
      onClick: (path: LearningPathListDTO) => navigate(`/instructor/learningPath/edit/${path.learningPathId}`),
      className: 'bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: (path: LearningPathListDTO) => handleAction('delete', path.learningPathId),
      className: 'bg-red-500 hover:bg-red-600 text-white transition-colors duration-200',
    },
    {
      key: 'submit',
      label: 'Submit for Review',
      icon: <Send size={16} />,
      onClick: (path: LearningPathListDTO) => handleAction('submit', path.learningPathId),
      condition: (path: LearningPathListDTO) => path.status === 'draft',
      className: 'bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-200',
    },
    {
      key: 'resubmit',
      label: 'Resubmit',
      icon: <RotateCcw size={16} />,
      onClick: (path: LearningPathListDTO) => handleAction('resubmit', path.learningPathId),
      condition: (path: LearningPathListDTO) => path.status === 'rejected',
      className: 'bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-200',
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <InstructorDataTable
        data={learningPaths}
        columns={columns}
        loading={loading}
        error={error}
        title="Learning Paths"
        description="Manage your learning paths for the e-learning platform"
        actions={actions}
        onRetry={handleRetry}
        emptyStateIcon={<X size={48} className="text-gray-400" />}
        emptyStateTitle="No Learning Paths Found"
        emptyStateDescription={
          search
            ? `No learning paths found matching "${search}". Try adjusting your search term or create a new learning path.`
            : 'Start by creating your first learning path to guide your students.'
        }
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={handleSearchChange}
        leftSideHeaderContent={
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Filter by Status:
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-gray-300 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-40"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <button
              onClick={() => navigate('/instructor/learningPath/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm w-full sm:w-auto"
            >
              Create New
            </button>
          </div>
        }
      />
      <ConfirmationModal
        isOpen={isModalOpen}
        message={
          modalAction === 'delete'
            ? 'Are you sure you want to delete this learning path? This action cannot be undone.'
            : modalAction === 'submit'
            ? 'Are you sure you want to submit this learning path for review?'
            : modalAction === 'resubmit'
            ? 'Are you sure you want to resubmit this learning path for review?'
            : ''
        }
        title={
          modalAction === 'delete'
            ? 'DELETE LEARNING PATH'
            : modalAction === 'submit'
            ? 'SUBMIT LEARNING PATH'
            : modalAction === 'resubmit'
            ? 'RESUBMIT LEARNING PATH'
            : 'CONFIRM ACTION'
        }
        confirmText={
          modalAction === 'delete'
            ? 'Delete'
            : modalAction === 'submit'
            ? 'Submit'
            : modalAction === 'resubmit'
            ? 'Resubmit'
            : 'Confirm'
        }
        cancelText="Cancel"
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
    </div>
  );
};

export default LearningPathListPage;