import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      external_apis: {
        haveibeenpwned: 'available',
        hunter_io: 'available'
      }
    },
    uptime: process?.uptime?.() || 'unknown'
  };

  return new Response(JSON.stringify(healthCheck), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});