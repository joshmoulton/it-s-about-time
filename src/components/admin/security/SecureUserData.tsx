import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Shield, AlertTriangle, Lock } from 'lucide-react';
import { maskUserData, logDataAccess, canViewUnmaskedData } from '@/utils/dataMasking';
import { adminSecurityManager } from '@/utils/adminSecurity';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/secureLogger';

interface SecureUserDataProps {
  user: any;
  viewerRole?: string;
  viewerEmail?: string;
  onDataAccess?: (action: string, classification: string) => void;
}

export function SecureUserData({ 
  user, 
  viewerRole = 'user', 
  viewerEmail,
  onDataAccess 
}: SecureUserDataProps) {
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const { toast } = useToast();

  const canViewSensitive = canViewUnmaskedData(viewerRole, 'confidential');
  const canViewSecret = canViewUnmaskedData(viewerRole, 'secret');

  const handleToggleVisibility = async () => {
    if (!showUnmasked && canViewSensitive) {
      // Require re-authentication for viewing sensitive data
      if (viewerEmail && !adminSecurityManager.hasElevatedPermissions(viewerEmail)) {
        setRequiresAuth(true);
        toast({
          title: "Authentication Required",
          description: "Please re-authenticate to view sensitive data",
          variant: "destructive"
        });
        return;
      }

      // Log the data access
      logDataAccess(
        'view_unmasked',
        'user_data',
        'confidential',
        viewerRole,
        viewerEmail,
        user.id
      );

      onDataAccess?.('view_unmasked', 'confidential');
    }

    setShowUnmasked(!showUnmasked);
  };

  const displayUser = showUnmasked && canViewSensitive ? user : maskUserData(user, viewerRole);

  const getClassificationBadge = (classification: string) => {
    const colors = {
      public: 'bg-green-500',
      restricted: 'bg-yellow-500',
      confidential: 'bg-orange-500',
      secret: 'bg-red-500'
    };

    return (
      <Badge className={`text-white text-xs ${colors[classification as keyof typeof colors]}`}>
        {classification.toUpperCase()}
      </Badge>
    );
  };

  const DataField = ({ 
    label, 
    value, 
    classification = 'public' 
  }: { 
    label: string; 
    value: string | null | undefined; 
    classification?: string;
  }) => (
    <div className="flex justify-between items-center p-2 border rounded">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{label}:</span>
        {getClassificationBadge(classification)}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono">{value || 'N/A'}</span>
        {classification !== 'public' && !canViewUnmaskedData(viewerRole, classification as any) && (
          <Lock className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Data
            {!canViewSensitive && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          
          {canViewSensitive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleVisibility}
              disabled={requiresAuth}
            >
              {showUnmasked ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Sensitive
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Sensitive
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Always visible fields */}
        <DataField label="User Type" value={user.user_type} classification="public" />
        <DataField label="Subscription Tier" value={user.subscription_tier} classification="public" />
        <DataField label="Status" value={user.status} classification="public" />
        <DataField label="Created" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} classification="public" />

        {/* Restricted fields */}
        <DataField label="Email" value={displayUser.email || displayUser.display_email} classification="restricted" />
        <DataField label="Name" value={displayUser.full_name || displayUser.first_name} classification="restricted" />

        {/* Confidential fields */}
        <DataField label="User ID" value={displayUser.id} classification="confidential" />
        <DataField label="Phone" value={displayUser.phone} classification="confidential" />
        <DataField label="Address" value={displayUser.address} classification="confidential" />
        <DataField label="IP Address" value={displayUser.ip_address} classification="confidential" />

        {/* Secret fields - only for super admins */}
        {canViewSecret && (
          <>
            <DataField label="Auth Provider ID" value={displayUser.auth_provider_id} classification="secret" />
            <DataField label="External User ID" value={displayUser.external_user_id} classification="secret" />
          </>
        )}

        {/* Permission notice */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Access Level: {viewerRole}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {canViewSensitive 
              ? "You have permission to view sensitive data. Click 'Show Sensitive' to reveal masked information."
              : "You have limited access to this user's data. Some information is masked for privacy."
            }
          </p>
        </div>

        {/* Re-authentication required notice */}
        {requiresAuth && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Re-authentication Required</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Please re-enter your password to view sensitive user data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}