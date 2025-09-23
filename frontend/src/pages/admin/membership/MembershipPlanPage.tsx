import { useEffect, useState, useCallback } from "react";
import { Pencil, Trash2, Plus, CheckCircle, Search, X, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable, {
  type Column,
  type ActionButton,
} from "../../../components/AdminComponents/DataTable";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import {
  getAllMembership,
  deleteMembership,
  toggleMembershipStatus,
} from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type IMembershipPlan } from "../interface/adminInterface";

const MembershipPlanPage = () => {
  const [plans, setPlans] = useState<IMembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(2);
  const [total, setTotal] = useState(0);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<IMembershipPlan | null>(null);

  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllMembership({
        page: currentPage,
        limit,
        search: debouncedSearchTerm,
      });
      console.log(response);
      setPlans(response.plans || []);
      setTotal(response.total || 0);
      setError(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load membership plans";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearchTerm]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreate = () => {
    navigate("/admin/membership/add");
  };

  const handleEdit = (plan: IMembershipPlan) => {
    navigate(`/admin/membership/edit/${plan._id}`);
  };

  const handleDeletePrompt = (plan: IMembershipPlan) => {
    setSelectedPlan(plan);
    setDeleteModalOpen(true);
  };

  const handleTogglePrompt = (plan: IMembershipPlan) => {
    setSelectedPlan(plan);
    setToggleModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;

    try {
      const planToDelete = selectedPlan._id;
      setPlans(prev => prev.filter(plan => plan._id !== planToDelete));
      setTotal(prev => prev - 1);

      await deleteMembership(selectedPlan._id);
      toast.success("Membership plan deleted");
    } catch (err: any) {
      fetchPlans();
      toast.error(err?.response?.data?.message || "Failed to delete membership plan");
    } finally {
      setDeleteModalOpen(false);
      setSelectedPlan(null);
    }
  };

  const handleConfirmToggle = async () => {
    if (!selectedPlan) return;

    try {
      setPlans(prev =>
        prev.map(plan =>
          plan._id === selectedPlan._id
            ? { ...plan, isActive: !plan.isActive }
            : plan
        )
      );

      await toggleMembershipStatus(selectedPlan._id);
      toast.success(
        `Plan ${selectedPlan.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (err: any) {
      setPlans(prev =>
        prev.map(plan =>
          plan._id === selectedPlan._id
            ? { ...plan, isActive: !plan.isActive }
            : plan
        )
      );
      toast.error(err?.response?.data?.message || "Failed to update plan status");
    } finally {
      setToggleModalOpen(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelModal = () => {
    setDeleteModalOpen(false);
    setToggleModalOpen(false);
    setSelectedPlan(null);
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    if (isMobileSearchOpen && searchTerm) {
      setSearchTerm("");
    }
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Responsive columns configuration
  const columns: Column<IMembershipPlan>[] = [
    {
      key: "serialNo",
      title: "S.NO",
      width: "60px",
      minWidth: "50px",
      render: (_val, _record, index) => (
        <div className="text-center">
          <span className="text-xs sm:text-sm text-gray-900 font-medium">
            {(currentPage - 1) * limit + index + 1}
          </span>
        </div>
      ),
    },
    {
      key: "name",
      title: "Plan Details",
      minWidth: "200px",
      render: (value, record) => (
        <div className="space-y-2">
          {/* Plan Name - Always visible */}
          <div className="font-semibold text-gray-900 text-sm sm:text-base">
            {value}
          </div>
          
          {/* Mobile-only compact info */}
          <div className="block sm:hidden space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar size={12} />
                <span>{record.durationInDays} {record.durationInDays === 1 ? 'Day' : 'Days'}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Clock size={12} />
                <span>{formatDate(record.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      title: "Price",
      width: "120px",
      minWidth: "100px",
      render: (value) => (
        <div className="text-right sm:text-left">
          <span className="text-sm sm:text-base font-bold text-green-600">
            ₹{value?.toLocaleString('en-IN') || '0'}
          </span>
        </div>
      ),
    },
    {
      key: "durationInDays",
      title: "Duration",
      width: "120px",
      minWidth: "100px",
      priority: 3,
      render: (value) => (
        <div className="hidden sm:flex items-center gap-2">
          <Calendar size={16} className="text-blue-500" />
          <span className="text-sm text-gray-700 font-medium">
            {value} {value === 1 ? 'Day' : 'Days'}
          </span>
        </div>
      ),
    },
    {
      key: "isActive",
      title: "Status",
      width: "120px",
      minWidth: "100px",
      render: (val) => (
        <div className="flex justify-center sm:justify-start">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm ${
              val 
                ? "bg-green-100 text-green-800 border border-green-200" 
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${val ? 'bg-green-500' : 'bg-red-500'}`} />
            {val ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Created",
      width: "140px",
      minWidth: "120px",
      priority: 4,
      render: (value) => (
        <div className="hidden sm:block space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock size={12} />
            <span className="font-medium">
              {formatDate(value)}
            </span>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            {new Date(value).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </div>
      ),
    },
  ];

  // Enhanced responsive actions
  const actions: ActionButton<IMembershipPlan>[] = [
    {
      key: "edit",
      label: (record) => `Edit ${record.name}`,
      icon: <Pencil size={14} />,
      onClick: handleEdit,
      className: "bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md transition-all duration-200 px-2 py-1 sm:px-3 sm:py-2",
    },
    {
      key: "toggle",
      label: (record) => `${record.isActive ? 'Deactivate' : 'Activate'} ${record.name}`,
      icon: (record) => (
        <CheckCircle 
          size={14} 
          className={record.isActive ? 'text-red-100' : 'text-green-100'} 
        />
      ),
      onClick: handleTogglePrompt,
      className: (record) => `${record.isActive 
        ? "bg-orange-500 hover:bg-orange-600" 
        : "bg-green-500 hover:bg-green-600"} text-white shadow-sm hover:shadow-md transition-all duration-200 px-2 py-1 sm:px-3 sm:py-2`,
    },
    {
      key: "delete",
      label: (record) => `Delete ${record.name}`,
      icon: <Trash2 size={14} />,
      onClick: handleDeletePrompt,
      className: "bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md transition-all duration-200 px-2 py-1 sm:px-3 sm:py-2",
    },
  ];

  const totalPages = Math.ceil(total / limit);

  // Enhanced responsive header
  const leftSideHeaderContent = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      {/* Mobile Search Toggle */}
      <div className="flex sm:hidden">
        <button
          onClick={toggleMobileSearch}
          className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
            isMobileSearchOpen 
              ? 'bg-blue-100 text-blue-600 border-2 border-blue-200 shadow-md' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
          }`}
          aria-label="Toggle search"
        >
          {isMobileSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>
      </div>

      {/* Mobile Search Input - Enhanced */}
      {isMobileSearchOpen && (
        <div className="flex sm:hidden w-full">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans by name, price..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm shadow-sm"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Plan Button - Enhanced */}
      <button
        onClick={handleCreate}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg active:shadow-xl w-full sm:w-auto transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus size={18} />
        <span className="text-sm sm:text-base">Add New Plan</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <DataTable
          title="Membership Plans"
          description="Manage instructor membership plans and pricing"
          data={plans}
          columns={columns}
          actions={actions}
          loading={loading}
          error={error}
          onRetry={fetchPlans}
          emptyStateTitle="No Membership Plans Found"
          emptyStateDescription="Create your first membership plan to get started with subscriptions."
          searchValue={isMobileSearchOpen ? "" : searchTerm}
          onSearchChange={!isMobileSearchOpen ? handleSearchChange : undefined}
          searchPlaceholder="Search by plan name, price..."
          pagination={{
            currentPage,
            totalPages,
            onPageChange: handlePageChange,
          }}
          leftSideHeaderContent={leftSideHeaderContent}
        />
      </div>

      {/* Enhanced Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Membership Plan"
        message={
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">Are you sure you want to delete this membership plan?</p>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg mb-2">"{selectedPlan?.name}"</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Price:</span> 
                      <span className="text-green-600 font-bold">₹{selectedPlan?.price?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-sm text-gray-600">{selectedPlan?.durationInDays} days</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Created: {selectedPlan?.createdAt ? formatDate(selectedPlan.createdAt) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">⚠️</span>
                <div>
                  <p className="text-red-800 font-semibold text-sm">Warning: This action is irreversible!</p>
                  <p className="text-red-700 text-sm mt-1">This will affect all associated subscriptions and cannot be undone.</p>
                </div>
              </div>
            </div>
          </div>
        }
        confirmText="Delete Plan"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelModal}
      />

      {/* Enhanced Toggle Status Confirmation Modal */}
      <ConfirmationModal
        isOpen={toggleModalOpen}
        title={`${selectedPlan?.isActive ? "Deactivate" : "Activate"} Plan`}
        message={
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">
              Are you sure you want to {selectedPlan?.isActive ? "deactivate" : "activate"} this membership plan?
            </p>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${selectedPlan?.isActive ? 'bg-orange-100' : 'bg-green-100'}`}>
                  <CheckCircle size={20} className={selectedPlan?.isActive ? 'text-orange-600' : 'text-green-600'} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg mb-2">"{selectedPlan?.name}"</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Price:</span> 
                      <span className="text-green-600 font-bold">₹{selectedPlan?.price?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-sm text-gray-600">{selectedPlan?.durationInDays} days</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Created: {selectedPlan?.createdAt ? formatDate(selectedPlan.createdAt) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`${selectedPlan?.isActive ? 'bg-orange-50 border-l-4 border-orange-400' : 'bg-green-50 border-l-4 border-green-400'} p-4 rounded-r-lg`}>
              <div className="flex items-start gap-2">
                <span className={`${selectedPlan?.isActive ? 'text-orange-600' : 'text-green-600'} text-xl`}>
                  {selectedPlan?.isActive ? "📵" : "✅"}
                </span>
                <div>
                  <p className={`${selectedPlan?.isActive ? 'text-orange-800' : 'text-green-800'} font-semibold text-sm`}>
                    {selectedPlan?.isActive ? "Deactivation Effect:" : "Activation Effect:"}
                  </p>
                  <p className={`${selectedPlan?.isActive ? 'text-orange-700' : 'text-green-700'} text-sm mt-1`}>
                    {selectedPlan?.isActive 
                      ? "New subscriptions to this plan will be prevented." 
                      : "New subscriptions to this plan will be allowed."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        confirmText={selectedPlan?.isActive ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        onConfirm={handleConfirmToggle}
        onCancel={handleCancelModal}
      />
    </div>
  );
};

export default MembershipPlanPage;