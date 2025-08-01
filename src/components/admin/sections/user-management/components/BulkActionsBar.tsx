import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Crown, 
  User, 
  Shield, 
  UserCheck, 
  UserX, 
  X,
  ChevronDown 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkTierChange: (tier: 'free' | 'paid' | 'premium') => void;
  onBulkStatusChange: (status: 'active' | 'inactive') => void;
  onBulkPasswordReset: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkTierChange,
  onBulkStatusChange,
  onBulkPasswordReset
}: BulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Only show if users are selected
  if (selectedCount === 0) {
    return null;
  }

  const handleDeleteConfirm = () => {
    onBulkDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="border border-slate-600 bg-slate-800/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-slate-400 hover:text-white h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-2">
                  {/* Tier Actions */}
                  <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    <Crown className="h-4 w-4 mr-2" />
                    Change Tier
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem 
                    onClick={() => onBulkTierChange('free')}
                    className="text-slate-300 hover:bg-slate-700"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Set to Free
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onBulkTierChange('paid')}
                    className="text-slate-300 hover:bg-slate-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Set to Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onBulkTierChange('premium')}
                    className="text-slate-300 hover:bg-slate-700"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Set to Premium
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Change Status
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem 
                    onClick={() => onBulkStatusChange('active')}
                    className="text-slate-300 hover:bg-slate-700"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Set to Active
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onBulkStatusChange('inactive')}
                    className="text-slate-300 hover:bg-slate-700"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Set to Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenuSeparator />

              {/* Bulk Password Reset */}
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkPasswordReset}
                className="border-slate-600 text-slate-300"
              >
                Send Password Reset
              </Button>

                  {/* Delete Action */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                  </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Users Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Selected Users</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to delete {selectedCount} user{selectedCount !== 1 ? 's' : ''}? 
              This action cannot be undone and will permanently remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedCount} User{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}