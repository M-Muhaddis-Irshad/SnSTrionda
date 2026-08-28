import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type ButtonBaseProps = {
  variant?: "primary" | "ghost" | "filled";
  size?: "default" | "sm";
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    as?: "button";
    href?: never;
  };

type ButtonAsAnchor = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    as: "a";
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantStyles: Record<string, string> = {
  primary: [
    "border border-chrome-400 bg-transparent text-foreground",
    "transition-all duration-300",
    "hover:border-chrome-200 hover:bg-chrome-500 hover:text-chrome-100",
  ].join(" "),
  ghost: [
    "border-b border-chrome-400 pb-1 bg-transparent text-foreground",
    "transition-colors duration-200",
    "hover:border-chrome-200 hover:text-chrome-200",
  ].join(" "),
  filled: [
    "border border-chrome-500 bg-chrome-500 text-foreground",
    "transition-colors duration-200",
    "hover:bg-chrome-400",
  ].join(" "),
};

const sizeStyles: Record<string, string> = {
  default: "px-10 py-4 text-sm tracking-[0.2em] uppercase",
  sm: "px-6 py-2 text-xs tracking-wider",
};

export default function Button({
  variant = "primary",
  size = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-block font-body ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (props.as === "a") {
    const { as, ...anchorProps } = props;
    return (
      <a className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { as, ...buttonProps } = props;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
