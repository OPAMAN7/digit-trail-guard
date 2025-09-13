import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-xl gap-md">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-spin">
          <div className="absolute inset-2 rounded-full bg-background"></div>
        </div>
        <Loader2 className="w-8 h-8 text-primary animate-spin absolute top-4 left-4" />
      </div>
      <p className="text-muted-foreground text-center font-medium">{message}</p>
    </div>
  );
};