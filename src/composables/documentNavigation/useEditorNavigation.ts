import { ref } from 'vue';
import { EditorView } from '@codemirror/view';

export const useEditorNavigation = (editorRef: EditorView) => {
  const currentZoom = ref<number>(1);
  const minZoom = 0.5;
  const maxZoom = 2;

  const setZoom = (zoom: number) => {
    if (zoom > maxZoom) zoom = maxZoom;
    if (zoom < minZoom) zoom = minZoom;
    
    currentZoom.value = zoom;
    
    // Apply zoom to editor
    editorRef.dom.style.fontSize = `${14 * zoom}px`;
  };

  const zoomIn = () => {
    setZoom(currentZoom.value * 1.1);
  };

  const zoomOut = () => {
    setZoom(currentZoom.value * 0.9);
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const goToLine = (lineNumber: number) => {
    const line = editorRef.state.doc.line(Math.max(1, Math.min(lineNumber, editorRef.state.doc.lines)));
    editorRef.dispatch({
      selection: { anchor: line.from },
      scrollIntoView: true
    });
  };

  const findText = (searchText: string) => {
    // Basic find functionality - in a real implementation you'd use @codemirror/search
    const content = editorRef.state.doc.toString();
    const index = content.indexOf(searchText);
    
    if (index !== -1) {
      editorRef.dispatch({
        selection: { anchor: index, head: index + searchText.length },
        scrollIntoView: true
      });
    }
  };

  return {
    currentZoom,
    minZoom,
    maxZoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    goToLine,
    findText
  };
};

export type useEditorNavigationType = ReturnType<typeof useEditorNavigation>;
