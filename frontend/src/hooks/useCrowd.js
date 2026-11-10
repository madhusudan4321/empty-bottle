"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";

export function useCrowd() {
  const [crowdById, setCrowdById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const intervalRef = useRef(null);

  const fetchCrowd = useCallback(async () => {
    try {
      const data = await apiFetch("/api/crowd", { cache: "no-store" });
      const map = {};
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.waterPointId) {
            map[item.waterPointId] = item;
          }
        }
      }
      setCrowdById(map);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load crowd data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchCrowd();

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchCrowd, 10000);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchCrowd();
        startPolling();
      } else {
        stopPolling();
      }
    };

    const handleFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchCrowd();
      }
    };

    const handleCustomRefresh = () => {
      fetchCrowd();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    window.addEventListener("crowd-refresh", handleCustomRefresh);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      window.removeEventListener("crowd-refresh", handleCustomRefresh);
    };
  }, [fetchCrowd]);

  return {
    crowdById,
    loading,
    error,
    refresh: fetchCrowd,
    lastUpdated,
  };
}
