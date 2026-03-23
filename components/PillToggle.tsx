"use client";

interface PillToggleProps {
  options: string[];
  active: string;
  onChange: (value: string) => void;
}

export default function PillToggle({ options, active, onChange }: PillToggleProps) {
  return (
    <div className="pill-group">
      {options.map((opt) => (
        <button
          key={opt}
          className={active === opt ? "active" : ""}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
