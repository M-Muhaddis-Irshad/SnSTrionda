"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

interface BrandStoryData {
  id: string;
  label: string;
  heading: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
}

const DEFAULTS: BrandStoryData = {
  id: "",
  label: "Our Story",
  heading: "Royalty Meets\nModern Tailoring",
  text: "Born from the grandeur of 90s royalty and the precision of modern tailoring, Trionda Wears crafts garments that command attention. Every stitch tells a story of heritage, every fit shaped for those who refuse to blend in.",
  ctaLabel: "Read More",
  ctaHref: "/about",
  imageUrl: null,
};

export default function BrandStory() {
  const [story, setStory] = useState<BrandStoryData>(DEFAULTS);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/brand-story`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setStory({
            id: res.data.id,
            label: res.data.label || DEFAULTS.label,
            heading: res.data.heading || DEFAULTS.heading,
            text: res.data.text || DEFAULTS.text,
            ctaLabel: res.data.ctaLabel || DEFAULTS.ctaLabel,
            ctaHref: res.data.ctaHref || DEFAULTS.ctaHref,
            imageUrl: res.data.imageUrl || null,
          });
        }
      })
      .catch(() => {
        // Keep defaults on error
      });
  }, []);

  const headingLines = story.heading.split("\n");

  return (
    <section className="brand-story-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="brand-story-grid">
          {/* Text column */}
          <div>
            <span className="brand-story-label">
              {story.label}
            </span>
            <h2 className="brand-story-heading">
              {headingLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < headingLines.length - 1 && <br />}
                </span>
              ))}
            </h2>
            <div className="brand-story-divider" />
            <p className="brand-story-text">
              {story.text}
            </p>
            <div className="brand-story-cta">
              <Button as="a" href={story.ctaHref} variant="ghost">
                {story.ctaLabel}
              </Button>
            </div>
          </div>

          {/* Visual */}
          <div className="brand-story-visual">
            {story.imageUrl ? (
              <>
                <div className="brand-story-frame-outer" />
                <div className="brand-story-frame-inner" />
                <div className="brand-story-frame-content">
                  <img
                    src={story.imageUrl}
                    alt={story.heading}
                    className="w-full h-full object-cover"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="brand-story-frame-outer" />
                <div className="brand-story-frame-inner" />
                <div className="brand-story-frame-content">
                  <div className="brand-story-frame-placeholder" />
                </div>
              </>
            )}
            <div className="brand-story-corner brand-story-corner--tl" />
            <div className="brand-story-corner brand-story-corner--tr" />
            <div className="brand-story-corner brand-story-corner--bl" />
            <div className="brand-story-corner brand-story-corner--br" />
          </div>
        </div>
      </div>
    </section>
  );
}
