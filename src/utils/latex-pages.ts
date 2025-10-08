import { isOptionLatexUnit, type LatexUnitValue } from "./latex-units";

export type PaperDimensions = {
    width: LatexUnitValue;
    height: LatexUnitValue;
}
export type PageSize = 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL' | 'CUSTOM';
export type LatexPaperSize = 'a4paper' | 'a3paper' | 'a5paper' | 'letterpaper' | 'legalpaper';
export type NamedLatexPaperSize = `paper=${LatexPaperSize}`;
export type PageOrientation = 'portrait' | 'landscape';
export type PageMargin = 'top' | 'bottom' | 'left' | 'right' | 'margin';
export type PageMarginOption = `${PageMargin}=${LatexUnitValue}`;

export const PAPER_SIZES_NAMES: LatexPaperSize[] = ['a4paper', 'a3paper', 'a5paper', 'letterpaper', 'legalpaper'];

export const isOptionMargin = (option: string): option is PageMarginOption => {
    const marginPattern = /^(top|bottom|left|right|margin)=\d+(?:\.\d+)?(pt|px|em|cm|mm|in)$/;
    return marginPattern.test(option.trim());
}

const getPaperSizeByName = (option: string): LatexPaperSize => {
    const trimmed = option.trim().toLowerCase();
    const paperSize = PAPER_SIZES_NAMES.find(size => size.toLowerCase() === trimmed);
    if (!paperSize) throw new Error(`Invalid paper size: ${option}`);
    return paperSize as LatexPaperSize;
}

const isPaperSizeByName = (option: string): option is LatexPaperSize => {
    try {
        getPaperSizeByName(option);
        return true;
    } catch (error) {
        return false;
    }
}

const getPaperSizeByNamed = (option: string): LatexPaperSize => {
    const trimmed = option.trim().toLowerCase();
    const paperSize = PAPER_SIZES_NAMES.find(size => size.toLowerCase() === trimmed.substring(6));
    if (!paperSize) throw new Error(`Invalid paper size: ${option}`);
    return paperSize as LatexPaperSize;
}

const isPaperSizeByNamed = (option: string): option is NamedLatexPaperSize => {
    try {
        getPaperSizeByNamed(option);
        return true;
    } catch (error) {
        return false;
    }
}

const getPaperSizeByDimensions = (option: string): PaperDimensions => {
    const dimensionsMatch = option.match(/papersize=\{([^}]+)\}/);
    if (!dimensionsMatch) throw new Error(`Invalid paper size: ${option}`);
    if (!dimensionsMatch[1]) throw new Error(`Invalid paper size: ${option}`);
    const dimensions = dimensionsMatch[1].split(',');
    if (!dimensions[0] || !dimensions[1]) throw new Error(`Invalid paper size: ${option}`);
    if (!isOptionLatexUnit(dimensions[0].trim()) || !isOptionLatexUnit(dimensions[1].trim())) throw new Error(`Invalid paper size: ${option}`);
    return {
        width: dimensions[0].trim() as LatexUnitValue,
        height: dimensions[1].trim() as LatexUnitValue
    };
}

const isPaperSizeByDimensions = (option: string): option is PageMarginOption => {
    try {
        getPaperSizeByDimensions(option);
        return true;
    } catch (error) {
        return false;
    }
}

export const isOptionPaperSize = (option: string): { paperSize?: LatexPaperSize, dimensions?: PaperDimensions } => {
    const trimmed = option.trim().toLowerCase();


    if (isPaperSizeByName(trimmed)) {
        return {
            paperSize: getPaperSizeByName(option),
        };
    }
    
    // Check for paper=<name> format
    if (isPaperSizeByNamed(trimmed)) {
        return {
            paperSize: getPaperSizeByNamed(option),
        };
    }
    
    // Check for papersize={width,height} format
    if (isPaperSizeByDimensions(trimmed)) {
        return {
            dimensions: getPaperSizeByDimensions(option),
        };
    }
    
    return {};
    
}