"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { isInside, hasLeft, nearestInside } from "@/lib/geofence";

const CrowdTrackerContext = createContext({
  sharing: false,
  setSharing: () => {},
  status: "idle",
  currentWaterPoint: null,
});

export function CrowdTrackerProvider({ children }) {
  const { user } = useAuth();
  const [sharing, setSharingState] = useState(false);
  const [status, setStatus] = useState("idle");
  const [currentWaterPoint, setCurrentWaterPoint] = useState(null);

  const waterPointsRef = useRef([]);
  const currentZoneRef = useRef(null);
  const candidateZoneRef = useRef({ waterPointId: null, count: 0 });
  const watchIdRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const wpIntervalRef = useRef(null);
  const prevUserRef = useRef(user);

  // Initialize sharing from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eb_share_location");
      if (stored === "true") {
        setSharingState(true);
      }
    } catch {}
  }, []);

  const setSharing = useCallback((val) => {
    setSharingState(val);
    try {
      localStorage.setItem("eb_share_location", val ? "true" : "false");
    } catch {}
  }, []);

  const callLeave = useCallback(async (keepalive = false) => {
    try {
      await apiFetch("/api/presence/leave", {
        method: "POST",
        keepalive,
      });
    } catch {}
  }, []);

  // Fetch water points periodically (every 5 minutes)
  const fetchWaterPoints = useCallback(async () => {
    try {
      const data = await apiFetch("/api/water-points");
      if (Array.isArray(data)) {
        waterPointsRef.current = data;
      }
    } catch {}
  }, []);

  // When user logs out while in a zone, send leave
  useEffect(() => {
    if (prevUserRef.current && !user) {
      if (currentZoneRef.current) {
        callLeave();
      }
      currentZoneRef.current = null;
      setCurrentWaterPoint(null);
      candidateZoneRef.current = { waterPointId: null, count: 0 };
    }
    prevUserRef.current = user;
  }, [user, callLeave]);

  // Page unload / pagehide handler
  useEffect(() => {
    const handlePageHide = () => {
      if (currentZoneRef.current) {
        callLeave(true);
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [callLeave]);

  // Ping interval: send /api/presence/ping every 60 seconds while inside a zone
  useEffect(() => {
    if (currentWaterPoint && sharing && user) {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      pingIntervalRef.current = setInterval(async () => {
        if (!currentZoneRef.current) return;
        try {
          await apiFetch("/api/presence/ping", {
            method: "POST",
            body: { waterPointId: currentZoneRef.current._id },
          });
        } catch {}
      }, 60000);
    } else {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    }

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [currentWaterPoint, sharing, user]);

  // Main tracking effect
  useEffect(() => {
    // Only active when logged in and sharing is turned on
    if (!user || !sharing) {
      if (currentZoneRef.current) {
        callLeave();
      }
      currentZoneRef.current = null;
      setCurrentWaterPoint(null);
      candidateZoneRef.current = { waterPointId: null, count: 0 };
      setStatus("idle");

      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (wpIntervalRef.current) {
        clearInterval(wpIntervalRef.current);
        wpIntervalRef.current = null;
      }
      return;
    }

    // Geolocation unsupported
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setSharing(false);
      return;
    }

    setStatus("requesting");

    // Fetch initial water points and setup 5-minute refresh
    fetchWaterPoints();
    wpIntervalRef.current = setInterval(fetchWaterPoints, 5 * 60 * 1000);

    const handleSuccess = async (pos) => {
      setStatus("active");
      const { latitude, longitude, accuracy } = pos.coords;

      // Ignore readings worse than 50m accuracy
      if (accuracy > 50) {
        return;
      }

      const position = { latitude, longitude };
      const waterPoints = waterPointsRef.current;
      const currentZone = currentZoneRef.current;
      const nearest = nearestInside(position, waterPoints);

      // If user is currently registered in a zone
      if (currentZone) {
        // Check if user has left the current zone
        if (hasLeft(position, currentZone)) {
          // If nearest points to a new zone, candidate tracking starts for that zone
          if (nearest && nearest._id !== currentZone._id) {
            candidateZoneRef.current = {
              waterPointId: nearest._id,
              count: 1,
            };
          } else {
            candidateZoneRef.current = { waterPointId: null, count: 0 };
          }

          currentZoneRef.current = null;
          setCurrentWaterPoint(null);
          await callLeave();
          return;
        }

        // Still within current zone (or buffer), check if closer to a DIFFERENT zone
        if (nearest && nearest._id !== currentZone._id) {
          if (candidateZoneRef.current.waterPointId === nearest._id) {
            candidateZoneRef.current.count += 1;
          } else {
            candidateZoneRef.current = {
              waterPointId: nearest._id,
              count: 1,
            };
          }

          // Switch zone after 2 consecutive readings
          if (candidateZoneRef.current.count >= 2) {
            try {
              await apiFetch("/api/presence/enter", {
                method: "POST",
                body: { waterPointId: nearest._id },
              });
              currentZoneRef.current = nearest;
              setCurrentWaterPoint(nearest);
              candidateZoneRef.current = { waterPointId: null, count: 0 };
            } catch {}
          }
        } else {
          // Normal within current zone
          candidateZoneRef.current = { waterPointId: null, count: 0 };
        }
      } else {
        // Not currently in any zone
        if (nearest) {
          if (candidateZoneRef.current.waterPointId === nearest._id) {
            candidateZoneRef.current.count += 1;
          } else {
            candidateZoneRef.current = {
              waterPointId: nearest._id,
              count: 1,
            };
          }

          // Enter zone after 2 consecutive readings
          if (candidateZoneRef.current.count >= 2) {
            try {
              await apiFetch("/api/presence/enter", {
                method: "POST",
                body: { waterPointId: nearest._id },
              });
              currentZoneRef.current = nearest;
              setCurrentWaterPoint(nearest);
              candidateZoneRef.current = { waterPointId: null, count: 0 };
            } catch {}
          }
        } else {
          candidateZoneRef.current = { waterPointId: null, count: 0 };
        }
      }
    };

    const handleError = (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        setStatus("denied");
        setSharing(false);
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setStatus("unavailable");
        setSharing(false);
      } else {
        setStatus("error");
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      }
    );

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (wpIntervalRef.current) {
        clearInterval(wpIntervalRef.current);
        wpIntervalRef.current = null;
      }
    };
  }, [user, sharing, callLeave, fetchWaterPoints, setSharing]);

  return (
    <CrowdTrackerContext.Provider
      value={{
        sharing,
        setSharing,
        status,
        currentWaterPoint,
      }}
    >
      {children}
    </CrowdTrackerContext.Provider>
  );
}

export function useCrowdTracker() {
  return useContext(CrowdTrackerContext);
}
