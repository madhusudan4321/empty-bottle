import { getDistanceInMeters } from "@/app/water-points/distance";

/**
 * Global accuracy limit for crowd location readings.
 * In development, allow up to 100m for easier testing / indoor signals;
 * In production, cap at 50m for strict proximity.
 */
export const MAX_ACCURACY_METERS =
  process.env.NODE_ENV === "production" ? 50 : 100;

/**
 * Checks if a position is within the crowdRadius of a water point.
 * ENTER condition: distance <= crowdRadius AND accuracy <= crowdRadius.
 * A reading whose accuracy is worse than the zone is ambiguous and does not count as inside.
 *
 * @param {{ latitude: number, longitude: number, accuracy?: number }} position
 * @param {object} waterPoint
 * @param {number} [overrideAccuracy]
 * @returns {boolean}
 */
export function isInside(position, waterPoint, overrideAccuracy) {
  if (!position || !waterPoint) return false;
  if (
    typeof position.latitude !== "number" ||
    typeof position.longitude !== "number" ||
    typeof waterPoint.latitude !== "number" ||
    typeof waterPoint.longitude !== "number"
  ) {
    return false;
  }

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

  const accuracy =
    typeof overrideAccuracy === "number"
      ? overrideAccuracy
      : typeof position.accuracy === "number"
      ? position.accuracy
      : 0;

  return distance <= radius && accuracy <= radius;
}

/**
 * Checks if a position has left the water point zone.
 * LEAVE conditions:
 * 1) distance - accuracy > crowdRadius (definitely outside)
 * 2) distance > crowdRadius + 10 with accuracy <= 30
 *
 * @param {{ latitude: number, longitude: number, accuracy?: number }} position
 * @param {object} waterPoint
 * @param {number} [overrideAccuracy]
 * @returns {boolean}
 */
export function hasLeft(position, waterPoint, overrideAccuracy) {
  if (!position || !waterPoint) return true;
  if (
    typeof position.latitude !== "number" ||
    typeof position.longitude !== "number" ||
    typeof waterPoint.latitude !== "number" ||
    typeof waterPoint.longitude !== "number"
  ) {
    return true;
  }

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

  const accuracy =
    typeof overrideAccuracy === "number"
      ? overrideAccuracy
      : typeof position.accuracy === "number"
      ? position.accuracy
      : 0;

  // Condition 1: distance - accuracy > crowdRadius (definitely outside)
  if (distance - accuracy > radius) {
    return true;
  }

  // Condition 2: distance > crowdRadius + 10 with accuracy <= 30
  if (distance > radius + 10 && accuracy <= 30) {
    return true;
  }

  return false;
}

/**
 * Finds the nearest water point whose zone contains the given position.
 * Only returns a water point if distance <= radius AND accuracy <= radius.
 *
 * @param {{ latitude: number, longitude: number, accuracy?: number }} position
 * @param {Array<object>} waterPoints
 * @param {number} [overrideAccuracy]
 * @returns {object|null}
 */
export function nearestInside(position, waterPoints, overrideAccuracy) {
  if (!position || !Array.isArray(waterPoints) || waterPoints.length === 0) {
    return null;
  }

  let nearestWp = null;
  let minDistance = Infinity;

  for (const wp of waterPoints) {
    if (!wp || typeof wp.latitude !== "number" || typeof wp.longitude !== "number") {
      continue;
    }

    if (isInside(position, wp, overrideAccuracy)) {
      const distance = getDistanceInMeters(
        position.latitude,
        position.longitude,
        wp.latitude,
        wp.longitude
      );
      if (distance !== null && distance < minDistance) {
        minDistance = distance;
        nearestWp = wp;
      }
    }
  }

  return nearestWp;
}

/**
 * Finds the closest water point overall, regardless of inside/outside status.
 * Used for distance computation and diagnostics.
 *
 * @param {{ latitude: number, longitude: number }} position
 * @param {Array<object>} waterPoints
 * @returns {{ waterPoint: object, distance: number }|null}
 */
export function getNearestWaterPoint(position, waterPoints) {
  if (!position || !Array.isArray(waterPoints) || waterPoints.length === 0) {
    return null;
  }

  let nearest = null;
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
    if (distance !== null && distance < minDistance) {
      minDistance = distance;
      nearest = { waterPoint: wp, distance };
    }
  }

  return nearest;
}
