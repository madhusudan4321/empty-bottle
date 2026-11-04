"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageLayout from "@/components/ui/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import {
  AvailabilityBadge,
  CrowdBadge,
  CleanlinessBadge,
  TemperatureBadge,
} from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import {
  getDistanceInMeters,
  formatDistance,
  formatRelativeTime,
} from "../distance";

function WaterPointDetailContent({ userPosition = null }) {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [waterPoint, setWaterPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiFetch(`/api/water-points/${id}`);
      setWaterPoint(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchData();
  };

  if (loading) {
    return (
      <PageLayout title="Water Point Details">
        <div className="py-16 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-gray-500">
            Loading water point details...
          </p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    const is404 =
      error.status === 404 ||
      (error.message && error.message.toLowerCase().includes("not found"));

    if (is404) {
      return (
        <PageLayout title="Water Point Not Found">
          <EmptyState
            title="Water Point Not Found"
            description={`No drinking water point exists with ID: "${id}". It may have been removed or relocated.`}
            action={
              <Button onClick={() => router.push("/water-points")}>
                &larr; Back to Water Points
              </Button>
            }
          />
        </PageLayout>
      );
    }

    return (
      <PageLayout title="Water Point Details">
        <ErrorMessage
          title="Failed to load water point details"
          message={error.message || "An unexpected error occurred."}
          onRetry={handleRetry}
        />
      </PageLayout>
    );
  }

  if (!waterPoint) {
    return (
      <PageLayout title="Water Point Not Found">
        <EmptyState
          title="Water Point Not Found"
          description={`No drinking water point exists with ID: "${id}".`}
          action={
            <Button onClick={() => router.push("/water-points")}>
              &larr; Back to Water Points
            </Button>
          }
        />
      </PageLayout>
    );
  }

  const distance =
    userPosition &&
    typeof userPosition.latitude === "number" &&
    typeof userPosition.longitude === "number" &&
    typeof waterPoint.latitude === "number" &&
    typeof waterPoint.longitude === "number"
      ? getDistanceInMeters(
          userPosition.latitude,
          userPosition.longitude,
          waterPoint.latitude,
          waterPoint.longitude
        )
      : null;

  const formattedDate = waterPoint.lastUpdated
    ? new Date(waterPoint.lastUpdated).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Recently";

  const subtitle = distance != null
    ? `Campus Drinking Point Details • ${formatDistance(distance)} from your current location`
    : "Campus Drinking Point Details";

  return (
    <PageLayout
      title={waterPoint.name}
      subtitle={subtitle}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/water-points")}
          >
            &larr; Back to List
          </Button>
          <Link href={`/reports/new?waterPointId=${waterPoint._id}`}>
            <Button variant="danger" size="sm">
              ⚠️ Report Issue
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Status &amp; Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(waterPoint.building || waterPoint.floor) && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 font-medium">
                  📍 {waterPoint.building}
                  {waterPoint.floor ? ` • Floor ${waterPoint.floor}` : ""}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-1">
                    Availability
                  </span>
                  <AvailabilityBadge availability={waterPoint.availability} />
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-1">
                    Temperature
                  </span>
                  <TemperatureBadge temperature={waterPoint.temperature} />
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-1">
                    Cleanliness
                  </span>
                  <CleanlinessBadge cleanliness={waterPoint.cleanliness} />
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-1">
                    Crowd Level
                  </span>
                  <CrowdBadge level={null} />
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Technical Specifications
                </h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <dt className="text-gray-500">Dispenser ID</dt>
                    <dd className="font-mono text-gray-800 text-xs">
                      {waterPoint._id}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <dt className="text-gray-500">Dispenser Capacity</dt>
                    <dd className="font-semibold text-gray-800">
                      {waterPoint.capacity != null
                        ? `${waterPoint.capacity} L / min`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <dt className="text-gray-500">Crowd Radius</dt>
                    <dd className="font-semibold text-gray-800">
                      {waterPoint.crowdRadius != null
                        ? `${waterPoint.crowdRadius} meters`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <dt className="text-gray-500">Last Verified</dt>
                    <dd className="text-gray-800 text-xs">
                      {formatRelativeTime(waterPoint.lastUpdated)} ({formattedDate})
                    </dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>

          {/* Report an Issue CTA banner */}
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                Notice something wrong at this point?
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Is the water warm, dirty, or is the tap leaking? Submit a quick report
                for campus maintenance staff.
              </p>
            </div>
            <Link href={`/reports/new?waterPointId=${waterPoint._id}`}>
              <Button variant="danger" size="sm">
                Report Issue
              </Button>
            </Link>
          </div>
        </div>

        {/* Sidebar: Location Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location &amp; Coordinates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Latitude:</span>
                  <span className="font-semibold text-gray-900">
                    {waterPoint.latitude != null
                      ? waterPoint.latitude.toFixed(6)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Longitude:</span>
                  <span className="font-semibold text-gray-900">
                    {waterPoint.longitude != null
                      ? waterPoint.longitude.toFixed(6)
                      : "—"}
                  </span>
                </div>
              </div>

              {waterPoint.latitude != null && waterPoint.longitude != null && (
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${waterPoint.latitude},${waterPoint.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span>Open in External Maps</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

export default function WaterPointDetailPage() {
  return (
    <ProtectedRoute>
      <WaterPointDetailContent />
    </ProtectedRoute>
  );
}
