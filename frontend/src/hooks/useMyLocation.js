"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Isolated geolocation hook dedicated to map views.
 * Keeps user location strictly in local React state.
 *
 * @returns {{
 *   position: { latitude: number, longitude: number, accuracy: number } | null,
 *   status: "idle" | "requesting" | "granted" | "denied" | "unavailable" | "error",
 *   error: string | null,
 *   request: () => void
 * }}
 */
export function useMyLocation() {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);

  const stopWatching = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const request = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Geolocation is not supported by your browser.");
      return;
    }

    // Reset previous error and start requesting
    setError(null);
    setStatus("requesting");

    stopWatching();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosition({ latitude, longitude, accuracy });
        setStatus("granted");
        setError(null);
      },
      (err) => {
        let newStatus = "error";
        let message = err?.message || "Failed to retrieve your location.";

        if (err.code === err.PERMISSION_DENIED) {
          newStatus = "denied";
          message =
            "Location permission was denied. Please allow location access in your browser to view your position.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          newStatus = "unavailable";
          message =
            "Location information is currently unavailable. Please check your GPS/device settings.";
        } else if (err.code === err.TIMEOUT) {
          message =
            "Location request timed out. Please check your signal and try again.";
        }

        setStatus(newStatus);
        setError(message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      }
    );
  }, [stopWatching]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    position,
    status,
    error,
    request,
  };
}
