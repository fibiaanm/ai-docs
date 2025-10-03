// Page dimensions in pixels (at 96 DPI for web display)
export interface PageDimensions {
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export const PAGE_DIMENSIONS: Record<string, PageDimensions> = {
  A4: {
    name: 'A4',
    width: 794,  // 210mm at 96 DPI
    height: 1123, // 297mm at 96 DPI
    aspectRatio: 210 / 297
  },
  A3: {
    name: 'A3',
    width: 1123, // 297mm at 96 DPI  
    height: 1587, // 420mm at 96 DPI
    aspectRatio: 297 / 420
  },
  A5: {
    name: 'A5',
    width: 559,  // 148mm at 96 DPI
    height: 794,  // 210mm at 96 DPI
    aspectRatio: 148 / 210
  },
  LETTER: {
    name: 'Letter',
    width: 816,  // 8.5" at 96 DPI
    height: 1056, // 11" at 96 DPI
    aspectRatio: 8.5 / 11
  },
  LEGAL: {
    name: 'Legal',
    width: 816,  // 8.5" at 96 DPI
    height: 1344, // 14" at 96 DPI
    aspectRatio: 8.5 / 14
  }
};

export const DEFAULT_PAGE_DIMENSIONS = PAGE_DIMENSIONS.A4;

// Page margins in pixels
export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_PAGE_MARGINS: PageMargins = {
  top: 60,    // ~15.9mm
  right: 60,  // ~15.9mm  
  bottom: 60, // ~15.9mm
  left: 60    // ~15.9mm
};

export const PAGE_SPACING = 24; // Space between pages in multi-page view

// Calculate content area dimensions
export const getContentDimensions = (
  pageDimensions: PageDimensions, 
  margins: PageMargins = DEFAULT_PAGE_MARGINS
) => ({
  width: pageDimensions.width - margins.left - margins.right,
  height: pageDimensions.height - margins.top - margins.bottom
});

// Scale page dimensions for different zoom levels
export const scalePage = (dimensions: PageDimensions, scale: number) => ({
  ...dimensions,
  width: dimensions.width * scale,
  height: dimensions.height * scale
});
