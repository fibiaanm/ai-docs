<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { EditorView, keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { history, historyKeymap } from '@codemirror/commands';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { latex } from 'codemirror-lang-latex';
import { useLatexDocument } from '../composables/document/useLatexDocument';
import DocumentViewer from './DocumentViewer.vue';
import { processGeometry } from '../utils/geometry-parser';

const editorParent = ref<HTMLDivElement|null>(null);
const documentContent = ref<string>('');
const pageCount = ref<number>(0);
let view: EditorView | null = null;
const latexDoc = useLatexDocument();


// Spanish economic proposal document
const initialTex = String.raw`\documentclass[25pt]{article}
\usepackage[spanish]{babel}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[a4paper,margin=2.5cm]{geometry}
\usepackage{xcolor}
\usepackage{setspace}
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt}

\begin{document}

\begin{center}
{\fontsize{25}{18}\selectfont \textbf{PROPUESTA ECONÓMICA}}
\end{center}

\vspace{14pt}

Bucaramanga 23 de mayo de 2025

\vspace{10pt}

Señores\\
\textbf{UNIVERSIDAD SANTO TOMÁS}\\
Bucaramanga\\
NIT 860.012.357-6

\vspace{10pt}

\textbf{Asunto:} Ensamble de estructura y elementos electrónicos de cancha robótica para el proyecto de investigación titulado "Fortaleciendo Red para promover la convivencia escolar - Fase 2"

Por medio de la presente, me permito presentar la propuesta ensamble de estructura y elementos electrónicos de cancha robótica, con el objetivo de fomentar el aprendizaje práctico en tecnología y robótica.

El servicio incluye el ensamble de estructura de la cancha, sensores para detectar goles automáticamente, cámaras para grabar los partidos y una plataforma web local para organizar campeonatos, registrar resultados y mostrar el marcador en tiempo real. El sistema será autónomo, sin necesidad de internet, y funcionará con componentes electrónicos y software personalizado.

Esta propuesta económica busca ofrecer una experiencia innovadora que combine entretenimiento, educación y tecnología, ideal para espacios académicos o actividades de formación, de acuerdo con el diseño e indicaciones de los clientes.

Esta propuesta económica busca ofrecer una experiencia innovadora que combine entretenimiento, educación y tecnología, ideal para espacios académicos o actividades de formación, de acuerdo con el diseño e indicaciones de los clientes.

  Esta propuesta económica busca ofrecer una experiencia innovadora que combine entretenimiento, educación y tecnología, ideal para espacios académicos o actividades de formación, de acuerdo con el diseño e indicaciones de los clientes.
  Esta propuesta económica busca ofrecer una experiencia innovadora que combine entretenimiento, educación y tecnología, ideal para espacios académicos o actividades de formación, de acuerdo con el diseño e indicaciones de los clientes. Esta propuesta económica busca ofrecer una experiencia innovadora que combine entretenimiento, educación y tecnología, ideal para espacios académicos o actividades de formación, de acuerdo con el diseño e indicaciones de los clientes.

\vspace{6pt}

\textbf{Tiempo de ejecución:} 1 mes\\
\textbf{Costo del servicio:} $ 2.000.000 (Pago del (100%) al finalizar el servicio)

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

// Handle page count changes from DocumentViewer
function handlePageCountChanged(count: number) {
  pageCount.value = count;
}

// Get dynamic page dimensions based on geometry package
const getCurrentPageDimensions = () => {
  const tex = getDoc();
  const geometry = processGeometry(tex);
  return geometry.dimensions;
};


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
        <DocumentViewer
          :content="documentContent"
          :page-dimensions="getCurrentPageDimensions()"
          :scale="0.7"
          @page-count-changed="handlePageCountChanged"
        />
      </div>
    </div>
  </div>
</template>

