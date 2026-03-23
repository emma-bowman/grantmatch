"use client";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  count?: number;
}

export default function FilterChip({ label, selected, onToggle, count }: FilterChipProps) {
  return (
    <button
      onClick={onToggle}
      className={`filter-chip ${selected ? "selected" : ""}`}
    >
      {label}
      {count !== undefined && (
        <span
          className="text-xs rounded-full px-1.5 py-0.5 ml-0.5"
          style={{
            background: selected ? "rgba(255,255,255,0.25)" : "rgba(74,92,58,0.12)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
