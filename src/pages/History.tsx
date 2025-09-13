import { Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import { Badge } from "@/components/ui/badge";

interface HistoryItem {
  id: string;
  timestamp: string;
  email: string;
  score: number;
  breaches: number;
  sitesFound: number;
}

// Mock data - this will come from your backend
const historyData: HistoryItem[] = [
  {
    id: "1",
    timestamp: "2024-01-15T14:30:00Z",
    email: "user@example.com",
    score: 67,
    breaches: 3,
    sitesFound: 12
  },
  {
    id: "2", 
    timestamp: "2024-01-10T09:15:00Z",
    email: "user@example.com",
    score: 72,
    breaches: 2,
    sitesFound: 8
  },
  {
    id: "3",
    timestamp: "2024-01-05T16:45:00Z", 
    email: "user@example.com",
    score: 58,
    breaches: 5,
    sitesFound: 15
  }
];

export const History = () => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-lg pt-lg">
      <div className="text-center space-y-sm">
        <h1 className="text-xl font-semibold">Scan History</h1>
        <p className="text-muted-foreground text-sm">
          Track your privacy improvements over time
        </p>
      </div>

      <div className="space-y-sm">
        {historyData.map((item) => (
          <div key={item.id} className="glass p-md rounded-2xl space-y-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-xs">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatDate(item.timestamp)}
                </span>
              </div>
              <Badge 
                variant={item.breaches > 3 ? "destructive" : item.breaches > 0 ? "secondary" : "default"}
                className="text-xs"
              >
                {item.breaches} breaches
              </Badge>
            </div>

            {/* Content */}
            <div className="flex items-center gap-md">
              <ScoreRing score={item.score} size="sm" />
              
              <div className="flex-1 space-y-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.email}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.sitesFound} sites found
                  </span>
                </div>
                
                {item.breaches > 0 && (
                  <div className="flex items-center gap-xs">
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                    <span className="text-xs text-destructive">
                      High-risk exposures detected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {historyData.length === 0 && (
        <div className="text-center py-xl space-y-md">
          <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
          <div>
            <h3 className="font-medium text-muted-foreground">No scans yet</h3>
            <p className="text-sm text-muted-foreground">
              Start your first privacy scan to see your history
            </p>
          </div>
        </div>
      )}
    </div>
  );
};