import type { Grant, GrantStatus } from "@/lib/types";
import SaveButton from "@/components/SaveButton";

const statusConfig: Record<
  GrantStatus,
  { label: string; bg: string; color: string }
> = {
  match: { label: "New match", bg: "#EDF2E8", color: "#4A5C3A" },
  applied: { label: "Applied", bg: "#EAE8F0", color: "#5A4E80" },
  awarded: { label: "Awarded", bg: "#E8F0EA", color: "#2E6B3E" },
  declined: { label: "Not awarded", bg: "#F0E8E8", color: "#7A3A3A" },
  saved: { label: "Saved", bg: "#F0EDE4", color: "#8A8880" },
};

interface GrantCardProps {
  grant: Grant;
  onStatusChange?: (id: string, status: GrantStatus) => void;
}

export default function GrantCard({ grant, onStatusChange }: GrantCardProps) {
  const status = statusConfig[grant.status] ?? statusConfig.match;

  return (
    <div className="grant-card">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Left: info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="status-badge"
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </span>
            {grant.matchScore > 0 && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {grant.matchScore}% match
              </span>
            )}
          </div>

          <h3
            className="text-base font-normal mt-1 mb-0.5"
            style={{
              fontFamily: "Georgia, 'Playfair Display', serif",
              color: "var(--color-text-primary)",
            }}
          >
            {grant.url ? (
              <a
                href={grant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {grant.name}
              </a>
            ) : (
              grant.name
            )}
          </h3>

          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {grant.funder}
          </p>

          {grant.description && (
            <p
              className="text-sm mt-2 leading-relaxed line-clamp-2"
              style={{ color: "var(--color-text-label)" }}
            >
              {grant.description}
            </p>
          )}

          {grant.focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {grant.focusAreas.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(74,92,58,0.08)",
                    color: "var(--color-accent)",
                    border: "1px solid rgba(74,92,58,0.15)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: amount + deadline + actions */}
        <div className="flex sm:flex-col items-end gap-3 sm:gap-2 shrink-0 sm:min-w-[120px]">
          <div className="text-right">
            {grant.amount && (
              <div
                className="text-base font-normal whitespace-nowrap"
                style={{
                  fontFamily: "Georgia, 'Playfair Display', serif",
                  color: "var(--color-text-primary)",
                }}
              >
                {grant.amount}
              </div>
            )}
            {grant.deadline && (
              <div className="text-xs mt-0.5 whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                Due {grant.deadline}
              </div>
            )}
          </div>

          <SaveButton
            grantId={grant.id}
            currentStatus={grant.status}
            onStatusChange={(newStatus) => onStatusChange?.(grant.id, newStatus)}
          />
        </div>
      </div>
    </div>
  );
}

export type { Grant };
