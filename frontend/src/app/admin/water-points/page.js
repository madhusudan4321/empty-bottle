"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import WaterPointTable from "@/components/admin/WaterPointTable";
import WaterPointModal from "@/components/admin/WaterPointModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function AdminWaterPointsPage() {
  const [waterPoints, setWaterPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWaterPoint, setSelectedWaterPoint] = useState(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [waterPointToDelete, setWaterPointToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const refreshWaterPoints = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch("/api/water-points");
      setWaterPoints(data || []);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to load water points.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    apiFetch("/api/water-points")
      .then((data) => {
        if (isMounted) {
          setWaterPoints(data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFeedback({
            type: "error",
            message: err.message || "Failed to load water points.",
          });
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setSelectedWaterPoint(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wp) => {
    setSelectedWaterPoint(wp);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWaterPoint(null);
  };

  const handleSaveWaterPoint = async (payload) => {
    try {
      setActionLoading(true);
      setFeedback({ type: "", message: "" });

      if (selectedWaterPoint) {
        // Edit mode (PUT)
        await apiFetch(`/api/water-points/${selectedWaterPoint._id}`, {
          method: "PUT",
          body: payload,
        });
        setFeedback({
          type: "success",
          message: `Water point "${payload.name}" updated successfully.`,
        });
      } else {
        // Create mode (POST)
        await apiFetch("/api/water-points", {
          method: "POST",
          body: payload,
        });
        setFeedback({
          type: "success",
          message: `Water point "${payload.name}" created successfully.`,
        });
      }

      handleCloseModal();
      await refreshWaterPoints();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save water point.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (wp) => {
    setWaterPointToDelete(wp);
    setDeleteError("");
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setWaterPointToDelete(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!waterPointToDelete) return;
    try {
      setActionLoading(true);
      setDeleteError("");
      await apiFetch(`/api/water-points/${waterPointToDelete._id}`, {
        method: "DELETE",
      });
      setFeedback({
        type: "success",
        message: `Water point "${waterPointToDelete.name}" deleted successfully.`,
      });
      handleCloseDelete();
      await refreshWaterPoints();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete water point.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Water Points Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Add, update, or remove campus drinking water stations and monitor their current statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
        >
          + Add Water Point
        </button>
      </div>

      {/* Feedback Alerts */}
      {feedback.message && (
        <div
          className={`p-4 rounded-md text-sm flex justify-between items-center ${
            feedback.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-gray-400 hover:text-gray-600 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Water Points Table */}
      <WaterPointTable
        waterPoints={waterPoints}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        isLoading={isLoading}
      />

      {/* Add / Edit Modal */}
      <WaterPointModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveWaterPoint}
        waterPoint={selectedWaterPoint}
        isLoading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        waterPoint={waterPointToDelete}
        isLoading={actionLoading}
        error={deleteError}
      />
    </div>
  );
}
