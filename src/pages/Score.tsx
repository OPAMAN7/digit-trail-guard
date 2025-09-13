import { useNavigate } from "react-router-dom";
import { AlertTriangle, Brain, Eye, Search, RefreshCw } from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import { FeatureCard } from "@/components/FeatureCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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

export const Score = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    // Get latest scan results from localStorage
    const savedResult = localStorage.getItem('latestScanResult');
    if (savedResult) {
      setScanResult(JSON.parse(savedResult));
    }
  }, []);

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

  const getRiskLevel = (breaches: number, platforms: number) => {
    const total = breaches + platforms;
    if (total === 0) return "low";
    if (total <= 2) return "medium";
    return "high";
  };
  
  if (!scanResult) {
    return (
      <div className="space-y-lg pt-lg">
        <div className="text-center space-y-md">
          <h1 className="text-xl font-semibold">Your Privacy Score</h1>
          <div className="glass p-lg rounded-2xl">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-md" />
            <p className="text-muted-foreground mb-md">
              No scan results found. Please run a scan first.
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
      {/* Privacy Score */}
      <div className="text-center space-y-md">
        <h1 className="text-xl font-semibold">Your Privacy Score</h1>
        <ScoreRing score={scanResult.score} />
        <div className="flex items-center justify-center gap-sm">
          <div className={`text-lg font-bold ${getScoreColor(scanResult.score)}`}>
            {scanResult.score}/100
          </div>
          <Badge className={scanResult.score >= 80 ? "bg-green-500/20 text-green-500" : scanResult.score >= 60 ? "bg-yellow-500/20 text-yellow-500" : "bg-destructive/20 text-destructive"}>
            {getScoreLabel(scanResult.score)}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {scanResult.summary}
        </p>
      </div>

      {/* Risk Indicators */}
      <div className="flex flex-wrap justify-center gap-sm">
        {scanResult.breach_count > 0 && (
          <Badge 
            variant="destructive" 
            className="px-md py-xs rounded-full flex items-center gap-xs"
          >
            <AlertTriangle className="w-4 h-4" />
            {scanResult.breach_count} Data Breaches
          </Badge>
        )}
        {scanResult.platforms_found > 0 && (
          <Badge 
            className="px-md py-xs rounded-full flex items-center gap-xs bg-accent/20 text-accent"
          >
            <Eye className="w-4 h-4" />
            {scanResult.platforms_found} Platforms Found
          </Badge>
        )}
        {scanResult.emailrep?.suspicious && (
          <Badge 
            className="px-md py-xs rounded-full flex items-center gap-xs bg-yellow-500/20 text-yellow-500"
          >
            <AlertTriangle className="w-4 h-4" />
            Suspicious Activity
          </Badge>
        )}
      </div>

      {/* Action Cards */}
      <div className="space-y-sm">
        <FeatureCard
          icon={Brain}
          title="AI Summary"
          description="Intelligent analysis of your privacy risks and recommendations"
          onClick={() => navigate("/ai-summary")}
          variant="primary"
        />
        <FeatureCard
          icon={Eye}
          title="Last Seen"
          description="Detailed view of where your data was found online"
          onClick={() => navigate("/footprints")}
          variant="accent"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-sm">
        <div className="glass p-md rounded-2xl text-center">
          <div className="text-2xl font-bold text-primary">{scanResult.platforms_found}</div>
          <div className="text-xs text-muted-foreground">Platforms Found</div>
        </div>
        <div className="glass p-md rounded-2xl text-center">
          <div className={`text-2xl font-bold ${getRiskLevel(scanResult.breach_count, scanResult.platforms_found) === 'high' ? 'text-destructive' : getRiskLevel(scanResult.breach_count, scanResult.platforms_found) === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
            {getRiskLevel(scanResult.breach_count, scanResult.platforms_found).toUpperCase()}
          </div>
          <div className="text-xs text-muted-foreground">Risk Level</div>
        </div>
        <div className="glass p-md rounded-2xl text-center">
          <div className="text-2xl font-bold text-destructive">{scanResult.breach_count}</div>
          <div className="text-xs text-muted-foreground">Breaches</div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => navigate("/")}
          variant="outline"
          className="glass border-primary/20 hover:bg-primary/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Run New Scan
        </Button>
      </div>
    </div>
  );
};