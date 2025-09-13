import { useNavigate } from "react-router-dom";
import { AlertTriangle, Brain, Eye } from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import { FeatureCard } from "@/components/FeatureCard";
import { Badge } from "@/components/ui/badge";

export const Score = () => {
  const navigate = useNavigate();
  
  // Mock data - this will come from your backend
  const privacyScore = 67;
  const breaches = 3;
  
  return (
    <div className="space-y-lg pt-lg">
      {/* Privacy Score */}
      <div className="text-center space-y-md">
        <h1 className="text-xl font-semibold">Your Privacy Score</h1>
        <ScoreRing score={privacyScore} />
        <p className="text-muted-foreground text-sm">
          Your digital footprint analysis is complete
        </p>
      </div>

      {/* Breaches Indicator */}
      <div className="flex justify-center">
        <Badge 
          variant="destructive" 
          className="px-md py-xs rounded-full flex items-center gap-xs"
        >
          <AlertTriangle className="w-4 h-4" />
          {breaches} Data Breaches Found
        </Badge>
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
          <div className="text-2xl font-bold text-primary">12</div>
          <div className="text-xs text-muted-foreground">Sites Found</div>
        </div>
        <div className="glass p-md rounded-2xl text-center">
          <div className="text-2xl font-bold text-accent">8</div>
          <div className="text-xs text-muted-foreground">High Risk</div>
        </div>
        <div className="glass p-md rounded-2xl text-center">
          <div className="text-2xl font-bold text-destructive">3</div>
          <div className="text-xs text-muted-foreground">Breaches</div>
        </div>
      </div>
    </div>
  );
};