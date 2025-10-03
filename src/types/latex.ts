import type { EditorView } from '@codemirror/view';

export interface LatexDocument {
  id: string;
  title: string;
  content: string;
  template: string;
  lastModified: Date;
}

export interface LatexTemplate {
  name: string;
  description: string;
  content: string;
}

export interface EditorConfig {
  fontSize: number;
  fontFamily: string;
  lineNumbers: boolean;
  wordWrap: boolean;
  theme: 'light' | 'dark';
}

export interface PreviewConfig {
  showSource: boolean;
  autoRender: boolean;
  debounceMs: number;
}

export interface LatexEditorInstance {
  editor: EditorView;
  getContent: () => string;
  setContent: (content: string) => void;
  insertText: (text: string) => void;
  focus: () => void;
  destroy: () => void;
}
