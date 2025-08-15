import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CMC_API_KEY = Deno.env.get("CMC_API_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Mapping = { ticker: string; coingecko_id?: string; cmc_id?: number; binance_symbol?: string };

async function getMapping(ticker: string): Promise<Mapping | null> {
  const url = `${SUPABASE_URL}/rest/v1/ticker_mappings?select=ticker,coingecko_id,cmc_id,binance_symbol&ticker=eq.${encodeURIComponent(ticker)}`;
  const r = await fetch(url, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }});
  const rows = await r.json();
  return rows?.[0] ?? null;
}

async function withTimeout<T>(p: Promise<T>, ms=800): Promise<T | null> {
  return await Promise.race([p.then(v=>v).catch(()=>null), new Promise<null>(res=>setTimeout(()=>res(null), ms))]);
}

async function fromCoingecko(id?: string) {
  if (!id) return null;
  const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`);
  if (!r.ok) return null; 
  const j = await r.json(); 
  const v = j?.[id]?.usd;
  return typeof v === "number" ? v : null;
}

async function fromCMC(id?: number) {
  if (!id || !CMC_API_KEY) return null;
  const r = await fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${id}`, { headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY }});
  if (!r.ok) return null; 
  const j = await r.json();
  const v = j?.data?.[id]?.[0]?.quote?.USD?.price ?? j?.data?.[id]?.quote?.USD?.price;
  return typeof v === "number" ? v : null;
}

async function fromBinanceREST(symbol?: string) {
  if (!symbol) return null; 
  const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
  if (!r.ok) return null; 
  const j = await r.json(); 
  const v = parseFloat(j?.price);
  return Number.isFinite(v) ? v : null;
}

function median(values: number[]) {
  const a = [...values].sort((x,y)=>x-y); 
  const m = Math.floor(a.length/2);
  return a.length % 2 ? a[m] : (a[m-1] + a[m]) / 2;
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

  const { ticker } = await req.json().catch(()=>({}));
  if (!ticker) {
    return new Response("ticker required", { 
      status: 400, 
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  console.log(`Fetching price for ticker: ${ticker}`);
  
  const map = await getMapping(ticker);
  if (!map) {
    return new Response(JSON.stringify({ price: null, sources: [], error: "no mapping" }), { 
      headers: { ...corsHeaders, "content-type":"application/json" }
    });
  }

  console.log(`Found mapping for ${ticker}:`, map);

  const [cg, cmc, bin] = await Promise.all([
    withTimeout(fromCoingecko(map.coingecko_id)),
    withTimeout(fromCMC(map.cmc_id)),
    withTimeout(fromBinanceREST(map.binance_symbol)),
  ]);
  
  console.log(`Price sources - CoinGecko: ${cg}, CMC: ${cmc}, Binance: ${bin}`);
  
  const vals = [cg, cmc, bin].filter((v): v is number => typeof v === "number");
  const price = vals.length ? median(vals) : null;

  console.log(`Final aggregated price for ${ticker}: ${price}`);

  return new Response(JSON.stringify({
    price,
    sources: [
      {name:"coingecko", value: cg},
      {name:"cmc", value: cmc},
      {name:"binance_rest", value: bin}
    ]
  }), { 
    headers: { ...corsHeaders, "content-type":"application/json" }
  });
});