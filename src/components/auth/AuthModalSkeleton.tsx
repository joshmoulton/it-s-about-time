import React from 'react';
import { Loader2 } from 'lucide-react';

export const AuthModalSkeleton: React.FC = () => (
  <div className="relative overflow-hidden bg-brand-white border border-gray-200 rounded-2xl p-8 shadow-xl">
    <div className="text-center space-y-6">
      <div className="space-y-3">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
        <div className="h-8 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);