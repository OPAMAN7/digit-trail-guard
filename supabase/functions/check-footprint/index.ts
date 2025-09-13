import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HIBP_API_KEY = Deno.env.get('HIBP_API_KEY');
const HUNTER_API_KEY = '8e0c9461ccd2e654c8ba623eea1b1976220554f3';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// In-memory cache with 10-minute expiration
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

function getCachedData(key: string): any | null {
  const entry = cache.get(key) as CacheEntry;
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function checkHaveIBeenPwned(email: string): Promise<any[]> {
  const cacheKey = `hibp_${email}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
      headers: {
        'hibp-api-key': HIBP_API_KEY!,
        'User-Agent': 'DigitalFootprintChecker'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 404) {
      setCachedData(cacheKey, []);
      return [];
    }

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const breaches = await response.json();
    setCachedData(cacheKey, breaches);
    return breaches;
  } catch (error) {
    console.error('HaveIBeenPwned API error:', error);
    throw error;
  }
}

async function checkHunterIO(email: string): Promise<any> {
  const cacheKey = `hunter_${email}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const domain = email.split('@')[1];
    
    // Call discover API to get domain information and emails
    const discoverResponse = await fetch(`https://api.hunter.io/v2/discover?domain=${domain}&api_key=${HUNTER_API_KEY}`, {
      signal: AbortSignal.timeout(10000)
    });

    if (!discoverResponse.ok) {
      throw new Error(`Hunter.io Discover API error: ${discoverResponse.status}`);
    }

    const discoverData = await discoverResponse.json();
    
    // Try to get additional domain verification data
    const verifyResponse = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`, {
      signal: AbortSignal.timeout(10000)
    });
    
    let verifyData = null;
    if (verifyResponse.ok) {
      verifyData = await verifyResponse.json();
    }

    // Combine the data
    const combinedData = {
      discover: discoverData,
      domain_search: verifyData
    };

    setCachedData(cacheKey, combinedData);
    return combinedData;
  } catch (error) {
    console.error('Hunter.io API error:', error);
    throw error;
  }
}

function calculatePrivacyScore(breaches: any[], hunterData: any): number {
  let score = 100;

  // Deduct points for breaches
  if (breaches.length > 0) {
    score -= Math.min(breaches.length * 15, 70);
  }

  // Deduct points for public exposure from discover API
  const discoverEmails = hunterData?.discover?.data?.emails?.length || 0;
  if (discoverEmails > 0) {
    score -= Math.min(discoverEmails * 5, 25);
  }

  // Deduct points for domain search results
  const domainEmails = hunterData?.domain_search?.data?.emails?.length || 0;
  if (domainEmails > 0) {
    score -= Math.min(domainEmails * 3, 20);
  }

  // Deduct points for domain exposure
  const domain = hunterData?.discover?.data?.domain || hunterData?.domain_search?.data?.domain;
  if (domain?.webmail === false) {
    score -= 10;
  }

  return Math.max(score, 0);
}

function generateRecommendations(breaches: any[], hunterData: any): string[] {
  const recommendations = [];

  if (breaches.length > 0) {
    recommendations.push('Change passwords for affected accounts immediately');
    recommendations.push('Enable two-factor authentication on all important accounts');
    recommendations.push('Monitor your credit reports regularly');
  }

  const totalEmails = (hunterData?.discover?.data?.emails?.length || 0) + (hunterData?.domain_search?.data?.emails?.length || 0);
  
  if (totalEmails > 0) {
    recommendations.push('Consider using a professional email for business communications only');
    recommendations.push('Review your email privacy settings');
    recommendations.push('Monitor for unauthorized use of your email on public platforms');
  }

  const domain = hunterData?.discover?.data?.domain || hunterData?.domain_search?.data?.domain;
  if (domain && !domain.webmail) {
    recommendations.push('Review your company\'s email exposure policies');
  }

  if (breaches.length === 0 && totalEmails === 0) {
    recommendations.push('Your digital footprint appears minimal - maintain good privacy practices');
    recommendations.push('Use unique passwords for each account');
  }

  return recommendations;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, user_id } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Checking footprint for email: ${email}`);

    // Check HaveIBeenPwned
    const breaches = await checkHaveIBeenPwned(email);
    console.log(`Found ${breaches.length} breaches`);

    // Check Hunter.io
    const hunterData = await checkHunterIO(email);
    console.log('Hunter.io data retrieved');

    // Calculate privacy score
    const score = calculatePrivacyScore(breaches, hunterData);

    // Generate recommendations
    const recommendations = generateRecommendations(breaches, hunterData);

    // Extract data from Hunter.io responses
    const discoverEmails = hunterData?.discover?.data?.emails || [];
    const domainEmails = hunterData?.domain_search?.data?.emails || [];
    const totalEmails = discoverEmails.length + domainEmails.length;
    
    const domain = hunterData?.discover?.data?.domain || hunterData?.domain_search?.data?.domain;

    const result = {
      email,
      score,
      breach_count: breaches.length,
      platforms_found: totalEmails,
      breaches: breaches.map((breach: any) => ({
        name: breach.Name,
        domain: breach.Domain,
        breach_date: breach.BreachDate,
        pwn_count: breach.PwnCount,
        description: breach.Description,
        data_classes: breach.DataClasses
      })),
      hunter_data: {
        domain: domain?.domain || null,
        emails_found: totalEmails,
        confidence: domain?.confidence || null,
        country: domain?.country || null,
        disposable: domain?.disposable || false,
        webmail: domain?.webmail || false,
        discover_emails: discoverEmails,
        domain_search_emails: domainEmails
      },
      recommendations,
      summary: `Found ${breaches.length} data breaches and ${totalEmails} public email exposures. Privacy score: ${score}/100.`
    };

    // Store in database if user_id provided
    if (user_id) {
      try {
        const { error: dbError } = await supabase
          .from('footprint_results')
          .insert({
            user_id,
            score,
            breach_count: breaches.length,
            platforms_found: totalEmails.toString(),
            summary: result.summary
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in check-footprint function:', error);
    
    if (error.message.includes('HIBP API error') || error.message.includes('Hunter.io API error')) {
      return new Response(JSON.stringify({ 
        error: 'External API temporarily unavailable',
        details: error.message 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});