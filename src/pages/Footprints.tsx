import { Eye, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FootprintItem {
  id: string;
  siteName: string;
  url: string;
  dataFound: string[];
  lastSeen: string;
  riskLevel: "low" | "medium" | "high";
  category: string;
}

// Mock data - this will come from your backend
const footprints: FootprintItem[] = [
  {
    id: "1",
    siteName: "DataBroker Inc",
    url: "databroker.com",
    dataFound: ["Email", "Phone", "Address", "Age"],
    lastSeen: "2024-01-15T10:30:00Z",
    riskLevel: "high",
    category: "Data Broker"
  },
  {
    id: "2", 
    siteName: "Social Network X",
    url: "socialx.com",
    dataFound: ["Email", "Profile Photo", "Bio"],
    lastSeen: "2024-01-14T15:45:00Z",
    riskLevel: "medium",
    category: "Social Media"
  },
  {
    id: "3",
    siteName: "Newsletter Service",
    url: "newsletter.com", 
    dataFound: ["Email Address"],
    lastSeen: "2024-01-10T08:20:00Z",
    riskLevel: "low",
    category: "Marketing"
  },
  {
    id: "4",
    siteName: "Shopping Platform",
    url: "shop.com",
    dataFound: ["Email", "Purchase History"],
    lastSeen: "2024-01-12T19:15:00Z",
    riskLevel: "medium",
    category: "E-commerce"
  }
];

export const Footprints = () => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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
          Detailed view of where your data was found online
        </p>
      </div>

      {/* Summary Stats */}
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

      {/* Footprints List */}
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
    </div>
  );
};