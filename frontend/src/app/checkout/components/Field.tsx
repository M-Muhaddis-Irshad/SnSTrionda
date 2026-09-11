"use client";

import { useState, useId, type ReactNode } from "react";

interface FieldProps {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  autoComplete?: string;
  autoFocus?: boolean;
  selectOptions?: Array<{ value: string; label: string }>;
  textarea?: boolean;
  rows?: number;
  disabled?: boolean;
  hint?: ReactNode;
  maxLength?: number;
}

export default function Field({
  id,
  label,
  required,
  error,
  value,
  onChange,
  onBlur,
  type = "text",
  inputMode,
  autoComplete,
  autoFocus,
  selectOptions,
  textarea,
  rows = 3,
  disabled,
  hint,
  maxLength,
}: FieldProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;
  const [focused, setFocused] = useState(false);
  const isSelect = !!selectOptions;
  const floated = isSelect || textarea || focused || value.length > 0;

  const borderClass = error
    ? "checkout-float-input--error"
    : "";

  const baseClass = isSelect ? "checkout-float-select" : "checkout-float-input";
  const fieldClass = `${baseClass} ${borderClass}`;

  return (
    <div>
      <div className="checkout-float-wrap">
        {isSelect ? (
          <select
            id={fieldId}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            aria-required={required || undefined}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            autoFocus={autoFocus}
            className={`${fieldClass} pr-10`}
          >
            {selectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : textarea ? (
          <textarea
            id={fieldId}
            value={value}
            rows={rows}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            aria-required={required || undefined}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            autoFocus={autoFocus}
            className={`${fieldClass} resize-none`}
          />
        ) : (
          <input
            id={fieldId}
            type={type}
            value={value}
            inputMode={inputMode}
            autoComplete={autoComplete}
            disabled={disabled}
            maxLength={maxLength}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            aria-required={required || undefined}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            autoFocus={autoFocus}
            className={fieldClass}
          />
        )}

        {/* Chevron for selects */}
        {isSelect && (
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-chrome-300"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        <label
          htmlFor={fieldId}
          className={`checkout-float-label ${
            floated ? "checkout-float-label--up" : ""
          } ${error ? "checkout-float-label--error" : ""}`}
        >
          {label}
          {required && <span className="checkout-required-asterisk"> *</span>}
        </label>
      </div>

      {error && (
        <p id={errorId} className="checkout-field-error" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1.5 font-body text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
