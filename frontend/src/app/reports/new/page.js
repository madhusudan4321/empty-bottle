"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageLayout from "@/components/ui/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { apiFetch } from "@/lib/api";
import { ISSUE_TYPE_LABELS } from "@/lib/constants";

function ReportForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryWaterPointId = searchParams.get("waterPointId") || "";

  const [waterPoints, setWaterPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [pointsError, setPointsError] = useState("");

  const [waterPointId, setWaterPointId] = useState(queryWaterPointId);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiFetch("/api/water-points")
      .then((data) => {
        if (isMounted) {
          setWaterPoints(Array.isArray(data) ? data : []);
          setLoadingPoints(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setPointsError(err.message || "Failed to load water points");
          setLoadingPoints(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const waterPointOptions = waterPoints.map((wp) => ({
    value: wp._id,
    label: wp.building ? `${wp.name} (${wp.building})` : wp.name,
  }));

  const issueTypeOptions = Object.entries(ISSUE_TYPE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!waterPointId) {
      setErrorMessage("Please select a water point.");
      return;
    }
    if (!issueType) {
      setErrorMessage("Please select the type of problem observed.");
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch("/api/reports", {
        method: "POST",
        body: {
          waterPointId,
          issueType,
          description: description.trim(),
        },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/reports");
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-xl mx-auto border-emerald-200 bg-emerald-50/40">
        <CardContent className="p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-2xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Report Submitted Successfully!
            </h3>
            <p className="text-sm text-gray-600 mt-1 max-w-sm mx-auto">
              Campus facilities staff have received your report. Redirecting you to
              your report history...
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link href="/reports">
              <Button variant="primary">View My Reports</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setDescription("");
                setIssueType("");
              }}
            >
              Report Another Issue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit Water Point Issue</CardTitle>
          <CardDescription>
            Help keep campus drinking water clean, cold, and running for everyone.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {pointsError && (
            <div className="mb-6">
              <ErrorMessage
                title="Could not load water points"
                message={pointsError}
              />
            </div>
          )}

          {errorMessage && (
            <div className="mb-6">
              <ErrorMessage message={errorMessage} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Water Point Selector */}
            {loadingPoints ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <Spinner size="sm" />
                <span>Loading water points list...</span>
              </div>
            ) : (
              <Select
                id="waterPointId"
                label="Water Dispenser Location"
                required
                options={waterPointOptions}
                placeholder="Select water point..."
                value={waterPointId}
                onChange={(e) => setWaterPointId(e.target.value)}
                helperText="Choose the specific water point where the problem occurred."
              />
            )}

            {/* Issue Type Selector */}
            <Select
              id="issueType"
              label="Observed Problem"
              required
              options={issueTypeOptions}
              placeholder="Select problem type..."
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              helperText="Categorize the issue so staff can bring the right tools."
            />

            {/* Description Textarea */}
            <div>
              <Textarea
                id="description"
                label="Detailed Description (Optional)"
                rows={4}
                maxLength={1000}
                placeholder="E.g., Left tap water is cloudy, cooler seems off, or basin is overflowing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                helperText={`${description.length} / 1000 characters`}
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Submit Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <ProtectedRoute>
      <PageLayout
        title="Report a Problem"
        subtitle="Report outages, hygiene issues, leaks, or broken taps directly to maintenance staff."
      >
        <Suspense
          fallback={
            <div className="text-center py-10">
              <Spinner size="md" />
              <p className="mt-2 text-sm text-gray-500">Loading form...</p>
            </div>
          }
        >
          <ReportForm />
        </Suspense>
      </PageLayout>
    </ProtectedRoute>
  );
}
