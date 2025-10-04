import { ref, type Ref } from "vue";
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
  const accumulatedContent = ref('');


  const createStream = (content: string, targetElement: HTMLDivElement) => {
    // Reset state for each new stream
    let documentHasBegun = false;
    let accumulatedContent = '';
    const processedBatchesHtml: string[] = [];
    
    // Split content into lines
    const lines = content.split('\n');
    let i = 0;
    
    while (i < lines.length) {
      const currentLine = lines[i]?.trim() || '';
      
      // Handle document beginning
      if (currentLine.includes('\\begin{document}')) {
        // Process any accumulated preamble content
        if (accumulatedContent.trim()) {
          processBeforeDocumentInitialization(accumulatedContent.trim());
          accumulatedContent = '';
        }
        documentHasBegun = true;
        i++;
        continue;
      }

      if (!documentHasBegun) {
        accumulatedContent += '\n' + currentLine;
        i++;
        continue;
      }
      
      // Handle document end
      if (currentLine.includes('\\end{document}')) {
        // Process any remaining accumulated content
        if (accumulatedContent.trim()) {
          const htmlContent = processLatexToHtml(accumulatedContent.trim());
          if (htmlContent.trim()) {
            processedBatchesHtml.push(htmlContent);
          }
        }
        break;
      }
      
      // If it's an empty line, we need to check for batching logic
      if (currentLine === '') {
        // Count consecutive empty lines
        let emptyLineCount = 0;
        let j = i;
        while (j < lines.length && (lines[j]?.trim() || '') === '') {
          emptyLineCount++;
          j++;
        }
        
        // If we have accumulated content and hit empty lines, process the batch
        if (accumulatedContent.trim()) {
          if (documentHasBegun) {
            const htmlContent = processLatexToHtml(accumulatedContent.trim());
            if (htmlContent.trim()) {
              processedBatchesHtml.push(htmlContent);
            }
          }
          accumulatedContent = '';
        }
        
        // Skip all the empty lines
        i = j;
        continue;
      }
      
      // Add non-empty line to accumulated content
      if (accumulatedContent) {
        accumulatedContent += '\n' + currentLine;
      } else {
        accumulatedContent = currentLine;
      }
      
      i++;
    }
    
    // Process any remaining content
    if (accumulatedContent.trim()) {
      console.log('accumulatedContent', accumulatedContent);
      if (documentHasBegun) {
        const htmlContent = processLatexToHtml(accumulatedContent.trim());
        if (htmlContent.trim()) {
          processedBatchesHtml.push(htmlContent);
        }
      }
    }
    
    // Set the final HTML content and render math
    targetElement.innerHTML = processedBatchesHtml.join('\n');
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