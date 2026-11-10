"use client";

import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-sm text-gray-600 leading-relaxed">
        {typeof message === "string" ? <p>{message}</p> : message}
      </div>
    </Modal>
  );
}
