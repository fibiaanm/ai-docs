import { ref } from "vue";
import { isOptionLatexUnit, type LatexUnitValue, convertLatexUnit } from "../../utils/latex-units";
import type { PageMargin, PageOrientation, LatexPaperSize, PaperDimensions } from "../../utils/latex-pages";
import { isOptionMargin, isOptionPaperSize } from "../../utils/latex-pages";

export type DocumentType = 'article' | 'book' | 'report' | 'letter';


export interface PageSettings {
    margins: {
        [key in PageMargin]: number;
    };
    paperSize: LatexPaperSize;
    customDimensions?: PaperDimensions;
    orientation: PageOrientation;
}

export interface ParagraphSettings {
    parindent: number;
    parskip: number;
    lineSpread: number;
    fontSize: number;
}

export interface DocumentSettings {
    documentType: DocumentType;
    page: PageSettings;
    paragraph: ParagraphSettings;
}

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
    documentType: 'article',
    page: {
        paperSize: 'a4paper',
        orientation: 'portrait',
        margins: {
            top: 60,
            bottom: 60,
            left: 60,
            right: 60,
            margin: 60,
        },
    },
    paragraph: {
        parindent: 10,
        parskip: 10,
        lineSpread: 1.0,
        fontSize: 10,
    },
}

export type Options = Partial<{
    fontSize: LatexUnitValue,
    margins: Partial<{
        [key in PageMargin]: LatexUnitValue
    }>,
    paperSize: LatexPaperSize,
    customDimensions?: {
        width: LatexUnitValue,
        height: LatexUnitValue
    },
    documentType: DocumentType,
    lineSpread: number,
    parindent: LatexUnitValue,
    parskip: LatexUnitValue
}>

export const useDocumentConfig = (
    _previousSettings: DocumentSettings = DEFAULT_DOCUMENT_SETTINGS,
) => {

    const documentSettings = ref<DocumentSettings>(
        JSON.parse(JSON.stringify(_previousSettings))
    );

    const identifyDocumentOptions = (options: string) => {
        const identifiedOptions: Options = {}

        options.split(',').forEach(option => {
            if (isOptionLatexUnit(option)) {
                identifiedOptions.fontSize = option as LatexUnitValue;
                return;
            }
        })

        return identifiedOptions;
    }

    const identifyGeometryOptions = (options: string) => {
        const identifiedOptions: Options = {}
        
        options.split(',').forEach(option => {
            const trimmedOption = option.trim();
            
            if (isOptionMargin(trimmedOption)) {
                const [marginType, value] = trimmedOption.split('=') as [PageMargin, LatexUnitValue];
                
                if (!identifiedOptions.margins) {
                    identifiedOptions.margins = {};
                }
                
                identifiedOptions.margins[marginType] = value;
            } else if (!!isOptionPaperSize(trimmedOption)) {
                const { paperSize, dimensions } = isOptionPaperSize(trimmedOption);
                if (paperSize) {
                    identifiedOptions.paperSize = paperSize;
                }
                if (dimensions) {
                    identifiedOptions.customDimensions = dimensions;
                }
            }
        });
        
        return identifiedOptions;
    }

    const applyOptions = (options: Options) => {
        if ('fontSize' in options) {
            const fontSize = options.fontSize!;
            documentSettings.value.paragraph.fontSize = convertLatexUnit(fontSize);
        }

        if ('documentType' in options) {
            documentSettings.value.documentType = options.documentType!;
        }
        
        if ('margins' in options && options.margins) {
            Object.entries(options.margins).forEach(([marginType, value]) => {
                const margin = marginType as PageMargin;
                const convertedValue = convertLatexUnit(value);
                
                if (margin === 'margin') {
                    // Apply to all margins
                    documentSettings.value.page.margins.top = convertedValue;
                    documentSettings.value.page.margins.bottom = convertedValue;
                    documentSettings.value.page.margins.left = convertedValue;
                    documentSettings.value.page.margins.right = convertedValue;
                } else {
                    // Apply to specific margin
                    documentSettings.value.page.margins[margin] = convertedValue;
                }
            });
        }
        
        if ('paperSize' in options && options.paperSize) {
            documentSettings.value.page.paperSize = options.paperSize;
        }
        
        if ('customDimensions' in options && options.customDimensions) {
            documentSettings.value.page.customDimensions = options.customDimensions;
        }
        
        if ('lineSpread' in options && options.lineSpread) {
            documentSettings.value.paragraph.lineSpread = options.lineSpread;
        }
        
        if ('parindent' in options && options.parindent) {
            documentSettings.value.paragraph.parindent = convertLatexUnit(options.parindent);
        }
        
        if ('parskip' in options && options.parskip) {
            documentSettings.value.paragraph.parskip = convertLatexUnit(options.parskip);
        }
    }

    const processHeaderSettings = (content: string) => {
        const collectedOptions: Options = {}
        content.replace(/\\documentclass(\[[^\]]*\])?\{([^}]*)\}/g, (_, optionsStr, documentType: DocumentType) => {
            collectedOptions.documentType = documentType;
            const identifiedOptions = identifyDocumentOptions(optionsStr);
            Object.assign(collectedOptions, identifiedOptions);
            return ''
        }) // get the document class to use for the settings
        .replace(/\\usepackage\[([^\]]*)\]\{geometry\}/g, (_, optionsStr) => {
            const identifiedOptions = identifyGeometryOptions(optionsStr);
            Object.assign(collectedOptions, identifiedOptions);
            return ''
        })
        .replace(/\\linespread\{([^}]+)\}/g, (_, value) => {
            const lineSpread = parseFloat(value);
            if (isNaN(lineSpread)) return '';
            collectedOptions.lineSpread = lineSpread;
            return ''
        })
        .replace(/\\setlength\{\\parindent\}\{([^}]+)\}/g, (_, value) => {
            collectedOptions.parindent = value as LatexUnitValue;
            return ''
        })
        .replace(/\\setlength\{\\parskip\}\{([^}]+)\}/g, (_, value) => {
            collectedOptions.parskip = value as LatexUnitValue;
            return ''
        })

        applyOptions(collectedOptions);

        console.log('collectedOptions', collectedOptions);
    }

    return {
        documentSettings,
        processHeaderSettings,
    }
}