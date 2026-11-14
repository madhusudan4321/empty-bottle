"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import {
  getWalkingRoute,
  formatDistance,
  formatDuration,
  getCompassDirection,
} from "@/lib/routing";
import { getDistanceInMeters } from "@/app/water-points/distance";

// Precise coordinates & boundaries for Lovely Professional University (LPU), Phagwara, Punjab
export const LPU_CENTER = [31.2536, 75.7037];
export const LPU_CAMPUS_BOUNDS = [
  [31.240, 75.688], // South-West corner
  [31.266, 75.720], // North-East corner
];

/**
 * Checks whether a given coordinate is within or near the LPU campus area.
 */
export const isLpuCampusPoint = (lat, lng) =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  lat >= 31.235 &&
  lat <= 31.270 &&
  lng >= 75.680 &&
  lng <= 75.728;

/**
 * Cache for L.divIcon instances so React-Leaflet does not call marker.setIcon()
 * and rebuild the marker DOM on every re-render.
 */
const iconCache = new Map();

function createWaterPointIcon(availability, isSelected) {
  const color =
    availability === "available"
      ? "#10B981" // emerald green
      : availability === "unavailable"
      ? "#EF4444" // red
      : "#F59E0B"; // amber (maintenance)

  const size = isSelected ? 42 : 30;
  const strokeColor = isSelected ? "#1E3A8A" : "#FFFFFF";
  const strokeWidth = isSelected ? 3.5 : 2;

  const html = `
    <div style="width:${size}px; height:${size}px; display:flex; align-items:center; justify-content:center; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35)); cursor:pointer;">
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2 C16 2, 6 14, 6 21 C6 26.5 10.5 31 16 31 C21.5 31 26 26.5 26 21 C26 14 16 2 16 2 Z"
              fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <circle cx="16" cy="21" r="${isSelected ? 5 : 4}" fill="#FFFFFF" />
      </svg>
    </div>
  `;

  return L.divIcon({
    className: "water-point-custom-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

function getWaterPointIcon(availability, isSelected) {
  const key = `${availability || "available"}_${isSelected ? "1" : "0"}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, createWaterPointIcon(availability, isSelected));
  }
  return iconCache.get(key);
}

let cachedUserIcon = null;
function getUserLocationIcon() {
  if (!cachedUserIcon) {
    const html = `
      <div style="position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; width:24px; height:24px; border-radius:50%; background-color:#3B82F6; opacity:0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width:14px; height:14px; border-radius:50%; background-color:#2563EB; border:2.5px solid #FFFFFF; box-shadow:0 1px 5px rgba(0,0,0,0.4);"></div>
      </div>
    `;
    cachedUserIcon = L.divIcon({
      className: "user-location-custom-icon",
      html,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }
  return cachedUserIcon;
}

// Stable style caches for vector layers
const crowdZoneStyleCache = {
  LOW: { color: "#10B981", fillColor: "#10B981", fillOpacity: 0.16, weight: 1.5, dashArray: "3, 3" },
  MODERATE: { color: "#F59E0B", fillColor: "#F59E0B", fillOpacity: 0.16, weight: 1.5, dashArray: "3, 3" },
  HIGH: { color: "#EF4444", fillColor: "#EF4444", fillOpacity: 0.16, weight: 1.5, dashArray: "3, 3" },
  UNKNOWN: { color: "#9CA3AF", fillColor: "#9CA3AF", fillOpacity: 0.16, weight: 1.5, dashArray: "3, 3" },
};

const userAccuracyPathOptions = {
  color: "#3B82F6",
  fillColor: "#3B82F6",
  fillOpacity: 0.12,
  weight: 1,
};

/**
 * Controller subcomponent to handle LPU campus auto-focus, "Show on Map" building zoom,
 * and route bounds fitting.
 */
function MapController({
  waterPoints,
  selectedId,
  userPosition,
  routePath,
  markerRefs,
}) {
  const map = useMap();
  const initialFitDoneRef = useRef(false);
  const prevSelectedIdRef = useRef(null);

  // Invalidate map size on mount and on window resize to ensure full tile rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  // Initial load: either focus directly on selectedId or fit within LPU campus bounds
  useEffect(() => {
    if (!initialFitDoneRef.current && waterPoints && waterPoints.length > 0) {
      if (selectedId) {
        // Direct focus on the selected water point (e.g., clicked "Show on map")
        const target = waterPoints.find((wp) => wp._id === selectedId);
        if (target && typeof target.latitude === "number") {
          map.setView([target.latitude, target.longitude], 18, { animate: false });
          initialFitDoneRef.current = true;
          prevSelectedIdRef.current = selectedId;
          setTimeout(() => {
            markerRefs.current?.[selectedId]?.openPopup();
          }, 200);
          return;
        }
      }

      // No selectedId: fit ONLY campus water points located at LPU
      const campusPoints = waterPoints.filter(
        (wp) =>
          typeof wp.latitude === "number" &&
          typeof wp.longitude === "number" &&
          isLpuCampusPoint(wp.latitude, wp.longitude)
      );

      if (campusPoints.length > 1) {
        const bounds = L.latLngBounds(
          campusPoints.map((wp) => [wp.latitude, wp.longitude])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18, minZoom: 16 });
      } else if (campusPoints.length === 1) {
        map.setView([campusPoints[0].latitude, campusPoints[0].longitude], 17);
      } else {
        // Fallback to LPU center
        map.setView(LPU_CENTER, 17);
      }
      initialFitDoneRef.current = true;
    }
  }, [map, waterPoints, selectedId, markerRefs]);

  // Fly to selected water point when selectedId changes afterwards
  useEffect(() => {
    if (selectedId && selectedId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedId;
      const target = waterPoints?.find((wp) => wp._id === selectedId);
      if (target && typeof target.latitude === "number") {
        map.flyTo([target.latitude, target.longitude], 18, { duration: 0.8 });
        const timer = setTimeout(() => {
          markerRefs.current?.[selectedId]?.openPopup();
        }, 850);
        return () => clearTimeout(timer);
      }
    } else if (!selectedId) {
      prevSelectedIdRef.current = null;
    }
  }, [selectedId, waterPoints, map, markerRefs]);

  // Fit bounds to active walking route ONLY when route changes
  const prevRouteRef = useRef(null);
  useEffect(() => {
    if (routePath && routePath.length > 0 && routePath !== prevRouteRef.current) {
      prevRouteRef.current = routePath;
      const bounds = L.latLngBounds(routePath);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }
  }, [routePath, map]);

  return null;
}

/**
 * Interactive Lovely Professional University (LPU) campus drinking water map.
 */
export default function WaterMap({
  waterPoints = [],
  crowdById = {},
  selectedId = null,
  onSelect = null,
  height = "70vh",
  showCrowdZones = true,
  userPosition = null,
  onRequestLocation = null,
}) {
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [locationNotice, setLocationNotice] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const markerRefs = useRef({});

  // Compute clean initial center (selected point, or single point, or LPU campus center)
  const initialCenter = useMemo(() => {
    if (selectedId) {
      const target = waterPoints?.find((wp) => wp._id === selectedId);
      if (target && typeof target.latitude === "number") {
        return [target.latitude, target.longitude];
      }
    }
    if (
      waterPoints &&
      waterPoints.length === 1 &&
      typeof waterPoints[0].latitude === "number"
    ) {
      return [waterPoints[0].latitude, waterPoints[0].longitude];
    }
    return LPU_CENTER;
  }, [selectedId, waterPoints]);

  // Recenter map on user location
  const handleRecenterUser = useCallback(() => {
    if (
      userPosition &&
      typeof userPosition.latitude === "number" &&
      typeof userPosition.longitude === "number" &&
      mapInstance
    ) {
      mapInstance.flyTo([userPosition.latitude, userPosition.longitude], 18, {
        duration: 0.8,
      });
    } else if (onRequestLocation) {
      onRequestLocation();
    }
  }, [userPosition, mapInstance, onRequestLocation]);

  // Reset view to LPU campus center
  const handleResetLpuCampus = useCallback(() => {
    if (mapInstance) {
      mapInstance.flyTo(LPU_CENTER, 17, { duration: 0.8 });
    }
  }, [mapInstance]);

  // Request walking directions to a target water point
  const handleGetDirections = useCallback(
    async (wp) => {
      if (!userPosition || typeof userPosition.latitude !== "number") {
        setLocationNotice("Please enable your location to get walking directions.");
        if (onRequestLocation) {
          onRequestLocation();
        }
        return;
      }

      setLocationNotice(null);
      setRouteLoading(true);
      setRouteError(null);
      setShowSteps(false);

      const from = {
        latitude: userPosition.latitude,
        longitude: userPosition.longitude,
      };
      const to = {
        latitude: wp.latitude,
        longitude: wp.longitude,
      };

      try {
        const result = await getWalkingRoute(from, to);
        setActiveRoute({
          destination: wp,
          path: result.path,
          distanceMeters: result.distanceMeters,
          durationSeconds: result.durationSeconds,
          steps: result.steps || [],
          routerSource: result.routerSource,
          isFallback: false,
        });
      } catch (err) {
        // Fallback: high-contrast straight line with Haversine distance and compass bearing
        const distance = getDistanceInMeters(
          from.latitude,
          from.longitude,
          to.latitude,
          to.longitude
        );
        const compass = getCompassDirection(
          from.latitude,
          from.longitude,
          to.latitude,
          to.longitude
        );

        setActiveRoute({
          destination: wp,
          path: [
            [from.latitude, from.longitude],
            [to.latitude, to.longitude],
          ],
          distanceMeters: distance || 0,
          durationSeconds: Math.round((distance || 0) / 1.3),
          compass,
          isFallback: true,
          errorMessage: err.message || "Route calculation unavailable.",
        });
        setRouteError(
          "Direct walkway unavailable. Showing direct line & compass direction."
        );
      } finally {
        setRouteLoading(false);
      }
    },
    [userPosition, onRequestLocation]
  );

  const handleClearRoute = () => {
    setActiveRoute(null);
    setRouteError(null);
    setShowSteps(false);
  };

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex flex-col"
      style={{ height }}
    >
      {/* Global CSS overrides for Leaflet markers and popups */}
      <style>{`
        .water-point-custom-icon, .user-location-custom-icon {
          background: transparent !important;
          border: none !important;
        }
        .water-point-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1);
          padding: 0;
          overflow: hidden;
        }
        .water-point-popup .leaflet-popup-content {
          margin: 10px 14px;
          line-height: 1.4;
        }
      `}</style>

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 max-w-[calc(100%-60px)]">
        {onRequestLocation && (
          <button
            type="button"
            onClick={handleRecenterUser}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-gray-800 shadow-md hover:bg-gray-100 active:bg-gray-200 transition-all border border-gray-200 cursor-pointer min-h-[36px]"
            title={userPosition ? "Center on my location" : "Find my location"}
          >
            <span className="text-sm">📍</span>
            <span>{userPosition ? "My Location" : "Find Me"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleResetLpuCampus}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-blue-700 shadow-md hover:bg-blue-50 active:bg-blue-100 transition-all border border-blue-200 cursor-pointer min-h-[36px]"
          title="Reset view to Lovely Professional University (LPU) campus"
        >
          <span className="text-sm">🏫</span>
          <span>LPU Campus</span>
        </button>

        {/* Temporary location notice */}
        {locationNotice && !userPosition && (
          <div className="bg-amber-50 text-amber-900 border border-amber-200 text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
            <span>ℹ️</span>
            <span>{locationNotice}</span>
            <button
              type="button"
              onClick={() => setLocationNotice(null)}
              className="ml-1 font-bold hover:text-amber-700"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Directions Card with Clear Walkway Details & Step Breakdown */}
      {activeRoute && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-[1000] bg-white rounded-xl shadow-2xl border border-gray-200 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 max-h-[70vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                <span>🚶 Walking Route</span>
                {activeRoute.isFallback ? (
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">
                    Direct Heading
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                    Campus Walkway
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900 mt-0.5">
                {activeRoute.destination.name}
              </h4>
              {(activeRoute.destination.building ||
                activeRoute.destination.floor ||
                activeRoute.destination.landmark) && (
                <p className="text-[11px] text-gray-500 font-medium">
                  {[
                    activeRoute.destination.building,
                    activeRoute.destination.floor
                      ? `Floor ${activeRoute.destination.floor}`
                      : null,
                    activeRoute.destination.landmark
                      ? `Near ${activeRoute.destination.landmark}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearRoute}
              className="text-xs text-gray-400 hover:text-gray-700 font-bold p-1 rounded hover:bg-gray-100"
              title="Clear route"
            >
              &times;
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="text-base">📏</span>
              <div>
                <span className="text-[10px] text-blue-600 font-medium block">
                  Distance
                </span>
                <span className="font-bold text-blue-900 text-sm">
                  {formatDistance(activeRoute.distanceMeters)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <span className="text-base">⏱️</span>
              <div>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  Est. Walk Time
                </span>
                <span className="font-bold text-emerald-900 text-sm">
                  {formatDuration(activeRoute.durationSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Fallback Compass Heading Helper */}
          {activeRoute.isFallback && activeRoute.compass && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
              <span className="text-base">🧭</span>
              <div>
                <p className="font-semibold">
                  Head {activeRoute.compass.cardinal} ({activeRoute.compass.bearing}&deg;)
                </p>
                <p className="text-[11px] text-amber-800">
                  Follow direct bearing across campus to reach dispenser.
                </p>
              </div>
            </div>
          )}

          {/* Turn-by-Turn Steps Toggle */}
          {activeRoute.steps && activeRoute.steps.length > 0 && (
            <div className="border border-gray-100 rounded-lg p-2.5 bg-gray-50 text-xs">
              <button
                type="button"
                onClick={() => setShowSteps(!showSteps)}
                className="w-full flex items-center justify-between text-gray-700 font-semibold hover:text-blue-600"
              >
                <span>📍 Campus Steps ({activeRoute.steps.length})</span>
                <span>{showSteps ? "▲" : "▼"}</span>
              </button>

              {showSteps && (
                <ol className="mt-2 space-y-1.5 pl-4 list-decimal text-gray-600 border-t border-gray-200 pt-2 text-[11px]">
                  {activeRoute.steps.map((step, idx) => (
                    <li key={idx} className="leading-tight">
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Action Links */}
          <div className="pt-1 flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition?.latitude},${userPosition?.longitude}&destination=${activeRoute.destination.latitude},${activeRoute.destination.longitude}&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all"
            >
              <span>🗺️ Turn-by-Turn in Google Maps</span>
              <span className="text-[10px]">&rarr;</span>
            </a>

            <button
              type="button"
              onClick={handleClearRoute}
              className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map Container Locked to Lovely Professional University */}
      <MapContainer
        center={initialCenter}
        zoom={17}
        minZoom={15}
        maxZoom={19}
        maxBounds={LPU_CAMPUS_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        ref={setMapInstance}
      >
        <MapController
          waterPoints={waterPoints}
          selectedId={selectedId}
          userPosition={userPosition}
          routePath={activeRoute?.path}
          markerRefs={markerRefs}
        />

        {/* Base Layer Switcher */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Esri Satellite">
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Crowd Zones Circles */}
        {showCrowdZones &&
          waterPoints.map((wp) => {
            if (typeof wp.latitude !== "number" || typeof wp.longitude !== "number")
              return null;
            const crowd = crowdById?.[wp._id];
            const radius =
              typeof wp.crowdRadius === "number" && wp.crowdRadius > 0
                ? wp.crowdRadius
                : 30;
            const style =
              crowdZoneStyleCache[crowd?.level] || crowdZoneStyleCache.UNKNOWN;

            return (
              <Circle
                key={`circle-${wp._id}`}
                center={[wp.latitude, wp.longitude]}
                radius={radius}
                pathOptions={style}
              />
            );
          })}

        {/* Water Points Markers */}
        {waterPoints.map((wp) => {
          if (typeof wp.latitude !== "number" || typeof wp.longitude !== "number")
            return null;

          const isSelected = wp._id === selectedId;
          const crowd = crowdById?.[wp._id];
          const icon = getWaterPointIcon(wp.availability, isSelected);

          const locationText = [
            wp.building,
            wp.floor ? `Floor ${wp.floor}` : null,
            wp.landmark ? `Near ${wp.landmark}` : null,
          ]
            .filter(Boolean)
            .join(" • ");

          return (
            <Marker
              key={wp._id}
              position={[wp.latitude, wp.longitude]}
              icon={icon}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[wp._id] = ref;
                } else {
                  delete markerRefs.current[wp._id];
                }
              }}
              eventHandlers={{
                click: () => {
                  if (onSelect) {
                    onSelect(wp._id);
                  }
                },
              }}
            >
              <Popup className="water-point-popup" autoPanPadding={[12, 12]}>
                <div className="p-1 max-w-[240px] space-y-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug">
                      {wp.name}
                    </h3>
                    {locationText && (
                      <p className="text-xs text-gray-600 font-medium mt-0.5">
                        {locationText}
                      </p>
                    )}
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        wp.availability === "available"
                          ? "bg-emerald-100 text-emerald-800"
                          : wp.availability === "unavailable"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {wp.availability || "Unknown"}
                    </span>
                    {crowd?.level && (
                      <span className="text-[11px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                        Crowd: <strong>{crowd.level}</strong>
                      </span>
                    )}
                  </div>

                  {/* Crowd estimate text */}
                  {crowd ? (
                    <p className="text-xs text-gray-600">
                      👥 <strong>{crowd.count}</strong> people nearby (estimated)
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">Crowd data unknown</p>
                  )}

                  {/* Action links */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/water-points/${wp._id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Details &rarr;
                      </Link>

                      <button
                        type="button"
                        disabled={routeLoading}
                        onClick={() => handleGetDirections(wp)}
                        className="text-xs font-semibold bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 cursor-pointer"
                      >
                        {routeLoading && activeRoute?.destination?._id === wp._id
                          ? "Routing..."
                          : "🚶 Directions"}
                      </button>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition?.latitude || ""}&destination=${wp.latitude},${wp.longitude}&travelmode=walking`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1 pt-0.5 hover:underline"
                    >
                      <span>🗺️ Open in Google Maps</span>
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* User Location Marker & Accuracy Circle */}
        {userPosition &&
          typeof userPosition.latitude === "number" &&
          typeof userPosition.longitude === "number" && (
            <>
              {typeof userPosition.accuracy === "number" &&
                userPosition.accuracy > 0 && (
                  <Circle
                    center={[userPosition.latitude, userPosition.longitude]}
                    radius={userPosition.accuracy}
                    pathOptions={userAccuracyPathOptions}
                  />
                )}
              <Marker
                position={[userPosition.latitude, userPosition.longitude]}
                icon={getUserLocationIcon()}
              >
                <Popup autoPanPadding={[12, 12]}>
                  <div className="text-xs text-gray-800 font-medium">
                    📍 <strong>Your Current Location</strong>
                    {userPosition.accuracy != null && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Accuracy: &plusmn;{Math.round(userPosition.accuracy)} m
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            </>
          )}

        {/* Directions Walking Route Polylines: High-contrast white casing + vibrant blue core */}
        {activeRoute?.path && (
          <>
            {/* White outer border casing */}
            <Polyline
              positions={activeRoute.path}
              pathOptions={{
                color: "#FFFFFF",
                weight: 9,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* Inner vibrant line */}
            <Polyline
              positions={activeRoute.path}
              pathOptions={{
                color: "#2563EB",
                weight: 5,
                opacity: 1.0,
                lineCap: "round",
                lineJoin: "round",
                dashArray: activeRoute.isFallback ? "8, 8" : undefined,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
