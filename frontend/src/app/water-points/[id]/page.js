"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/ui/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  AvailabilityBadge,
  CrowdBadge,
  CleanlinessBadge,
  TemperatureBadge,
} from "@/components/ui/Badge";
import {
  MOCK_WATER_POINTS,
  MOCK_CROWD_DATA,
  MOCK_USER_COORDINATES,
} from "@/lib/mockData";
import {
  getDistanceInMeters,
  formatDistance,
} from "../distance";

export default function WaterPointDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const waterPoint = MOCK_WATER_POINTS.find((wp) => wp._id === id);
  const crowd = id ? MOCK_CROWD_DATA[id] : null;

  if (!waterPoint) {
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

  const userCoords = MOCK_USER_COORDINATES;
  const distance = getDistanceInMeters(
    userCoords.latitude,
    userCoords.longitude,
    waterPoint.latitude,
    waterPoint.longitude
  );

  const formattedDate = new Date(waterPoint.lastUpdated).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <PageLayout
      title={waterPoint.name}
      subtitle={`Campus Drinking Point Details • ${formatDistance(distance)} from your current location`}
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
                  {crowd ? (
                    <CrowdBadge
                      level={crowd.level}
                      percentage={crowd.percentage}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Unavailable</span>
                  )}
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
                    <dd className="font-mono text-gray-800 text-xs">{waterPoint._id}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <dt className="text-gray-500">Dispenser Capacity</dt>
                    <dd className="font-semibold text-gray-800">
                      {waterPoint.capacity} L / min
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <dt className="text-gray-500">Crowd Radius</dt>
                    <dd className="font-semibold text-gray-800">
                      {waterPoint.crowdRadius} meters
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <dt className="text-gray-500">Last Verified</dt>
                    <dd className="text-gray-800 text-xs">{formattedDate}</dd>
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
                    {waterPoint.latitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Longitude:</span>
                  <span className="font-semibold text-gray-900">
                    {waterPoint.longitude.toFixed(6)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Currently displayed by GPS latitude and longitude. An enhancement
                request has been submitted to add descriptive names (e.g. &ldquo;Behind
                Staircase 2&rdquo;).
              </p>

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
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
