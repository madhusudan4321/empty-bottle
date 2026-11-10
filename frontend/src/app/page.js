"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { homeForRole } from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(homeForRole(user.role));
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading Empty Bottle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 bg-blue-100 rounded-xl text-blue-600">💧</span>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              Empty Bottle
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <span>🚰</span>
            <span>Campus Drinking Water Finder • LPU</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight sm:leading-tight">
            Find clean, cool, uncrowded{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              drinking water
            </span>{" "}
            on campus.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Never walk up to an empty or broken dispenser again. Empty Bottle gives LPU students real-time availability, water temperature, cleanliness status, and live crowd levels.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
                Find Water Points &rarr;
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card className="hover:border-blue-300 transition shadow-sm hover:shadow-md">
              <CardContent className="p-6 space-y-3">
                <span className="text-3xl p-3 bg-blue-50 rounded-2xl text-blue-600 inline-block">
                  📍
                </span>
                <h3 className="font-bold text-gray-900 text-lg">
                  Campus-Wide Directory
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Pinpoint exact dispensers across all university academic blocks and residences with building, floor, and landmark directions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-indigo-300 transition shadow-sm hover:shadow-md">
              <CardContent className="p-6 space-y-3">
                <span className="text-3xl p-3 bg-indigo-50 rounded-2xl text-indigo-600 inline-block">
                  👥
                </span>
                <h3 className="font-bold text-gray-900 text-lg">
                  Real-Time Crowd Zones
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Opt-in, 100% privacy-preserving crowd density estimations. Check whether lines are short or busy before making the trip.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-amber-300 transition shadow-sm hover:shadow-md">
              <CardContent className="p-6 space-y-3">
                <span className="text-3xl p-3 bg-amber-50 rounded-2xl text-amber-600 inline-block">
                  🛠️
                </span>
                <h3 className="font-bold text-gray-900 text-lg">
                  Fast Maintenance
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Report leaking taps, warm water, or dirty filters in seconds. Campus facilities staff track, repair, and verify points rapidly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          <p>
            Empty Bottle &bull; Campus Drinking Water Finder &bull; Lovely Professional University
          </p>
        </div>
      </footer>
    </div>
  );
}
