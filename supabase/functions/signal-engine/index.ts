import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTIFIER_URL = (Deno.env.get("SUPABASE_FUNC_URL") || "") + "/degen-call-notifier";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type PriceEvent = { event: "price"; ticker: string; price: number };
type CandleEvent = { event: "candle_close"; ticker: string; candle: { interval: string; open: number; high: number; low: number; close: number; close_time: number } };
type Payload = PriceEvent | CandleEvent;

function pct(from?: number|null, to?: number|null) {
  if (typeof from !== "number" || typeof to !== "number" || from === 0) return null;
  return ((to - from)/from) * 100;
}

function crossed(direction: "long"|"short", price: number, target: number) {
  return direction === "long" ? price >= target : price <= target;
}

function stopped(direction: "long"|"short", price: number, sl?: number|null) {
  if (typeof sl !== "number") return false;
  return direction === "long" ? price <= sl : price >= sl;
}

async function notify(message: Record<string,unknown>) {
  if (!NOTIFIER_URL) return;
  try {
    await fetch(NOTIFIER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, "content-type":"application/json" },
      body: JSON.stringify({ type: "live_trading_event", ...message })
    });
    console.log("Notification sent:", message);
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("POST only", { 
      status: 405, 
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  const body = await req.json().catch(()=>null) as Payload | null;
  if (!body || !("event" in body)) {
    return new Response("Bad payload", { 
      status: 400, 
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  console.log("Processing signal engine event:", body);

  const ticker = body.ticker;
  const { data: signals, error } = await supabase
    .from("analyst_signals")
    .select("*")
    .eq("ticker", ticker)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching signals:", error);
    return new Response(error.message, { 
      status: 500, 
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  console.log(`Found ${signals?.length || 0} active signals for ${ticker}`);

  for (const s of (signals ?? [])) {
    const direction = s.direction as "long"|"short";
    let currentPrice = s.current_price as number | null;
    
    if (body.event === "price") currentPrice = body.price;
    if (body.event === "candle_close") currentPrice = body.candle.close;

    const curPct = pct(s.entry_price, currentPrice);
    const maxPct = Math.max(s.max_profit_pct ?? (curPct ?? -1e9), curPct ?? -1e9);

    console.log(`Processing signal ${s.id}: direction=${direction}, entry=${s.entry_price}, current=${currentPrice}, profit=${curPct}%`);

    // Check for stop loss hit
    if (body.event === "price" && stopped(direction, currentPrice!, s.stop_loss_price) && !s.stopped_out) {
      console.log(`Stop loss hit for signal ${s.id} at price ${currentPrice}`);
      
      const ev = { 
        id: crypto.randomUUID(), 
        signal_id: s.id, 
        event: "stop_hit", 
        detail: { price: currentPrice } 
      };
      
        await supabase.from("signal_events").insert(ev).then(async () => {
          await supabase.from("analyst_signals").update({
            current_price: currentPrice, 
            current_profit_pct: curPct, 
            max_profit_pct: maxPct, 
            stopped_out: true, 
            status: "closed"
          }).eq("id", s.id);
          
          await notify({ 
            ticker, 
            kind: "position_closed", 
            reason: "stop_loss_hit",
            price: currentPrice, 
            signal_id: s.id,
            entry_price: s.entry_price,
            profit_pct: curPct
          });
        }).catch((error) => {
          console.error("Error handling stop loss:", error);
        });
      continue;
    }

    // Check for target hits
    const targets: number[] = Array.isArray(s.targets) ? s.targets : JSON.parse(s.targets || "[]");
    const hit: number[] = Array.isArray(s.hit_targets) ? s.hit_targets : JSON.parse(s.hit_targets || "[]");
    
    for (let i=0; i<targets.length; i++){
      if (hit.includes(i)) continue;
      if (crossed(direction, currentPrice!, targets[i])) {
        console.log(`Target ${i+1} hit for signal ${s.id} at price ${currentPrice}, target was ${targets[i]}`);
        
        const ev = { 
          id: crypto.randomUUID(), 
          signal_id: s.id, 
          event: "target_hit", 
          level: i, 
          detail: { price: currentPrice, target: targets[i] } 
        };
        
        await supabase.from("signal_events").insert(ev).then(async () => {
          const newHit = [...hit, i].sort((a,b)=>a-b);
          await supabase.from("analyst_signals").update({
            current_price: currentPrice, 
            current_profit_pct: curPct, 
            max_profit_pct: maxPct, 
            hit_targets: newHit
          }).eq("id", s.id);
          
          // Check if all targets hit - close position
          if (newHit.length === targets.length) {
            await supabase.from("analyst_signals").update({
              status: "closed"
            }).eq("id", s.id);
            
            await notify({ 
              ticker, 
              kind: "position_closed", 
              reason: "all_targets_hit",
              price: currentPrice, 
              signal_id: s.id,
              entry_price: s.entry_price,
              profit_pct: curPct
            });
          } else {
            await notify({ 
              ticker, 
              kind: "target_hit", 
              level: i+1, 
              price: currentPrice, 
              target: targets[i], 
              signal_id: s.id 
            });
          }
        }).catch((error) => {
          console.error("Error handling target hit:", error);
        });
      }
    }

    // Check for invalidation conditions on candle close
    if (body.event === "candle_close" && s.invalidation_type && s.invalidation_price && s.invalidation_tf) {
      if (s.invalidation_tf === body.candle.interval) {
        const close = body.candle.close;
        const broke =
          (s.invalidation_type === "candle_close_below" && close < s.invalidation_price) ||
          (s.invalidation_type === "candle_close_above" && close > s.invalidation_price);
          
        if (broke) {
          console.log(`Invalidation triggered for signal ${s.id}: ${s.invalidation_type} at ${close} vs ${s.invalidation_price}`);
          
          const ev = { 
            id: crypto.randomUUID(), 
            signal_id: s.id, 
            event: "invalidation", 
            detail: { 
              close, 
              rule: s.invalidation_type, 
              price: s.invalidation_price 
            } 
          };
          
          await supabase.from("signal_events").insert(ev).then(async () => {
            const finalProfit = pct(s.entry_price, close);
            await supabase.from("analyst_signals").update({
              status: "closed", 
              current_price: close, 
              current_profit_pct: finalProfit, 
              max_profit_pct: maxPct
            }).eq("id", s.id);
            
            await notify({ 
              ticker, 
              kind: "position_closed", 
              reason: "invalidation",
              rule: s.invalidation_type, 
              threshold: s.invalidation_price, 
              price: close, 
              signal_id: s.id,
              entry_price: s.entry_price,
              profit_pct: finalProfit
            });
          }).catch((error) => {
            console.error("Error handling invalidation:", error);
          });
        }
      }
    }

    // Update current price and profit calculations
    if (currentPrice != null) {
      await supabase.from("analyst_signals").update({
        current_price: currentPrice, 
        current_profit_pct: curPct, 
        max_profit_pct: maxPct
      }).eq("id", s.id).catch((error) => {
        console.error("Error updating signal price:", error);
      });
    }
  }

  console.log("Signal engine processing completed");

  return new Response(JSON.stringify({ ok: true }), { 
    headers: { ...corsHeaders, "content-type":"application/json" }
  });
});