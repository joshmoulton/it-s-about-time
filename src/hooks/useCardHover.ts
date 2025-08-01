import { useState } from "react";

export const useCardHover = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getHoverProps = (index: number) => ({
    onMouseEnter: () => setHoveredIndex(index),
    onMouseLeave: () => setHoveredIndex(null),
  });

  const isHovered = (index: number) => hoveredIndex === index;

  const reset = () => setHoveredIndex(null);

  return {
    hoveredIndex,
    getHoverProps,
    isHovered,
    reset,
  };
};