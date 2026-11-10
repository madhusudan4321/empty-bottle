"use client";

import { useCrowdTracker } from "./CrowdTrackerProvider";
import { useAuth } from "@/context/AuthContext";

export default function ShareLocationToggle({ compact = false }) {
  const { user } = useAuth();
  const { sharing, setSharing, status, currentWaterPoint } = useCrowdTracker();

  // Only render for students
  if (!user || user.role !== "student") {
    return null;
  }

  const handleToggle = () => {
    setSharing(!sharing);
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-1 py-1 px-2">
        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="text-xs font-medium text-gray-700">
            Share location for crowds
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={sharing}
            onClick={handleToggle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              sharing ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                sharing ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
        {sharing && currentWaterPoint && (
          <div className="text-[11px] text-emerald-700 font-medium truncate">
            📍 Near: {currentWaterPoint.name}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <label
            htmlFor="share-location-toggle"
            className="text-sm font-semibold text-gray-900 cursor-pointer flex items-center gap-2"
          >
            <span>Share my location to help estimate crowds</span>
          </label>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your location stays on your phone. Only &apos;near water point X&apos; is sent, and it is removed when you leave. No location history is kept.
          </p>
        </div>

        <button
          id="share-location-toggle"
          type="button"
          role="switch"
          aria-checked={sharing}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            sharing ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              sharing ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Dynamic Status / Feedback */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1.5 text-xs">
        {sharing && currentWaterPoint ? (
          <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-100">
            <span>📍</span>
            <span>
              You are near: <strong>{currentWaterPoint.name}</strong>
            </span>
          </div>
        ) : sharing && status === "active" ? (
          <div className="text-blue-600 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Location active • Walking on campus</span>
          </div>
        ) : null}

        {status === "denied" && (
          <div className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
            ⚠️ Location permission was denied in your browser settings. Please allow location access to enable crowd sharing.
          </div>
        )}

        {status === "unavailable" && (
          <div className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
            ⚠️ Geolocation is unavailable on this browser or device.
          </div>
        )}

        <p className="text-[11px] text-gray-500">
          Crowd levels are live estimates based on active students who have opted into location sharing.
        </p>
      </div>
    </div>
  );
}
