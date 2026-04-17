"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  hoverBorderColor?: "green" | "amber" | "blue" | "red";
  padding?: "sm" | "md" | "lg";
}

const paddingStyles = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const hoverColors = {
  green: "hover:border-[#22c55e]/30",
  amber: "hover:border-[#f59e0b]/30",
  blue: "hover:border-blue-500/30",
  red: "hover:border-red-500/30",
};

export function Card({ children, className = "", hover = false, hoverBorderColor = "green", padding = "md" }: CardProps) {
  return (
    <div
      className={`bg-[#111] rounded-xl border border-[#222] ${hover ? hoverColors[hoverBorderColor] : ""} transition-all ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-b border-[#222] bg-[#151515] ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
