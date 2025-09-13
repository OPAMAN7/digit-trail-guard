interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const ScoreRing = ({ score, size = "lg" }: ScoreRingProps) => {
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  };
  
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "hsl(120, 60%, 50%)"; // Green
    if (score >= 60) return "hsl(60, 90%, 50%)"; // Yellow
    if (score >= 40) return "hsl(30, 90%, 50%)"; // Orange
    return "hsl(0, 80%, 60%)"; // Red
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg className={sizeClasses[size]} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            filter: `drop-shadow(0 0 8px ${getScoreColor(score)}40)`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold text-foreground ${textSizes[size]}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground font-medium">SCORE</span>
      </div>
    </div>
  );
};