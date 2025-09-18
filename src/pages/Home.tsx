import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, Clock, Trash2, TrendingUp, Eye, AlertTriangle, Lock, EyeOff } from "lucide-react";
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
  social_media?: {
    platforms: Array<{
      platform: string;
      found: boolean;
      username?: string;
      url?: string;
    }>;
    total_platforms: number;
    error?: string;
  };
  password_check: {
    is_pwned: boolean;
    pwn_count: number;
    checked: boolean;
  };
  recommendations: string[];
  summary: string;
}

export const Home = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [includePasswordCheck, setIncludePasswordCheck] = useState(false);
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
      const body: any = { email };
      if (includePasswordCheck && password) {
        body.password = password;
      }

      const { data, error } = await supabase.functions.invoke('check-footprint', {
        body
      });

      if (error) throw error;

      setScanResult(data);
      // Save to localStorage for other pages to access
      localStorage.setItem('latestScanResult', JSON.stringify(data));
      const passwordMsg = data.password_check?.checked && data.password_check?.is_pwned 
        ? `, password compromised ${data.password_check.pwn_count} times` 
        : '';
      toast({
        title: "Scan Complete",
        description: `Found ${data.breach_count} breaches and ${data.platforms_found} platforms${passwordMsg}`,
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

        {/* Optional Password Check */}
        <div className="space-y-xs">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="include-password"
              checked={includePasswordCheck}
              onChange={(e) => setIncludePasswordCheck(e.target.checked)}
              className="rounded border-2 border-primary/20"
            />
            <label htmlFor="include-password" className="text-sm text-muted-foreground">
              Include password security check (optional)
            </label>
          </div>
          
          {includePasswordCheck && (
            <div className="relative">
              <Lock className="absolute left-sm top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password to check if it's been compromised"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-12 rounded-2xl glass border-gradient"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-sm top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}
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
          <div className="grid grid-cols-3 gap-sm">
            <div className="glass p-sm rounded-xl text-center">
              <div className="text-lg font-bold text-destructive">{scanResult.breach_count}</div>
              <div className="text-xs text-muted-foreground">
                {scanResult.breach_count === 0 ? "No Breaches" : "Data Breaches"}
              </div>
            </div>
            <div className="glass p-sm rounded-xl text-center">
              <div className="text-lg font-bold text-accent">{scanResult.platforms_found}</div>
              <div className="text-xs text-muted-foreground">Platforms Found</div>
            </div>
            <div className="glass p-sm rounded-xl text-center">
              <div className="text-lg font-bold text-primary">
                {scanResult.social_media?.platforms?.filter(p => p.found)?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Social Media</div>
            </div>
          </div>

          {/* Password Check Result */}
          {scanResult.password_check?.checked && (
            <div className={`glass p-sm rounded-xl text-center ${scanResult.password_check.is_pwned ? 'border-destructive/20' : 'border-green-500/20'}`}>
              <div className={`text-lg font-bold ${scanResult.password_check.is_pwned ? 'text-destructive' : 'text-green-500'}`}>
                {scanResult.password_check.is_pwned ? `⚠️ COMPROMISED` : '✅ SECURE'}
              </div>
              <div className="text-xs text-muted-foreground">
                {scanResult.password_check.is_pwned 
                  ? `Password found in ${scanResult.password_check.pwn_count.toLocaleString()} breaches`
                  : 'Password not found in known breaches'
                }
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-sm">
            <Button 
              onClick={() => navigate("/footprints")} 
              className="glass border-accent/20 hover:bg-accent/10"
              variant="outline"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              onClick={() => navigate("/social-media")} 
              className="glass border-primary/20 hover:bg-primary/10"
              variant="outline"
            >
              <Search className="w-4 h-4 mr-2" />
              Social Media
            </Button>
            <Button 
              onClick={() => navigate("/ai-summary")} 
              className="glass border-secondary/20 hover:bg-secondary/10"
              variant="outline"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              AI Summary
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