import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HighlightTopic {
  id: string;
  topic_title: string;
  topic_slug: string;
  keyword_group: string[];
  message_count: number;
  engagement_score: number;
  first_mentioned_at: string;
  last_activity_at: string;
  is_trending: boolean;
  topic_description?: string;
  created_at: string;
  updated_at: string;
}

export interface HighlightComment {
  id: string;
  topic_id: string;
  parent_comment_id?: string;
  user_email: string;
  user_display_name?: string;
  comment_text: string;
  upvotes: number;
  downvotes: number;
  is_highlighted: boolean;
  is_deleted: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
  replies?: HighlightComment[];
  user_vote?: 'upvote' | 'downvote' | null;
}

export function useHighlightTopics() {
  return useQuery({
    queryKey: ['highlight-topics'],
    queryFn: async (): Promise<HighlightTopic[]> => {
      const { data, error } = await supabase
        .from('highlight_topics')
        .select('*')
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useTopicComments(topicId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['topic-comments', topicId],
    queryFn: async (): Promise<HighlightComment[]> => {
      // Get current user email for vote info
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;

      // Get all comments first
      const { data: allComments, error: allError } = await supabase
        .from('highlight_comments')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (allError) throw allError;

      // Get user votes if authenticated
      let userVotes: any[] = [];
      if (userEmail) {
        const { data: voteData, error: voteError } = await supabase
          .from('comment_votes')
          .select('comment_id, vote_type')
          .eq('user_email', userEmail)
          .in('comment_id', (allComments || []).map(c => c.id));

        if (voteError && voteError.code !== 'PGRST116') throw voteError;
        userVotes = voteData || [];
      }

      // Merge vote information
      const commentsWithVoteInfo = (allComments || []).map(comment => {
        const userVote = userVotes.find(v => v.comment_id === comment.id);
        return {
          ...comment,
          user_vote: userVote?.vote_type || null
        };
      });

      // Build threaded structure
      const commentMap = new Map<string, HighlightComment>();
      const rootComments: HighlightComment[] = [];

      // First pass: create comment objects
      commentsWithVoteInfo.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: build hierarchy
      commentsWithVoteInfo.forEach(comment => {
        const commentObj = commentMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies!.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      return rootComments;
    },
    enabled: !!topicId,
    refetchInterval: 15000, // Refetch every 15 seconds for real-time feel
  });
}

export function useAddComment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topicId,
      parentCommentId,
      commentText,
      userDisplayName
    }: {
      topicId: string;
      parentCommentId?: string;
      commentText: string;
      userDisplayName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Must be authenticated to comment');

      const { data, error } = await supabase
        .from('highlight_comments')
        .insert({
          topic_id: topicId,
          parent_comment_id: parentCommentId,
          user_email: user.email,
          user_display_name: userDisplayName || user.email.split('@')[0],
          comment_text: commentText
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['topic-comments', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['highlight-topics'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Comment",
        description: "Could not post your comment. Please try again.",
        variant: "destructive",
      });
    }
  });
}

export function useVoteComment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      topicId,
      voteType
    }: {
      commentId: string;
      topicId: string;
      voteType: 'upvote' | 'downvote';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Must be authenticated to vote');

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_email', user.email)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if same type
          const { error } = await supabase
            .from('comment_votes')
            .delete()
            .eq('id', existingVote.id);
          if (error) throw error;
          return 'removed';
        } else {
          // Update vote type
          const { error } = await supabase
            .from('comment_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
          if (error) throw error;
          return 'updated';
        }
      } else {
        // Create new vote
        const { error } = await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            user_email: user.email,
            vote_type: voteType
          });
        if (error) throw error;
        return 'created';
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['topic-comments', variables.topicId] });
    },
    onError: (error) => {
      toast({
        title: "Vote Failed",
        description: "Could not register your vote. Please try again.",
        variant: "destructive",
      });
    }
  });
}

export function useCreateTopicFromKeywords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      keywords,
      firstMessageTime
    }: {
      keywords: string[];
      firstMessageTime?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_topic_from_keywords', {
        keywords,
        first_message_time: firstMessageTime || new Date().toISOString()
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlight-topics'] });
    }
  });
}