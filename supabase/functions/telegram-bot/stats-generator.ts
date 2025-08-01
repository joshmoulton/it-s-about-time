
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function generateTelegramStats(supabase: ReturnType<typeof createClient>) {
  try {
    // Get total message count
    const { count: totalMessages } = await supabase
      .from('telegram_messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', -1002083186778); // Updated to new group ID

    // Get messages from this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count: messagesThisWeek } = await supabase
      .from('telegram_messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', -1002083186778) // Updated to new group ID
      .gte('timestamp', weekAgo.toISOString());

    // Get unique active users (last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const { data: activeUsersData } = await supabase
      .from('telegram_messages')
      .select('user_id')
      .eq('chat_id', -1002083186778) // Updated to new group ID
      .gte('timestamp', monthAgo.toISOString())
      .not('user_id', 'is', null);

    const activeUsers = new Set(activeUsersData?.map(msg => msg.user_id)).size;

    // Get top contributors
    const { data: contributorsData } = await supabase
      .from('telegram_messages')
      .select('username, first_name, user_id')
      .eq('chat_id', -1002083186778) // Updated to new group ID
      .gte('timestamp', monthAgo.toISOString())
      .not('user_id', 'is', null);

    const contributorCounts = new Map();
    contributorsData?.forEach(msg => {
      const key = msg.username || msg.first_name || `user_${msg.user_id}`;
      contributorCounts.set(key, (contributorCounts.get(key) || 0) + 1);
    });

    const topContributors = Array.from(contributorCounts.entries())
      .map(([username, messageCount]) => ({ username, messageCount }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5);

    return {
      totalMessages: totalMessages || 0,
      messagesThisWeek: messagesThisWeek || 0,
      activeUsers: activeUsers || 0,
      topContributors
    };
  } catch (error) {
    console.error('Error generating stats:', error);
    throw error;
  }
}
