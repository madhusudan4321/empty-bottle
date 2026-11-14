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
import { getWalkingRoute, formatDistance, formatDuration } from "@/lib/routing";
import { getDistanceInMeters } from "@/app/water-points/distance";

// Default coordinates: Lovely Professional University (LPU) campus
const LPU_CENTER = [31.2536, 75.7037];
const DEFAULT_ZOOM = 16;

/**
 * Creates custom SVG droplet marker icon based on availability and selection state.
 */
function createWaterPointIcon(availability, isSelected) {
  const color =
    availability === "available"
      ? "#10B981" // emerald green
      : availability === "unavailable"
      ? "#EF4444" // red
      : "#F59E0B"; // amber (maintenance)

  const size = isSelected ? 40 : 30;
  const strokeColor = isSelected ? "#1E3A8A" : "#FFFFFF";
  const strokeWidth = isSelected ? 3 : 2;

  const html = `
    <div style="width:${size}px; height:${size}px; display:flex; align-items:center; justify-content:center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
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

/**
 * Creates a pulsing blue dot icon for the user's current location.
 */
function createUserLocationIcon() {
  const html = `
    <div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:22px; height:22px; border-radius:50%; background-color:#3B82F6; opacity:0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width:14px; height:14px; border-radius:50%; background-color:#2563EB; border:2.5px solid #FFFFFF; box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>
    </div>
  `;

  return L.divIcon({
    className: "user-location-custom-icon",
    html,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

/**
 * Controller subcomponent to handle auto-fit bounds, invalidateSize, flyTo on selectedId, and route bounds.
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

  // Invalidate map size on mount and on window resize to prevent grey tiles
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

  // Initial fit to water points bounds
  useEffect(() => {
    if (!initialFitDoneRef.current && waterPoints && waterPoints.length > 0) {
      const validPoints = waterPoints.filter(
        (wp) => typeof wp.latitude === "number" && typeof wp.longitude === "number"
      );
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(
          validPoints.map((wp) => [wp.latitude, wp.longitude])
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
        initialFitDoneRef.current = true;
      }
    }
  }, [map, waterPoints]);

  // Fly to selected water point if selectedId changes
  useEffect(() => {
    if (selectedId && waterPoints) {
      const target = waterPoints.find((wp) => wp._id === selectedId);
      if (target && typeof target.latitude === "number") {
        map.flyTo([target.latitude, target.longitude], 17, { duration: 0.8 });
        const marker = markerRefs.current?.[selectedId];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [selectedId, waterPoints, map, markerRefs]);

  // Fit bounds to active route
  useEffect(() => {
    if (routePath && routePath.length > 0) {
      const bounds = L.latLngBounds(routePath);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [routePath, map]);

  return null;
}

/**
 * Interactive campus drinking water map component.
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
  const [mapInstance, setMapInstance] = useState(null);

  const markerRefs = useRef({});

  // Recenter map on user location
  const handleRecenterUser = useCallback(() => {
    if (
      userPosition &&
      typeof userPosition.latitude === "number" &&
      typeof userPosition.longitude === "number" &&
      mapInstance
    ) {
      mapInstance.flyTo([userPosition.latitude, userPosition.longitude], 17, {
        duration: 0.8,
      });
    } else if (onRequestLocation) {
      onRequestLocation();
    }
  }, [userPosition, mapInstance, onRequestLocation]);

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
          isFallback: false,
        });
      } catch (err) {
        // Fallback: straight line with Haversine distance
        const distance = getDistanceInMeters(
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
          durationSeconds: null,
          isFallback: true,
          errorMessage: err.message || "Route calculation unavailable.",
        });
        setRouteError(
          err.message || "Could not calculate walking path. Showing straight line."
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
  };

  // Helper to determine circle color based on crowd level
  const getCrowdZoneStyle = (level) => {
    switch (level) {
      case "LOW":
        return { color: "#10B981", fillColor: "#10B981" };
      case "MODERATE":
        return { color: "#F59E0B", fillColor: "#F59E0B" };
      case "HIGH":
        return { color: "#EF4444", fillColor: "#EF4444" };
      default:
        return { color: "#9CA3AF", fillColor: "#9CA3AF" };
    }
  };

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex flex-col"
      style={{ height }}
    >
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

      {/* Route Info Overlay Card */}
      {activeRoute && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-[1000] bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 space-y-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Directions to</p>
              <h4 className="text-sm font-bold text-gray-900">
                {activeRoute.destination.name}
              </h4>
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

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
              <span>🚶</span>
              <span>{formatDistance(activeRoute.distanceMeters)}</span>
            </div>
            {activeRoute.durationSeconds != null && (
              <div className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <span>⏱️</span>
                <span>{formatDuration(activeRoute.durationSeconds)}</span>
              </div>
            )}
            {activeRoute.isFallback && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Straight line
              </span>
            )}
          </div>

          {activeRoute.isFallback && routeError && (
            <p className="text-[11px] text-gray-500 leading-snug">
              Note: Walking path unavailable. Showing straight line. You can also open Google Maps below.
            </p>
          )}

          <div className="pt-1 flex items-center justify-between gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeRoute.destination.latitude},${activeRoute.destination.longitude}&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
            >
              <span>🗺️ Open in Google Maps</span>
              <span className="text-[10px]">&rarr;</span>
            </a>
            <button
              type="button"
              onClick={handleClearRoute}
              className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              Clear Route
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={LPU_CENTER}
        zoom={DEFAULT_ZOOM}
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
            const { color, fillColor } = getCrowdZoneStyle(crowd?.level);

            return (
              <Circle
                key={`circle-${wp._id}`}
                center={[wp.latitude, wp.longitude]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor,
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: "3, 3",
                }}
              />
            );
          })}

        {/* Water Points Markers */}
        {waterPoints.map((wp) => {
          if (typeof wp.latitude !== "number" || typeof wp.longitude !== "number")
            return null;

          const isSelected = wp._id === selectedId;
          const crowd = crowdById?.[wp._id];
          const icon = createWaterPointIcon(wp.availability, isSelected);

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
              <Popup className="water-point-popup">
                <div className="p-1 max-w-[260px] space-y-2">
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
                      href={`https://www.google.com/maps/dir/?api=1&destination=${wp.latitude},${wp.longitude}&travelmode=walking`}
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
                    pathOptions={{
                      color: "#3B82F6",
                      fillColor: "#3B82F6",
                      fillOpacity: 0.12,
                      weight: 1,
                    }}
                  />
                )}
              <Marker
                position={[userPosition.latitude, userPosition.longitude]}
                icon={createUserLocationIcon()}
              >
                <Popup>
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

        {/* Directions Walking Route Polyline */}
        {activeRoute?.path && (
          <Polyline
            positions={activeRoute.path}
            pathOptions={{
              color: "#2563EB",
              weight: 5,
              opacity: 0.85,
              dashArray: activeRoute.isFallback ? "8, 8" : undefined,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
