import { Brain, TrendingDown, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeatureCard } from "@/components/FeatureCard";

export const AISummary = () => {
  return (
    <div className="space-y-lg pt-lg">
      <div className="text-center space-y-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center glow-primary mb-md">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">AI Privacy Analysis</h1>
        <p className="text-muted-foreground text-sm">
          Intelligent insights about your digital footprint
        </p>
      </div>

      {/* Risk Assessment */}
      <div className="glass p-md rounded-2xl space-y-md">
        <div className="flex items-center gap-sm">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold">Risk Assessment</h3>
          <Badge variant="secondary">Medium Risk</Badge>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your email address has been found on 12 different platforms, with 3 confirmed data breaches. 
          The primary concerns are data broker sites that have your contact information and 
          several social platforms with outdated privacy settings.
        </p>
      </div>

      {/* Key Findings */}
      <div className="space-y-sm">
        <h3 className="font-semibold text-sm">Key Findings</h3>
        
        <div className="glass p-md rounded-2xl">
          <div className="flex items-start gap-sm">
            <TrendingDown className="w-5 h-5 text-destructive mt-xs" />
            <div>
              <h4 className="font-medium text-sm">High-Risk Exposures</h4>
              <p className="text-xs text-muted-foreground mt-xs">
                3 data breaches include sensitive information like phone numbers and addresses
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-md rounded-2xl">
          <div className="flex items-start gap-sm">
            <Shield className="w-5 h-5 text-accent mt-xs" />
            <div>
              <h4 className="font-medium text-sm">Privacy Opportunities</h4>
              <p className="text-xs text-muted-foreground mt-xs">
                8 sites can be easily removed through automated deletion requests
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-md rounded-2xl">
          <div className="flex items-start gap-sm">
            <TrendingUp className="w-5 h-5 text-green-500 mt-xs" />
            <div>
              <h4 className="font-medium text-sm">Improvement Potential</h4>
              <p className="text-xs text-muted-foreground mt-xs">
                Your score could improve to 85+ by removing high-risk exposures
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-sm">
        <h3 className="font-semibold text-sm">Recommended Actions</h3>
        
        <FeatureCard
          icon={AlertTriangle}
          title="Priority: Remove High-Risk Data"
          description="Start with the 3 data broker sites that have your full contact details"
          variant="primary"
        />
        
        <FeatureCard
          icon={Shield}
          title="Update Privacy Settings" 
          description="Review and tighten privacy controls on social media platforms"
          variant="accent"
        />
      </div>
    </div>
  );
};