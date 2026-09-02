import { type HTMLAttributes, type ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hoverable?: boolean;
};

export default function Card({
  children,
  hoverable = true,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`card ${hoverable ? "card--hoverable" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

type CardImageProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export function CardImage({ children, className = "", ...props }: CardImageProps) {
  return (
    <div className={`card-image ${className}`} {...props}>
      {children}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-chrome-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </div>
  );
}

type CardContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={`card-content ${className}`} {...props}>
      {children}
    </div>
  );
}
