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

  // If no API key is configured, skip HIBP breaches gracefully (prevents 401)
  if (!HIBP_API_KEY) {
    console.warn('HIBP_API_KEY not set - skipping HIBP breach check');
    setCachedData(cacheKey, []);
    return [];
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'DigitalFootprintChecker/1.0 (Lovable Edge Function)'
    };
    // Use API key when available
    headers['hibp-api-key'] = HIBP_API_KEY;

    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (response.status === 404) {
      setCachedData(cacheKey, []);
      return [];
    }

    if (response.status === 429) {
      // Rate limited - wait and retry once
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryResponse = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });

      if (retryResponse.status === 404) {
        setCachedData(cacheKey, []);
        return [];
      }

      if (!retryResponse.ok) {
        throw new Error(`HIBP API error: ${retryResponse.status}`);
      }

      const breaches = await retryResponse.json();
      setCachedData(cacheKey, breaches);
      return breaches;
    }

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const breaches = await response.json();
    setCachedData(cacheKey, breaches);
    return breaches;
  } catch (error) {
    console.error('HaveIBeenPwned API error:', error);
    // Don't throw error, return empty array to continue with other data sources
    return [];
  }
}

async function checkXposedOrNot(email: string): Promise<{ breaches: string[], analytics: any }> {
  const cacheKey = `xon_${email}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // First, check for basic breaches
    const basicResponse = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`, {
      signal: AbortSignal.timeout(10000)
    });
    
    let breaches: string[] = [];
    
    if (basicResponse.ok) {
      const basicData = await basicResponse.json();
      if (basicData.breaches && Array.isArray(basicData.breaches) && basicData.breaches.length > 0) {
        breaches = basicData.breaches[0] || [];
      }
    } else if (basicResponse.status !== 404) {
      console.log('XposedOrNot basic API returned:', basicResponse.status);
    }

    // Try to get detailed analytics (this might not always work without API key)
    let analytics = null;
    try {
      const analyticsResponse = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (analyticsResponse.ok) {
        analytics = await analyticsResponse.json();
      }
    } catch (error) {
      console.log('XposedOrNot analytics not available:', error);
    }

    const result = { breaches, analytics };
    console.log(`XposedOrNot found ${breaches.length} breaches for: ${email}`);
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error checking XposedOrNot:', error);
    return { breaches: [], analytics: null };
  }
}

async function checkHunterIO(email: string): Promise<any> {
  const cacheKey = `hunter_${email}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const domain = email.split('@')[1];

    // Discover API - may return 404 if no data for the domain
    const discoverUrl = `https://api.hunter.io/v2/discover?domain=${domain}&api_key=${HUNTER_API_KEY}`;
    const discoverResponse = await fetch(discoverUrl, { signal: AbortSignal.timeout(10000) });

    let discoverData: any = { data: { emails: [] } };
    if (discoverResponse.status === 404) {
      discoverData = { data: { emails: [] } };
    } else if (discoverResponse.ok) {
      discoverData = await discoverResponse.json();
    } else {
      console.warn(`Hunter.io Discover returned ${discoverResponse.status} for ${domain}`);
    }

    // Domain Search for additional context
    const domainSearchUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
    const verifyResponse = await fetch(domainSearchUrl, { signal: AbortSignal.timeout(10000) });

    let verifyData: any = null;
    if (verifyResponse.ok) {
      verifyData = await verifyResponse.json();
    } else if (verifyResponse.status !== 404) {
      console.warn(`Hunter.io Domain Search returned ${verifyResponse.status} for ${domain}`);
    }

    const combinedData = {
      discover: discoverData,
      domain_search: verifyData
    };

    setCachedData(cacheKey, combinedData);
    return combinedData;
  } catch (error) {
    console.error('Hunter.io API error:', error);
    // Return empty structure so we can continue with other data sources
    return { discover: { data: { emails: [] } }, domain_search: null };
  }
}

async function checkEmailRep(email: string): Promise<any | null> {
  const cacheKey = `emailrep_${email}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
      headers: { 'User-Agent': 'DigitalFootprintChecker/1.0 (Lovable Edge Function)' },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn(`EmailRep returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('EmailRep API error:', error);
    return null;
  }
}

async function checkPwnedPasswords(password: string): Promise<{ isPwned: boolean; pwnCount: number }> {
  try {
    // Generate SHA-1 hash of the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Use k-anonymity: send only first 5 characters
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 
        'User-Agent': 'DigitalFootprintChecker/1.0 (Lovable Edge Function)',
        'Add-Padding': 'true' // Enable padding for enhanced privacy
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn(`Pwned Passwords API returned status ${response.status}`);
      return { isPwned: false, pwnCount: 0 };
    }

    const responseText = await response.text();
    const lines = responseText.split('\n');

    // Search for our hash suffix in the response
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix === suffix) {
        const count = parseInt(countStr || '0', 10);
        return { isPwned: true, pwnCount: count };
      }
    }

    return { isPwned: false, pwnCount: 0 };
  } catch (error) {
    console.error('Pwned Passwords API error:', error);
    return { isPwned: false, pwnCount: 0 };
  }
}

function calculatePrivacyScore(hibpBreaches: any[], xonData: { breaches: string[], analytics: any }, hunterData: any, emailRep: any | null, passwordCheck?: { isPwned: boolean; pwnCount: number }): number {
  let score = 100;

  // Combine breach counts from both sources
  const totalBreaches = hibpBreaches.length + xonData.breaches.length;
  
  // Deduct points for breaches (combined from both sources)
  if (totalBreaches > 0) {
    score -= Math.min(totalBreaches * 12, 70);
  }

  // Additional deduction for high-risk breaches from XposedOrNot analytics
  if (xonData.analytics?.BreachMetrics?.risk?.[0]) {
    const riskScore = xonData.analytics.BreachMetrics.risk[0].risk_score;
    if (riskScore >= 8) score -= 15; // High risk
    else if (riskScore >= 5) score -= 10; // Medium risk
    else if (riskScore >= 3) score -= 5; // Low risk
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

  // Deduct based on EmailRep risk indicators
  if (emailRep) {
    if (emailRep.suspicious === true) score -= 20;
    if (emailRep.details?.credentials_leaked === true) score -= 20;
    if (emailRep.details?.malicious_activity === true) score -= 10;
    if (emailRep.details?.blacklisted === true) score -= 15;
  }

  // Deduct points for pwned passwords
  if (passwordCheck?.isPwned) {
    if (passwordCheck.pwnCount > 100000) score -= 30; // Very common password
    else if (passwordCheck.pwnCount > 10000) score -= 25; // Common password
    else if (passwordCheck.pwnCount > 1000) score -= 20; // Moderately common
    else score -= 15; // Less common but still pwned
  }

  return Math.max(score, 0);
}

function generateRecommendations(hibpBreaches: any[], xonData: { breaches: string[], analytics: any }, hunterData: any, emailRep: any | null, passwordCheck?: { isPwned: boolean; pwnCount: number }): string[] {
  const recommendations: string[] = [];

  const totalBreaches = hibpBreaches.length + xonData.breaches.length;
  
  if (totalBreaches > 0) {
    recommendations.push('Change passwords for affected accounts immediately');
    recommendations.push('Enable two-factor authentication on all important accounts');
    recommendations.push('Monitor your credit reports regularly');
    
    // Add specific recommendations based on XposedOrNot analytics
    if (xonData.analytics?.BreachMetrics) {
      const riskData = xonData.analytics.BreachMetrics.risk?.[0];
      if (riskData && riskData.risk_score >= 7) {
        recommendations.push('High-risk breaches detected - consider identity monitoring services');
      }
      
      const passwordStrength = xonData.analytics.BreachMetrics.passwords_strength?.[0];
      if (passwordStrength) {
        if (passwordStrength.PlainText > 0) {
          recommendations.push('Some breaches exposed passwords in plain text - change all passwords immediately');
        } else if (passwordStrength.EasyToCrack > 0) {
          recommendations.push('Some breaches had easily crackable passwords - use stronger passwords');
        }
      }
    }
  }

  const totalEmails = (hunterData?.discover?.data?.emails?.length || 0) + (hunterData?.domain_search?.data?.emails?.length || 0);
  if (totalEmails > 0) {
    recommendations.push('Consider using a professional email for business communications only');
    recommendations.push('Review your email privacy settings');
    recommendations.push('Monitor for unauthorized use of your email on public platforms');
  }

  if (emailRep) {
    if (emailRep.suspicious === true) recommendations.push('Email appears suspicious on some checks — review public profiles linked to it');
    if (emailRep.details?.credentials_leaked === true) recommendations.push('Your email appears in leaked credentials — reset passwords and enable 2FA');
    if (emailRep.details?.blacklisted === true) recommendations.push('Your email is blacklisted by some services — investigate recent activity');
  }

  if (passwordCheck?.isPwned) {
    if (passwordCheck.pwnCount > 100000) {
      recommendations.push(`Password has been compromised ${passwordCheck.pwnCount.toLocaleString()} times - change immediately`);
    } else if (passwordCheck.pwnCount > 10000) {
      recommendations.push(`Password appears in ${passwordCheck.pwnCount.toLocaleString()} breaches - highly recommended to change`);
    } else {
      recommendations.push(`Password found in ${passwordCheck.pwnCount.toLocaleString()} breaches - consider changing`);
    }
    recommendations.push('Use a unique, strong password that has not been compromised');
    recommendations.push('Consider using a password manager to generate secure passwords');
  }

  if (totalBreaches === 0 && totalEmails === 0 && !emailRep?.suspicious && !passwordCheck?.isPwned) {
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
    const { email, user_id, password } = await req.json();

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

    // Check all data sources in parallel
    const [hibpBreaches, xonData, hunterData, emailRep] = await Promise.all([
      checkHaveIBeenPwned(email),
      checkXposedOrNot(email),
      checkHunterIO(email),
      checkEmailRep(email)
    ]);
    
    console.log(`Found ${hibpBreaches.length} HIBP breaches and ${xonData.breaches.length} XposedOrNot breaches`);

    // Check password if provided (optional for additional security analysis)
    let passwordCheck = null;
    if (password && typeof password === 'string' && password.length > 0) {
      passwordCheck = await checkPwnedPasswords(password);
      console.log(`Password check completed: ${passwordCheck.isPwned ? 'PWNED' : 'SAFE'}`);
    }

    // Calculate privacy score
    const score = calculatePrivacyScore(hibpBreaches, xonData, hunterData, emailRep, passwordCheck);

    // Generate recommendations
    const recommendations = generateRecommendations(hibpBreaches, xonData, hunterData, emailRep, passwordCheck);

    // Extract data from Hunter.io responses
    const discoverEmails = hunterData?.discover?.data?.emails || [];
    const domainEmails = hunterData?.domain_search?.data?.emails || [];
    const totalEmails = discoverEmails.length + domainEmails.length;
    
    const domain = hunterData?.discover?.data?.domain || hunterData?.domain_search?.data?.domain;

    // Combine breach data from both sources
    const combinedBreaches = [
      ...hibpBreaches.map((breach: any) => ({
        name: breach.Name,
        domain: breach.Domain,
        breach_date: breach.BreachDate,
        pwn_count: breach.PwnCount,
        description: breach.Description,
        data_classes: breach.DataClasses,
        source: 'HaveIBeenPwned'
      })),
      ...xonData.breaches.map((breachName: string) => ({
        name: breachName,
        domain: null,
        breach_date: null,
        pwn_count: null,
        description: `Breach detected in XposedOrNot database`,
        data_classes: [],
        source: 'XposedOrNot'
      }))
    ];

    const totalBreaches = combinedBreaches.length;

    const result = {
      email,
      score,
      breach_count: totalBreaches,
      platforms_found: totalEmails,
      breaches: combinedBreaches,
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
      emailrep: emailRep || null,
      password_check: passwordCheck ? {
        is_pwned: passwordCheck.isPwned,
        pwn_count: passwordCheck.pwnCount,
        checked: true
      } : { checked: false },
      recommendations,
      summary: `Found ${totalBreaches} data breach${totalBreaches !== 1 ? 'es' : ''} and ${totalEmails} public email exposure${totalEmails !== 1 ? 's' : ''}${passwordCheck?.isPwned ? `, password compromised ${passwordCheck.pwnCount} times` : ''}. Privacy score: ${score}/100.${emailRep?.reputation ? ' Reputation: ' + emailRep.reputation : ''}`
    };

    // Store in database if user_id provided
    if (user_id) {
      try {
        const { error: dbError } = await supabase
          .from('footprint_results')
          .insert({
            user_id,
            score,
            breach_count: totalBreaches,
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