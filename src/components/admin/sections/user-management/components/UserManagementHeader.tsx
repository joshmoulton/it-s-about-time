
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Settings } from 'lucide-react';

interface UserManagementHeaderProps {
  onAddAdmin: () => void;
  onAddAnalyst: () => void;
  onAddLocalAdmin: () => void;
}

export function UserManagementHeader({ onAddAdmin, onAddAnalyst, onAddLocalAdmin }: UserManagementHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-slate-400">Manage administrators and analysts</p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onAddAnalyst}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Analyst
        </Button>
        <Button
          onClick={onAddAdmin}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
        <Button
          onClick={onAddLocalAdmin}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          Add Local Admin
        </Button>
      </div>
    </div>
  );
}
