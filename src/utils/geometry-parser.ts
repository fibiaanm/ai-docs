import type { PageDimensions, PageMargins } from '../constants/page-dimensions';
import { PAGE_DIMENSIONS } from '../constants/page-dimensions';
import { convertLatexUnit } from './latex-units';

export interface GeometrySettings {
  paperSize?: string;
  landscape?: boolean;
  margins: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    margin?: string; // uniform margin
  };
}

export interface DocumentClassSettings {
  class: string;
  fontSize?: string;
  options: string[];
}

export interface ParagraphSettings {
  parindent: number; // in pixels
  parskip: number;   // in pixels
  lineSpread: number; // line spacing multiplier (1.0 = normal, 2.0 = double spacing)
}

export interface ParsedGeometry {
  dimensions: PageDimensions;
  margins: PageMargins;
  fontSize: number; // in pixels
  documentClass: string;
  paragraphSettings: ParagraphSettings;
}

/**
 * Parse geometry package options from LaTeX content
 * Enhanced to handle various syntax patterns
 */
export function parseGeometryPackage(content: string): GeometrySettings | null {
  const geometryMatch = content.match(/\\usepackage\[([^\]]*)\]\{geometry\}/);
  if (!geometryMatch || !geometryMatch[1]) return null;

  const options = geometryMatch[1];
  const settings: GeometrySettings = {
    margins: {}
  };

  // Parse paper size options
  if (options.includes('a4paper')) settings.paperSize = 'A4';
  else if (options.includes('a3paper')) settings.paperSize = 'A3';
  else if (options.includes('a5paper')) settings.paperSize = 'A5';
  else if (options.includes('letterpaper')) settings.paperSize = 'LETTER';
  else if (options.includes('legalpaper')) settings.paperSize = 'LEGAL';

  // Parse orientation
  if (options.includes('landscape')) settings.landscape = true;

  // Enhanced margin parsing to handle various syntax patterns
  // Matches: margin=1.5cm, top=2cm, left=1in, etc.
  const marginPattern = /(\w+)\s*=\s*([^\s,\]]+)/g;
  let match;
  while ((match = marginPattern.exec(options)) !== null) {
    if (match[1] && match[2]) {
      const key = match[1].trim();
      const value = match[2].trim();
      
      if (key === 'margin') {
        settings.margins.margin = value;
      } else if (['top', 'bottom', 'left', 'right'].includes(key)) {
        settings.margins[key as keyof typeof settings.margins] = value;
      }
    }
  }

  return settings;
}

/**
 * Parse document class declaration from LaTeX content
 */
export function parseDocumentClass(content: string): DocumentClassSettings | null {
  const classMatch = content.match(/\\documentclass(?:\[([^\]]*)\])?\{([^}]*)\}/);
  if (!classMatch) return null;

  const [, optionsStr, documentClass] = classMatch;
  const options = optionsStr ? optionsStr.split(',').map(opt => opt.trim()) : [];
  
  const settings: DocumentClassSettings = {
    class: documentClass || 'article',
    options
  };

  // Extract font size from options
  const fontSizeOption = options.find(opt => opt.match(/^\d+pt$/));
  if (fontSizeOption) {
    settings.fontSize = fontSizeOption;
  }

  return settings;
}

/**
 * Parse setlength commands from LaTeX content
 */
export function parseParagraphSettings(content: string): ParagraphSettings {
  const defaultSettings: ParagraphSettings = {
    parindent: 20, // Default paragraph indentation (about 1.5em at 14px)
    parskip: 0,    // Default no extra space between paragraphs
    lineSpread: 1.0 // Default normal line spacing
  };

  // Extract parindent setting
  const parindentMatch = content.match(/\\setlength\{\\parindent\}\{([^}]+)\}/);
  if (parindentMatch && parindentMatch[1]) {
    defaultSettings.parindent = convertLatexUnit(parindentMatch[1]);
  }

  // Extract parskip setting
  const parskipMatch = content.match(/\\setlength\{\\parskip\}\{([^}]+)\}/);
  if (parskipMatch && parskipMatch[1]) {
    defaultSettings.parskip = convertLatexUnit(parskipMatch[1]);
  }

  // Extract linespread setting
  const linespreadMatch = content.match(/\\linespread\{([^}]+)\}/);
  if (linespreadMatch && linespreadMatch[1]) {
    const value = parseFloat(linespreadMatch[1]);
    if (!isNaN(value)) {
      defaultSettings.lineSpread = value;
    }
  }

  return defaultSettings;
}

/**
 * Extract geometry settings from LaTeX content and return parsed configuration
 * Following the proper pattern: load defaults first, parse all packages, then override
 */
export function processGeometry(content: string): ParsedGeometry {
  // 1. START WITH COMPLETE DEFAULTS
  const defaultConfig: ParsedGeometry = {
    dimensions: {
      name: 'A4',
      width: 794,
      height: 1123,
      aspectRatio: 210 / 297
    },
    margins: {
      top: 96,    // 1 inch default
      bottom: 96,
      left: 96,
      right: 96
    },
    fontSize: 14,
    documentClass: 'article',
    paragraphSettings: {
      parindent: 20, // Default paragraph indentation
      parskip: 0,    // Default no extra space between paragraphs
      lineSpread: 1.0 // Default normal line spacing
    }
  };

  // 2. PARSE ALL LaTeX PACKAGES AND COMMANDS
  const geometrySettings = parseGeometryPackage(content);
  const documentClassSettings = parseDocumentClass(content);
  const paragraphSettings = parseParagraphSettings(content);

  // 3. START WITH DEFAULTS AND OVERRIDE WITH PARSED VALUES
  let finalConfig = { ...defaultConfig };

  // Override document class settings
  if (documentClassSettings) {
    finalConfig.documentClass = documentClassSettings.class;
    if (documentClassSettings.fontSize) {
      finalConfig.fontSize = convertLatexUnit(documentClassSettings.fontSize);
    }
  }

  // Override paragraph settings
  if (paragraphSettings) {
    finalConfig.paragraphSettings = {
      parindent: paragraphSettings.parindent,
      parskip: paragraphSettings.parskip,
      lineSpread: paragraphSettings.lineSpread
    };
  }

  // Override geometry settings
  if (geometrySettings) {
    // Apply paper size
    if (geometrySettings.paperSize && PAGE_DIMENSIONS[geometrySettings.paperSize]) {
      const baseDimensions = PAGE_DIMENSIONS[geometrySettings.paperSize];
      if (baseDimensions) {
        finalConfig.dimensions = {
          name: baseDimensions.name,
          width: baseDimensions.width,
          height: baseDimensions.height,
          aspectRatio: baseDimensions.aspectRatio
        };
      }
    }

    // Apply landscape orientation (swap width/height)
    if (geometrySettings.landscape) {
      finalConfig.dimensions = {
        name: finalConfig.dimensions.name,
        width: finalConfig.dimensions.height,
        height: finalConfig.dimensions.width,
        aspectRatio: 1 / finalConfig.dimensions.aspectRatio
      };
    }

    // Apply margins
    if (geometrySettings.margins.margin) {
      // Uniform margin
      const marginPx = convertLatexUnit(geometrySettings.margins.margin);
      finalConfig.margins = {
        top: marginPx,
        bottom: marginPx,
        left: marginPx,
        right: marginPx
      };
    }

    // Apply individual margins (override uniform if specified)
    if (geometrySettings.margins.top) {
      finalConfig.margins.top = convertLatexUnit(geometrySettings.margins.top);
    }
    if (geometrySettings.margins.bottom) {
      finalConfig.margins.bottom = convertLatexUnit(geometrySettings.margins.bottom);
    }
    if (geometrySettings.margins.left) {
      finalConfig.margins.left = convertLatexUnit(geometrySettings.margins.left);
    }
    if (geometrySettings.margins.right) {
      finalConfig.margins.right = convertLatexUnit(geometrySettings.margins.right);
    }
  }
  return finalConfig;
}
