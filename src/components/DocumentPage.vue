<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { PageDimensions, PageMargins } from '../constants/page-dimensions';
import { DEFAULT_PAGE_MARGINS } from '../constants/page-dimensions';
import { processLipsumCommands } from '../utils/lipsum';
import { convertLatexUnit } from '../utils/latex-units';
import { processGeometry } from '../utils/geometry-parser';
// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

interface Props {
  content: string;
  pageNumber: number;
  dimensions: PageDimensions;
  margins?: PageMargins;
  scale?: number;
  isPreProcessed?: boolean; // Flag to indicate content is already processed HTML
}

const props = withDefaults(defineProps<Props>(), {
  margins: () => DEFAULT_PAGE_MARGINS,
  scale: 1,
  isPreProcessed: false
});

const pageElement = ref<HTMLDivElement | null>(null);
const contentElement = ref<HTMLDivElement | null>(null);

// Calculate scaled dimensions
const scaledWidth = () => props.dimensions.width * props.scale;
const scaledHeight = () => props.dimensions.height * props.scale;
const scaledMargins = () => ({
  top: props.margins.top * props.scale,
  right: props.margins.right * props.scale,
  bottom: props.margins.bottom * props.scale,
  left: props.margins.left * props.scale,
});

// Process LaTeX content for rendering
const processLatexContent = (content: string): string => {
  let processedContent = content;
  
  // Get font size and paragraph settings from document class for dynamic styling
  const geometryConfig = processGeometry(content);
  const fontSize = geometryConfig.fontSize;
  const { parindent, parskip } = geometryConfig.paragraphSettings;
  
  // Process lipsum commands first
  processedContent = processLipsumCommands(processedContent);
  
  // Remove document structure that doesn't belong in page content (but preserve geometry for processing)
  processedContent = processedContent
    .replace(/\\documentclass(\[[^\]]*\])?\{[^}]*\}/g, '') // Remove documentclass declarations
    .replace(/\\usepackage(\[[^\]]*\])?\{(?!geometry)[^}]*\}/g, '') // Preserve geometry package
    .replace(/\\setlength\{\\parindent\}\{[^}]*\}/g, '') // Remove parindent setlength commands
    .replace(/\\setlength\{\\parskip\}\{[^}]*\}/g, '') // Remove parskip setlength commands
    .replace(/\\begin\{document\}/g, '')
    .replace(/\\end\{document\}/g, '')
    .replace(/\\maketitle/g, '');

  // Convert LaTeX commands to HTML
  processedContent = processedContent
    .replace(/\\title\{([^}]*)\}/g, '<h1 class="text-3xl font-bold mb-6 text-center">$1</h1>')
    .replace(/\\author\{([^}]*)\}/g, '<p class="text-lg text-center mb-2 font-medium">$1</p>')
    .replace(/\\date\{([^}]*)\}/g, '<p class="text-sm text-center mb-8 text-gray-600">$1</p>')
    .replace(/\\section\{([^}]*)\}/g, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/\\subsection\{([^}]*)\}/g, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
    .replace(/\\subsubsection\{([^}]*)\}/g, '<h4 class="text-base font-medium mt-4 mb-2">$1</h4>')
    .replace(/\\chapter\{([^}]*)\}/g, '<h1 class="text-2xl font-bold mt-12 mb-6">$1</h1>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
    .replace(/\\texttt\{([^}]*)\}/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
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
    
    // Handle line breaks and paragraphs
    .replace(/\\\\/g, '<br>')
    .replace(/\n\s*\n/g, '</p><p class="mb-4">');

  // Wrap content in paragraphs if not already wrapped, with dynamic font size and paragraph styling
  if (processedContent.trim() && !processedContent.trim().startsWith('<')) {
    const paragraphStyle = `font-size: ${fontSize}px; text-indent: ${parindent}px;`;
    const containerStyle = `font-size: ${fontSize}px;`;
    processedContent = `<div style="${containerStyle}"><p class="mb-4" style="${paragraphStyle}">${processedContent}</p></div>`;
  } else if (fontSize !== 14 || parindent !== 20 || parskip !== 0) {
    // Apply font size and paragraph styling to existing content
    const containerStyle = `font-size: ${fontSize}px;`;
    // Add paragraph spacing by modifying paragraph margins
    const paragraphSpacingStyle = parskip > 0 ? `<style>.mb-4 { margin-bottom: ${parskip + 16}px !important; } p { text-indent: ${parindent}px; }</style>` : `<style>p { text-indent: ${parindent}px; }</style>`;
    processedContent = `${paragraphSpacingStyle}<div style="${containerStyle}">${processedContent}</div>`;
  }

  return processedContent;
};

// Render content with KaTeX
const renderContent = () => {
  if (!contentElement.value) return;

  let processedContent: string;
  
  if (props.isPreProcessed) {
    // Content is already processed HTML from pagination system
    processedContent = props.content;
  } else {
    // Process raw LaTeX content
    processedContent = processLatexContent(props.content);
  }

  contentElement.value.innerHTML = processedContent;

  // Render math with KaTeX
  renderMathInElement(contentElement.value, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
    ],
    throwOnError: false,
    strict: false
  });
};

// Watch for content changes
watch(() => props.content, () => {
  renderContent();
});

onMounted(() => {
  renderContent();
});
</script>

<template>
  <div 
    ref="pageElement"
    class="document-page bg-white shadow-lg mx-auto mb-6 relative"
    :style="{
      width: `${scaledWidth()}px`,
      height: `${scaledHeight()}px`,
      minHeight: `${scaledHeight()}px`
    }"
  >
    <!-- Page background and border -->
    <div class="absolute inset-0 bg-white border border-gray-300 shadow-sm"></div>
    
    <!-- Page number (optional) -->
    <div 
      v-if="pageNumber > 0"
      class="absolute bottom-2 right-4 text-xs text-gray-400 font-mono"
      :style="{ fontSize: `${12 * props.scale}px` }"
    >
      {{ pageNumber }}
    </div>
    
    <!-- Content area -->
    <div 
      ref="contentElement"
      class="absolute overflow-hidden text-black leading-relaxed"
      :style="{
        top: `${scaledMargins().top}px`,
        left: `${scaledMargins().left}px`,
        right: `${scaledMargins().right}px`,
        bottom: `${scaledMargins().bottom}px`,
        width: `${scaledWidth() - scaledMargins().left - scaledMargins().right}px`,
        height: `${scaledHeight() - scaledMargins().top - scaledMargins().bottom}px`,
        fontSize: `${14 * props.scale}px`,
        lineHeight: `${1.6 * props.scale}`
      }"
    ></div>
  </div>
</template>

<style scoped>
.document-page {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Ensure math content scales properly */
.document-page :deep(.katex) {
  font-size: 1em;
}

.document-page :deep(.katex-display) {
  margin: 1em 0;
}

/* Style headings and content appropriately */
.document-page :deep(h1) {
  page-break-after: avoid;
}

.document-page :deep(h2) {
  page-break-after: avoid;
}

.document-page :deep(h3) {
  page-break-after: avoid;
}

.document-page :deep(p) {
  text-align: justify;
  hyphens: auto;
}
</style>
