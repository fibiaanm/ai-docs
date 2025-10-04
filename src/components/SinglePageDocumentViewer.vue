<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { DEFAULT_PAGE_DIMENSIONS, DEFAULT_PAGE_MARGINS } from '../constants/page-dimensions';
import { type ParsedGeometry } from '../utils/geometry-parser';
import { useCreateLatexStream } from '../composables/document/useCreateLatexStream';

interface Props {
  content: string;
  scale?: number;
  showPageNumbers?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  scale: 0.8,
  showPageNumbers: false
});

const contentElement = ref<HTMLDivElement | null>(null);

// Get current geometry configuration for rendering
const currentGeometry = ref<ParsedGeometry>({
  dimensions: DEFAULT_PAGE_DIMENSIONS,
  margins: DEFAULT_PAGE_MARGINS,
  fontSize: 14,
  documentClass: 'article',
  paragraphSettings: { parindent: 20, parskip: 0, lineSpread: 1.0 }
});

const fontSize = computed(() => currentGeometry.value.fontSize * props.scale);
const lineHeight = computed(() => 1.6 * props.scale);
const paragraphSpacing = computed(() => currentGeometry.value.paragraphSettings.parskip * props.scale);
const paragraphSize = computed(() => currentGeometry.value.paragraphSettings.parindent * props.scale);

// Calculate scaled dimensions
const scaledWidth = () => currentGeometry.value.dimensions.width * props.scale;
const scaledMargins = () => ({
  top: currentGeometry.value.margins.top * props.scale,
  right: currentGeometry.value.margins.right * props.scale,
  bottom: currentGeometry.value.margins.bottom * props.scale,
  left: currentGeometry.value.margins.left * props.scale,
});

const { createStream } = useCreateLatexStream(
    currentGeometry,
    [
        (content: string) => {
            return content.replace(/\\(?:newpage|clearpage)/g, '\n\n<hr class="page-break-line my-8 border-t-2 border-gray-300">\n\n');
        }
    ]
);

// Render content function
const renderLatexContent = () => {
  if (!contentElement.value) return;
  createStream(props.content, contentElement.value);
};

// Watch for content changes
watch(() => props.content, () => {
  renderLatexContent();
});

onMounted(() => {
  renderLatexContent();
});
</script>

<template>
  <div 
    class="single-page-document-viewer w-full h-full overflow-auto bg-gray-100 pt-8"
  >
    <!-- Single document page with auto height -->
    <div class="flex flex-col items-center">
      <div 
        class="document-page bg-white shadow-lg mx-auto mb-6"
        :style="{
          width: `${scaledWidth()}px`
        }"
      >
        <!-- Content area -->
        <div 
          ref="contentElement"
          class="text-black leading-relaxed"
          :style="{
            width: `${scaledWidth() - scaledMargins().left - scaledMargins().right}px`,
            marginLeft: `${scaledMargins().left}px`,
            marginRight: `${scaledMargins().right}px`,
            marginTop: `${scaledMargins().top}px`,
            marginBottom: `${scaledMargins().bottom}px`,
            fontSize: `${fontSize}px`,
            lineHeight: `${lineHeight}`
          }"
        ></div>
      </div>
      
      <!-- Empty state when no content -->
      <div v-if="!content.trim()" 
           class="text-center text-gray-500 mt-16">
        <div class="text-lg mb-2">Start typing to see your document</div>
        <div class="text-sm">Your LaTeX content will appear here as you write</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.single-page-document-viewer {
  /* Custom scrollbar for better aesthetics */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.single-page-document-viewer::-webkit-scrollbar {
  width: 12px;
}

.single-page-document-viewer::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.single-page-document-viewer::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 6px;
  border: 2px solid #f1f5f9;
}

.single-page-document-viewer::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

.document-page {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Ensure math content scales properly */
.document-page :deep(.katex) {
  font-size: 1em;
}

.document-page :deep(.katex-display) {
  margin: 1em 0;
}

/* Style content appropriately */
.document-page :deep(p) {
  text-align: justify;
  hyphens: auto;
}
</style>
