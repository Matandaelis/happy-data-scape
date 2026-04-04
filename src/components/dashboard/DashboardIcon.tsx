import { ICONS, type IconName } from "@/lib/dashboard-icons";

interface DashboardIconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  fill?: string;
}

export function DashboardIcon({ name, size = 16, className = "", strokeWidth = 1.6, fill = "none" }: DashboardIconProps) {
  const d = ICONS[name];
  const paths = d.split("|||");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {paths.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
