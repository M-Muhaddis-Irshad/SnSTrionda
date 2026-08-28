import { type HTMLAttributes, type ReactNode } from "react";

type BadgeVariant = "default" | "outline" | "filled";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "border border-chrome-400 bg-transparent text-muted",
  outline: "border border-chrome-300 bg-transparent text-foreground",
  filled: "border border-chrome-500 bg-chrome-500 text-foreground",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 font-body text-xs tracking-wider uppercase ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
