import { Eye, ExternalLink, AlertTriangle, Clock, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FootprintItem {
  id: string;
  siteName: string;
  url: string;
  dataFound: string[];
  lastSeen: string;
  riskLevel: "low" | "medium" | "high";
  category: string;
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
}

interface FootprintResult {
  email: string;
  score: number;
  breach_count: number;
  platforms_found: number;
  breaches: BreachData[];
  hunter_data: HunterData;
  recommendations: string[];
  summary: string;
}

export const Footprints = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [footprintData, setFootprintData] = useState<FootprintResult | null>(null);
  const [footprints, setFootprints] = useState<FootprintItem[]>([]);
  const { toast } = useToast();

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

      setFootprintData(data);
      
      // Convert API data to FootprintItem format
      const footprintItems: FootprintItem[] = [];
      
      // Add breaches as footprint items
      data.breaches.forEach((breach: BreachData, index: number) => {
        footprintItems.push({
          id: `breach-${index}`,
          siteName: breach.name,
          url: breach.domain,
          dataFound: breach.data_classes,
          lastSeen: new Date(breach.breach_date).toISOString(),
          riskLevel: breach.pwn_count > 1000000 ? "high" : breach.pwn_count > 100000 ? "medium" : "low",
          category: "Data Breach"
        });
      });

      // Add Hunter.io domain data as footprint item
      if (data.hunter_data.domain) {
        footprintItems.push({
          id: "hunter-domain",
          siteName: data.hunter_data.domain,
          url: data.hunter_data.domain,
          dataFound: ["Email Address", "Domain Information"],
          lastSeen: new Date().toISOString(),
          riskLevel: data.hunter_data.disposable ? "low" : data.hunter_data.webmail ? "medium" : "high",
          category: data.hunter_data.webmail ? "Webmail" : "Corporate Domain"
        });
      }

      setFootprints(footprintItems);

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
      "Data Broker": "bg-red-500/20 text-red-400",
      "Social Media": "bg-blue-500/20 text-blue-400", 
      "Marketing": "bg-purple-500/20 text-purple-400",
      "E-commerce": "bg-green-500/20 text-green-400"
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

      {/* Search Form */}
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

      {footprintData && (
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
          <div key={footprint.id} className="glass p-md rounded-2xl space-y-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <h3 className="font-semibold">{footprint.siteName}</h3>
                <Badge className={getRiskBadgeClass(footprint.riskLevel)}>
                  {footprint.riskLevel} risk
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

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

            {/* Risk Indicator */}
            {footprint.riskLevel === "high" && (
              <div className="flex items-center gap-xs text-xs text-destructive">
                <AlertTriangle className="w-3 h-3" />
                <span>Contains sensitive personal information</span>
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
};