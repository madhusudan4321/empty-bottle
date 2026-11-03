"use client";

import { useState } from "react";

function WaterPointForm({ waterPoint, onClose, onSubmit, isLoading }) {
  const isEditing = Boolean(waterPoint);

  const [formData, setFormData] = useState({
    name: waterPoint?.name || "",
    latitude: waterPoint?.latitude ?? "",
    longitude: waterPoint?.longitude ?? "",
    capacity: waterPoint?.capacity ?? 10,
    crowdRadius: waterPoint?.crowdRadius ?? 50,
    availability: waterPoint?.availability || "available",
    temperature: waterPoint?.temperature || "normal",
    cleanliness: waterPoint?.cleanliness || "clean",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    if (isNaN(crowdRadiusNum) || crowdRadiusNum <= 0) {
      setError("Crowd radius must be a positive number.");
      return;
    }

    const payload = {
      name: trimmedName,
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

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
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

        <div className="grid grid-cols-2 gap-3">
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
              placeholder="12.9716"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              placeholder="77.5946"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              min="1"
              step="any"
              name="crowdRadius"
              value={formData.crowdRadius}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

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
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
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
