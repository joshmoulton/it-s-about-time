import { useState } from "react";

export const useToggleHover = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getToggleHoverProps = (
    id: string, 
    isSelected: boolean,
    styles: {
      selected: string;
      unselected: string;
      hover: string;
    }
  ) => ({
    className: isSelected ? styles.selected : hoveredItem === id ? styles.hover : styles.unselected,
    onMouseEnter: () => !isSelected && setHoveredItem(id),
    onMouseLeave: () => setHoveredItem(null),
  });

  return { getToggleHoverProps, hoveredItem };
};