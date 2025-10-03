import { EditorView } from '@codemirror/view';
import { useLatexTemplates } from './useLatexTemplate';

export class LatexDocument {
  static instance: LatexDocument | null = null;
  
  static createInstance() {
    if (LatexDocument.instance) {
      return LatexDocument.instance;
    }
    LatexDocument.instance = new LatexDocument();
    return LatexDocument.instance;
  }

  constructor() {}

  private _editor: EditorView | null = null;
  private _currentTemplate: string = 'article';
  public documentContent: string = '';

  get editor() {
    if (!this._editor) {
      throw new Error('Editor not initialized');
    }
    return this._editor;
  }

  set editor(editor: EditorView) {
    this._editor = editor;
  }

  public getDocumentContent(): string {
    return this._editor ? this._editor.state.doc.toString() : '';
  }

  public setDocumentContent(content: string): void {
    if (!this._editor) return;
    
    const transaction = this._editor.state.update({
      changes: { from: 0, to: this._editor.state.doc.length, insert: content }
    });
    this._editor.dispatch(transaction);
  }

  public insertTemplate(templateName: string): void {
    const templates = useLatexTemplates();
    const template = templates.getTemplate(templateName);
    
    if (template && this._editor) {
      this.setDocumentContent(template.content);
      this._currentTemplate = templateName;
    }
  }

  public getCurrentTemplate(): string {
    return this._currentTemplate;
  }

  public getAvailableTemplates() {
    const templates = useLatexTemplates();
    return templates.getAllTemplates();
  }
}

export const useLatexDocument = () => {
  return LatexDocument.createInstance();
};
