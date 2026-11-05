"use client";

import { useState, useMemo } from "react";

export default function WaterPointTable({
  waterPoints,
  onEdit,
  onDelete,
  isLoading,
}) {
  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("all");

  const filteredPoints = useMemo(() => {
    return waterPoints.filter((wp) => {
      const matchesSearch = wp.name.toLowerCase().includes(search.toLowerCase());
      const matchesAvailability =
        filterAvailability === "all" || wp.availability === filterAvailability;
      return matchesSearch && matchesAvailability;
    });
  }, [waterPoints, search, filterAvailability]);

  const getAvailabilityBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            Available
          </span>
        );
      case "unavailable":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            Unavailable
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getTemperatureBadge = (temp) => {
    const colors = {
      cold: "bg-blue-100 text-blue-800 border-blue-200",
      cool: "bg-cyan-100 text-cyan-800 border-cyan-200",
      normal: "bg-gray-100 text-gray-800 border-gray-200",
      warm: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
          colors[temp] || colors.normal
        }`}
      >
        {temp}
      </span>
    );
  };

  const getCleanlinessBadge = (cleanliness) => {
    const colors = {
      clean: "bg-emerald-100 text-emerald-800 border-emerald-200",
      average: "bg-amber-100 text-amber-800 border-amber-200",
      dirty: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
          colors[cleanliness] || colors.clean
        }`}
      >
        {cleanliness}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Search and Filter Controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50">
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search water points by name..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full sm:w-auto flex items-center space-x-2">
          <label className="text-xs font-semibold text-gray-600">Availability:</label>
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-100 text-xs font-semibold uppercase text-gray-700 tracking-wider">
            <tr>
              <th className="px-4 py-3">Water Point</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Temp / Clean</th>
              <th className="px-4 py-3">Capacity / Radius</th>
              <th className="px-4 py-3">Coordinates</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
                  Loading water points...
                </td>
              </tr>
            ) : filteredPoints.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No water points found.
                </td>
              </tr>
            ) : (
              filteredPoints.map((wp) => (
                <tr key={wp._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div>{wp.name}</div>
                    {(wp.building || wp.floor) && (
                      <div className="text-xs text-gray-500 font-normal mt-0.5">
                        {[wp.building, wp.floor].filter(Boolean).join(" • ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{getAvailabilityBadge(wp.availability)}</td>
                  <td className="px-4 py-3 space-x-1.5">
                    {getTemperatureBadge(wp.temperature)}
                    {getCleanlinessBadge(wp.cleanliness)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div>Cap: <strong className="text-gray-800">{wp.capacity}</strong></div>
                    <div>Radius: <strong className="text-gray-800">{wp.crowdRadius}m</strong></div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {wp.lastUpdated
                      ? new Date(wp.lastUpdated).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(wp)}
                      className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(wp)}
                      className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

