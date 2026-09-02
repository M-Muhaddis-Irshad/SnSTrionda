import { type HTMLAttributes, type ReactNode } from "react";

type BadgeVariant = "default" | "outline" | "filled";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "badge--default",
  outline: "badge--outline",
  filled: "badge--filled",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`badge ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
