import Link from "next/link";
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

export default function Button({
  variant = "primary",
  size = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `btn btn--${variant} btn--${size} ${className}`;

  if (props.as === "a") {
    const { as, ...anchorProps } = props;
    return (
      <Link className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  const { as, ...buttonProps } = props;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
