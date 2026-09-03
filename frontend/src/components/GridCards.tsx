import { Children, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// GridCards — responsive grid with staggered entrance animation.
//
// Every child is wrapped in a grid item that fades up with a 100ms stagger.
// On small screens the stagger is disabled in CSS for a fast first paint.
// ---------------------------------------------------------------------------

interface GridCardsProps {
  children: ReactNode;
  stagger?: boolean;
  className?: string;
}

export default function GridCards({
  children,
  stagger = true,
  className = "",
}: GridCardsProps) {
  return (
    <div className={`featured-grid ${className}`}>
      {Children.map(children, (child, index) => (
        <div
          className="featured-grid-item"
          style={
            stagger
              ? { animationDelay: `${index * 100}ms` }
              : undefined
          }
        >
          {child}
        </div>
      ))}
    </div>
  );
}
