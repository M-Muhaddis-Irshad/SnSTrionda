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
        hoverable ? "hover:border-chrome-300" : ""
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
      className={`relative aspect-[3/4] overflow-hidden ${className}`}
      {...props}
    >
      {children}
      {/* Chrome accent on hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

type CardContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
