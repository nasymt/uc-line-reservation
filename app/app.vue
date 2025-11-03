<template>
  <v-layout>
    <v-app-bar app color="#FFEF8A" flat dark>
      <v-img src="https://uc.kyoshin.co.jp/wp-content/uploads/sites/6/2024/02/uc-logo-vertical.svg" alt="UCラインロゴ"
        height="120" contain class="ml-2" style="max-width: 180px" />

      <!-- 中央固定タイトル（ロゴ幅に影響されない） -->
      <v-toolbar-title class="appbar-title">
        無料体験予約フォーム
      </v-toolbar-title>
    </v-app-bar>

    <v-main class="grey" style="background-color: #EEE;">
      <global-loading />
      <reservation-form />
    </v-main>
  </v-layout>

</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()

onMounted(() => {
  ui.start('ページを読み込み中です…')
  setTimeout(() => {
    ui.stop()
  }, 5000)
})
</script>

<style scoped>
.appbar-title {
  position: absolute;
  left: 0;
  right: 20px;
  text-align: right;
  font-weight: 500;
  pointer-events: none;
  /* クリックを下の要素に通す（必要なら） */
}
</style>