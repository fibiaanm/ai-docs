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

  // Parse margin options
  const marginPattern = /(\w+)=([^,\]]+)/g;
  let match;
  while ((match = marginPattern.exec(options)) !== null) {
    if (match[1] && match[2]) {
      const key = match[1];
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
    parskip: 0     // Default no extra space between paragraphs
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

  return defaultSettings;
}

/**
 * Convert geometry settings to page dimensions and margins
 */
export function applyGeometrySettings(settings: GeometrySettings | null, documentClass?: DocumentClassSettings | null, paragraphSettings?: ParagraphSettings | null): ParsedGeometry {
  // Default to A4 if no settings
  let dimensions: PageDimensions = {
    name: 'A4',
    width: 794,
    height: 1123,
    aspectRatio: 210 / 297
  };
  let margins: PageMargins = {
    top: 96,    // 1 inch default
    bottom: 96,
    left: 96,
    right: 96
  };
  
  // Default font size (14px), document class, and paragraph settings
  let fontSize = 14;
  let docClass = 'article';
  let paragraphConfig: ParagraphSettings = {
    parindent: 20, // Default indentation
    parskip: 0     // Default no extra spacing
  };

  // Apply document class settings
  if (documentClass) {
    docClass = documentClass.class;
    if (documentClass.fontSize) {
      fontSize = convertLatexUnit(documentClass.fontSize); // Use existing utility!
    }
  }

  // Apply paragraph settings
  if (paragraphSettings) {
    paragraphConfig = paragraphSettings;
  }

  if (!settings) return { dimensions, margins, fontSize, documentClass: docClass, paragraphSettings: paragraphConfig };

  // Apply paper size
  if (settings.paperSize && PAGE_DIMENSIONS[settings.paperSize]) {
    const baseDimensions = PAGE_DIMENSIONS[settings.paperSize];
    if (baseDimensions) {
      dimensions = { 
        name: baseDimensions.name,
        width: baseDimensions.width,
        height: baseDimensions.height,
        aspectRatio: baseDimensions.aspectRatio
      };
    }
  }

  // Apply landscape orientation (swap width/height)
  if (settings.landscape) {
    dimensions = {
      name: dimensions.name,
      width: dimensions.height,
      height: dimensions.width,
      aspectRatio: 1 / dimensions.aspectRatio
    };
  }

  // Apply margins
  if (settings.margins.margin) {
    // Uniform margin
    const marginPx = convertLatexUnit(settings.margins.margin);
    margins = {
      top: marginPx,
      bottom: marginPx,
      left: marginPx,
      right: marginPx
    };
  }

  // Apply individual margins (override uniform if specified)
  if (settings.margins.top) margins.top = convertLatexUnit(settings.margins.top);
  if (settings.margins.bottom) margins.bottom = convertLatexUnit(settings.margins.bottom);
  if (settings.margins.left) margins.left = convertLatexUnit(settings.margins.left);
  if (settings.margins.right) margins.right = convertLatexUnit(settings.margins.right);

  return { dimensions, margins, fontSize, documentClass: docClass, paragraphSettings: paragraphConfig };
}

/**
 * Extract geometry settings from LaTeX content and return parsed configuration
 */
export function processGeometry(content: string): ParsedGeometry {
  const geometrySettings = parseGeometryPackage(content);
  const documentClassSettings = parseDocumentClass(content);
  const paragraphSettings = parseParagraphSettings(content);
  return applyGeometrySettings(geometrySettings, documentClassSettings, paragraphSettings);
}
