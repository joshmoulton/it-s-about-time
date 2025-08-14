-- Check current RLS policies on telegram_messages table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'telegram_messages';

-- Check if RLS is enabled on telegram_messages
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'telegram_messages' AND schemaname = 'public';