"use client";

import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PriorityBadge, MaintenanceStatusBadge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/app/water-points/distance";
import { ISSUE_TYPE_LABELS } from "@/lib/constants";

export default function StaffTaskCard({
  task,
  onAction,
  loadingActionId,
}) {
  const wp = task.waterPointId || {};
  const isActionLoading = loadingActionId === task._id;

  const locItems = [
    wp.building,
    wp.floor ? `Floor ${wp.floor}` : null,
    wp.landmark ? `Near ${wp.landmark}` : null,
  ].filter(Boolean);

  const locString = locItems.length > 0 ? locItems.join(" • ") : null;

  const hasCoords =
    typeof wp.latitude === "number" && typeof wp.longitude === "number";

  const navigationUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${wp.latitude},${wp.longitude}&travelmode=walking`
    : null;

  return (
    <Card className="hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Header: Name, Priority, Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg tracking-tight truncate">
              {wp.name || "Campus Drinking Point"}
            </h3>
            {locString && (
              <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                <span>📍</span>
                <span>{locString}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <PriorityBadge priority={task.priority} size="sm" />
            <MaintenanceStatusBadge status={task.status} size="sm" />
          </div>
        </div>

        {/* Issue summary */}
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5 text-xs">
          <span className="text-base shrink-0">⚠️</span>
          <div className="space-y-0.5">
            <span className="font-bold text-gray-900">
              {ISSUE_TYPE_LABELS[task.issue] || task.issue}
            </span>
            <p className="text-gray-500">
              {task.distinctReporterCount || 1} distinct student reporter(s) &bull; Reported {formatRelativeTime(task.createdAt)}
            </p>
          </div>
        </div>

        {/* Reports Comments Preview (if any) */}
        {task.reportIds && task.reportIds.length > 0 && task.reportIds[0]?.description && (
          <div className="text-xs text-gray-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/60 leading-relaxed">
            <span className="font-semibold text-blue-900 block text-[11px] uppercase tracking-wider mb-0.5">
              Latest Student Note:
            </span>
            &ldquo;{task.reportIds[0].description}&rdquo;
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Navigation Button */}
          {navigationUrl ? (
            <a
              href={navigationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <span>🧭</span>
              <span>Navigate (Walking)</span>
              <span>↗</span>
            </a>
          ) : (
            <span className="text-xs text-gray-400 italic">No GPS coordinates available</span>
          )}

          {/* Single Primary Action Button for Next Allowed Step */}
          <div>
            {task.status === "assigned" && (
              <Button
                variant="primary"
                size="sm"
                loading={isActionLoading}
                onClick={() => onAction(task, "in_progress")}
                className="w-full sm:w-auto shadow-sm"
              >
                <span>🔧 Start Work</span>
              </Button>
            )}

            {task.status === "in_progress" && (
              <Button
                variant="primary"
                size="sm"
                loading={isActionLoading}
                onClick={() => onAction(task, "fixed")}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm"
              >
                <span>✨ Mark as Fixed</span>
              </Button>
            )}

            {task.status === "fixed" && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block text-center w-full sm:w-auto">
                ⏳ Awaiting Admin Verification
              </span>
            )}

            {(task.status === "verified" || task.status === "available") && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 inline-block text-center w-full sm:w-auto">
                ✅ Verified &bull; Complete
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

