<script setup lang="ts">
import { ref } from 'vue';
import { useLatexDocument } from '../composables/document/useLatexDocument';

const latexDoc = useLatexDocument();
const showTemplates = ref(false);

const insertTemplate = (templateName: string) => {
  latexDoc.insertTemplate(templateName);
  showTemplates.value = false;
};

const availableTemplates = latexDoc.getAvailableTemplates();
</script>

<template>
  <div class="h-16 w-full bg-gray-900 border-b border-gray-700 flex items-center px-4 justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-white font-bold text-lg">LaTeX Editor</h1>
      
      <!-- Template Selector -->
      <div class="relative">
        <button
          @click="showTemplates = !showTemplates"
          class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
        >
          Templates ▼
        </button>
        
        <div
          v-if="showTemplates"
          class="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-50 min-w-[200px]"
        >
          <button
            v-for="template in availableTemplates"
            :key="template.name"
            @click="insertTemplate(template.name.toLowerCase())"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
          >
            <div class="font-medium">{{ template.name }}</div>
            <div class="text-sm text-gray-600">{{ template.description }}</div>
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Future: File operations, export, etc. -->
      <span class="text-gray-400 text-sm">Ready</span>
    </div>
  </div>
</template>
