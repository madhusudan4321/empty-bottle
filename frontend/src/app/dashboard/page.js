"use client";

import Link from "next/link";
import PageLayout from "@/components/ui/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  AvailabilityBadge,
  CrowdBadge,
  TemperatureBadge,
  StatusBadge,
} from "@/components/ui/Badge";
import {
  MOCK_USER,
  MOCK_WATER_POINTS,
  MOCK_CROWD_DATA,
  MOCK_REPORTS,
  MOCK_USER_COORDINATES,
} from "@/lib/mockData";
import {
  getDistanceInMeters,
  formatDistance,
} from "../water-points/distance";

export default function DashboardPage() {
  const user = MOCK_USER;
  const userCoords = MOCK_USER_COORDINATES;

  // Compute distances and sort water points closest to student
  const sortedWaterPoints = [...MOCK_WATER_POINTS]
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

  const nearestWaterPoints = sortedWaterPoints.slice(0, 3);
  const recentReports = MOCK_REPORTS.slice(0, 2);

  return (
    <PageLayout
      title={`Hi, ${user.name} 👋`}
      subtitle="Find clean, cold drinking water points across campus and report outages."
    >
      {/* Geolocation status note */}
      <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-800 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span>📍</span>
          <span>
            Using mock campus center coordinates (
            {userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)}
            ). Real-time browser GPS will activate once the Lead&apos;s geolocation
            hook is merged.
          </span>
        </span>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/water-points" className="block group">
          <Card className="h-full hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
            <CardContent className="p-5 flex items-start gap-4">
              <span className="text-3xl p-2.5 bg-blue-100 rounded-xl text-blue-600">
                🚰
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Find Drinking Water
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  View all campus water dispensers sorted by proximity and live
                  status.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/new" className="block group">
          <Card className="h-full hover:border-amber-300 transition-all shadow-sm hover:shadow-md">
            <CardContent className="p-5 flex items-start gap-4">
              <span className="text-3xl p-2.5 bg-amber-100 rounded-xl text-amber-600">
                ⚠️
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                  Report a Problem
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Let staff know about empty dispensers, warm water, dirt, or leaks.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports" className="block group">
          <Card className="h-full hover:border-emerald-300 transition-all shadow-sm hover:shadow-md">
            <CardContent className="p-5 flex items-start gap-4">
              <span className="text-3xl p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                📋
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  My Reports History
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Track resolution progress on issues you reported to campus staff.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Nearest Water Points Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Nearest Water Points
            </h2>
            <Link
              href="/water-points"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View all points &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {nearestWaterPoints.map((wp) => {
              const crowd = MOCK_CROWD_DATA[wp._id];
              return (
                <Card
                  key={wp._id}
                  className="hover:border-gray-300 transition-all"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {wp.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Coordinates: {wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)} &bull;{" "}
                          <span className="font-medium text-blue-700">
                            {formatDistance(wp.distance)} away
                          </span>
                        </p>
                      </div>

                      <Link href={`/water-points/${wp._id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                      <AvailabilityBadge availability={wp.availability} />
                      <TemperatureBadge temperature={wp.temperature} />
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
        </div>

        {/* Recent Reports / Campus Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Your Recent Reports</h2>
            <Link
              href="/reports"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              See all
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-xs text-gray-500">
                No active issue reports. Everything looks clear!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <Card key={report._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 capitalize">
                          {report.issueType.replace(/_/g, " ")}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {report.waterPointId.name}
                        </p>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                    {report.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2 bg-gray-50 p-2 rounded">
                        &ldquo;{report.description}&rdquo;
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Notice about Privacy / Aggregated Presence */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <h4 className="text-xs font-semibold text-slate-800">
                🔒 Privacy &amp; Crowd Estimation
              </h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Crowd levels are aggregate estimates calculated automatically. Your
                exact location is never stored or displayed to other students.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
