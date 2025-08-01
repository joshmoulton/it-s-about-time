interface TimeCondition {
  type: 'candlestick_close' | 'date_range' | 'timezone';
  enabled: boolean;
  config: {
    timeframe?: string;           // '1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w'
    waitForClose?: boolean;       // Wait for candle close
    startDate?: string;           // ISO string
    endDate?: string;             // ISO string
    timezone?: string;            // Timezone for conditions
  };
}

interface AlertSubmission {
  // Required fields
  coin: string;                    // Must be uppercase symbol (e.g., "BTC")
  entry_price: number;            // Must be positive
  
  // Optional trading fields
  target_price?: number;          // Must be profitable direction from entry
  stop_loss_price?: number;       // Must be on correct side of entry
  position_type?: 'long' | 'short';  // Auto-detected if not provided
  trading_type?: 'spot' | 'futures';  // Trading type
  
  // Enhanced fields
  coingecko_id?: string;          // Auto-resolved if not provided
  caller?: string;                // Defaults to "External API"
  note?: string;                  // Optional description
  user_id?: string;               // Admin user if not provided
  timezone?: string;              // Defaults to "UTC"
  invalidation_price?: number;    // Auto-calculated if not provided
  
  // New: Time conditions support
  time_conditions?: TimeCondition[];
}

interface AlertResponse {
  success: boolean;
  alert_id?: string;
  message?: string;
  alert_data?: {
    coin: string;
    entry_price: number;
    target_price?: number;
    stop_loss_price?: number;
    position_type: string;
    coingecko_id: string;
    has_time_conditions: boolean;
  };
  validation?: {
    warnings: string[];
    auto_resolved_coingecko_id?: boolean;
  };
  error?: string;
  errors?: string[];
  warnings?: string[];
}

// Phone number validation function
export const validatePhoneNumber = (phone: string): boolean => {
  // Must start with + followed by country code and number
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Position validation functions
export const validatePositionLogic = (
  entryPrice: number,
  targetPrice?: number,
  stopLossPrice?: number,
  positionType?: 'long' | 'short'
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!entryPrice || entryPrice <= 0) {
    errors.push('Entry price must be positive');
    return { isValid: false, errors };
  }

  // Auto-detect position type if not provided
  let actualPositionType = positionType;
  if (!actualPositionType && targetPrice) {
    actualPositionType = targetPrice > entryPrice ? 'long' : 'short';
  }

  if (targetPrice && actualPositionType) {
    if (actualPositionType === 'long' && targetPrice <= entryPrice) {
      errors.push('Target price must be above entry for long positions');
    } else if (actualPositionType === 'short' && targetPrice >= entryPrice) {
      errors.push('Target price must be below entry for short positions');
    }
  }

  if (stopLossPrice && actualPositionType) {
    if (actualPositionType === 'long' && stopLossPrice >= entryPrice) {
      errors.push('Stop loss must be below entry for long positions');
    } else if (actualPositionType === 'short' && stopLossPrice <= entryPrice) {
      errors.push('Stop loss must be above entry for short positions');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const API_ENDPOINT = 'https://tcchfpgmwqawcjtwicek.supabase.co/functions/v1/external-alert-creation';

export const submitAlert = async (alertData: AlertSubmission, apiKey: string): Promise<AlertResponse> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        ...alertData,
        coin: alertData.coin.toUpperCase(), // Ensure uppercase
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        errors: result.errors || [result.error || 'Failed to create alert'],
        warnings: result.warnings || []
      };
    }

    return {
      success: true,
      alert_id: result.alert_id,
      message: result.message,
      warnings: result.validation?.warnings || [],
      validation: result.validation
    };

  } catch (error) {
    return {
      success: false,
      errors: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

export type { AlertSubmission, TimeCondition, AlertResponse };