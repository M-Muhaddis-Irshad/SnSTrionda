import { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`flex-1 bg-surface border border-chrome-500 px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-chrome-300 transition-colors ${className}`}
      {...props}
    />
  );
}
