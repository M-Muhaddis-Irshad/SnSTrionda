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
      className={`group relative overflow-hidden border border-chrome-500 transition-all duration-300 ${
        hoverable ? "hover:border-chrome-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]" : ""
      } ${className}`}
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
    <div
      className={`relative aspect-[3/4] overflow-hidden bg-surface ${className}`}
      {...props}
    >
      {children}
      {/* Dark gradient overlay on hover for text readability */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)",
        }}
      />
      {/* Chrome accent line on hover */}
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
    <div className={`mt-3 px-3 pb-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
