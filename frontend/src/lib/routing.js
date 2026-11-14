/**
 * Walking route client utility for campus navigation using OpenRouteService.
 * Coordinates are formatted for Leaflet [lat, lng].
 */

/**
 * Formats distance in meters to a human-readable string ("85 m" / "1.2 km").
 * @param {number|null} m Distance in meters
 * @returns {string} Formatted distance
 */
export function formatDistance(m) {
  if (m == null || isNaN(m)) return "";
  if (m < 1000) {
    return `${Math.round(m)} m`;
  }
  const km = m / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/**
 * Formats duration in seconds to a human-readable string ("3 min" / "< 1 min" / "1 hr 5 min").
 * @param {number|null} s Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(s) {
  if (s == null || isNaN(s)) return "";
  const totalMinutes = Math.round(s / 60);
  if (totalMinutes < 1) {
    return "< 1 min";
  }
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}

/**
 * Fetches walking route between two coordinates via OpenRouteService foot-walking profile.
 *
 * @param {{ latitude?: number, lat?: number, longitude?: number, lng?: number }} from Origin coordinate
 * @param {{ latitude?: number, lat?: number, longitude?: number, lng?: number }} to Destination coordinate
 * @returns {Promise<{ path: [number, number][], distanceMeters: number, durationSeconds: number }>}
 */
export async function getWalkingRoute(from, to) {
  const fromLat = from?.latitude ?? from?.lat;
  const fromLng = from?.longitude ?? from?.lng;
  const toLat = to?.latitude ?? to?.lat;
  const toLng = to?.longitude ?? to?.lng;

  if (
    typeof fromLat !== "number" ||
    typeof fromLng !== "number" ||
    typeof toLat !== "number" ||
    typeof toLng !== "number"
  ) {
    throw new Error("Valid start and end coordinates are required.");
  }

  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "OpenRouteService API key is missing. Set NEXT_PUBLIC_ORS_API_KEY in .env.local."
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  // OpenRouteService expects start=LNG,LAT and end=LNG,LAT
  const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${encodeURIComponent(
    apiKey.trim()
  )}&start=${fromLng},${fromLat}&end=${toLng},${toLat}`;

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, application/geo+json",
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Invalid or unauthorized OpenRouteService API key.");
      }
      if (res.status === 429) {
        throw new Error(
          "OpenRouteService rate limit exceeded. Please try again later."
        );
      }
      let errorDetail = "";
      try {
        const errJson = await res.json();
        errorDetail = errJson?.error?.message || errJson?.message || "";
      } catch {
        // ignore json parse error
      }
      throw new Error(
        errorDetail || `Directions request failed with status ${res.status}.`
      );
    }

    const data = await res.json();
    const feature = data?.features?.[0];
    const coordinates = feature?.geometry?.coordinates;
    const summary = feature?.properties?.summary;

    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throw new Error("No walking route could be found between these points.");
    }

    // Convert GeoJSON [lng, lat] pairs into Leaflet [lat, lng] pairs
    const path = coordinates.map(([lng, lat]) => [lat, lng]);

    return {
      path,
      distanceMeters: Math.round(summary?.distance ?? 0),
      durationSeconds: Math.round(summary?.duration ?? 0),
    };
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Walking directions request timed out after 10 seconds.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
