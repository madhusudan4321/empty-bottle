"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import StaffHeader from "@/components/staff/StaffHeader";
import StaffTaskCard from "@/components/staff/StaffTaskCard";
import Tabs from "@/components/ui/Tabs";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

function StaffPortalContent() {
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("todo");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchTasks = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const data = await apiFetch("/api/maintenance");
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!isBackground) {
        setError(err.message || "Failed to load assigned tasks");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(false);

    // Auto-refresh every 30 seconds while the tab is visible
    let intervalId = null;

    const startTimer = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          fetchTasks(true);
        }
      }, 30000);
    };

    const stopTimer = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startTimer();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchTasks(true);
        startTimer();
      } else {
        stopTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchTasks]);

  // Tab categorization
  // Todo: assigned
  // In progress: in_progress
  // Done: fixed, verified, available
  const todoTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "assigned");
  }, [tasks]);

  const inProgressTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "in_progress");
  }, [tasks]);

  const doneTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.status === "fixed" || t.status === "verified" || t.status === "available"
    );
  }, [tasks]);

  const displayedTasks = useMemo(() => {
    if (activeTab === "todo") return todoTasks;
    if (activeTab === "in_progress") return inProgressTasks;
    return doneTasks;
  }, [activeTab, todoTasks, inProgressTasks, doneTasks]);

  const tabsConfig = [
    { id: "todo", label: "To Do", count: todoTasks.length, icon: "📋" },
    { id: "in_progress", label: "In Progress", count: inProgressTasks.length, icon: "🔧" },
    { id: "done", label: "Done", count: doneTasks.length, icon: "✅" },
  ];

  // Action handler for Next Allowed Step:
  // assigned -> in_progress ("Start work")
  // in_progress -> fixed ("Mark as fixed")
  const handleTaskAction = async (task, targetStatus) => {
    setActionLoadingId(task._id);
    try {
      const updated = await apiFetch(`/api/maintenance/${task._id}/status`, {
        method: "PUT",
        body: { status: targetStatus },
      });

      success(
        targetStatus === "in_progress"
          ? `Work started on ${task.waterPointId?.name || "water point"}!`
          : `Water point marked as fixed! Awaiting verification.`
      );

      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

      // Auto-switch tabs to give user feedback
      if (targetStatus === "in_progress") {
        setActiveTab("in_progress");
      } else if (targetStatus === "fixed") {
        setActiveTab("done");
      }
    } catch (err) {
      toastError(err.message || "Failed to update task status");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <StaffHeader
        onRefresh={() => fetchTasks(false)}
        refreshing={refreshing}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Page Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Assigned Work Orders
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Repair and verify campus drinking water dispensers across university buildings
            </p>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Total assigned: <strong className="text-gray-900">{tasks.length}</strong>
          </div>
        </div>

        {/* Workflow Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 shadow-sm">
          <Tabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Task Cards Content */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorMessage
            title="Failed to load tasks"
            message={error}
            onRetry={() => fetchTasks(false)}
          />
        ) : displayedTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <EmptyState
              title={
                activeTab === "todo"
                  ? "No tasks waiting to start"
                  : activeTab === "in_progress"
                  ? "No tasks currently in progress"
                  : "No completed tasks yet"
              }
              description={
                activeTab === "todo"
                  ? "When maintenance requests are assigned to you by campus admin, they will appear here."
                  : activeTab === "in_progress"
                  ? "Click 'Start Work' on any pending task to begin repairs."
                  : "Fixed and verified repairs will be archived in this section."
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {displayedTasks.map((task) => (
              <StaffTaskCard
                key={task._id}
                task={task}
                onAction={handleTaskAction}
                loadingActionId={actionLoadingId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function StaffPage() {
  return (
    <ProtectedRoute roles={["staff", "admin"]}>
      <StaffPortalContent />
    </ProtectedRoute>
  );
}
