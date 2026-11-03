"use client";

import Link from "next/link";
import PageLayout from "@/components/ui/PageLayout";
import {
  Card,
  CardContent,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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
} from "./distance";

export default function WaterPointsPage() {
  const userCoords = MOCK_USER_COORDINATES;

  // Calculate distance for all water points and sort ascending by proximity
  const waterPoints = [...MOCK_WATER_POINTS]
    .map((wp) => {
      const distance = getDistanceInMeters(
        userCoords.latitude,
        userCoords.longitude,
        wp.latitude,
        wp.longitude
      );
      return { ...wp, distance };
    })
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return (
    <PageLayout
      title="Campus Water Points"
      subtitle="Find clean and cold drinking water dispensers nearest to your current location."
      actions={
        <Link href="/reports/new">
          <Button variant="outline" size="sm">
            ⚠️ Report Outage
          </Button>
        </Link>
      }
    >
      {/* Map component placeholder (Lead's feature pending merge) */}
      <div className="mb-6 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <span className="text-3xl mb-1">🗺️</span>
          <h3 className="text-sm font-semibold text-blue-900">
            Interactive Campus Water Map
          </h3>
          <p className="text-xs text-blue-700 max-w-md mt-1">
            The interactive campus map will be embedded here once the Lead&apos;s
            Map component (`components/map/WaterMap.js`) is merged.
          </p>
        </div>
      </div>

      {/* Note about location coordinates vs description */}
      <div className="mb-6 p-3 bg-gray-100 rounded-lg text-xs text-gray-600 flex items-center justify-between">
        <span>
          📌 <strong>Note on locations:</strong> Locations currently display GPS
          coordinates (latitude &amp; longitude). We have recommended that the Lead
          add an optional <code>locationDescription</code> field to the WaterPoint model.
        </span>
      </div>

      {/* Water Points List */}
      <div className="space-y-4">
        {waterPoints.map((wp) => {
          const crowd = MOCK_CROWD_DATA[wp._id];
          const formattedDate = new Date(wp.lastUpdated).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <Card
              key={wp._id}
              className="hover:border-blue-300 transition-all shadow-sm"
            >
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/water-points/${wp._id}`}
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {wp.name}
                      </Link>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {formatDistance(wp.distance)} away
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">
                      <strong>Location (GPS):</strong> Lat {wp.latitude.toFixed(5)}, Long {wp.longitude.toFixed(5)}
                    </p>

                    <p className="text-xs text-gray-400">
                      Last status check: today at {formattedDate}
                    </p>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <Link href={`/reports/new?waterPointId=${wp._id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-amber-700 hover:bg-amber-50">
                        Report Issue
                      </Button>
                    </Link>
                    <Link href={`/water-points/${wp._id}`}>
                      <Button variant="primary" size="sm" className="text-xs">
                        View Details &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <AvailabilityBadge availability={wp.availability} />
                  <TemperatureBadge temperature={wp.temperature} />
                  <CleanlinessBadge cleanliness={wp.cleanliness} />
                  {crowd && (
                    <CrowdBadge
                      level={crowd.level}
                      percentage={crowd.percentage}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
}
