import { EditorView, lineNumbers, highlightActiveLineGutter, keymap, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { history, historyKeymap } from '@codemirror/commands';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { latex } from 'codemirror-lang-latex';

export const createLatexEditor = (element: HTMLDivElement, onDocumentChange: () => void) => {
  const initialTex = String.raw`\documentclass{article}
\usepackage{amsmath, amssymb}
\title{Hello, LaTeX on the Web}
\author{You}
\begin{document}
\maketitle

Inline math $E=mc^2$ and display:
\[
\int_{0}^{\infty} e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}.
\]

\end{document}
`;

  const state = EditorState.create({
    doc: initialTex,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      keymap.of([
        indentWithTab,
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      latex(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onDocumentChange();
        }
      }),
      EditorView.theme({
        '&': { 
          height: '100%', 
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' 
        },
        '.cm-content': { fontSize: '14px' },
      }),
    ],
  });

  const view = new EditorView({ 
    state, 
    parent: element 
  });

  return view;
};
