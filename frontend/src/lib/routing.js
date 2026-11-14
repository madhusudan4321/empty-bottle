/**
 * Walking route client utility for Lovely Professional University campus navigation.
 * Supports OpenRouteService (when API key is set) and OpenStreetMap OSRM pedestrian
 * routing (for real campus pathways without an API key), plus compass headings.
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
 * Calculates compass bearing and cardinal direction from start to end coordinates.
 * @param {number} fromLat
 * @param {number} fromLng
 * @param {number} toLat
 * @param {number} toLng
 * @returns {{ bearing: number, cardinal: string }}
 */
export function getCompassDirection(fromLat, fromLng, toLat, toLng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;

  const y = Math.sin(toRad(toLng - fromLng)) * Math.cos(toRad(toLat));
  const x =
    Math.cos(toRad(fromLat)) * Math.sin(toRad(toLat)) -
    Math.sin(toRad(fromLat)) *
      Math.cos(toRad(toLat)) *
      Math.cos(toRad(toLng - fromLng));

  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  const directions = [
    "North",
    "North-East",
    "East",
    "South-East",
    "South",
    "South-West",
    "West",
    "North-West",
  ];
  const index = Math.round(bearing / 45) % 8;
  return {
    bearing: Math.round(bearing),
    cardinal: directions[index],
  };
}

/**
 * Formats raw OSRM maneuver into a readable walking step.
 */
function formatStepInstruction(step) {
  const type = step?.maneuver?.type;
  const modifier = step?.maneuver?.modifier;
  const name = step?.name ? `onto ${step.name}` : "along campus walkway";
  const dist = step?.distance ? ` (${formatDistance(step.distance)})` : "";

  if (type === "depart") {
    return `Head ${modifier || "forward"} ${name}${dist}`;
  }
  if (type === "arrive") {
    return `Arrive at water dispenser`;
  }
  if (type === "turn") {
    return `Turn ${modifier || "left/right"} ${name}${dist}`;
  }
  if (type === "end of road") {
    return `At the end of the path, turn ${modifier || "ahead"} ${name}${dist}`;
  }
  return `Walk ${modifier || "straight"} ${name}${dist}`;
}

/**
 * Fetches walking route between two coordinates via OpenRouteService or OSRM pedestrian router.
 *
 * @param {{ latitude?: number, lat?: number, longitude?: number, lng?: number }} from Origin coordinate
 * @param {{ latitude?: number, lat?: number, longitude?: number, lng?: number }} to Destination coordinate
 * @returns {Promise<{ path: [number, number][], distanceMeters: number, durationSeconds: number, steps?: string[], routerSource: string }>}
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

  // 1. Try OpenRouteService if API key is provided
  if (apiKey && apiKey.trim()) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${encodeURIComponent(
      apiKey.trim()
    )}&start=${fromLng},${fromLat}&end=${toLng},${toLat}`;

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json, application/geo+json" },
      });

      if (res.ok) {
        const data = await res.json();
        const feature = data?.features?.[0];
        const coordinates = feature?.geometry?.coordinates;
        const summary = feature?.properties?.summary;

        if (Array.isArray(coordinates) && coordinates.length > 0) {
          return {
            path: coordinates.map(([lng, lat]) => [lat, lng]),
            distanceMeters: Math.round(summary?.distance ?? 0),
            durationSeconds: Math.round(summary?.duration ?? 0),
            routerSource: "OpenRouteService",
          };
        }
      }
    } catch {
      // Fall through to OSRM pedestrian routing
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 2. OpenStreetMap OSRM Public Pedestrian Router (specialized for campus paths, no key required)
  const osrmController = new AbortController();
  const osrmTimeout = setTimeout(() => osrmController.abort(), 10000);
  const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(osrmUrl, {
      signal: osrmController.signal,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      const route = data?.routes?.[0];
      const coordinates = route?.geometry?.coordinates;

      if (Array.isArray(coordinates) && coordinates.length > 0) {
        const rawSteps = route?.legs?.[0]?.steps || [];
        const formattedSteps = rawSteps
          .map(formatStepInstruction)
          .filter(Boolean);

        return {
          path: coordinates.map(([lng, lat]) => [lat, lng]),
          distanceMeters: Math.round(route.distance ?? 0),
          durationSeconds: Math.round(route.duration ?? (route.distance / 1.3)), // ~1.3 m/s walking speed
          steps: formattedSteps,
          routerSource: "Campus Walkway Router (OSRM)",
        };
      }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Walking directions request timed out.");
    }
  } finally {
    clearTimeout(osrmTimeout);
  }

  throw new Error("Unable to calculate pedestrian route.");
}
