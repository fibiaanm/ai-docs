// Lorem ipsum generator utility
// Simulates the LaTeX lipsum package functionality

const LOREM_IPSUM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'reprehenderit', 'in', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos',
  'accusamus', 'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis',
  'praesentium', 'voluptatum', 'deleniti', 'atque', 'corrupti', 'quos', 'dolores',
  'quas', 'molestias', 'excepturi', 'occaecati', 'cupiditate', 'facilis', 'est',
  'expedita', 'distinctio', 'nam', 'libero', 'tempore', 'cum', 'soluta', 'nobis',
  'eligendi', 'optio', 'cumque', 'nihil', 'impedit', 'quo', 'minus', 'maxime',
  'placeat', 'facere', 'possimus', 'omnis', 'assumenda', 'repellendus',
  'temporibus', 'autem', 'quibusdam', 'officiis', 'debitis', 'rerum',
  'necessitatibus', 'saepe', 'eveniet', 'voluptates', 'repudiandae', 'recusandae',
  'itaque', 'earum', 'hic', 'tenetur', 'sapiente', 'delectus', 'reiciendis',
  'voluptatibus', 'maiores', 'alias', 'perferendis', 'doloribus', 'asperiores',
  'repellat', 'neque', 'porro', 'quisquam', 'totam', 'rem', 'aperiam', 'eaque',
  'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis', 'quasi', 'architecto',
  'beatae', 'vitae', 'dicta', 'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas',
  'aspernatur', 'odit', 'aut', 'fugit', 'consequuntur', 'magni', 'ratione',
  'sequi', 'nesciunt'
];

/**
 * Generate Lorem ipsum text
 * @param words Number of words to generate
 * @param startWithLorem Whether to start with "Lorem ipsum"
 * @returns Generated text
 */
export function generateLipsum(words: number = 50, startWithLorem: boolean = true): string {
  if (words <= 0) return '';
  
  const result: string[] = [];
  
  if (startWithLorem && words >= 2) {
    result.push('Lorem', 'ipsum');
    words -= 2;
  }
  
  for (let i = 0; i < words; i++) {
    const randomIndex = Math.floor(Math.random() * LOREM_IPSUM_WORDS.length);
    const word = LOREM_IPSUM_WORDS[randomIndex];
    if (word) {
      result.push(word);
    }
  }
  
  // Capitalize first letter and add period at the end
  if (result.length > 0 && result[0]) {
    result[0] = result[0].charAt(0).toUpperCase() + result[0].slice(1);
  }
  
  return result.join(' ') + '.';
}

/**
 * Generate Lorem ipsum paragraphs
 * @param paragraphs Number of paragraphs
 * @param wordsPerParagraph Words per paragraph (can be a range)
 * @returns Generated paragraphs
 */
export function generateLipsumParagraphs(
  paragraphs: number = 3, 
  wordsPerParagraph: number | [number, number] = [40, 80]
): string[] {
  const result: string[] = [];
  
  for (let i = 0; i < paragraphs; i++) {
    let wordCount: number;
    
    if (Array.isArray(wordsPerParagraph)) {
      const [min, max] = wordsPerParagraph;
      wordCount = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      wordCount = wordsPerParagraph;
    }
    
    const startWithLorem = i === 0; // Only first paragraph starts with "Lorem ipsum"
    result.push(generateLipsum(wordCount, startWithLorem));
  }
  
  return result;
}

/**
 * Generate LaTeX lipsum command equivalent
 * @param paragraphs Number of paragraphs (1-150, matching LaTeX lipsum package)
 * @returns LaTeX-formatted lipsum text
 */
export function generateLatexLipsum(paragraphs: number = 3): string {
  if (paragraphs < 1) paragraphs = 1;
  if (paragraphs > 150) paragraphs = 150;
  
  const paras = generateLipsumParagraphs(paragraphs, [50, 100]);
  return paras.join('\n\n');
}

/**
 * LaTeX lipsum commands that can be processed
 */
export const LIPSUM_COMMANDS = {
  '\\lipsum': () => generateLatexLipsum(3),
  '\\lipsum[1]': () => generateLatexLipsum(1),
  '\\lipsum[1-3]': () => generateLatexLipsum(3),
  '\\lipsum[1-5]': () => generateLatexLipsum(5),
  '\\lipsum[1-10]': () => generateLatexLipsum(10),
};

/**
 * Process lipsum commands in LaTeX text
 * @param text LaTeX text containing lipsum commands
 * @returns Text with lipsum commands replaced
 */
export function processLipsumCommands(text: string): string {
  let processedText = text;
  
  // Replace specific lipsum commands
  Object.entries(LIPSUM_COMMANDS).forEach(([command, generator]) => {
    const regex = new RegExp(command.replace(/[[\]]/g, '\\$&'), 'g');
    processedText = processedText.replace(regex, generator());
  });
  
  // Handle generic \lipsum[n] commands
  processedText = processedText.replace(/\\lipsum\[(\d+)\]/g, (_, n) => {
    const paragraphs = Math.min(parseInt(n, 10), 150);
    return generateLatexLipsum(paragraphs);
  });
  
  // Handle range commands \lipsum[n-m]
  processedText = processedText.replace(/\\lipsum\[(\d+)-(\d+)\]/g, (_, start, end) => {
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    const count = Math.min(endNum - startNum + 1, 150);
    return generateLatexLipsum(count);
  });
  
  return processedText;
}
