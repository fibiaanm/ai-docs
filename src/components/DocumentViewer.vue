<script setup lang="ts">
import { computed, watch } from 'vue';
import DocumentPage from './DocumentPage.vue';
import type { PageDimensions, PageMargins } from '../constants/page-dimensions';
import { DEFAULT_PAGE_DIMENSIONS, DEFAULT_PAGE_MARGINS, PAGE_SPACING } from '../constants/page-dimensions';
import { parseLatexContent, paginateContent, contentItemsToHtml } from '../utils/pagination';
import { processGeometry } from '../utils/geometry-parser';

interface Props {
  content: string;
  pageDimensions?: PageDimensions;
  pageMargins?: PageMargins;
  scale?: number;
  showPageNumbers?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  scale: 0.8, // Default scale for better fit
  showPageNumbers: true
});

const emit = defineEmits<{
  'page-count-changed': [count: number]
}>();

// For now, we'll show content on a single page
// In the future, this can be enhanced to split content across multiple pages
const pages = computed(() => {
  // Extract geometry settings from content
  const geometryConfig = processGeometry(props.content);
  
  // First split by explicit page breaks (\newpage, \clearpage)
  const explicitPageBreaks = props.content.split(/\\(?:newpage|clearpage)/);
  
  const allPages: string[] = [];
  
  for (const pageContent of explicitPageBreaks) {
    if (!pageContent.trim()) continue;
    
    // Parse content into structured items
    const contentItems = parseLatexContent(pageContent);
    
    // Use geometry settings or fallback to props/defaults
    const dimensions = props.pageDimensions ?? geometryConfig.dimensions ?? DEFAULT_PAGE_DIMENSIONS;
    const margins = props.pageMargins ?? geometryConfig.margins ?? DEFAULT_PAGE_MARGINS;
    
    // Paginate content based on page height
    const paginatedItems = paginateContent(contentItems, dimensions!.height, margins);
    
    // Convert paginated items back to HTML content
    for (const pageItems of paginatedItems) {
      if (pageItems.length > 0) {
        allPages.push(contentItemsToHtml(pageItems));
      }
    }
  }
  
  return allPages.length > 0 ? allPages : [''];
});

// Get current geometry configuration for rendering
const currentGeometry = computed(() => {
  const geometryConfig = processGeometry(props.content);
  return {
    dimensions: props.pageDimensions ?? geometryConfig.dimensions ?? DEFAULT_PAGE_DIMENSIONS,
    margins: props.pageMargins ?? geometryConfig.margins ?? DEFAULT_PAGE_MARGINS
  };
});


// Emit page count changes
watch(() => pages.value.length, (newCount) => {
  emit('page-count-changed', newCount);
});
</script>

<template>
  <div 
    class="document-viewer w-full h-full overflow-auto bg-gray-100 pt-8"
  >
    <!-- Document pages -->
    <div class="flex flex-col items-center">
      <DocumentPage
        v-for="(pageContent, index) in pages"
        :key="index"
        :content="pageContent"
        :page-number="showPageNumbers ? index + 1 : 0"
        :dimensions="currentGeometry.dimensions"
        :margins="currentGeometry.margins"
        :scale="scale"
        :is-pre-processed="true"
        :style="{ marginBottom: index < pages.length - 1 ? `${PAGE_SPACING}px` : '0' }"
      />
      
      <!-- Empty state when no content -->
      <div v-if="pages.length === 0 || !content.trim()" 
           class="text-center text-gray-500 mt-16">
        <div class="text-lg mb-2">Start typing to see your document</div>
        <div class="text-sm">Your LaTeX content will appear here as you write</div>
      </div>
    </div>
    
    <!-- Document info footer -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <div v-if="pages.length > 0">
        {{ pages.length }} page{{ pages.length !== 1 ? 's' : '' }} • 
        {{ (pageDimensions ?? DEFAULT_PAGE_DIMENSIONS).name }} format
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-viewer {
  /* Custom scrollbar for better aesthetics */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.document-viewer::-webkit-scrollbar {
  width: 12px;
}

.document-viewer::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.document-viewer::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 6px;
  border: 2px solid #f1f5f9;
}

.document-viewer::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}
</style>
