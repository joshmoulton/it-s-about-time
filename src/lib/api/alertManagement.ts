// Alert Management API Service
export interface AlertData {
  id: string;
  coin: string;
  entry_price: number;
  target_price?: number;
  stop_loss_price?: number;
  position_type: 'long' | 'short';
  is_active: boolean;
  entry_activated: boolean;
  triggered_at?: string;
  stopped_out: boolean;
  invalidated: boolean;
  caller: string;
  note?: string;
  created_at: string;
  updated_at?: string;
}

export interface AlertsResponse {
  success: boolean;
  alerts: AlertData[];
  count: number;
}

export interface AlertUpdateResponse {
  success: boolean;
  message: string;
  alert: Partial<AlertData>;
}

export interface AlertUpdateParams {
  target_price?: number;
  stop_loss_price?: number;
  note?: string;
  additional_targets?: number[];
}

export type AlertStatusOperation = 
  | 'entry_activated'
  | 'triggered'
  | 'stopped_out'
  | 'invalidated'
  | 'validated'
  | 'reset_stopped_out';


// Get alerts with optional filtering
export const getAlerts = async (
  apiKey: string,
  filters?: {
    caller?: string;
    active?: boolean;
  }
): Promise<AlertsResponse> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data, error } = await supabase.functions.invoke('external-alert-management', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
    body: filters ? JSON.stringify(filters) : undefined,
  });
  
  if (error) {
    throw new Error(error.message || 'Failed to fetch alerts');
  }
  
  return data;
};

// Update alert status (trading lifecycle)
export const updateAlertStatus = async (
  alertId: string,
  operation: AlertStatusOperation,
  apiKey: string
): Promise<AlertUpdateResponse> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data, error } = await supabase.functions.invoke('external-alert-management', {
    method: 'PATCH',
    headers: {
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ alertId, operation, action: 'updateStatus' }),
  });
  
  if (error) {
    throw new Error(error.message || 'Failed to update alert status');
  }
  
  return data;
};

// Update alert parameters
export const updateAlertParameters = async (
  alertId: string,
  params: AlertUpdateParams,
  apiKey: string
): Promise<AlertUpdateResponse> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data, error } = await supabase.functions.invoke('external-alert-management', {
    method: 'PATCH',
    headers: {
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ alertId, params, action: 'updateParameters' }),
  });
  
  if (error) {
    throw new Error(error.message || 'Failed to update alert parameters');
  }
  
  return data;
};

// Delete alert
export const deleteAlert = async (
  alertId: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data, error } = await supabase.functions.invoke('external-alert-management', {
    method: 'DELETE',
    headers: {
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ alertId, action: 'delete' }),
  });
  
  if (error) {
    throw new Error(error.message || 'Failed to delete alert');
  }
  
  return data;
};