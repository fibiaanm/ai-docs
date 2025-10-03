// LaTeX document templates and configurations
export interface DocumentTemplate {
  name: string;
  description: string;
  documentClass: string;
  defaultPackages: string[];
}

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  ARTICLE: {
    name: 'Article',
    description: 'Standard article document class',
    documentClass: 'article',
    defaultPackages: ['amsmath', 'amssymb', 'geometry']
  },
  REPORT: {
    name: 'Report',
    description: 'Report document class with chapters',
    documentClass: 'report',
    defaultPackages: ['amsmath', 'amssymb', 'geometry', 'graphicx']
  },
  BOOK: {
    name: 'Book',
    description: 'Book document class',
    documentClass: 'book',
    defaultPackages: ['amsmath', 'amssymb', 'geometry', 'graphicx']
  },
  LETTER: {
    name: 'Letter',
    description: 'Formal letter template',
    documentClass: 'letter',
    defaultPackages: []
  },
  BEAMER: {
    name: 'Presentation',
    description: 'Beamer presentation slides',
    documentClass: 'beamer',
    defaultPackages: ['amsmath', 'amssymb', 'graphicx']
  }
};

export const DEFAULT_TEMPLATE = DOCUMENT_TEMPLATES.ARTICLE;

// Editor configuration constants
export const EDITOR_CONFIG = {
  defaultFontSize: 14,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  lineHeight: 1.5,
  tabSize: 2,
  indentUnit: 2
} as const;

// Preview configuration
export const PREVIEW_CONFIG = {
  debounceMs: 300,
  maxPreviewLength: 10000, // Characters
  autoScroll: true
} as const;

// Common LaTeX packages and their descriptions
export const COMMON_PACKAGES = {
  'amsmath': 'Enhanced math environments and commands',
  'amssymb': 'Additional math symbols',
  'geometry': 'Page layout and margins',
  'graphicx': 'Include graphics and images',
  'hyperref': 'Hyperlinks and PDF bookmarks',
  'babel': 'Language support and hyphenation',
  'fontenc': 'Font encoding',
  'inputenc': 'Input encoding (UTF-8)',
  'microtype': 'Improved typography',
  'listings': 'Source code listings',
  'tikz': 'Drawing and graphics',
  'booktabs': 'Professional table formatting',
  'longtable': 'Multi-page tables',
  'float': 'Improved float placement',
  'lipsum': 'Placeholder text'
} as const;
