import React from "react";

interface MinecraftIconProps {
  sprite: string;
  scale?: number;
  className?: string;
  glow?: boolean;
  glowColor?: string;
  isSmall?: boolean;
  style?: React.CSSProperties;
}

export function MinecraftIcon({
  sprite,
  scale = 1,
  className = "",
  glow = false,
  glowColor = "rgba(52, 211, 153, 0.2)", // emerald-400/20
  isSmall = false,
  style = {},
}: MinecraftIconProps) {
  const baseSize = isSmall ? 16 : 32;
  const size = baseSize * scale;

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {glow && (
        <div
          className="absolute inset-0 blur-xl rounded-full animate-pulse-slow"
          style={{ backgroundColor: glowColor }}
        ></div>
      )}
      <div
        className={`${isSmall ? "icon-minecraft-sm" : "icon-minecraft"} icon-minecraft-${sprite} relative z-10`}
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'center'
        }}
      ></div>
    </div>
  );
}
