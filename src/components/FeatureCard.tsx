import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "primary" | "accent";
}

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  className,
  variant = "default" 
}: FeatureCardProps) => {
  const variantClasses = {
    default: "glass hover:bg-card/80",
    primary: "glass hover:bg-primary/10 border-primary/20 glow-primary",
    accent: "glass hover:bg-accent/10 border-accent/20 glow-accent"
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-md rounded-2xl border transition-all duration-300 cursor-pointer group",
        "hover:scale-[1.02] hover:shadow-lg",
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-center gap-sm mb-sm">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          variant === "primary" ? "bg-primary/20" : 
          variant === "accent" ? "bg-accent/20" : "bg-muted/20"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            variant === "primary" ? "text-primary" : 
            variant === "accent" ? "text-accent" : "text-foreground"
          )} />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};