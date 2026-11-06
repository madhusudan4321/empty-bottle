"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";

export function useCrowd() {
  const [crowdById, setCrowdById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);

  const fetchCrowd = useCallback(async () => {
    try {
      const data = await apiFetch("/api/crowd");
      const map = {};
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.waterPointId) {
            map[item.waterPointId] = item;
          }
        }
      }
      setCrowdById(map);
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

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchCrowd]);

  return {
    crowdById,
    loading,
    error,
    refresh: fetchCrowd,
  };
}
