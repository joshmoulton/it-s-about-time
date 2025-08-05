import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  Send, 
  Eye, 
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

interface Feedback {
  id: string;
  user_email: string;
  title: string;
  description: string;
  category: 'bug' | 'feature_request' | 'feedback' | 'support';
  status: 'pending' | 'in_progress' | 'completed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  browser_info: any;
  page_url: string;
  created_at: string;
  updated_at: string;
}

interface FeedbackReply {
  id: string;
  feedback_id: string;
  admin_email: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
}

const categoryIcons = {
  bug: Bug,
  feature_request: Lightbulb,
  feedback: MessageSquare,
  support: HelpCircle
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

export function FeedbackManagement() {
  const { subscriber } = useEnhancedAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replies, setReplies] = useState<FeedbackReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus as any);
      }

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory as any);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (feedbackId: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback_replies')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error loading replies:', error);
      toast.error('Failed to load replies');
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: string, priority?: string) => {
    try {
      const updates: any = { status };
      if (priority) updates.priority = priority;

      const { error } = await supabase
        .from('feedback')
        .update(updates)
        .eq('id', feedbackId);

      if (error) throw error;

      toast.success('Feedback updated successfully');
      loadFeedback();
      
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status, ...(priority ? { priority } : {}) } as Feedback);
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    }
  };

  const submitReply = async () => {
    if (!selectedFeedback || !newReply.trim() || !subscriber?.email) {
      console.log('Missing required data:', { 
        selectedFeedback: !!selectedFeedback, 
        newReply: !!newReply.trim(), 
        email: subscriber?.email 
      });
      return;
    }

    setIsSubmittingReply(true);

    try {
      console.log('Attempting to submit reply:', {
        feedback_id: selectedFeedback.id,
        admin_email: subscriber.email,
        message: newReply,
        is_internal_note: isInternalNote
      });

      const { error } = await supabase
        .from('feedback_replies')
        .insert({
          feedback_id: selectedFeedback.id,
          admin_email: subscriber.email,
          message: newReply,
          is_internal_note: isInternalNote
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast.success(isInternalNote ? 'Internal note added' : 'Reply sent successfully');
      setNewReply('');
      setIsInternalNote(false);
      loadReplies(selectedFeedback.id);
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error(`Failed to submit reply: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const openFeedbackDetails = (feedbackItem: Feedback) => {
    console.log('🔍 Opening feedback details:', feedbackItem);
    setSelectedFeedback(feedbackItem);
    console.log('📱 Selected feedback set, loading replies...');
    loadReplies(feedbackItem.id);
  };

  useEffect(() => {
    loadFeedback();
  }, [filterStatus, filterCategory, searchTerm]);

  const CategoryIcon = (category: string) => {
    const Icon = categoryIcons[category as keyof typeof categoryIcons] || MessageSquare;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Feedback Management</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="feature_request">Feature Request</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="grid gap-4">
        {feedback.map((item) => (
          <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {CategoryIcon(item.category)}
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>
                      From: {item.user_email} • {new Date(item.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[item.status]}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={priorityColors[item.priority]}>
                    {item.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {item.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {item.page_url && `Page: ${new URL(item.page_url).pathname}`}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => openFeedbackDetails(item)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {feedback.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No feedback found</p>
        </div>
      )}

      {/* Feedback Details Modal */}
      {selectedFeedback && (() => {
        console.log('💬 Rendering Dialog with selectedFeedback:', selectedFeedback.title);
        return null;
      })()}
      {selectedFeedback && (
        <Dialog open={!!selectedFeedback} onOpenChange={() => {
          console.log('🚪 Dialog closing...');
          setSelectedFeedback(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">{' '}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {CategoryIcon(selectedFeedback.category)}
                {selectedFeedback.title}
              </DialogTitle>
              <DialogDescription>
                View and manage feedback details, replies, and status updates.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Feedback Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={selectedFeedback.status}
                      onValueChange={(value) => updateFeedbackStatus(selectedFeedback.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={selectedFeedback.priority}
                      onValueChange={(value) => updateFeedbackStatus(selectedFeedback.id, selectedFeedback.status, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">Description</h3>
                <p className="text-sm bg-muted p-3 rounded">{selectedFeedback.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>User:</strong> {selectedFeedback.user_email}
                </div>
                <div>
                  <strong>Category:</strong> {selectedFeedback.category.replace('_', ' ')}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedFeedback.created_at).toLocaleString()}
                </div>
                <div>
                  <strong>Page:</strong> {selectedFeedback.page_url}
                </div>
              </div>

              {/* Replies */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Replies & Notes</h3>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {replies.map((reply) => (
                    <div key={reply.id} className={`p-3 rounded border-l-4 ${
                      reply.is_internal_note 
                        ? 'bg-yellow-50 border-l-yellow-400' 
                        : 'bg-blue-50 border-l-blue-400'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {reply.admin_email} {reply.is_internal_note && '(Internal Note)'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{reply.message}</p>
                    </div>
                  ))}
                </div>

                {/* New Reply */}
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    placeholder="Write a reply or internal note..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="min-h-[80px]"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="internal-note"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                      />
                      <label htmlFor="internal-note" className="text-sm">
                        Internal note (not visible to user)
                      </label>
                    </div>
                    
                    <Button
                      onClick={submitReply}
                      disabled={!newReply.trim() || isSubmittingReply}
                    >
                      {isSubmittingReply ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {isInternalNote ? 'Add Note' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}