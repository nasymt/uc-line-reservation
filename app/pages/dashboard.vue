<!-- app/pages/dashboard.vue の例 -->
<script setup lang="ts">
definePageMeta({ requiresAuth: true })
const mounted = ref(false)
onMounted(() => { mounted.value = true })
</script>

<template>
    <!-- SSR では常に同じマークアップ（空 or ローディング）を返す -->
    <div v-if="mounted">
        <!-- 本来のダッシュボードUI -->
    </div>
    <div v-else style="min-height: 40vh; display:grid; place-items:center;">
        読み込み中…
    </div>
</template>
