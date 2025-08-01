-- Create feedback categories enum
CREATE TYPE public.feedback_category AS ENUM ('bug', 'feature_request', 'feedback', 'support');

-- Create feedback status enum  
CREATE TYPE public.feedback_status AS ENUM ('pending', 'in_progress', 'completed', 'closed');

-- Create feedback priority enum
CREATE TYPE public.feedback_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category feedback_category NOT NULL DEFAULT 'feedback',
  status feedback_status NOT NULL DEFAULT 'pending',
  priority feedback_priority NOT NULL DEFAULT 'medium',
  browser_info JSONB DEFAULT '{}',
  page_url TEXT,
  attachments TEXT[],
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback replies table for admin responses
CREATE TABLE public.feedback_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback table
CREATE POLICY "Users can create their own feedback"
ON public.feedback
FOR INSERT
WITH CHECK (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
USING (is_current_user_admin());

CREATE POLICY "Admins can update all feedback"
ON public.feedback
FOR UPDATE
USING (is_current_user_admin());

-- RLS policies for feedback replies
CREATE POLICY "Users can view replies to their feedback"
ON public.feedback_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.feedback 
    WHERE feedback.id = feedback_replies.feedback_id 
    AND feedback.user_email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
  AND is_internal_note = false
);

CREATE POLICY "Admins can view all replies"
ON public.feedback_replies
FOR SELECT
USING (is_current_user_admin());

CREATE POLICY "Admins can create replies"
ON public.feedback_replies
FOR INSERT
WITH CHECK (is_current_user_admin());

-- Create indexes for better performance
CREATE INDEX idx_feedback_user_email ON public.feedback(user_email);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_category ON public.feedback(category);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_feedback_replies_feedback_id ON public.feedback_replies(feedback_id);

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();