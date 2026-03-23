"use client";

import { useState } from "react";
import type { GrantStatus } from "@/lib/types";

interface SaveButtonProps {
  grantId: string;
  currentStatus: GrantStatus;
  onStatusChange?: (newStatus: GrantStatus) => void;
}

// Cycle: match → saved → applied → awarded / declined
const NEXT_STATUS: Partial<Record<GrantStatus, GrantStatus>> = {
  match: "saved",
  saved: "applied",
  applied: "awarded",
};

const LABEL: Record<GrantStatus, string> = {
  match: "Save",
  saved: "Mark applied",
  applied: "Mark awarded",
  awarded: "Awarded",
  declined: "Not awarded",
};

export default function SaveButton({ grantId, currentStatus, onStatusChange }: SaveButtonProps) {
  const [status, setStatus] = useState<GrantStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  const nextStatus = NEXT_STATUS[status];

  async function handleClick() {
    if (!nextStatus || loading) return;
    setLoading(true);
    // Optimistic update
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);

    try {
      const res = await fetch(`/api/grants/${grantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // Rollback on failure
      setStatus(status);
      onStatusChange?.(status);
    } finally {
      setLoading(false);
    }
  }

  // Terminal states — no action available
  if (status === "awarded" || status === "declined") {
    return (
      <span
        className="text-xs px-3 py-1.5 rounded-full"
        style={{
          background: status === "awarded" ? "#E8F0EA" : "#F0E8E8",
          color: status === "awarded" ? "#2E6B3E" : "#7A3A3A",
        }}
      >
        {LABEL[status]}
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || !nextStatus}
      className="btn-outline text-xs px-4 py-2"
      style={{ opacity: loading ? 0.6 : 1 }}
    >
      {loading ? "Saving…" : LABEL[status]}
    </button>
  );
}
