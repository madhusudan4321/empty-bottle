"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageLayout from "@/components/ui/PageLayout";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { ISSUE_TYPE_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "../water-points/distance";

function ReportsHistoryContent() {
  const [reports, setReports] = useState([]);
  const [waterPointsMap, setWaterPointsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      // Fetch both reports and water points to ensure bulletproof name resolution
      const [reportsData, waterPointsData] = await Promise.all([
        apiFetch("/api/reports/my"),
        apiFetch("/api/water-points").catch(() => []),
      ]);

      const map = {};
      if (Array.isArray(waterPointsData)) {
        for (const wp of waterPointsData) {
          if (wp._id) map[wp._id] = wp.name;
        }
      }
      setWaterPointsMap(map);
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchData();
  };

  return (
    <PageLayout
      title="My Reports History"
      subtitle="Track campus maintenance updates and resolution progress for issues you reported."
      actions={
        <Link href="/reports/new">
          <Button variant="primary" size="sm">
            + Report New Issue
          </Button>
        </Link>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-gray-500">Loading your reports...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mb-6">
          <ErrorMessage
            title="Unable to load reports"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && reports.length === 0 && (
        <EmptyState
          title="No Reports Filed Yet"
          description="You haven't reported any drinking water dispenser problems. If you notice an issue around campus, let us know!"
          action={
            <Link href="/reports/new">
              <Button variant="primary">Report an Issue</Button>
            </Link>
          }
        />
      )}

      {/* Reports List */}
      {!loading && !error && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => {
            let waterPointName = "Campus Water Point";
            if (
              typeof report.waterPointId === "object" &&
              report.waterPointId?.name
            ) {
              waterPointName = report.waterPointId.name;
            } else if (
              typeof report.waterPointId === "string" &&
              waterPointsMap[report.waterPointId]
            ) {
              waterPointName = waterPointsMap[report.waterPointId];
            }

            const issueLabel =
              ISSUE_TYPE_LABELS[report.issueType] ||
              (report.issueType || "").replace(/_/g, " ");

            const formattedDate = report.createdAt
              ? new Date(report.createdAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "Recently";

            return (
              <Card
                key={report._id}
                className="hover:border-gray-300 transition-all shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900">
                          {issueLabel}
                        </span>
                        <StatusBadge status={report.status} />
                      </div>

                      <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{waterPointName}</span>
                      </p>

                      <p className="text-[11px] text-gray-400">
                        Submitted: {formattedDate} ({formatRelativeTime(report.createdAt)}) &bull; Report ID:{" "}
                        <span className="font-mono">{report._id}</span>
                      </p>
                    </div>

                    <div className="self-start sm:self-center">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-600">
                        Status:{" "}
                        <strong className="capitalize">
                          {(report.status || "open").replace(/_/g, " ")}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {report.description && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-700 bg-gray-50/80 p-3 rounded-lg border border-gray-100 italic">
                        &ldquo;{report.description}&rdquo;
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}

export default function ReportsHistoryPage() {
  return (
    <ProtectedRoute>
      <ReportsHistoryContent />
    </ProtectedRoute>
  );
}
