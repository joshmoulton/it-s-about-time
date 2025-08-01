
import { toast } from 'sonner';

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 35000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs / 1000} seconds`)), timeoutMs)
  );
  
  return Promise.race([promise, timeoutPromise]);
};

export const handleSyncError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);
  const isTimeout = error.message.includes('timed out');
  const isRateLimit = error.message.includes('rate limit') || error.message.includes('429');
  
  let errorMessage = `Failed to ${operation}`;
  if (isTimeout) {
    errorMessage = `${operation} timed out. Running in background.`;
  } else if (isRateLimit) {
    errorMessage = 'Rate limit reached. Please try again in a few minutes.';
  }
  
  toast.error(errorMessage);
  throw error;
};

export const showSyncCompletionToast = (job: any) => {
  const completionMessage = `🎉 Sync completed! ${job.synced_records} new, ${job.updated_records} updated, ${job.failed_records} failed`;
  toast.success(completionMessage, { duration: 8000 });
  
  // Show tier and status breakdown if available
  if (job.metadata?.tier_stats) {
    const tierStats = job.metadata.tier_stats;
    toast.info(`Tier breakdown: ${tierStats.premium} premium, ${tierStats.paid} paid, ${tierStats.free} free`, { duration: 6000 });
  }
};
