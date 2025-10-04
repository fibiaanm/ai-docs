<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { EditorView, keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { history, historyKeymap } from '@codemirror/commands';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { latex } from 'codemirror-lang-latex';
import { useLatexDocument } from '../composables/document/useLatexDocument';
import SinglePageDocumentViewer from './SinglePageDocumentViewer.vue';

const editorParent = ref<HTMLDivElement|null>(null);
const documentContent = ref<string>('');
const pageCount = ref<number>(0);
let view: EditorView | null = null;
const latexDoc = useLatexDocument();


// Spanish economic proposal document
const initialTex = String.raw`\documentclass[12pt]{article}
\usepackage[spanish]{babel}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[a4paper,margin=1in]{geometry}
\usepackage{xcolor}
\usepackage{setspace}
\linespread{2}
\setlength{\parindent}{1.27cm}
\setlength{\parskip}{6pt}

\begin{document}

% --- APA-style title page ---
\begin{titlepage}
    \centering
    \vspace*{3cm}
    
    {\Large\textbf{The Positive Impact of Artificial Intelligence on Automated Coding:\\Understanding the Learning Curve}\par}
    \vspace{2cm}
    
    {\large Fabián Mejía\par}
    \vspace{1cm}
    
    {\large Freepik University\par}
    \vspace{1cm}
    
    {\large Department of Computer Science\par}
    \vspace{1cm}
    
    {\large October 2025\par}
    \vfill
    
    {\large Author Note\par}
    {\small
    This paper was prepared for [Course Name], instructed by [Instructor’s Name].\\
    Correspondence concerning this paper should be addressed to\\
    Fabián Mejía, email: fabianmejia@freepik.com
    }
\end{titlepage}

\end{document}


\[
\int_{0}^{\infty} e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}, 
\quad 
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
\]

\end{document}
`;

function getDoc(): string {
  return view ? view.state.doc.toString() : '';
}

// Debounce helper
let t: number | undefined;
function debounce(fn: () => void, ms = 200) {
  window.clearTimeout(t);
  t = window.setTimeout(fn, ms);
}

// Update document content for the page viewer
function updateDocumentContent() {
  const tex = getDoc();
  documentContent.value = tex;
}

onMounted(() => {
  if (!editorParent.value) return;

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
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          debounce(updateDocumentContent, 200);
        }
      }),
      EditorView.theme({
        '&': { 
          height: '100%', 
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' 
        },
        '.cm-content': { fontSize: '14px' },
        '.cm-focused': { outline: 'none' },
        
        // Enhanced LaTeX token highlighting
        '.tok-keyword': { color: '#d73a49', fontWeight: 'bold' },
        '.tok-string': { color: '#032f62' },
        '.tok-comment': { color: '#6a737d', fontStyle: 'italic' },
        '.tok-operator': { color: '#d73a49' },
        '.tok-number': { color: '#005cc5' },
        '.tok-punctuation': { color: '#24292e', fontWeight: 'bold' },
        '.tok-bracket': { color: '#005cc5', fontWeight: 'bold' },
        '.tok-brace': { color: '#24292e', fontWeight: 'bold' },
        '.tok-function': { color: '#6f42c1', fontWeight: 'bold' },
        '.tok-variableName': { color: '#e36209' },
        '.tok-typeName': { color: '#d73a49', fontWeight: 'bold' },
        '.tok-tagName': { color: '#e36209', fontWeight: 'bold' },
        '.tok-attributeName': { color: '#6f42c1' },
        '.tok-escape': { color: '#d73a49', fontWeight: 'bold' },
        
        // LaTeX-specific tokens
        '.tok-latex-command': { color: '#d73a49', fontWeight: 'bold' },
        '.tok-latex-environment': { color: '#e36209', fontWeight: 'bold' },
        '.tok-latex-math': { color: '#6f42c1' },
        '.tok-latex-comment': { color: '#6a737d', fontStyle: 'italic' },
        '.tok-latex-keyword': { color: '#d73a49', fontWeight: 'bold' },
        
        // CodeMirror class-based highlighting
        '.cm-latex-command': { color: '#d73a49', fontWeight: 'bold' },
        '.cm-latex-keyword': { color: '#d73a49', fontWeight: 'bold' },
        '.cm-latex-brace': { color: '#24292e', fontWeight: 'bold' },
        '.cm-latex-bracket': { color: '#005cc5', fontWeight: 'bold' },
        '.cm-latex-comment': { color: '#6a737d', fontStyle: 'italic' },
        '.cm-latex-environment': { color: '#e36209', fontWeight: 'bold' },
        '.cm-latex-math': { color: '#6f42c1' },
      }),
    ],
  });

  view = new EditorView({ state, parent: editorParent.value });
  
  // Register the editor with the LatexDocument singleton
  latexDoc.editor = view;
  
  // Initialize document content
  updateDocumentContent();
});

onBeforeUnmount(() => {
  if (view) {
    view.destroy();
    view = null;
  }
});
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] gap-4 p-4">
    <!-- Editor -->
    <div class="basis-1/2 min-w-[320px] border rounded-2xl overflow-hidden shadow-sm">
      <div class="px-3 py-2 border-b flex items-center justify-between bg-gray-50">
        <strong>LaTeX Editor</strong>
      </div>
      <div ref="editorParent" class="h-[calc(100vh-140px)]"></div>
    </div>

    <!-- Document Viewer -->
    <div class="basis-1/2 min-w-[320px] flex flex-col">
      <!-- Header with page info -->
      <div class="px-3 py-2 border-b bg-gray-50 flex items-center justify-between text-sm">
        <strong>Document Preview</strong>
        <span class="text-gray-600">
          {{ pageCount }} page{{ pageCount !== 1 ? 's' : '' }}
        </span>
      </div>
      
      <!-- Document viewer -->
      <div class="flex-1 overflow-hidden border rounded-b-2xl h-[calc(100vh-140px)]">
        <SinglePageDocumentViewer
          :content="documentContent"
          :scale="0.7"
        />
      </div>
    </div>
  </div>
</template>

