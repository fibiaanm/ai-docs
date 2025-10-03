<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  currentFontSize: number
  minFontSize: number
  maxFontSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:fontSize': [fontSize: number]
}>()

// Convert font size to percentage for the slider (12px = 0%, 24px = 100%)
const fontSizePercentage = computed(() => {
  const range = props.maxFontSize - props.minFontSize
  return Math.round(((props.currentFontSize - props.minFontSize) / range) * 100)
})

const localPercentage = ref(fontSizePercentage.value)

watch(fontSizePercentage, (newVal) => {
  localPercentage.value = newVal
})

const handleFontSizeChange = () => {
  const range = props.maxFontSize - props.minFontSize
  const fontSize = props.minFontSize + (localPercentage.value / 100) * range
  emit('update:fontSize', Math.round(fontSize))
}
</script>

<template>
  <div class="absolute bottom-4 right-4 bg-white rounded shadow-lg p-4 flex items-center gap-3">
    <span class="text-sm text-gray-600">Font Size:</span>
    <input
      v-model.number="localPercentage"
      type="range"
      min="0"
      max="100"
      step="5"
      class="w-32"
      @change="handleFontSizeChange"
    />
    <span class="text-sm font-medium text-gray-700 min-w-[3rem]">
      {{ props.currentFontSize }}px
    </span>
  </div>
</template>

