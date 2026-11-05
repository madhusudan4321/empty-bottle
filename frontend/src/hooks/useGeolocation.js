"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      const err = new Error("Geolocation is not supported by your browser.");
      setStatus("unavailable");
      setError(err);
      return;
    }

    stop();
    setStatus("requesting");
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setPosition({ latitude, longitude });
        setAccuracy(acc);
        setStatus("granted");
        setError(null);
      },
      (err) => {
        let newStatus = "error";
        let message = err.message || "Failed to get location.";
        if (err.code === err.PERMISSION_DENIED) {
          newStatus = "denied";
          message = "Location permission was denied.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          newStatus = "unavailable";
          message = "Location information is unavailable.";
        }
        setStatus(newStatus);
        setError(new Error(message));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const getBestPosition = useCallback(
    ({ targetAccuracy = 10, maxWaitMs = 15000 } = {}) => {
      return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !navigator.geolocation) {
          const err = new Error("Geolocation is not supported by your browser.");
          setStatus("unavailable");
          setError(err);
          return reject(err);
        }

        setStatus("requesting");
        setError(null);

        let bestReading = null;
        let watchId = null;
        let timerId = null;
        let isDone = false;

        const cleanup = () => {
          isDone = true;
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
          }
          if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
          }
        };

        const handleSuccess = (pos) => {
          if (isDone) return;
          const { latitude, longitude, accuracy: acc } = pos.coords;

          // Keep the reading with the SMALLEST accuracy value
          if (!bestReading || acc < bestReading.accuracy) {
            bestReading = { latitude, longitude, accuracy: acc };
            setPosition({ latitude, longitude });
            setAccuracy(acc);
          }

          // If reached target accuracy, resolve immediately
          if (acc <= targetAccuracy) {
            cleanup();
            setStatus("granted");
            resolve({ latitude, longitude, accuracy: acc });
          }
        };

        const handleError = (err) => {
          if (isDone) return;
          let readableMessage = err.message || "Unable to acquire location.";
          let newStatus = "error";

          if (err.code === err.PERMISSION_DENIED) {
            newStatus = "denied";
            readableMessage =
              "Location permission was denied. Please allow location access in your browser settings.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            newStatus = "unavailable";
            readableMessage = "Location signal is unavailable. Try moving outdoors.";
          }

          // If no reading has arrived yet, fail
          if (!bestReading) {
            cleanup();
            const errorObj = new Error(readableMessage);
            setStatus(newStatus);
            setError(errorObj);
            reject(errorObj);
          }
        };

        watchId = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: Math.max(5000, maxWaitMs),
          }
        );

        timerId = setTimeout(() => {
          if (isDone) return;
          cleanup();

          if (bestReading) {
            setStatus("granted");
            resolve(bestReading);
          } else {
            const timeoutError = new Error(
              "No GPS reading arrived within time limit. Please try again."
            );
            setStatus("error");
            setError(timeoutError);
            reject(timeoutError);
          }
        }, maxWaitMs);
      });
    },
    []
  );

  return {
    position,
    accuracy,
    status,
    error,
    start,
    stop,
    getBestPosition,
  };
}

export default useGeolocation;

