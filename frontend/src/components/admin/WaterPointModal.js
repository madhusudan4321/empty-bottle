"use client";

import { useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";

function WaterPointForm({ waterPoint, onClose, onSubmit, isLoading }) {
  const isEditing = Boolean(waterPoint);
  const { getBestPosition } = useGeolocation();

  const [formData, setFormData] = useState({
    name: waterPoint?.name || "",
    building: waterPoint?.building || "",
    floor: waterPoint?.floor || "",
    landmark: waterPoint?.landmark || "",
    latitude: waterPoint?.latitude ?? "",
    longitude: waterPoint?.longitude ?? "",
    capacity: waterPoint?.capacity ?? 10,
    crowdRadius: waterPoint?.crowdRadius ?? 30,
    availability: waterPoint?.availability || "available",
    temperature: waterPoint?.temperature || "normal",
    cleanliness: waterPoint?.cleanliness || "clean",
  });

  const [error, setError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetLocation = async () => {
    setGpsLoading(true);
    setGpsError("");
    try {
      const best = await getBestPosition({ targetAccuracy: 10, maxWaitMs: 15000 });
      const roundedLat = Number(best.latitude.toFixed(6));
      const roundedLng = Number(best.longitude.toFixed(6));
      setFormData((prev) => ({
        ...prev,
        latitude: roundedLat,
        longitude: roundedLng,
      }));
      setGpsAccuracy(Math.round(best.accuracy));
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("permission")) {
        setGpsError(
          "Location permission was denied. Please allow location access for this site in your browser settings (click the lock/tune icon near the address bar) and click the button again."
        );
      } else {
        setGpsError(
          err.message || "Failed to acquire GPS location. Please try again or enter manually."
        );
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError("Water point name is required.");
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError("Latitude must be a valid number between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError("Longitude must be a valid number between -180 and 180.");
      return;
    }

    const capacityNum = parseInt(formData.capacity, 10);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setError("Capacity must be a positive number.");
      return;
    }

    const crowdRadiusNum = parseFloat(formData.crowdRadius);
    if (isNaN(crowdRadiusNum) || crowdRadiusNum < 10) {
      setError("Crowd radius must be a number of at least 10 metres.");
      return;
    }

    const payload = {
      name: trimmedName,
      building: formData.building.trim(),
      floor: formData.floor.trim(),
      landmark: formData.landmark.trim(),
      latitude: lat,
      longitude: lng,
      capacity: capacityNum,
      crowdRadius: crowdRadiusNum,
      availability: formData.availability,
      temperature: formData.temperature,
      cleanliness: formData.cleanliness,
    };

    onSubmit(payload);
  };

  const latNum = parseFloat(formData.latitude);
  const lngNum = parseFloat(formData.longitude);
  const hasValidCoords =
    !isNaN(latNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    !isNaN(lngNum) &&
    lngNum >= -180 &&
    lngNum <= 180;

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Edit Water Point" : "Add New Water Point"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
        >
          &times;
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
            Water Point Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Library 2nd Floor Cooler"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Building, Floor, Landmark */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Building
            </label>
            <input
              type="text"
              name="building"
              maxLength={100}
              value={formData.building}
              onChange={handleChange}
              placeholder="Block 34"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Floor
            </label>
            <input
              type="text"
              name="floor"
              maxLength={50}
              value={formData.floor}
              onChange={handleChange}
              placeholder="Ground floor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Landmark
            </label>
            <input
              type="text"
              name="landmark"
              maxLength={200}
              value={formData.landmark}
              onChange={handleChange}
              placeholder="Near the stairs"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* GPS Coordinates Header & Location Button */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase text-blue-900 tracking-wide">
                GPS Location
              </span>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Stand directly beside the water point for optimal map &amp; crowd zone accuracy.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gpsLoading}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              {gpsLoading ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <span>📍</span>
                  <span>Use my current location</span>
                </>
              )}
            </button>
          </div>

          {gpsLoading && (
            <div className="p-2.5 bg-blue-100/70 border border-blue-300 rounded text-xs text-blue-900 flex items-center gap-2">
              <span className="animate-pulse">🛰️</span>
              <span>Getting accurate location... stay next to the water point</span>
            </div>
          )}

          {gpsError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 leading-relaxed">
              {gpsError}
            </div>
          )}

          {gpsAccuracy !== null && !gpsLoading && (
            <div
              className={`p-2.5 rounded-md border text-xs flex flex-wrap items-center justify-between gap-2 ${
                gpsAccuracy <= 15
                  ? "bg-green-50 text-green-800 border-green-200"
                  : gpsAccuracy <= 30
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              <span>
                <strong>
                  {gpsAccuracy <= 15
                    ? "Good"
                    : gpsAccuracy <= 30
                    ? "Fair"
                    : "Poor accuracy"}
                </strong>{" "}
                (Accuracy: &plusmn;{gpsAccuracy} m)
                {gpsAccuracy > 15 && gpsAccuracy <= 30
                  ? " — try moving near a window or outside, then retry"
                  : gpsAccuracy > 30
                  ? " — try again outdoors"
                  : ""}
              </span>
              <button
                type="button"
                onClick={handleGetLocation}
                className="underline font-semibold text-xs hover:opacity-80"
              >
                Retake
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Latitude (-90 to 90) *
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="12.971600"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Longitude (-180 to 180) *
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="77.594600"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
          </div>

          {hasValidCoords && (
            <div className="pt-1 text-right">
              <a
                href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 font-medium"
              >
                <span>Check on Google Maps</span>
                <span>↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Capacity & Crowd Radius */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Capacity (persons) *
            </label>
            <input
              type="number"
              min="1"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Crowd Radius (metres) *
            </label>
            <input
              type="number"
              min="10"
              step="any"
              name="crowdRadius"
              value={formData.crowdRadius}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-[11px] text-gray-500 leading-tight">
              Distance in metres around the water point that counts as &apos;nearby&apos;.
              Recommended 20 to 50 m because phone GPS is only accurate to about 5 to 15 m.
            </p>
          </div>
        </div>

        {/* Quality status selectors */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Availability
            </label>
            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Temperature
            </label>
            <select
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cold">Cold</option>
              <option value="cool">Cool</option>
              <option value="normal">Normal</option>
              <option value="warm">Warm</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
              Cleanliness
            </label>
            <select
              name="cleanliness"
              value={formData.cleanliness}
              onChange={handleChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="clean">Clean</option>
              <option value="average">Average</option>
              <option value="dirty">Dirty</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || gpsLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || gpsLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Water Point"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function WaterPointModal({
  isOpen,
  onClose,
  onSubmit,
  waterPoint,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
      <WaterPointForm
        key={waterPoint?._id || "new"}
        waterPoint={waterPoint}
        onClose={onClose}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
