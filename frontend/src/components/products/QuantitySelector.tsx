"use client";

// ---------------------------------------------------------------------------
// QuantitySelector — +/− stepper with min/max bounds
// ---------------------------------------------------------------------------

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  function handleDecrement() {
    if (value > min) onChange(value - 1);
  }

  function handleIncrement() {
    if (value < max) onChange(value + 1);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center border border-chrome-500 text-muted transition-colors hover:border-chrome-400 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </button>

      <span className="font-body text-base text-foreground w-8 text-center tabular-nums">
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center border border-chrome-500 text-muted transition-colors hover:border-chrome-400 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
