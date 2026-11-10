"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const ToastContext = createContext({
  addToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", message, title, duration = 4000 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const newToast = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message, title) => addToast({ type: "success", message, title }),
    [addToast]
  );

  const error = useCallback(
    (message, title) => addToast({ type: "error", message, title: title || "Error" }),
    [addToast]
  );

  const info = useCallback(
    (message, title) => addToast({ type: "info", message, title }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border text-sm transition-all transform duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-white border-emerald-200 text-gray-900 shadow-emerald-500/10"
                : toast.type === "error"
                ? "bg-white border-red-200 text-gray-900 shadow-red-500/10"
                : "bg-white border-blue-200 text-gray-900 shadow-blue-500/10"
            }`}
          >
            <span className="text-lg shrink-0">
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </span>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4
                  className={`font-semibold text-xs uppercase tracking-wider mb-0.5 ${
                    toast.type === "success"
                      ? "text-emerald-700"
                      : toast.type === "error"
                      ? "text-red-700"
                      : "text-blue-700"
                  }`}
                >
                  {toast.title}
                </h4>
              )}
              <p className="text-gray-700 text-xs leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
