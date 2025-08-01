-- Fix feedback system RLS policies for better reliability

-- Drop existing problematic policies
DROP POLICY IF EXISTS "feedback_user_submit" ON public.feedback;
DROP POLICY IF EXISTS "feedback_user_read" ON public.feedback;
DROP POLICY IF EXISTS "feedback_user_update" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_full" ON public.feedback;

-- Create consolidated, more reliable policies
CREATE POLICY "feedback_submission_policy" ON public.feedback
  FOR INSERT
  WITH CHECK (
    -- Allow authenticated users to submit with their email
    (auth.uid() IS NOT NULL AND user_email = auth.email()) OR
    -- Allow anonymous submissions
    (auth.uid() IS NULL) OR
    -- Allow service role (from edge functions)
    (current_setting('role') = 'service_role') OR
    -- Allow admin submissions
    is_current_user_admin_fast()
  );

CREATE POLICY "feedback_read_policy" ON public.feedback
  FOR SELECT
  USING (
    -- Users can read their own feedback
    (user_email = get_current_user_email_optimized()) OR
    (user_email = auth.email()) OR
    -- Admins can read all feedback
    is_current_user_admin_fast()
  );

CREATE POLICY "feedback_update_policy" ON public.feedback
  FOR UPDATE
  USING (
    -- Users can update their own feedback
    (user_email = get_current_user_email_optimized()) OR
    (user_email = auth.email()) OR
    -- Admins can update all feedback
    is_current_user_admin_fast()
  )
  WITH CHECK (
    -- Validate content length constraints
    (char_length(title) <= 200) AND (char_length(description) <= 2000)
  );

CREATE POLICY "feedback_admin_manage" ON public.feedback
  FOR ALL
  USING (is_current_user_admin_fast())
  WITH CHECK (is_current_user_admin_fast());

-- Add index for better performance on email lookups
CREATE INDEX IF NOT EXISTS idx_feedback_user_email ON public.feedback(user_email);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);