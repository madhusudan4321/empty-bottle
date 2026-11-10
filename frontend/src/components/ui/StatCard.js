import Link from "next/link";
import { Card, CardContent } from "./Card";

export default function StatCard({
  title,
  value,
  icon,
  subtitle,
  href,
  onClick,
  badge,
  variant = "blue",
  className = "",
}) {
  const iconBgMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-rose-100 text-rose-600",
    purple: "bg-purple-100 text-purple-600",
    gray: "bg-gray-100 text-gray-600",
  };

  const borderHoverMap = {
    blue: "hover:border-blue-300",
    green: "hover:border-emerald-300",
    amber: "hover:border-amber-300",
    red: "hover:border-rose-300",
    purple: "hover:border-purple-300",
    gray: "hover:border-gray-300",
  };

  const isClickable = Boolean(href || onClick);

  const cardContent = (
    <Card
      className={`h-full transition-all duration-150 ${
        isClickable
          ? `cursor-pointer hover:shadow-md ${borderHoverMap[variant] || "hover:border-blue-300"}`
          : "shadow-sm"
      } ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {title}
            </span>
            {badge}
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {value != null ? value : "—"}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 leading-snug">{subtitle}</p>
          )}
        </div>
        {icon && (
          <span
            className={`text-2xl p-3 rounded-xl shrink-0 ${
              iconBgMap[variant] || iconBgMap.blue
            }`}
          >
            {icon}
          </span>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
