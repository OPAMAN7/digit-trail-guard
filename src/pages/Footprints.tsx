import { Eye, ExternalLink, AlertTriangle, Clock, Search, Loader2, ChevronDown, ChevronUp, Info, Shield, Globe, Mail, FileText, Database, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface FootprintItem {
  id: string;
  siteName: string;
  url: string;
  dataFound: string[];
  lastSeen: string;
  riskLevel: "low" | "medium" | "high";
  category: string;
  description?: string;
  confidence?: number;
  pwnCount?: number;
}

interface BreachData {
  name: string;
  domain: string;
  breach_date: string;
  pwn_count: number;
  description: string;
  data_classes: string[];
}

interface HunterData {
  domain: string | null;
  emails_found: number;
  confidence: number | null;
  country: string | null;
  disposable: boolean;
  webmail: boolean;
  discover_emails?: any[];
  domain_search_emails?: any[];
}

interface FootprintResult {
  email: string;
  score: number;
  breach_count: number;
  platforms_found: number;
  breaches: BreachData[];
  hunter_data: HunterData;
  xposed_or_not?: {
    breach_count: number;
    breaches: string[];
    analytics: any;
    detailed: {
      breachesSummary: any;
      exposedBreaches: any;
      breachMetrics: any;
      xposedData: any;
      pastesSummary: any;
      exposedPastes: any;
      pasteMetrics: any;
    };
  };
  password_check?: {
    is_pwned: boolean;
    pwn_count: number;
    checked: boolean;
  };
  recommendations: string[];
  summary: string;
}

export const Footprints = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [footprintData, setFootprintData] = useState<FootprintResult | null>(null);
  const [footprints, setFootprints] = useState<FootprintItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showSearchForm, setShowSearchForm] = useState(false);
  const { toast } = useToast();

  // Load existing scan results on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem('latestScanResult');
    if (savedResults) {
      try {
        const data = JSON.parse(savedResults);
        loadFootprintData(data);
        setEmail(data.email || "");
      } catch (error) {
        console.error('Error loading saved results:', error);
        setShowSearchForm(true);
      }
    } else {
      setShowSearchForm(true);
    }
  }, []);

  const loadFootprintData = (data: FootprintResult) => {
    setFootprintData(data);
    
    // Convert API data to FootprintItem format
    const footprintItems: FootprintItem[] = [];
    
    // Add breaches as footprint items with detailed information
    data.breaches.forEach((breach: BreachData, index: number) => {
      footprintItems.push({
        id: `breach-${index}`,
        siteName: breach.name,
        url: breach.domain || 'Unknown',
        dataFound: breach.data_classes || ['Email'],
        lastSeen: new Date(breach.breach_date).toISOString(),
        riskLevel: breach.pwn_count > 10000000 ? "high" : breach.pwn_count > 1000000 ? "medium" : "low",
        category: "Data Breach",
        description: breach.description,
        pwnCount: breach.pwn_count
      });
    });

    // Add Hunter.io discovered emails as separate footprint items
    if (data.hunter_data.discover_emails) {
      data.hunter_data.discover_emails.forEach((emailData: any, index: number) => {
        footprintItems.push({
          id: `hunter-discover-${index}`,
          siteName: emailData.domain || data.hunter_data.domain,
          url: emailData.domain || data.hunter_data.domain,
          dataFound: ["Email Address", "Public Profile", ...(emailData.sources || [])],
          lastSeen: new Date(emailData.last_seen_on || Date.now()).toISOString(),
          riskLevel: emailData.confidence > 90 ? "high" : emailData.confidence > 50 ? "medium" : "low",
          category: "Public Directory",
          confidence: emailData.confidence
        });
      });
    }

    // Add Hunter.io domain search results
    if (data.hunter_data.domain_search_emails) {
      data.hunter_data.domain_search_emails.forEach((emailData: any, index: number) => {
        footprintItems.push({
          id: `hunter-domain-${index}`,
          siteName: `${emailData.first_name || ''} ${emailData.last_name || ''}`.trim() || emailData.value,
          url: emailData.domain || data.hunter_data.domain,
          dataFound: ["Email Address", "Name", "Position", "Phone"].filter(Boolean),
          lastSeen: new Date().toISOString(),
          riskLevel: emailData.confidence > 90 ? "high" : emailData.confidence > 50 ? "medium" : "low",
          category: emailData.type === "personal" ? "Personal Email" : "Corporate Email",
          confidence: emailData.confidence
        });
      });
    }

    // Add Hunter.io domain data as footprint item
    if (data.hunter_data.domain) {
      const domainRisk = data.hunter_data.disposable ? "low" : 
                        data.hunter_data.webmail ? "medium" : "high";
      
      footprintItems.push({
        id: "hunter-domain",
        siteName: data.hunter_data.domain,
        url: data.hunter_data.domain,
        dataFound: [
          "Domain Information", 
          "Email Pattern",
          ...(data.hunter_data.country ? [`Location: ${data.hunter_data.country}`] : []),
          ...(data.hunter_data.disposable ? ["Disposable Email"] : []),
          ...(data.hunter_data.webmail ? ["Webmail Service"] : ["Corporate Domain"])
        ],
        lastSeen: new Date().toISOString(),
        riskLevel: domainRisk,
        category: data.hunter_data.webmail ? "Webmail Provider" : "Corporate Domain"
      });
    }

    setFootprints(footprintItems);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const searchFootprint = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to search",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-footprint', {
        body: { email }
      });

      if (error) throw error;

      loadFootprintData(data);
      // Save to localStorage for future visits
      localStorage.setItem('latestScanResult', JSON.stringify(data));

      toast({
        title: "Search Complete",
        description: `Found ${data.breach_count} breaches and ${data.platforms_found} platforms`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search digital footprint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };
  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case "high": return "bg-destructive/20 text-destructive";
      case "medium": return "bg-yellow-500/20 text-yellow-500";
      case "low": return "bg-green-500/20 text-green-500";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Data Breach": "bg-red-500/20 text-red-400",
      "Public Directory": "bg-orange-500/20 text-orange-400",
      "Corporate Email": "bg-blue-500/20 text-blue-400",
      "Personal Email": "bg-green-500/20 text-green-400",
      "Webmail Provider": "bg-purple-500/20 text-purple-400",
      "Corporate Domain": "bg-indigo-500/20 text-indigo-400"
    };
    return colors[category] || "bg-muted/20 text-muted-foreground";
  };

  return (
    <div className="space-y-lg pt-lg">
      <div className="text-center space-y-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/20 flex items-center justify-center glow-accent mb-md">
          <Eye className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-xl font-semibold">Digital Footprints</h1>
        <p className="text-muted-foreground text-sm">
          Search for your digital footprint across breaches and platforms
        </p>
      </div>

      {/* Search Form - Only show if no results or user wants to search different email */}
      {(showSearchForm || footprints.length === 0) && (
        <div className="glass p-md rounded-2xl space-y-sm">
          <div className="flex gap-sm">
            <Input
              type="email"
              placeholder="Enter email address to search..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={searchFootprint} disabled={loading || !email}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Show search different email button if results are loaded */}
      {footprints.length > 0 && !showSearchForm && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowSearchForm(true)}
            className="glass border-accent/20 hover:bg-accent/10"
          >
            Search Different Email
          </Button>
        </div>
      )}

      {footprintData && (
        <div className="space-y-sm">
          {/* Privacy Score */}
          <div className="glass p-md rounded-2xl space-y-sm">
            <h2 className="font-semibold">Privacy Score</h2>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{footprintData.score}/100</div>
              <Badge className={footprintData.score >= 80 ? "bg-green-500/20 text-green-500" : footprintData.score >= 60 ? "bg-yellow-500/20 text-yellow-500" : "bg-destructive/20 text-destructive"}>
                {footprintData.score >= 80 ? "Good" : footprintData.score >= 60 ? "Fair" : "Poor"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{footprintData.summary}</p>
          </div>

          {/* Password Security Check */}
          {footprintData.password_check?.checked && (
            <div className={`glass p-md rounded-2xl space-y-sm ${footprintData.password_check.is_pwned ? 'border-destructive/20' : 'border-green-500/20'}`}>
              <h2 className="font-semibold flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${footprintData.password_check.is_pwned ? 'text-destructive' : 'text-green-500'}`} />
                Password Security
              </h2>
              <div className="flex items-center justify-between">
                <div className={`text-lg font-bold ${footprintData.password_check.is_pwned ? 'text-destructive' : 'text-green-500'}`}>
                  {footprintData.password_check.is_pwned ? '⚠️ COMPROMISED' : '✅ SECURE'}
                </div>
                {footprintData.password_check.is_pwned && (
                  <Badge className="bg-destructive/20 text-destructive">
                    {footprintData.password_check.pwn_count.toLocaleString()} breaches
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {footprintData.password_check.is_pwned 
                  ? `Your password has been found in ${footprintData.password_check.pwn_count.toLocaleString()} known data breaches. Consider changing it immediately.`
                  : 'Your password was not found in any known data breaches.'
                }
              </p>
            </div>
          )}

          {/* XposedOrNot Detailed Analysis */}
          {footprintData.xposed_or_not?.detailed && (
            <div className="space-y-sm">
              {/* Breaches Summary */}
              {footprintData.xposed_or_not.detailed.breachesSummary && (
                <div className="glass p-md rounded-2xl space-y-sm">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Breaches Summary
                  </h2>
                  <div className="text-sm space-y-2">
                    {typeof footprintData.xposed_or_not.detailed.breachesSummary === 'object' ? (
                      <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(footprintData.xposed_or_not.detailed.breachesSummary, null, 2)}
                      </pre>
                    ) : (
                      <p>{footprintData.xposed_or_not.detailed.breachesSummary}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Exposed Breaches Details */}
              {footprintData.xposed_or_not.detailed.exposedBreaches && (
                <div className="glass p-md rounded-2xl space-y-sm">
                  <h2 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Exposed Breaches Details
                  </h2>
                  <div className="text-sm space-y-2">
                    {Array.isArray(footprintData.xposed_or_not.detailed.exposedBreaches) ? (
                      <div className="space-y-3">
                        {footprintData.xposed_or_not.detailed.exposedBreaches.map((breach: any, index: number) => (
                          <div key={index} className="bg-muted/50 p-3 rounded-lg">
                            <h4 className="font-medium text-destructive">{breach.name || breach.Name || `Breach ${index + 1}`}</h4>
                            {breach.description && <p className="text-xs mt-1 text-muted-foreground">{breach.description}</p>}
                            {breach.domain && <p className="text-xs"><strong>Domain:</strong> {breach.domain}</p>}
                            {breach.industry && <p className="text-xs"><strong>Industry:</strong> {breach.industry}</p>}
                            {breach.risk_level && <p className="text-xs"><strong>Risk Level:</strong> {breach.risk_level}</p>}
                            {breach.year && <p className="text-xs"><strong>Year:</strong> {breach.year}</p>}
                            {breach.records && <p className="text-xs"><strong>Records:</strong> {breach.records.toLocaleString()}</p>}
                            {breach.exposed_data && (
                              <div className="text-xs mt-2">
                                <strong>Exposed Data:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.isArray(breach.exposed_data) ? 
                                    breach.exposed_data.map((data: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">{data}</Badge>
                                    )) : 
                                    <span>{breach.exposed_data}</span>
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(footprintData.xposed_or_not.detailed.exposedBreaches, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Breach Metrics */}
              {footprintData.xposed_or_not.detailed.breachMetrics && (
                <div className="glass p-md rounded-2xl space-y-sm">
                  <h2 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    Breach Analytics & Metrics
                  </h2>
                  <div className="text-sm space-y-3">
                    {/* Risk Score */}
                    {footprintData.xposed_or_not.detailed.breachMetrics.risk && (
                      <div>
                        <h4 className="font-medium mb-2">Risk Assessment</h4>
                        {footprintData.xposed_or_not.detailed.breachMetrics.risk.map((risk: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span>Risk Level: {risk.risk_label}</span>
                            <Badge className={`${risk.risk_score >= 7 ? 'bg-destructive' : risk.risk_score >= 4 ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
                              Score: {risk.risk_score}/10
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Password Strength */}
                    {footprintData.xposed_or_not.detailed.breachMetrics.passwords_strength && (
                      <div>
                        <h4 className="font-medium mb-2">Password Security Analysis</h4>
                        {footprintData.xposed_or_not.detailed.breachMetrics.passwords_strength.map((strength: any, index: number) => (
                          <div key={index} className="grid grid-cols-2 gap-2 text-xs">
                            {strength.PlainText > 0 && <div className="p-2 bg-destructive/20 text-destructive rounded">Plain Text: {strength.PlainText}</div>}
                            {strength.EasyToCrack > 0 && <div className="p-2 bg-orange-500/20 text-orange-600 rounded">Easy to Crack: {strength.EasyToCrack}</div>}
                            {strength.StrongHash > 0 && <div className="p-2 bg-green-500/20 text-green-600 rounded">Strong Hash: {strength.StrongHash}</div>}
                            {strength.Unknown > 0 && <div className="p-2 bg-muted/50 rounded">Unknown: {strength.Unknown}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Industry Breakdown */}
                    {footprintData.xposed_or_not.detailed.breachMetrics.industry && (
                      <div>
                        <h4 className="font-medium mb-2">Affected Industries</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Array.isArray(footprintData.xposed_or_not.detailed.breachMetrics.industry[0]) && 
                            footprintData.xposed_or_not.detailed.breachMetrics.industry[0]
                              .filter(([_, count]: [string, number]) => count > 0)
                              .map(([industry, count]: [string, number], index: number) => (
                                <div key={index} className="flex justify-between p-1 bg-muted/50 rounded">
                                  <span>{industry}</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Exposed Data Types */}
              {footprintData.xposed_or_not.detailed.xposedData && (
                <div className="glass p-md rounded-2xl space-y-sm">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5 text-red-500" />
                    Exposed Data Types
                  </h2>
                  <div className="text-sm space-y-2">
                    {Array.isArray(footprintData.xposed_or_not.detailed.xposedData) ? (
                      <div className="space-y-2">
                        {footprintData.xposed_or_not.detailed.xposedData.map((dataGroup: any, index: number) => (
                          <div key={index} className="bg-muted/50 p-3 rounded-lg">
                            <h4 className="font-medium">{dataGroup.name || `Data Group ${index + 1}`}</h4>
                            {dataGroup.children && Array.isArray(dataGroup.children) && (
                              <div className="mt-2 space-y-1">
                                {dataGroup.children.map((child: any, childIndex: number) => (
                                  <div key={childIndex} className="ml-3">
                                    <p className="text-xs font-medium">{child.name}</p>
                                    {child.children && Array.isArray(child.children) && (
                                      <div className="ml-3 flex flex-wrap gap-1 mt-1">
                                        {child.children.map((item: any, itemIndex: number) => (
                                          <Badge key={itemIndex} variant="outline" className="text-xs">
                                            {item.name}: {item.value}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(footprintData.xposed_or_not.detailed.xposedData, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Pastes Summary */}
              {footprintData.xposed_or_not.detailed.pastesSummary && (
                <div className="glass p-md rounded-2xl space-y-sm">
                  <h2 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-500" />
                    Paste Exposures Summary
                  </h2>
                  <div className="text-sm">
                    <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(footprintData.xposed_or_not.detailed.pastesSummary, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Exposed Pastes */}
              {footprintData.xposed_or_not.detailed.exposedPastes && (
                <div className="glass p-md rounded-2xl space-y-sm">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-500" />
                    Detailed Paste Exposures
                  </h2>
                  <div className="text-sm">
                    <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(footprintData.xposed_or_not.detailed.exposedPastes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Paste Metrics */}
              {footprintData.xposed_or_not.detailed.pasteMetrics && (
                <div className="glass p-md rounded-2xl space-y-sm">
                  <h2 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Paste Analytics & Trends
                  </h2>
                  <div className="text-sm">
                    <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(footprintData.xposed_or_not.detailed.pasteMetrics, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      )}

      {footprints.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Enter an email address above to search for digital footprints</p>
        </div>
      )}

      {/* Summary Stats */}
      {footprints.length > 0 && (
        <div className="grid grid-cols-3 gap-sm">
          <div className="glass p-sm rounded-2xl text-center">
            <div className="text-lg font-bold text-destructive">{footprints.filter(f => f.riskLevel === "high").length}</div>
            <div className="text-xs text-muted-foreground">High Risk</div>
          </div>
          <div className="glass p-sm rounded-2xl text-center">
            <div className="text-lg font-bold text-yellow-500">{footprints.filter(f => f.riskLevel === "medium").length}</div>
            <div className="text-xs text-muted-foreground">Medium Risk</div>
          </div>
          <div className="glass p-sm rounded-2xl text-center">
            <div className="text-lg font-bold text-green-500">{footprints.filter(f => f.riskLevel === "low").length}</div>
            <div className="text-xs text-muted-foreground">Low Risk</div>
          </div>
        </div>
      )}

      {/* Footprints List */}
      {footprints.length > 0 && (
        <div className="space-y-sm">
          {footprints.map((footprint) => (
            <Collapsible key={footprint.id} open={expandedItems.has(footprint.id)} onOpenChange={() => toggleExpanded(footprint.id)}>
              <div className="glass p-md rounded-2xl space-y-sm">
                {/* Header */}
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-sm">
                      <h3 className="font-semibold">{footprint.siteName}</h3>
                      <Badge className={getRiskBadgeClass(footprint.riskLevel)}>
                        {footprint.riskLevel} risk
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      {expandedItems.has(footprint.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Category and URL */}
                <div className="flex items-center gap-sm text-xs">
                  <Badge className={getCategoryColor(footprint.category)}>
                    {footprint.category}
                  </Badge>
                  <span className="text-muted-foreground">{footprint.url}</span>
                </div>

                {/* Data Found */}
                <div className="space-y-xs">
                  <div className="text-sm font-medium">Data Found:</div>
                  <div className="flex flex-wrap gap-xs">
                    {footprint.dataFound.map((data, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {data}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Last Seen */}
                <div className="flex items-center gap-xs text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Last seen: {formatDate(footprint.lastSeen)}</span>
                </div>

                {/* Collapsible Content */}
                <CollapsibleContent className="space-y-sm">
                  {footprint.description && (
                    <div className="space-y-xs">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Description:
                      </div>
                      <p className="text-sm text-muted-foreground">{footprint.description}</p>
                    </div>
                  )}
                  
                  {footprint.pwnCount && (
                    <div className="space-y-xs">
                      <div className="text-sm font-medium">Affected Accounts:</div>
                      <p className="text-sm text-muted-foreground">{footprint.pwnCount.toLocaleString()} accounts compromised</p>
                    </div>
                  )}
                  
                  {footprint.confidence && (
                    <div className="space-y-xs">
                      <div className="text-sm font-medium">Confidence Score:</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted/20 rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${footprint.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{footprint.confidence}%</span>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>

                {/* Risk Indicator */}
                {footprint.riskLevel === "high" && (
                  <div className="flex items-center gap-xs text-xs text-destructive">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Contains sensitive personal information</span>
                  </div>
                )}
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};