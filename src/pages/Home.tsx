import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, Clock, Trash2, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/FeatureCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

export const Home = () => {
  const [email, setEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
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
    
    // Simulate API call
    setTimeout(() => {
      setIsScanning(false);
      navigate("/score");
    }, 3000);
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