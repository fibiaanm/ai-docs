import { computed, ref, type Ref } from "vue";
import type { ParsedGeometry } from "../../utils/geometry-parser";
import { useLatexProcessor } from "./useLatexProcessor";
// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

export const useCreateLatexStream = (
    geometry: Ref<ParsedGeometry>,
    overrides: any[]
) => {
  const { 
    processBeforeDocumentInitialization, 
    processLatexToHtml,
  } = useLatexProcessor(geometry, overrides);

  const documentHasBegun = ref(false);
  const accumulatedContent = ref<string>('');
  const currentLine = ref('');
  const htmlBatches = ref<string[]>([]);
  const i = ref(0);

  const isDocumentBeginning = computed(() => currentLine.value.includes('\\begin{document}'));
  const isDocumentEnd = computed(() => currentLine.value.includes('\\end{document}'));

  const processDocumentBeginning = () => {
    if (accumulatedContent.value.trim()) {
      processBeforeDocumentInitialization(accumulatedContent.value.trim());
      accumulatedContent.value = '';
    }
    documentHasBegun.value = true;
  };

  const processContent = () => {
    if (accumulatedContent.value.trim()) {
      const htmlContent = processLatexToHtml(accumulatedContent.value.trim());
      if (htmlContent.trim()) {
        htmlBatches.value.push(htmlContent);
      }
    }
  };

  const processDocumentEnd = () => {
    processContent();
  };

  const isCurrentLineEmpty = computed(() => currentLine.value.trim() === '');

  const countEmptyLines = (lines: string[]) => {
    let emptyLineCount = 0;
    let j = i.value;
    while (j < lines.length && (lines[j]?.trim() || '') === '') {
      emptyLineCount++;
      j++;
    }
    return { emptyLineCount, j };
  }

  const createStream = (content: string, targetElement: HTMLDivElement) => {
    // Split content into lines
    const lines = content.split('\n');
    i.value = 0;
    documentHasBegun.value = false;
    accumulatedContent.value = '';
    htmlBatches.value = [];
    
    while (i.value < lines.length) {
      currentLine.value = lines[i.value]?.trim() || '';
      
      // Handle document beginning
      if (isDocumentBeginning.value) {
        processDocumentBeginning();
        i.value++;
        continue;
      }

      if (!documentHasBegun.value) {
        accumulatedContent.value += '\n' + currentLine.value;
        i.value++;
        continue;
      }
      
      // Handle document end
      if (isDocumentEnd.value) {
        // Process any remaining accumulated content
        processDocumentEnd();
        break;
      }
      
      // If it's an empty line, we need to check for batching logic
      if (isCurrentLineEmpty.value) {
        const { j } = countEmptyLines(lines);

        if (documentHasBegun.value && accumulatedContent.value.trim()) {
          processContent();
          accumulatedContent.value = '';
        } 
        // Skip all the empty lines
        i.value = j;
        continue;
      }
      
      // Add non-empty line to accumulated content
      if (accumulatedContent.value) {
        accumulatedContent.value += '\n' + currentLine.value;
      } else {
        accumulatedContent.value = currentLine.value;
      }
      
      i.value++;
    }
    
    // Process any remaining content
    if (documentHasBegun.value) {
      processContent();
    }
    
    // Set the final HTML content and render math
    targetElement.innerHTML = htmlBatches.value.join('\n');
    renderMathInElement(targetElement, {
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

  return {
    createStream
  };
};