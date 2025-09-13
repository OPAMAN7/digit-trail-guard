import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, Clock, Trash2, TrendingUp, Eye, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/FeatureCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ScoreRing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  email: string;
  score: number;
  breach_count: number;
  platforms_found: number;
  breaches: any[];
  hunter_data: any;
  recommendations: string[];
  summary: string;
}

export const Home = () => {
  const [email, setEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleScan = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to scan",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-footprint', {
        body: { email }
      });

      if (error) throw error;

      setScanResult(data);
      // Save to localStorage for other pages to access
      localStorage.setItem('latestScanResult', JSON.stringify(data));
      toast({
        title: "Scan Complete",
        description: `Found ${data.breach_count} breaches and ${data.platforms_found} platforms`,
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to scan digital footprint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Good";
    if (score >= 60) return "Fair";
    return "Poor";
  };

  if (isScanning) {
    return <LoadingSpinner message="Checking your digital footprint..." />;
  }

  return (
    <div className="space-y-lg pt-lg">
      {/* Hero Section */}
      <div className="text-center space-y-md">
        <h1 className="text-2xl font-bold text-glow">
          Protect Your Digital Privacy
        </h1>
        <p className="text-muted-foreground">
          Scan your email to discover where your data is exposed and take control
        </p>
      </div>

      {/* Email Input */}
      <div className="space-y-sm">
        <div className="relative">
          <Search className="absolute left-sm top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 h-12 rounded-2xl glass border-gradient"
          />
        </div>
        <Button 
          onClick={handleScan}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
          disabled={!email}
        >
          Start Privacy Scan
        </Button>
      </div>

      {/* Results Section */}
      {scanResult && (
        <div className="space-y-sm">
          {/* Privacy Score */}
          <div className="glass p-md rounded-2xl text-center space-y-sm">
            <h2 className="text-lg font-semibold">Privacy Score</h2>
            <div className="flex items-center justify-center space-x-md">
              <ScoreRing score={scanResult.score} size="lg" />
              <div className="text-left">
                <div className={`text-2xl font-bold ${getScoreColor(scanResult.score)}`}>
                  {scanResult.score}/100
                </div>
                <Badge className={scanResult.score >= 80 ? "bg-green-500/20 text-green-500" : scanResult.score >= 60 ? "bg-yellow-500/20 text-yellow-500" : "bg-destructive/20 text-destructive"}>
                  {getScoreLabel(scanResult.score)}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{scanResult.summary}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-sm">
            <div className="glass p-sm rounded-xl text-center">
              <div className="text-lg font-bold text-destructive">{scanResult.breach_count}</div>
              <div className="text-xs text-muted-foreground">Data Breaches</div>
            </div>
            <div className="glass p-sm rounded-xl text-center">
              <div className="text-lg font-bold text-accent">{scanResult.platforms_found}</div>
              <div className="text-xs text-muted-foreground">Platforms Found</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-sm">
            <Button 
              onClick={() => navigate("/footprints")} 
              className="glass border-accent/20 hover:bg-accent/10"
              variant="outline"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              onClick={() => navigate("/ai-summary")} 
              className="glass border-primary/20 hover:bg-primary/10"
              variant="outline"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Get Recommendations
            </Button>
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-sm">
        <FeatureCard
          icon={TrendingUp}
          title="Privacy Score"
          description="Get your overall privacy rating"
          onClick={() => navigate("/score")}
          variant="primary"
        />
        <FeatureCard
          icon={Shield}
          title="Realtime Scan"
          description="Live monitoring of your data"
          onClick={() => handleScan()}
          variant="accent"
        />
        <FeatureCard
          icon={Clock}
          title="History"
          description="View all your previous scans"
          onClick={() => navigate("/history")}
        />
        <FeatureCard
          icon={Trash2}
          title="Delete Data"
          description="Request data removal"
          onClick={() => navigate("/deletion-request")}
        />
      </div>
    </div>
  );
};