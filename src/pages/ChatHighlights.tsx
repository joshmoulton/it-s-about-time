import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EnhancedChatHighlights } from '@/components/chat-highlights/EnhancedChatHighlights';

export default function ChatHighlights() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="mb-6 bg-purple-900/30 border-purple-500/30 text-purple-200 hover:bg-purple-800/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Enhanced Chat Highlights Component */}
        <EnhancedChatHighlights />
      </div>
    </div>
  );
}