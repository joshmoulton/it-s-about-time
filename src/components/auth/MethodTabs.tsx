
import React from 'react';
import { Mail, LogIn, UserPlus } from 'lucide-react';

const methodTabs = [
  { key: "magic", label: "Magic Link", icon: <Mail className="h-4 w-4 mr-1" /> },
  { key: "signin", label: "Sign In", icon: <LogIn className="h-4 w-4 mr-1" /> },
  { key: "signup", label: "Create Account", icon: <UserPlus className="h-4 w-4 mr-1" /> },
];

interface MethodTabsProps {
  method: string;
  onTabClick: (tabKey: string) => void;
  isLoading: boolean;
}

export const MethodTabs: React.FC<MethodTabsProps> = ({ method, onTabClick, isLoading }) => {
  return (
    <div className="flex justify-center pt-4 pb-2 px-4">
      <div className="flex bg-white/40 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
        {methodTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabClick(tab.key)}
            className={`flex items-center px-3 py-2 mx-0.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              method === tab.key
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                : 'text-muted-foreground hover:bg-white/50'
            }`}
            disabled={isLoading}
            type="button"
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
