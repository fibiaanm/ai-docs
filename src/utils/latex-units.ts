export type LatexUnit = 'pt' | 'px' | 'em' | 'cm' | 'mm' | 'in';
export type LatexUnitValue = `${number}${LatexUnit}`;

/**
 * Convert LaTeX units to CSS pixels
 * 
 * @param value - LaTeX unit value (e.g., "10pt", "2em", "1.5cm")
 * @returns Pixel value as number
 */
export function convertLatexUnit(value: LatexUnitValue | string): number {
  const match = value.match(/^([0-9.]+)(.*)$/);
  if (!match || !match[1]) return 0;
  
  const numStr = match[1];
  const unit = match[2] || '';
  const num = parseFloat(numStr);
  
  switch (unit.toLowerCase()) {
    case 'pt': return num * 1.333; // points to pixels
    case 'px': return num; // pixels
    case 'em': return num * 16; // em to pixels (assuming 16px base)
    case 'cm': return num * 37.795; // centimeters to pixels
    case 'mm': return num * 3.7795; // millimeters to pixels
    case 'in': return num * 96; // inches to pixels
    default: return num; // fallback to treating as pixels
  }
}

/**
 * Check if an option is any of the LaTeX units
 * @param option 
 * @returns 
 */
export function isOptionLatexUnit(option: string): boolean {
  return option.match(/(\d+(?:\.\d+)?)pt|px|em|cm|mm|in/) !== null;
}
