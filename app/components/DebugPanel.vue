<template>
  <Teleport to="body">
    <div
      v-if="logs.length"
      class="debug-panel"
    >
      <div class="debug-header">
        <span>DEBUG</span>
        <button class="debug-close" @click="logs = []">×</button>
      </div>
      <div class="debug-body">
        <div v-for="(log, i) in logs" :key="i" class="debug-item">
          <pre>{{ log }}</pre>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const logs = useState<string[]>('__debug_logs', () => [])

defineExpose({
  push(log: string) {
    logs.value.unshift(log)
    // たまりすぎ防止
    logs.value = logs.value.slice(0, 10)
  },
})
</script>

<style scoped>
.debug-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 40vh;
  background: rgba(0,0,0,.9);
  color: #fff;
  font-size: 12px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
}
.debug-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(255,255,255,.1);
  font-weight: 600;
}
.debug-close {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 16px;
}
.debug-body {
  overflow: auto;
  padding: 6px 8px 10px;
  gap: 4px;
}
.debug-item {
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,.15);
}
pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
</style>
