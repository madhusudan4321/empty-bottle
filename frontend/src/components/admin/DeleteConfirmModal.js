"use client";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  waterPoint,
  isLoading,
  error,
}) {
  if (!isOpen || !waterPoint) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Confirm Deletion
        </h3>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete water point{" "}
            <strong className="text-gray-900 font-semibold">{waterPoint.name}</strong>?
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This action cannot be undone. Water points with active maintenance requests
            cannot be deleted.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? "Deleting..." : "Delete Water Point"}
          </button>
        </div>
      </div>
    </div>
  );
}

