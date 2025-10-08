
import { convertLatexUnit } from '../../utils/latex-units';
import { processGeometry, type ParsedGeometry } from '../../utils/geometry-parser';
// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import type { Ref } from 'vue';
import { useDocumentConfig } from './useDocumentConfig';

export const useLatexProcessor = (
    _geometry: Ref<ParsedGeometry>,
    _parseOverrides: any[]
) => {

    const { processHeaderSettings } = useDocumentConfig();

    const processBeforeDocumentInitialization = (content: string) => {
        const geometry = processGeometry(content);
        _geometry.value = geometry;
        console.log('processBeforeDocumentInitialization', geometry, content);

        processHeaderSettings(content);


        return content
            .replace(/\\documentclass(\[[^\]]*\])?\{[^}]*\}/g, '') // Remove documentclass declarations
            .replace(/\\usepackage(\[[^\]]*\])?\{(?!geometry)[^}]*\}/g, '') // Preserve geometry package
            .replace(/\\setlength\{\\parindent\}\{[^}]*\}/g, '') // Remove parindent setlength commands
            .replace(/\\setlength\{\\parskip\}\{[^}]*\}/g, '') // Remove parskip setlength commands
            .replace(/\\linespread\{[^}]*\}/g, '') // Remove linespread commands
            .replace(/\\begin\{document\}/g, '')
            .replace(/\\end\{document\}/g, '')
            .replace(/\\maketitle/g, '');
    }

    const processLatexToHtml = (content: string): string => {
        let processedContent = content;

        const { parindent, parskip, lineSpread } = _geometry.value.paragraphSettings;

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
            .replace(/\n\s*\n/g, '</p><p>');

        // Wrap content in paragraphs if not already wrapped in block elements
        // Block elements: h1, h2, h3, h4, div, p
        // Inline elements like strong, em, u, code should still be wrapped in p tags
        const blockElementPattern = /^\s*<(h[1-6]|div|p)\b/i;
        if (processedContent.trim() && !blockElementPattern.test(processedContent.trim())) {
            processedContent = `<p style="text-indent: ${parindent}px; margin-bottom: ${parskip}px; line-height: ${lineSpread};">${processedContent}</p>`;
        }

        return processedContent;
    };

    const renderContent = (targetElement: HTMLDivElement, content: string) => {
        // Process LaTeX content to HTML
        const htmlContent = processLatexToHtml(content);

        // Set the HTML content
        targetElement.innerHTML = htmlContent;

        // Render math with KaTeX
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
        processLatexToHtml,
        renderContent,
        processBeforeDocumentInitialization
    };
};
