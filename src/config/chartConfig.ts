// Chart Configuration Constants
// Centralized configuration for consistent chart styling

export const CHART_CONFIG = {
  // Container dimensions
  CONTAINER_HEIGHT: 420, // px - increased to accommodate 280px chart area + legend
  
  // Legend configuration
  LEGEND: {
    POSITION: 'bottom' as const,
    MAX_HEIGHT: 100, // px - 3 rows max with comfortable spacing
    FONT_SIZE: 10, // px - standardized across all charts
    PADDING: 10, // px - space between legend items
    BOX_WIDTH: 10, // px - size of legend color boxes
    USE_POINT_STYLE: true,
  },
  
  // Aspect ratios
  ASPECT_RATIO: {
    STANDARD: false, // disable aspect ratio to use fixed chart area
    PIE: 1.2, // for chart 9 (pie chart)
  },
  
  // Chart area dimensions
  CHART_AREA: {
    HEIGHT: 300, // px - standardized chart plotting area
  },
  
  // Title configuration
  TITLE: {
    FONT_SIZE: 14,
    FONT_WEIGHT: 'bold' as const,
    COLOR: '#374151',
    PADDING_BOTTOM: 20,
  },
  
  // Axis configuration
  AXIS: {
    TICK_FONT_SIZE: 11,
    TITLE_FONT_SIZE: 12,
    TITLE_FONT_WEIGHT: 'bold' as const,
  },
} as const;