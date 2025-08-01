
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleGetStats(
  supabase: ReturnType<typeof createClient>
) {
  console.log('Getting Telegram stats...');
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  // Get total message count
  const { count: totalMessages } = await supabase
    .from('telegram_messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', -1002083186778) // Updated to new group ID
    .eq('is_hidden', false);
  
  // Get messages from this week
  const { count: messagesThisWeek } = await supabase
    .from('telegram_messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', -1002083186778) // Updated to new group ID
    .eq('is_hidden', false)
    .gte('timestamp', oneWeekAgo.toISOString());
  
  // Get active users count
  const { data: activeUsersData } = await supabase
    .from('telegram_messages')
    .select('user_id')
    .eq('chat_id', -1002083186778) // Updated to new group ID
    .eq('is_hidden', false)
    .gte('timestamp', oneWeekAgo.toISOString());
  
  const activeUsers = activeUsersData ? new Set(activeUsersData.map(m => m.user_id)).size : 0;
  
  // Get top contributors
  const { data: contributorsData } = await supabase
    .from('telegram_messages')
    .select('username, user_id')
    .eq('chat_id', -1002083186778) // Updated to new group ID
    .eq('is_hidden', false)
    .gte('timestamp', oneWeekAgo.toISOString())
    .not('username', 'is', null);
  
  const contributorCounts = new Map();
  contributorsData?.forEach(msg => {
    if (msg.username) {
      contributorCounts.set(msg.username, (contributorCounts.get(msg.username) || 0) + 1);
    }
  });
  
  const topContributors = Array.from(contributorCounts.entries())
    .map(([username, messageCount]) => ({ username, messageCount }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5);
  
  const stats = {
    totalMessages: totalMessages || 0,
    messagesThisWeek: messagesThisWeek || 0,
    activeUsers,
    topContributors
  };
  
  console.log('Generated stats:', stats);
  
  return stats;
}
