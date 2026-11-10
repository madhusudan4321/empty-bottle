import { getDistanceInMeters } from "@/app/water-points/distance";

/**
 * Checks if a position is within the crowdRadius of a water point.
 * @param {{ latitude: number, longitude: number }} position
 * @param {object} waterPoint
 * @returns {boolean}
 */
export function isInside(position, waterPoint) {
  if (!position || !waterPoint) return false;
  const distance = getDistanceInMeters(
    position.latitude,
    position.longitude,
    waterPoint.latitude,
    waterPoint.longitude
  );
  if (distance === null) return false;
  const radius =
    typeof waterPoint.crowdRadius === "number" && waterPoint.crowdRadius > 0
      ? waterPoint.crowdRadius
      : 30;
  return distance <= radius;
}

/**
 * Checks if a position has left the water point zone (includes a 10m buffer to prevent edge flicker).
 * @param {{ latitude: number, longitude: number }} position
 * @param {object} waterPoint
 * @returns {boolean}
 */
export function hasLeft(position, waterPoint) {
  if (!position || !waterPoint) return true;
  const distance = getDistanceInMeters(
    position.latitude,
    position.longitude,
    waterPoint.latitude,
    waterPoint.longitude
  );
  if (distance === null) return true;
  const radius =
    typeof waterPoint.crowdRadius === "number" && waterPoint.crowdRadius > 0
      ? waterPoint.crowdRadius
      : 30;
  return distance > radius + 10;
}

/**
 * Finds the nearest water point whose zone contains the given position.
 * @param {{ latitude: number, longitude: number }} position
 * @param {Array<object>} waterPoints
 * @returns {object|null}
 */
export function nearestInside(position, waterPoints) {
  if (!position || !Array.isArray(waterPoints) || waterPoints.length === 0) {
    return null;
  }

  let nearestWp = null;
  let minDistance = Infinity;

  for (const wp of waterPoints) {
    if (!wp || typeof wp.latitude !== "number" || typeof wp.longitude !== "number") {
      continue;
    }
    const distance = getDistanceInMeters(
      position.latitude,
      position.longitude,
      wp.latitude,
      wp.longitude
    );
    if (distance === null) continue;

    const radius =
      typeof wp.crowdRadius === "number" && wp.crowdRadius > 0
        ? wp.crowdRadius
        : 30;

    if (distance <= radius && distance < minDistance) {
      minDistance = distance;
      nearestWp = wp;
    }
  }

  return nearestWp;
}
