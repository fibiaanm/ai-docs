import { ref, type Ref } from "vue";
import type { ParsedGeometry } from "../../utils/geometry-parser";

export const useCreateLatexStream = (
    geometry: Ref<ParsedGeometry>,
    overrides: any[]
) => {

  const documentHasBegun = ref(false);

  const lineHasPreviousContent = (line: string, target: string) => {
    const startIndex = line.indexOf(target);
    if (startIndex > 0) return false;
    return line.substring(startIndex).trim() !== '';
  }

  const processLinesBeforeDocumentInitialization = (line: string) => {
    if (line.includes('\\begin{document}')) {
      if (lineHasPreviousContent(line, '\\documentclass')) {
        return line;
      }
      documentHasBegun.value = true;
      return '';
    }

  }

  const processLine = (line: string) => {

    if (!documentHasBegun.value) {
      return processLinesBeforeDocumentInitialization(line);
    }

  };

  const createStream = (content: string) => {
    const stream = content.split('\n');
    for (const line of stream) {
      processLine(line.trim());
    }
    return stream;
  };

  return {
    createStream
  };
};