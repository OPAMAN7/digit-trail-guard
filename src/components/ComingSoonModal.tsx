import { useState } from "react";
import { HelpCircle, Search, Shield, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const comingSoonFeatures = [
  {
    icon: Search,
    title: "Where You Signed Up",
    description: "Discover all platforms and services where you've created accounts using your email address",
    status: "Development",
    eta: "Q1 2024"
  },
  {
    icon: Shield,
    title: "Dark Web Scanning",
    description: "Monitor dark web forums and marketplaces for your personal information being sold",
    status: "Beta Testing",
    eta: "Q2 2024"
  },
  {
    icon: Users,
    title: "Social Media Analyzer",
    description: "Analyze your social media presence and privacy settings across all platforms",
    status: "Planning",
    eta: "Q2 2024"
  }
];

export const ComingSoonModal = ({ isOpen, onClose }: ComingSoonModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-primary/20 max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-glow flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Coming Soon Features
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="w-6 h-6 hover:bg-primary/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-sm">
          {comingSoonFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="glass p-sm rounded-xl border-accent/20">
                <div className="flex items-start gap-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <Badge variant="outline" className="text-xs bg-accent/20 text-accent border-accent/30">
                        {feature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                    <div className="text-xs text-primary font-medium">ETA: {feature.eta}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center text-sm text-muted-foreground border-t border-border pt-sm">
          Stay tuned for these exciting privacy protection features!
        </div>
      </DialogContent>
    </Dialog>
  );
};