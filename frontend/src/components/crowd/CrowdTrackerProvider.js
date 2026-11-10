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
import {
  isInside,
  hasLeft,
  nearestInside,
  getNearestWaterPoint,
  MAX_ACCURACY_METERS,
} from "@/lib/geofence";
import { getDistanceInMeters } from "@/app/water-points/distance";

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

  // Debug states (on-screen only, ?debug=1)
  const [isDebug, setIsDebug] = useState(false);
  const [debugAccuracy, setDebugAccuracy] = useState(null);
  const [debugNearest, setDebugNearest] = useState(null);
  const [debugDecision, setDebugDecision] = useState(null);
  const [debugZoneText, setDebugZoneText] = useState("OUTSIDE");
  const [lastPresenceCall, setLastPresenceCall] = useState(null);

  const waterPointsRef = useRef([]);
  const currentZoneRef = useRef(null);
  const candidateZoneRef = useRef(null);
  const watchIdRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const wpIntervalRef = useRef(null);
  const prevUserRef = useRef(user);

  // Jump filter state refs
  const lastAcceptedReadingRef = useRef(null);
  const jumpCandidateRef = useRef(null);

  const userRef = useRef(user);
  const sharingRef = useRef(sharing);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    sharingRef.current = sharing;
  }, [sharing]);

  // Check ?debug=1 in query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsDebug(params.get("debug") === "1");
    }
  }, []);

  // Initialize sharing preference from localStorage
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

  const callEnter = useCallback(async (waterPointId) => {
    const time = new Date().toLocaleTimeString();
    try {
      await apiFetch("/api/presence/enter", {
        method: "POST",
        body: { waterPointId },
      });
      setLastPresenceCall({
        endpoint: "POST /api/presence/enter",
        status: 200,
        time,
      });
    } catch (err) {
      setLastPresenceCall({
        endpoint: "POST /api/presence/enter",
        status: err.status || 500,
        time,
      });
    }
  }, []);

  const callLeave = useCallback(async (keepalive = false) => {
    const time = new Date().toLocaleTimeString();
    try {
      await apiFetch("/api/presence/leave", {
        method: "POST",
        keepalive,
      });
      setLastPresenceCall({
        endpoint: "POST /api/presence/leave",
        status: 200,
        time,
      });
    } catch (err) {
      setLastPresenceCall({
        endpoint: "POST /api/presence/leave",
        status: err.status || 500,
        time,
      });
    }
  }, []);

  const callPing = useCallback(async (waterPointId) => {
    const time = new Date().toLocaleTimeString();
    try {
      await apiFetch("/api/presence/ping", {
        method: "POST",
        body: { waterPointId },
      });
      setLastPresenceCall({
        endpoint: "POST /api/presence/ping",
        status: 200,
        time,
      });
    } catch (err) {
      setLastPresenceCall({
        endpoint: "POST /api/presence/ping",
        status: err.status || 500,
        time,
      });
    }
  }, []);

  // Trigger crowd refresh across open pages
  const notifyCrowdRefresh = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("crowd-refresh"));
    }
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

  // Process a GPS position reading through the filters and enter/leave logic
  const processPosition = useCallback(
    async (pos) => {
      setStatus("active");
      const { latitude, longitude, accuracy } = pos.coords;
      const now = Date.now();

      setDebugAccuracy(accuracy);

      // Compute nearest water point for debug view
      const nearestOverall = getNearestWaterPoint(
        { latitude, longitude },
        waterPointsRef.current
      );
      if (nearestOverall) {
        setDebugNearest({
          name: nearestOverall.waterPoint.name,
          distance: nearestOverall.distance,
        });
      }

      // Rule 1: Global accuracy limit check
      if (accuracy > MAX_ACCURACY_METERS) {
        setDebugDecision({
          accepted: false,
          reason: `Accuracy ${Math.round(accuracy)}m > ${MAX_ACCURACY_METERS}m limit`,
        });
        return;
      }

      // Rule 2: GPS jump filter:
      // Ignore a single reading that jumps > 150m from previous accepted reading within 5s
      // unless a second reading confirms it.
      if (lastAcceptedReadingRef.current) {
        const distFromLast = getDistanceInMeters(
          lastAcceptedReadingRef.current.latitude,
          lastAcceptedReadingRef.current.longitude,
          latitude,
          longitude
        );
        const timeDiffSec =
          (now - lastAcceptedReadingRef.current.timestamp) / 1000;

        if (timeDiffSec <= 5 && distFromLast !== null && distFromLast > 150) {
          // Jump detected
          if (jumpCandidateRef.current) {
            const distFromJump = getDistanceInMeters(
              jumpCandidateRef.current.latitude,
              jumpCandidateRef.current.longitude,
              latitude,
              longitude
            );
            if (distFromJump !== null && distFromJump <= 150) {
              // Second reading confirms the position change
              jumpCandidateRef.current = null;
              lastAcceptedReadingRef.current = {
                latitude,
                longitude,
                accuracy,
                timestamp: now,
              };
            } else {
              // Erratic / different jump
              jumpCandidateRef.current = {
                latitude,
                longitude,
                accuracy,
                timestamp: now,
              };
              setDebugDecision({
                accepted: false,
                reason: `Jump ${Math.round(distFromLast)}m in ${timeDiffSec.toFixed(1)}s (unconfirmed)`,
              });
              return;
            }
          } else {
            // First jump reading - hold as candidate and ignore
            jumpCandidateRef.current = {
              latitude,
              longitude,
              accuracy,
              timestamp: now,
            };
            setDebugDecision({
              accepted: false,
              reason: `Jump ${Math.round(distFromLast)}m in ${timeDiffSec.toFixed(1)}s (first reading)`,
            });
            return;
          }
        } else {
          // Normal accepted reading
          jumpCandidateRef.current = null;
          lastAcceptedReadingRef.current = {
            latitude,
            longitude,
            accuracy,
            timestamp: now,
          };
        }
      } else {
        // First reading since session start
        jumpCandidateRef.current = null;
        lastAcceptedReadingRef.current = {
          latitude,
          longitude,
          accuracy,
          timestamp: now,
        };
      }

      setDebugDecision({
        accepted: true,
        reason: "Valid position",
      });

      const position = { latitude, longitude, accuracy };
      const waterPoints = waterPointsRef.current;
      const currentZone = currentZoneRef.current;
      const nearest = nearestInside(position, waterPoints);

      // If currently registered inside a zone
      if (currentZone) {
        // LEAVE condition:
        // distance - accuracy > crowdRadius OR distance > crowdRadius + 10 with accuracy <= 30
        if (hasLeft(position, currentZone)) {
          currentZoneRef.current = null;
          setCurrentWaterPoint(null);
          candidateZoneRef.current = null;
          setDebugZoneText("OUTSIDE (Left zone)");

          await callLeave();
          notifyCrowdRefresh();

          // After leaving, could this reading already qualify as candidate for another zone?
          if (nearest && nearest._id !== currentZone._id) {
            candidateZoneRef.current = {
              waterPoint: nearest,
              firstSeen: now,
              lastSeen: now,
              count: 1,
            };
            setDebugZoneText(`CANDIDATE: ${nearest.name} (1 reading, 0s/8s)`);
          }
          return;
        }

        // Still within current zone. Check if switching to a different zone:
        if (nearest && nearest._id !== currentZone._id) {
          if (
            candidateZoneRef.current &&
            candidateZoneRef.current.waterPoint._id === nearest._id
          ) {
            candidateZoneRef.current.count += 1;
            candidateZoneRef.current.lastSeen = now;
            const elapsed = now - candidateZoneRef.current.firstSeen;

            setDebugZoneText(
              `SWITCHING: ${nearest.name} (${candidateZoneRef.current.count} readings, ${Math.round(elapsed / 1000)}s/8s)`
            );

            // ENTER condition: stayed inside for >= 8s across >= 2 good readings
            if (candidateZoneRef.current.count >= 2 && elapsed >= 8000) {
              await callEnter(nearest._id);
              currentZoneRef.current = nearest;
              setCurrentWaterPoint(nearest);
              candidateZoneRef.current = null;
              setDebugZoneText(`INSIDE: ${nearest.name}`);
              notifyCrowdRefresh();
            }
          } else {
            candidateZoneRef.current = {
              waterPoint: nearest,
              firstSeen: now,
              lastSeen: now,
              count: 1,
            };
            setDebugZoneText(`CANDIDATE: ${nearest.name} (1 reading, 0s/8s)`);
          }
        } else {
          // Cleanly inside currentZone
          candidateZoneRef.current = null;
          setDebugZoneText(`INSIDE: ${currentZone.name}`);
        }
      } else {
        // User is currently OUTSIDE all zones
        if (nearest) {
          // Reading is inside nearest zone (distance <= radius && accuracy <= radius)
          if (
            candidateZoneRef.current &&
            candidateZoneRef.current.waterPoint._id === nearest._id
          ) {
            candidateZoneRef.current.count += 1;
            candidateZoneRef.current.lastSeen = now;
            const elapsed = now - candidateZoneRef.current.firstSeen;

            setDebugZoneText(
              `CANDIDATE: ${nearest.name} (${candidateZoneRef.current.count} readings, ${Math.round(elapsed / 1000)}s/8s)`
            );

            // ENTER condition: stayed inside for >= 8s across >= 2 good readings
            if (candidateZoneRef.current.count >= 2 && elapsed >= 8000) {
              await callEnter(nearest._id);
              currentZoneRef.current = nearest;
              setCurrentWaterPoint(nearest);
              candidateZoneRef.current = null;
              setDebugZoneText(`INSIDE: ${nearest.name}`);
              notifyCrowdRefresh();
            }
          } else {
            candidateZoneRef.current = {
              waterPoint: nearest,
              firstSeen: now,
              lastSeen: now,
              count: 1,
            };
            setDebugZoneText(`CANDIDATE: ${nearest.name} (1 reading, 0s/8s)`);
          }
        } else {
          // Outside all zones
          if (
            candidateZoneRef.current &&
            hasLeft(position, candidateZoneRef.current.waterPoint)
          ) {
            candidateZoneRef.current = null;
          }
          setDebugZoneText("OUTSIDE");
        }
      }
    },
    [callEnter, callLeave, notifyCrowdRefresh]
  );

  const handlePositionError = useCallback((err) => {
    if (err.code === err.PERMISSION_DENIED) {
      setStatus("denied");
      setSharingState(false);
      try {
        localStorage.setItem("eb_share_location", "false");
      } catch {}
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      setStatus("unavailable");
      setSharingState(false);
    } else {
      setStatus("error");
    }
  }, []);

  // Pause geolocation watcher and pinging
  const pauseTracking = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    setStatus("paused");
  }, []);

  // Start / resume geolocation watcher
  const startTracking = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setStatus("requesting");

    watchIdRef.current = navigator.geolocation.watchPosition(
      processPosition,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );
  }, [processPosition, handlePositionError]);

  // Request immediate fresh position and re-evaluate
  const refreshPositionImmediate = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      processPosition,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  }, [processPosition, handlePositionError]);

  // When user logs out while in a zone, send leave
  useEffect(() => {
    if (prevUserRef.current && !user) {
      if (currentZoneRef.current) {
        callLeave();
      }
      currentZoneRef.current = null;
      setCurrentWaterPoint(null);
      candidateZoneRef.current = null;
      lastAcceptedReadingRef.current = null;
      jumpCandidateRef.current = null;
    }
    prevUserRef.current = user;
  }, [user, callLeave]);

  // Lifecycle listeners:
  // - visibilitychange to hidden / pagehide: send leave (keepalive: true) and pause tracker
  // - visibilitychange to visible / pageshow / window focus: take fresh position, refetch /api/crowd
  useEffect(() => {
    const handleHidden = () => {
      if (currentZoneRef.current) {
        callLeave(true);
        currentZoneRef.current = null;
        setCurrentWaterPoint(null);
      }
      candidateZoneRef.current = null;
      pauseTracking();
    };

    const handleResume = () => {
      notifyCrowdRefresh();

      if (
        userRef.current &&
        userRef.current.role === "student" &&
        sharingRef.current
      ) {
        startTracking();
        refreshPositionImmediate();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleHidden();
      } else {
        handleResume();
      }
    };

    const onPageHide = () => {
      handleHidden();
    };

    const onPageShow = () => {
      handleResume();
    };

    const onFocus = () => {
      handleResume();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
    };
  }, [
    callLeave,
    pauseTracking,
    startTracking,
    refreshPositionImmediate,
    notifyCrowdRefresh,
  ]);

  // Ping interval: send /api/presence/ping every 30 seconds while inside a zone
  useEffect(() => {
    if (currentWaterPoint && sharing && user) {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      pingIntervalRef.current = setInterval(async () => {
        if (!currentZoneRef.current) return;
        await callPing(currentZoneRef.current._id);
      }, 30000);
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
  }, [currentWaterPoint, sharing, user, callPing]);

  // Main tracking effect
  useEffect(() => {
    // Only active when logged in as student and sharing is turned on
    if (!user || user.role !== "student" || !sharing) {
      if (currentZoneRef.current) {
        callLeave();
      }
      currentZoneRef.current = null;
      setCurrentWaterPoint(null);
      candidateZoneRef.current = null;
      lastAcceptedReadingRef.current = null;
      jumpCandidateRef.current = null;
      setStatus("idle");
      setDebugZoneText("OUTSIDE");

      if (
        watchIdRef.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
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

    // Fetch initial water points and setup 5-minute refresh
    fetchWaterPoints();
    wpIntervalRef.current = setInterval(fetchWaterPoints, 5 * 60 * 1000);

    // Start watching position
    startTracking();

    return () => {
      if (
        watchIdRef.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (wpIntervalRef.current) {
        clearInterval(wpIntervalRef.current);
        wpIntervalRef.current = null;
      }
    };
  }, [user, sharing, callLeave, fetchWaterPoints, setSharing, startTracking]);

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

      {/* Temporary Debug View: ?debug=1 on screen only for student with sharing on */}
      {isDebug && user && user.role === "student" && sharing && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs bg-gray-950/90 backdrop-blur text-white text-[11px] font-mono p-3 rounded-xl shadow-2xl border border-gray-700 pointer-events-auto space-y-1.5">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 font-semibold text-gray-200">
            <span>🐞 Crowd Debug</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              ?debug=1
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Accuracy:</span>
              <span
                className={
                  debugAccuracy != null && debugAccuracy <= MAX_ACCURACY_METERS
                    ? "text-emerald-400 font-semibold"
                    : "text-amber-400 font-semibold"
                }
              >
                {debugAccuracy != null
                  ? `${Math.round(debugAccuracy)}m (limit ${MAX_ACCURACY_METERS}m)`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Nearest WP:</span>
              <span className="text-right truncate max-w-[170px]">
                {debugNearest
                  ? `${Math.round(debugNearest.distance)}m (${debugNearest.name})`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reading:</span>
              <span
                className={
                  debugDecision?.accepted
                    ? "text-emerald-400 font-medium"
                    : "text-rose-400 font-medium truncate max-w-[170px]"
                }
                title={debugDecision?.reason}
              >
                {debugDecision
                  ? debugDecision.accepted
                    ? "Accepted"
                    : `Rejected: ${debugDecision.reason}`
                  : "Waiting..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">State:</span>
              <span
                className={
                  currentWaterPoint
                    ? "text-emerald-400 font-bold truncate max-w-[170px]"
                    : "text-gray-300 truncate max-w-[170px]"
                }
              >
                {debugZoneText}
              </span>
            </div>
            <div className="border-t border-gray-800 pt-1 text-[10px] flex justify-between">
              <span className="text-gray-400">Last Presence:</span>
              <span className="text-right text-gray-300 truncate max-w-[160px]">
                {lastPresenceCall
                  ? `${lastPresenceCall.endpoint} -> ${lastPresenceCall.status} (${lastPresenceCall.time})`
                  : "None"}
              </span>
            </div>
          </div>
        </div>
      )}
    </CrowdTrackerContext.Provider>
  );
}

export function useCrowdTracker() {
  return useContext(CrowdTrackerContext);
}
