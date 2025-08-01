import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // External WebSocket connection details
  const externalWsUrl = 'wss://tccfpgmwqawcjtwicek.supabase.co/functions/v1/active-alerts-realtime';
  const externalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjY2ZwZ213cWF3Y2p0d2ljZWsiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDU0MzAwNCwiZXhwIjoyMDUwMTE5MDA0fQ.VjJoKJNxKBH7ihCa0IIjKzxetjDlF0TvnJmyV-i1lT8';
  
  let externalWs: WebSocket | null = null;
  let pingInterval: number | null = null;
  let reconnectTimeout: number | null = null;

  const connectToExternal = () => {
    try {
      console.log('🔌 Connecting to external alerts WebSocket...', externalWsUrl);
      
      // Test if the URL is reachable first
      fetch(externalWsUrl.replace('wss://', 'https://').replace('ws://', 'http://'))
        .then(() => console.log('✅ External URL is reachable'))
        .catch(err => console.warn('⚠️ External URL test failed:', err.message));
      
      externalWs = new WebSocket(externalWsUrl, [], {
        headers: {
          'Authorization': `Bearer ${externalAnonKey}`,
          'apikey': externalAnonKey,
        }
      });

      externalWs.onopen = () => {
        console.log('✅ Connected to external alerts WebSocket');
        
        // Request initial data immediately after connection
        if (externalWs?.readyState === WebSocket.OPEN) {
          console.log('📤 Requesting initial alerts data');
          externalWs.send(JSON.stringify({ type: 'get_alerts' }));
        }
        
        // Set up ping interval for external connection
        pingInterval = setInterval(() => {
          if (externalWs?.readyState === WebSocket.OPEN) {
            console.log('📤 Sending ping to external service');
            externalWs.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        // Also try to fetch from REST API as fallback
        console.log('🔄 Fetching initial data from REST API as fallback...');
        fetch('https://tccfpgmwqawcjtwicek.supabase.co/functions/v1/active-trades-widget', {
          headers: {
            'Authorization': `Bearer ${externalAnonKey}`,
            'apikey': externalAnonKey,
          }
        })
        .then(response => response.json())
        .then(data => {
          console.log('📊 REST API fallback data:', data);
          if (data && socket.readyState === WebSocket.OPEN) {
            // Transform REST data if needed and send to client
            socket.send(JSON.stringify({
              type: 'initial_data',
              alerts: data.data || [],
              tradingCount: data.data?.filter((alert: any) => alert.isActive).length || 0,
              awaitingCount: data.data?.filter((alert: any) => !alert.isActive).length || 0,
              totalCount: data.data?.length || 0,
              timestamp: Date.now(),
              source: 'rest_fallback'
            }));
          }
        })
        .catch(err => console.error('❌ REST API fallback failed:', err));
      };

      externalWs.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          console.log('📨 Received message from external service:', {
            type: messageData.type,
            dataCount: messageData.data?.length || 0,
            timestamp: messageData.timestamp,
            count: messageData.count
          });
          
          // Transform the data format to match our expected structure
          if (messageData.type === 'alerts_update' && messageData.data) {
            const transformedData = {
              type: 'initial_data',
              alerts: messageData.data.map((alert: any) => ({
                id: alert.id,
                coin: alert.symbol,
                entryPrice: alert.entry,
                targetPrice: alert.target,
                stopLossPrice: alert.stopLoss,
                status: alert.isActive ? 'trading' : 'awaiting_entry',
                positionType: 'long', // Default, could be derived from other fields
                caller: alert.caller,
                triggeredAt: alert.entryActivated ? new Date().toISOString() : null,
                entryActivated: alert.entryActivated,
                createdAt: new Date().toISOString()
              })),
              tradingCount: messageData.data.filter((alert: any) => alert.isActive).length,
              awaitingCount: messageData.data.filter((alert: any) => !alert.isActive).length,
              totalCount: messageData.count || messageData.data.length,
              timestamp: messageData.timestamp
            };
            
            console.log('📊 Transformed data:', {
              alertsCount: transformedData.alerts.length,
              tradingCount: transformedData.tradingCount,
              awaitingCount: transformedData.awaitingCount
            });
            
            // Send transformed data to client
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(transformedData));
            }
          } else {
            // Forward other message types as-is (ping/pong, etc.)
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          }
        } catch (error) {
          console.error('❌ Error parsing/transforming message:', error);
          // Still try to forward raw data if transformation fails
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        }
      };

      externalWs.onclose = (event) => {
        console.log('🔌 External WebSocket closed:', event.code, event.reason);
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        
        // Attempt to reconnect after 5 seconds
        if (!reconnectTimeout) {
          console.log('🔄 Scheduling reconnection in 5 seconds...');
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            if (socket.readyState === WebSocket.OPEN) {
              connectToExternal();
            }
          }, 5000);
        }
      };

      externalWs.onerror = (error) => {
        console.error('❌ External WebSocket error:', error);
      };
    } catch (error) {
      console.error('❌ Error connecting to external WebSocket:', error);
    }
  };

  socket.onopen = () => {
    console.log('✅ Client WebSocket connection opened');
    connectToExternal();
  };

  socket.onmessage = (event) => {
    try {
      console.log('📨 Received message from client:', event.data);
      // Forward client messages to external service
      if (externalWs?.readyState === WebSocket.OPEN) {
        externalWs.send(event.data);
      }
    } catch (error) {
      console.error('❌ Error forwarding message to external service:', error);
    }
  };

  socket.onclose = () => {
    console.log('🔌 Client WebSocket connection closed');
    
    // Clean up external connection and intervals
    if (externalWs) {
      externalWs.close();
    }
    if (pingInterval) {
      clearInterval(pingInterval);
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
  };

  socket.onerror = (error) => {
    console.error('❌ Client WebSocket error:', error);
  };

  return response;
});
