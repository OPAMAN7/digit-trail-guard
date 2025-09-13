import { useState, useEffect } from "react";
import { Trash2, Send, CheckCircle, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeletionSite {
  name: string;
  url: string;
  dataFound: string;
  riskLevel: "low" | "medium" | "high";
  type: "breach" | "platform";
}

interface ScanResult {
  email: string;
  score: number;
  breach_count: number;
  platforms_found: number;
  breaches: any[];
  hunter_data: any;
  emailrep: any;
  recommendations: string[];
  summary: string;
}

export const DeletionRequest = () => {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [exposedSites, setExposedSites] = useState<DeletionSite[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get latest scan results from localStorage
    const savedResult = localStorage.getItem('latestScanResult');
    if (savedResult) {
      const result = JSON.parse(savedResult);
      setScanResult(result);
      setEmail(result.email);
      
      // Convert scan results to deletion sites
      const sites: DeletionSite[] = [];
      
      // Add breaches
      result.breaches?.forEach((breach: any) => {
        sites.push({
          name: breach.name,
          url: breach.domain || `${breach.name.toLowerCase().replace(/\s+/g, '')}.com`,
          dataFound: breach.data_classes?.join(', ') || 'Personal Data',
          riskLevel: breach.pwn_count > 1000000 ? 'high' : breach.pwn_count > 100000 ? 'medium' : 'low',
          type: 'breach'
        });
      });
      
      // Add hunter.io discovered emails
      result.hunter_data?.discover_emails?.forEach((emailData: any) => {
        if (emailData.sources?.length > 0) {
          emailData.sources.forEach((source: any) => {
            sites.push({
              name: source.domain || 'Unknown Platform',
              url: source.uri || source.domain || 'unknown',
              dataFound: 'Email Address, Public Profile',
              riskLevel: source.still_on_page ? 'medium' : 'low',
              type: 'platform'
            });
          });
        }
      });
      
      setExposedSites(sites);
    }
  }, []);

  const handleSiteToggle = (siteUrl: string) => {
    setSelectedSites(prev => 
      prev.includes(siteUrl) 
        ? prev.filter(url => url !== siteUrl)
        : [...prev, siteUrl]
    );
  };

  const handleDeleteRequest = async () => {
    if (!email || selectedSites.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and select at least one site",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-data', {
        body: { 
          email, 
          sites: selectedSites,
          reason: reason || 'GDPR data deletion request'
        }
      });

      if (error) throw error;

      toast({
        title: "Deletion Request Sent",
        description: `Requests sent to ${selectedSites.length} sites. You'll receive confirmation emails.`
      });
      
      setSelectedSites([]);
      setReason("");
    } catch (error) {
      console.error('Deletion request error:', error);
      toast({
        title: "Request Failed",
        description: "Failed to send deletion requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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

  if (!scanResult) {
    return (
      <div className="space-y-lg pt-lg">
        <div className="text-center space-y-md">
          <h1 className="text-xl font-semibold">Data Deletion Request</h1>
          <div className="glass p-lg rounded-2xl">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-md" />
            <p className="text-muted-foreground mb-md">
              No scan results found. Please run a scan first to see where your data is exposed.
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Search className="w-4 h-4 mr-2" />
              Start Privacy Scan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg pt-lg">
      <div className="text-center space-y-sm">
        <h1 className="text-xl font-semibold">Data Deletion Request</h1>
        <p className="text-muted-foreground text-sm">
          Request removal of your personal data from {exposedSites.length} exposed sites
        </p>
      </div>

      {/* Email Input */}
      <div className="space-y-xs">
        <label className="text-sm font-medium">Your Email Address</label>
        <Input
          type="email"
          placeholder="Enter the email to delete data for"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl glass"
        />
      </div>

      {/* Sites List */}
      <div className="space-y-sm">
        <h3 className="font-medium text-sm">
          Select sites to request deletion from ({exposedSites.length} found):
        </h3>
        
        {exposedSites.length === 0 && (
          <div className="glass p-md rounded-2xl text-center">
            <p className="text-muted-foreground">No exposed sites found in your scan results.</p>
          </div>
        )}
        
        {exposedSites.map((site) => (
          <div
            key={site.url}
            onClick={() => handleSiteToggle(site.url)}
            className={`glass p-md rounded-2xl cursor-pointer transition-all duration-200 ${
              selectedSites.includes(site.url) 
                ? "border-primary/50 bg-primary/5 glow-primary" 
                : "hover:bg-card/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-sm mb-xs">
                  <h4 className="font-medium">{site.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRiskBadgeClass(site.riskLevel)}`}>
                    {site.riskLevel} risk
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{site.dataFound}</p>
                <p className="text-xs text-muted-foreground">{site.url}</p>
              </div>
              
              <div className="ml-sm">
                {selectedSites.includes(site.url) ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reason Input */}
      <div className="space-y-xs">
        <label className="text-sm font-medium">Reason (Optional)</label>
        <Textarea
          placeholder="Explain why you want your data deleted..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-2xl glass min-h-[80px]"
        />
      </div>

      {/* Delete Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            className="w-full h-12 rounded-2xl bg-destructive hover:bg-destructive/90"
            disabled={selectedSites.length === 0 || !email}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Send Deletion Request ({selectedSites.length} sites)
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Confirm Data Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send deletion requests to {selectedSites.length} sites. 
              You will receive confirmation emails for each request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRequest}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Send className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Delete My Data
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};