
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface LoginCardHeaderProps {
  onDeviceManagement: () => void;
}

export const LoginCardHeader: React.FC<LoginCardHeaderProps> = ({
  onDeviceManagement
}) => {
  return (
    <CardHeader className="space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your Weekly Wizdom dashboard
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeviceManagement}
          className="h-8 w-8 p-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
  );
};
