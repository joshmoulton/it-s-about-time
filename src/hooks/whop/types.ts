
export interface SyncProgress {
  job?: {
    id: string;
    status: string;
    error_message?: string;
    synced_records: number;
    updated_records: number;
    failed_records: number;
    metadata?: {
      tier_stats?: {
        premium: number;
        paid: number;
        free: number;
      };
    };
  };
}

export interface WhopSyncResult {
  success?: boolean;
  job_id?: string;
  total_records?: number;
  total_pages?: number;
  synced?: number;
  retried?: number;
  successes?: number;
  failures?: number;
  incremental?: boolean;
  sync_type?: string;
  message?: string;
  last_sync?: string;
}
