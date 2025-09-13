import { Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between p-md border-b border-border glass sticky top-0 z-50">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
        <Shield className="w-5 h-5 text-primary" />
      </div>
      
      <h1 className="text-xl font-semibold text-glow">Trava</h1>
      
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => navigate('/deletion-request')}
        className="w-8 h-8 hover:bg-destructive/20 hover:text-destructive"
      >
        <Trash2 className="w-5 h-5" />
      </Button>
    </header>
  );
};