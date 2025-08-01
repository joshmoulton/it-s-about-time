import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, MessageCircle, Reply, Send, Heart, Clock } from 'lucide-react';
import { HighlightComment, useAddComment, useVoteComment } from '@/hooks/useHighlightTopics';
import { useEnhancedAuthState } from '@/hooks/useEnhancedAuthState';

interface CommentItemProps {
  comment: HighlightComment;
  topicId: string;
  depth?: number;
  onReply?: (parentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, topicId, depth = 0, onReply }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { supabaseUser: user } = useEnhancedAuthState();
  const addComment = useAddComment();
  const voteComment = useVoteComment();

  const netScore = comment.upvotes - comment.downvotes;
  const isUserVoted = comment.user_vote;
  const maxDepth = 3; // Limit nesting depth

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    voteComment.mutate({ commentId: comment.id, topicId, voteType });
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      await addComment.mutateAsync({
        topicId,
        parentCommentId: comment.id,
        commentText: replyText,
        userDisplayName: user?.email?.split('@')[0]
      });
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-border/20 pl-4' : ''}`}>
      <Card className="mb-3 bg-background/50 backdrop-blur-sm border-border/30 hover:bg-background/70 transition-all duration-200">
        <CardContent className="p-4">
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/60 to-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                {comment.user_display_name?.[0] || comment.user_email[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-foreground">
                  {comment.user_display_name || comment.user_email.split('@')[0]}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(comment.created_at)}
                  {comment.is_highlighted && (
                    <Badge variant="secondary" className="text-xs">
                      <Heart className="h-2 w-2 mr-1" />
                      Highlighted
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comment Content */}
          <div className="mb-3">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {comment.comment_text}
            </p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Voting */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${isUserVoted === 'upvote' ? 'text-green-600 bg-green-50 dark:bg-green-950/20' : 'hover:text-green-600'}`}
                onClick={() => handleVote('upvote')}
                disabled={!user || voteComment.isPending}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <span className={`min-w-[2rem] text-center font-medium ${netScore > 0 ? 'text-green-600' : netScore < 0 ? 'text-red-600' : ''}`}>
                {netScore}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${isUserVoted === 'downvote' ? 'text-red-600 bg-red-50 dark:bg-red-950/20' : 'hover:text-red-600'}`}
                onClick={() => handleVote('downvote')}
                disabled={!user || voteComment.isPending}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            {/* Reply Button */}
            {user && depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs hover:text-primary"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {/* Reply Count */}
            {comment.replies && comment.replies.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && user && (
            <div className="mt-3 p-3 bg-background/30 rounded-lg border border-border/20">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] resize-none text-sm"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim() || addComment.isPending}
                  className="h-8"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              topicId={topicId}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CommentThreadProps {
  topicId: string;
  comments: HighlightComment[];
  isLoading?: boolean;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ topicId, comments, isLoading }) => {
  const [newCommentText, setNewCommentText] = useState('');
  const { supabaseUser: user } = useEnhancedAuthState();
  const addComment = useAddComment();

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;
    
    try {
      await addComment.mutateAsync({
        topicId,
        commentText: newCommentText,
        userDisplayName: user?.email?.split('@')[0]
      });
      setNewCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      {user && (
        <Card className="bg-background/30 backdrop-blur-sm border-border/30">
          <CardContent className="p-4">
            <Textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Share your thoughts on this topic..."
              className="min-h-[80px] resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button
                onClick={handleAddComment}
                disabled={!newCommentText.trim() || addComment.isPending}
                className="h-9"
              >
                <Send className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              topicId={topicId}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-background/20 backdrop-blur-sm border-border/20">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No comments yet</h3>
            <p className="text-muted-foreground">
              {user ? 'Be the first to share your thoughts on this topic!' : 'Sign in to join the discussion'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};