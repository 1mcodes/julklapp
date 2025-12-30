import { useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import type { ScrollState } from "@/types/views";

interface DrawsTableContainerProps {
  /** The table component */
  children: ReactNode;
}

/**
 * Wrapper component that provides responsive horizontal scrolling for the draws table
 * Implements edge shadows to indicate scrollable content on mobile devices
 * @param props - Component props
 * @param props.children - The table component to wrap
 */
export function DrawsTableContainer({ children }: DrawsTableContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    hasLeftShadow: false,
    hasRightShadow: false,
  });

  /**
   * Updates shadow visibility based on scroll position
   */
  const updateShadows = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const hasLeftShadow = container.scrollLeft > 0;
    const hasRightShadow = container.scrollLeft < container.scrollWidth - container.clientWidth - 1;

    setScrollState((prev) => {
      // Only update if state actually changed to prevent unnecessary re-renders
      if (prev.hasLeftShadow !== hasLeftShadow || prev.hasRightShadow !== hasRightShadow) {
        return { hasLeftShadow, hasRightShadow };
      }
      return prev;
    });
  }, []);

  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial check
    updateShadows();

    // Add scroll listener
    container.addEventListener("scroll", updateShadows);

    // Add resize listener to handle window resize
    window.addEventListener("resize", updateShadows);

    // Cleanup
    return () => {
      container.removeEventListener("scroll", updateShadows);
      window.removeEventListener("resize", updateShadows);
    };
  }, [updateShadows]);

  return (
    <div className="relative">
      {/* Left shadow overlay */}
      {scrollState.hasLeftShadow && (
        <div
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10"
          aria-hidden="true"
        />
      )}

      {/* Scrollable container */}
      <div ref={containerRef} className="overflow-x-auto rounded-md border">
        {children}
      </div>

      {/* Right shadow overlay */}
      {scrollState.hasRightShadow && (
        <div
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
