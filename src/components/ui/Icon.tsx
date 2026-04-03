"use client";

import { useIcon } from "@/hooks/useIcon";

type IconName = Parameters<typeof useIcon>[0];

interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = "w-4 h-4" }: IconProps) {
  const IconComponent = useIcon(name);
  return <IconComponent className={className} />;
}

interface IconLabelProps {
  name: IconName;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export function IconLabel({ name, children, className = "", iconClassName = "w-4 h-4" }: IconLabelProps) {
  const IconComponent = useIcon(name);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <IconComponent className={iconClassName} />
      {children}
    </span>
  );
}

interface IconHeaderProps {
  name: IconName;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export function IconHeader({ name, children, className = "", iconClassName = "w-5 h-5" }: IconHeaderProps) {
  const IconComponent = useIcon(name);
  return (
    <h2 className={`text-lg font-semibold text-white flex items-center gap-2 ${className}`}>
      <IconComponent className={iconClassName} />
      {children}
    </h2>
  );
}