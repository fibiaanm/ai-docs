import type { PageMargins } from '../constants/page-dimensions';
import { processLipsumCommands } from './lipsum';
import { convertLatexUnit } from './latex-units';

// Content item types for pagination
export interface ContentItem {
  type: 'paragraph' | 'heading' | 'math' | 'list' | 'raw';
  content: string;
  level?: number; // For headings (1-6)
  estimatedHeight: number;
  canSplit: boolean; // Whether this item can be split across pages
}

/**
 * Parse LaTeX content into pageable content items
 */
export function parseLatexContent(content: string): ContentItem[] {
  let processedContent = content;
  
  // Process lipsum commands first
  processedContent = processLipsumCommands(processedContent);
  
  // Extract title, author, date before removing document structure
  const titleMatch = processedContent.match(/\\title\{([^}]*)\}/);
  const authorMatch = processedContent.match(/\\author\{([^}]*)\}/);
  const dateMatch = processedContent.match(/\\date\{([^}]*)\}/);
  const hasMakeTitle = processedContent.includes('\\maketitle');
  
  // Remove document structure (but preserve geometry for processing)
  processedContent = processedContent
    .replace(/\\documentclass(\[[^\]]*\])?\{[^}]*\}/g, '') // Remove documentclass declarations
    .replace(/\\usepackage(\[[^\]]*\])?\{(?!geometry)[^}]*\}/g, '') // Preserve geometry package
    .replace(/\\setlength\{\\parindent\}\{[^}]*\}/g, '') // Remove parindent setlength commands
    .replace(/\\setlength\{\\parskip\}\{[^}]*\}/g, '') // Remove parskip setlength commands
    .replace(/\\begin\{document\}/g, '')
    .replace(/\\end\{document\}/g, '')
    .replace(/\\title\{[^}]*\}/g, '')
    .replace(/\\author\{[^}]*\}/g, '')
    .replace(/\\date\{[^}]*\}/g, '')
    .replace(/\\maketitle/g, '');

  const items: ContentItem[] = [];
  
  // Add title block items if \maketitle is present
  if (hasMakeTitle && (titleMatch || authorMatch || dateMatch)) {
    if (titleMatch && titleMatch[1]) {
      items.push({
        type: 'heading',
        content: titleMatch[1],
        level: 1,
        estimatedHeight: 80,
        canSplit: false
      });
    }
    
    if (authorMatch && authorMatch[1]) {
      items.push({
        type: 'paragraph',
        content: `<p class="text-lg text-center mb-2 font-medium">${authorMatch[1]}</p>`,
        estimatedHeight: 35,
        canSplit: false
      });
    }
    
    if (dateMatch && dateMatch[1]) {
      const dateContent = dateMatch[1] === '\\today' ? new Date().toLocaleDateString() : dateMatch[1];
      items.push({
        type: 'paragraph',
        content: `<p class="text-sm text-center mb-8 text-gray-600">${dateContent}</p>`,
        estimatedHeight: 30,
        canSplit: false
      });
    }
  }
  
  const lines = processedContent.split('\n');
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || '';
    
    if (!line) {
      // Empty line - end current paragraph if exists
      if (currentParagraph.trim()) {
        items.push(createParagraphItem(currentParagraph.trim()));
        currentParagraph = '';
      }
      continue;
    }

    // Check for headings
    if (line.match(/\\(chapter|section|subsection|subsubsection)\{/)) {
      // End current paragraph before heading
      if (currentParagraph.trim()) {
        items.push(createParagraphItem(currentParagraph.trim()));
        currentParagraph = '';
      }
      
      const headingMatch = line.match(/\\(chapter|section|subsection|subsubsection)\{([^}]*)\}/);
      if (headingMatch) {
        const [, type, title] = headingMatch;
        if (type && title) {
          const level = getHeadingLevel(type);
          items.push({
            type: 'heading',
            content: title,
            level,
            estimatedHeight: estimateHeadingHeight(level),
            canSplit: false
          });
        }
      }
      continue;
    }

    // Check for display math
    if (line.match(/^\\\[/) || line.match(/^\$\$/)) {
      // End current paragraph before math
      if (currentParagraph.trim()) {
        items.push(createParagraphItem(currentParagraph.trim()));
        currentParagraph = '';
      }
      
      // Collect math content
      let mathContent = line;
      const isDisplayMath = line.match(/^\\\[/);
      const isDollarMath = line.match(/^\$\$/);
      
      if (isDisplayMath && !line.includes('\\]')) {
        // Multi-line display math
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine) {
            mathContent += '\n' + nextLine;
            if (nextLine.includes('\\]')) {
              i = j;
              break;
            }
          }
        }
      } else if (isDollarMath && !line.slice(2).includes('$$')) {
        // Multi-line $$ math
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine) {
            mathContent += '\n' + nextLine;
            if (nextLine.includes('$$')) {
              i = j;
              break;
            }
          }
        }
      }
      
      items.push({
        type: 'math',
        content: mathContent,
        estimatedHeight: estimateMathHeight(mathContent),
        canSplit: false
      });
      continue;
    }

    // Check for lists
    if (line.match(/^\\begin\{(itemize|enumerate)\}/)) {
      // End current paragraph before list
      if (currentParagraph.trim()) {
        items.push(createParagraphItem(currentParagraph.trim()));
        currentParagraph = '';
      }
      
      // Collect list content
      let listContent = line;
      const listType = line.match(/\\begin\{(itemize|enumerate)\}/)?.[1];
      
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (nextLine) {
          listContent += '\n' + nextLine;
          if (nextLine.includes(`\\end{${listType}}`)) {
            i = j;
            break;
          }
        }
      }
      
      items.push({
        type: 'list',
        content: listContent,
        estimatedHeight: estimateListHeight(listContent),
        canSplit: true // Lists can be split across pages
      });
      continue;
    }

    // Regular content - add to current paragraph
    currentParagraph += (currentParagraph ? ' ' : '') + line;
  }

  // Add final paragraph if exists
  if (currentParagraph.trim()) {
    items.push(createParagraphItem(currentParagraph.trim()));
  }

  return items;
}

function createParagraphItem(content: string): ContentItem {
  return {
    type: 'paragraph',
    content,
    estimatedHeight: estimateParagraphHeight(content),
    canSplit: true
  };
}

function getHeadingLevel(type: string): number {
  switch (type) {
    case 'chapter': return 1;
    case 'section': return 2;
    case 'subsection': return 3;
    case 'subsubsection': return 4;
    default: return 2;
  }
}

/**
 * Estimate content heights (in pixels at scale=1)
 */
function estimateHeadingHeight(level: number): number {
  // Estimated heights for different heading levels
  const heights = { 1: 80, 2: 60, 3: 45, 4: 35, 5: 30, 6: 25 };
  return heights[level as keyof typeof heights] || 35;
}

function estimateParagraphHeight(content: string): number {
  // Estimate based on character count and line height
  const avgCharsPerLine = 80;
  const lineHeight = 24; // pixels at 14px font size
  const lines = Math.ceil(content.length / avgCharsPerLine);
  return lines * lineHeight + 16; // +16 for paragraph spacing
}

function estimateMathHeight(content: string): number {
  // Display math is typically taller
  const lines = content.split('\n').length;
  return Math.max(40, lines * 30) + 20; // Base height + spacing
}

function estimateListHeight(content: string): number {
  // Count list items
  const items = (content.match(/\\item/g) || []).length;
  return items * 25 + 20; // 25px per item + spacing
}

/**
 * Paginate content items across pages
 */
export function paginateContent(
  items: ContentItem[],
  pageHeight: number,
  margins: PageMargins
): ContentItem[][] {
  const availableHeight = pageHeight - margins.top - margins.bottom;
  const pages: ContentItem[][] = [];
  let currentPage: ContentItem[] = [];
  let currentHeight = 0;

  for (const item of items) {
    // Check if item fits on current page
    if (currentHeight + item.estimatedHeight <= availableHeight) {
      currentPage.push(item);
      currentHeight += item.estimatedHeight;
    } else {
      // Item doesn't fit - start new page
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }

      // If item is splittable and too large, split it
      if (item.canSplit && item.estimatedHeight > availableHeight) {
        const splitItems = splitContentItem(item, availableHeight);
        for (const splitItem of splitItems) {
          if (currentHeight + splitItem.estimatedHeight <= availableHeight) {
            currentPage.push(splitItem);
            currentHeight += splitItem.estimatedHeight;
          } else {
            if (currentPage.length > 0) {
              pages.push(currentPage);
              currentPage = [];
              currentHeight = 0;
            }
            currentPage.push(splitItem);
            currentHeight = splitItem.estimatedHeight;
          }
        }
      } else {
        // Add item to new page
        currentPage.push(item);
        currentHeight = item.estimatedHeight;
      }
    }
  }

  // Add final page if not empty
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
}

/**
 * Split a content item that's too large for a page
 */
function splitContentItem(item: ContentItem, maxHeight: number): ContentItem[] {
  if (item.type === 'paragraph') {
    return splitParagraph(item, maxHeight);
  } else if (item.type === 'list') {
    return splitList(item, maxHeight);
  }
  
  // For non-splittable items, return as-is
  return [item];
}

function splitParagraph(item: ContentItem, maxHeight: number): ContentItem[] {
  const words = item.content.split(' ');
  const items: ContentItem[] = [];
  let currentWords: string[] = [];
  let currentHeight = 0;

  for (const word of words) {
    const testContent = [...currentWords, word].join(' ');
    const testHeight = estimateParagraphHeight(testContent);
    
    if (testHeight <= maxHeight) {
      currentWords.push(word);
      currentHeight = testHeight;
    } else {
      // Create item with current words
      if (currentWords.length > 0) {
        items.push({
          type: 'paragraph',
          content: currentWords.join(' '),
          estimatedHeight: currentHeight,
          canSplit: true
        });
      }
      
      // Start new item
      currentWords = [word];
      currentHeight = estimateParagraphHeight(word);
    }
  }

  // Add final item
  if (currentWords.length > 0) {
    items.push({
      type: 'paragraph',
      content: currentWords.join(' '),
      estimatedHeight: currentHeight,
      canSplit: true
    });
  }

  return items.length > 0 ? items : [item];
}

function splitList(item: ContentItem, _maxHeight: number): ContentItem[] {
  // Simple list splitting - could be enhanced  
  const lines = item.content.split('\n');
  const listStart = lines.find(line => line.includes('\\begin{'));
  const listEnd = lines.find(line => line.includes('\\end{'));
  const listItems = lines.filter(line => line.trim().startsWith('\\item'));
  
  if (listItems.length <= 1) return [item];
  
  const items: ContentItem[] = [];
  const midPoint = Math.floor(listItems.length / 2);
  
  // First half
  const firstHalf = [
    listStart || '',
    ...listItems.slice(0, midPoint),
    listEnd || ''
  ].filter(Boolean).join('\n');
  
  // Second half  
  const secondHalf = [
    listStart || '',
    ...listItems.slice(midPoint),
    listEnd || ''
  ].filter(Boolean).join('\n');
  
  items.push({
    type: 'list',
    content: firstHalf,
    estimatedHeight: estimateListHeight(firstHalf),
    canSplit: true
  });
  
  items.push({
    type: 'list', 
    content: secondHalf,
    estimatedHeight: estimateListHeight(secondHalf),
    canSplit: true
  });
  
  return items;
}

/**
 * Convert content items back to HTML for rendering
 */
export function contentItemsToHtml(items: ContentItem[]): string {
  return items.map(item => {
    switch (item.type) {
      case 'heading':
        const tag = `h${Math.min(item.level || 2, 6)}`;
        const classes = {
          1: 'text-3xl font-bold mb-6 text-center', // Title styling - centered
          2: 'text-xl font-bold mt-8 mb-4', 
          3: 'text-lg font-semibold mt-6 mb-3',
          4: 'text-base font-medium mt-4 mb-2',
          5: 'text-sm font-medium mt-3 mb-2',
          6: 'text-sm font-medium mt-2 mb-1'
        };
        const className = classes[item.level as keyof typeof classes] || classes[2];
        return `<${tag} class="${className}">${item.content}</${tag}>`;
        
      case 'math':
        return `<div class="my-4">${item.content}</div>`;
        
      case 'list':
        return `<div class="my-4">${processLatexCommands(item.content)}</div>`;
        
      case 'paragraph':
        // Check if content is already HTML (for title block items)
        if (item.content.includes('<p ')) {
          return item.content;
        }
        return `<p class="mb-4 text-justify leading-relaxed">${processLatexCommands(item.content)}</p>`;
        
      default:
        return `<div>${item.content}</div>`;
    }
  }).join('');
}

function processLatexCommands(content: string): string {
  return content
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
    .replace(/\\texttt\{([^}]*)\}/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    .replace(/\\begin\{itemize\}/g, '<ul class="list-disc list-inside mb-4">')
    .replace(/\\end\{itemize\}/g, '</ul>')
    .replace(/\\begin\{enumerate\}/g, '<ol class="list-decimal list-inside mb-4">')
    .replace(/\\end\{enumerate\}/g, '</ol>')
    .replace(/\\item\s*/g, '<li class="mb-1">')
    // Font size commands
    .replace(/\{\\fontsize\{([^}]+)\}\{[^}]*\}\\selectfont\s*([^}]*)\}/g, (_, size, content) => {
      const pixels = convertLatexUnit(size + 'pt');
      return `<span style="font-size: ${pixels}px;">${content}</span>`;
    })
    // Center environment
    .replace(/\\begin\{center\}/g, '<div class="text-center">')
    .replace(/\\end\{center\}/g, '</div>')
    // Centering command
    .replace(/\{\\centering\s*([^}]*)\}/g, '<div class="text-center">$1</div>')
    // Spacing commands
    .replace(/\\vspace\{([^}]+)\}/g, (_, value) => {
      const pixels = convertLatexUnit(value);
      return `<div style="height: ${pixels}px;"></div>`;
    })
    .replace(/\\hspace\{([^}]+)\}/g, (_, value) => {
      const pixels = convertLatexUnit(value);
      return `<span style="display: inline-block; width: ${pixels}px;"></span>`;
    })
    .replace(/\\smallskip/g, '<div style="height: 3px;"></div>')
    .replace(/\\medskip/g, '<div style="height: 6px;"></div>')
    .replace(/\\bigskip/g, '<div style="height: 12px;"></div>')
    // Remove geometry package after processing (no visual rendering needed)
    .replace(/\\usepackage\[[^\]]*\]\{geometry\}/g, '')
    .replace(/\\\\/g, '<br>');
}
