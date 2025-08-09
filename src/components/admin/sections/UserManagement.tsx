
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserManagementHeader } from './user-management/components/UserManagementHeader';
import { UserStatsCards } from './user-management/components/UserStatsCards';
import { UserFilters } from './user-management/components/UserFilters';
import { UserTable } from './user-management/components/UserTable';
import { UserPagination } from './user-management/components/UserPagination';
import { BulkActionsBar } from './user-management/components/BulkActionsBar';
import { AddAdminForm } from '../forms/AddAdminForm';
import { AddAnalystForm } from '../forms/AddAnalystForm';
import { AddLocalAdminForm } from '../forms/AddLocalAdminForm';
import { EditAdminForm } from '../forms/EditAdminForm';
import { useUserManagement } from './user-management/hooks/useUserManagement';
import { useBulkActions } from './user-management/hooks/useBulkActions';
import { 
  UserLoadingState, 
  UserErrorState, 
  UserEmptyState 
} from './user-management/components';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

export function UserManagement() {
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddAnalyst, setShowAddAnalyst] = useState(false);
  const [showAddLocalAdmin, setShowAddLocalAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewingUser, setViewingUser] = useState<any>(null);

  const {
    users,
    userStats,
    isLoading,
    error,
    searchTerm,
    tierFilter,
    currentPage,
    totalUsers,
    totalPages,
    itemsPerPage,
    handlePageChange,
    handleSearch,
    handleTierFilter,
    refetch
  } = useUserManagement();

  const {
    bulkDelete,
    bulkTierChange,
    bulkStatusChange,
    bulkPasswordReset,
    removeBetaUsers,
    isProcessing
  } = useBulkActions();

  const { currentUser } = useEnhancedAuth();
  const isAllowlistedAdmin = (currentUser?.email || '').toLowerCase() === 'moulton.joshua@gmail.com';

  const handleSuccess = () => {
    refetch();
    setShowAddAdmin(false);
    setShowAddAnalyst(false);
    setShowAddLocalAdmin(false);
    setEditingUser(null);
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(users.map(user => user.id));
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const handleClearFilters = () => {
    handleSearch('');
    handleTierFilter('all');
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
  };

  const handleViewUser = (user: any) => {
    setViewingUser(user);
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    console.log('🚀 handleBulkDelete called with selectedUsers:', selectedUsers);
    const result = await bulkDelete(selectedUsers);
    console.log('🚀 bulkDelete result:', result);
    if (result.success) {
      setSelectedUsers([]);
      refetch();
    }
  };

  const handleRemoveBetaUsers = async () => {
    console.log('🧹 handleRemoveBetaUsers called');
    const result = await removeBetaUsers();
    console.log('🧹 removeBetaUsers result:', result);
    if (result.success) {
      setSelectedUsers([]);
      refetch();
    }
  };

  const handleBulkTierChange = async (tier: 'free' | 'paid' | 'premium') => {
    const result = await bulkTierChange(selectedUsers, tier);
    if (result.success) {
      refetch();
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    const result = await bulkStatusChange(selectedUsers, status);
    if (result.success) {
      refetch();
    }
  };

  const handleBulkPasswordReset = async () => {
    const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
    const userEmails = selectedUserData.map(user => user.email);
    const userTypes = selectedUserData.map(user => user.user_type || 'supabase_auth');
    
    await bulkPasswordReset(userEmails, userTypes);
  };

  if (isLoading) return <UserLoadingState />;
  if (error) return <UserErrorState onRetry={refetch} />;

  const hasFilters = searchTerm !== '' || tierFilter !== 'all';

  return (
    <div className="h-full w-full bg-slate-900">
      <div className="p-6 border-b border-slate-800">
        <UserManagementHeader
          onAddAdmin={() => setShowAddAdmin(true)}
          onAddAnalyst={() => setShowAddAnalyst(true)}
          onAddLocalAdmin={() => { if (isAllowlistedAdmin) setShowAddLocalAdmin(true); }}
        />
      </div>

      <div className="p-6 space-y-6">
        <UserStatsCards stats={userStats} isLoading={isLoading} />

        <UserFilters
          filters={{
            search: searchTerm,
            tier: tierFilter,
            status: 'all'
          }}
          onFiltersChange={(filters) => {
            if (filters.search !== undefined) handleSearch(filters.search);
            if (filters.tier) handleTierFilter(filters.tier);
          }}
          resultsCount={totalUsers}
        />

        {users.length === 0 ? (
          <UserEmptyState 
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <>
            <BulkActionsBar
              selectedCount={selectedUsers.length}
              onClearSelection={handleDeselectAll}
              onBulkDelete={handleBulkDelete}
              onBulkTierChange={handleBulkTierChange}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkPasswordReset={handleBulkPasswordReset}
            />
            
            <UserTable
              users={users}
              selectedUsers={selectedUsers}
              onToggleUser={handleToggleUser}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onEditUser={handleEditUser}
              onViewUser={handleViewUser}
              isLoading={isLoading || isProcessing}
            />
            
            <UserPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalUsers={totalUsers}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DialogContent className="max-w-2xl bg-transparent border-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>Add a new admin user to the system</DialogDescription>
          </DialogHeader>
          <AddAdminForm onCancel={() => setShowAddAdmin(false)} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddAnalyst} onOpenChange={setShowAddAnalyst}>
        <DialogContent className="max-w-2xl bg-transparent border-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Add Analyst User</DialogTitle>
            <DialogDescription>Add a new analyst user to the system</DialogDescription>
          </DialogHeader>
          <AddAnalystForm onClose={() => setShowAddAnalyst(false)} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddLocalAdmin} onOpenChange={setShowAddLocalAdmin}>
        <DialogContent className="max-w-2xl bg-transparent border-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Add Local Admin User</DialogTitle>
            <DialogDescription>Add a new local admin user to the system</DialogDescription>
          </DialogHeader>
          <AddLocalAdminForm onCancel={() => setShowAddLocalAdmin(false)} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl bg-transparent border-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Edit user permissions and settings</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <EditAdminForm
              admin={editingUser}
              onCancel={() => setEditingUser(null)}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-2xl bg-slate-800 border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">User Details</DialogTitle>
            <DialogDescription className="text-slate-300">View detailed user information</DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <p className="text-white">{viewingUser.email || viewingUser.display_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">User ID</label>
                  <p className="text-white font-mono text-sm">{viewingUser.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">User Type</label>
                  <p className="text-white capitalize">{viewingUser.user_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Subscription Tier</label>
                  <p className="text-white capitalize">{viewingUser.subscription_tier}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Status</label>
                  <p className="text-white capitalize">{viewingUser.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Created At</label>
                  <p className="text-white">{new Date(viewingUser.created_at).toLocaleString()}</p>
                </div>
                {viewingUser.role && (
                  <div>
                    <label className="text-sm font-medium text-slate-300">Role</label>
                    <p className="text-white capitalize">{viewingUser.role}</p>
                  </div>
                )}
                {viewingUser.whop_user_id && (
                  <div>
                    <label className="text-sm font-medium text-slate-300">Whop User ID</label>
                    <p className="text-white font-mono text-sm">{viewingUser.whop_user_id}</p>
                  </div>
                )}
                {viewingUser.whop_purchase_id && (
                  <div>
                    <label className="text-sm font-medium text-slate-300">Whop Purchase ID</label>
                    <p className="text-white font-mono text-sm">{viewingUser.whop_purchase_id}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
