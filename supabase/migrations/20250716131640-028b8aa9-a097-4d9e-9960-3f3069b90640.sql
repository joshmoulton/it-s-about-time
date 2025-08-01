-- Add DELETE policy for degen_call_notifications to allow admins to delete records
CREATE POLICY "Admins can delete degen call notifications" 
ON public.degen_call_notifications 
FOR DELETE
USING (is_current_user_admin());