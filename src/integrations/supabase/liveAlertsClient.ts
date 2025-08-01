// Separate client for live alerts database
import { createClient } from '@supabase/supabase-js';

const LIVE_ALERTS_SUPABASE_URL = "https://tcchfpgmwqawcjtwicek.supabase.co";
const LIVE_ALERTS_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjY2hmcGdtd3Fhd2NqdHdpY2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDI5OTksImV4cCI6MjA2MTc3ODk5OX0.MtrH7THZO7jpvJGgQf4-q6Wc5lcSu7b2db5tA_sTQYM";

export const liveAlertsSupabase = createClient(LIVE_ALERTS_SUPABASE_URL, LIVE_ALERTS_SUPABASE_KEY);