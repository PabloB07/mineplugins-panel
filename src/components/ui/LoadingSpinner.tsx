"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-2 border-[#333] border-t-[#22c55e] rounded-full animate-spin`} />
    </div>
  );
}

export function LoadingCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[#111] rounded-xl border border-[#222] p-8 ${className}`}>
      <div className="flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
