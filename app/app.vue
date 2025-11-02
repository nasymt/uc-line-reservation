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

    <!-- <nuxt-layout>
      <nuxt-page />
    </nuxt-layout> -->

    <v-main class="grey" style="background-color: #EEE;">
      <reservation-form />
      <!-- <v-btn color="primary">asdfAA</v-btn> -->
      <!-- <NuxtRouteAnnouncer />
    <NuxtWelcome /> -->
      <!-- <v-btn :loading="loading" @click="onSignOut" variant="text">
        ログアウト
      </v-btn> -->
    </v-main>

  </v-layout>

</template>

<script setup lang="ts">
const { $supabase } = useNuxtApp()
const loading = ref(false)
const msg = useState<string | null>('flash', () => null) // 任意: 画面間でメッセージ共有

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

/* 念のため、影を完全に無効化しておきたい場合は以下も可
.v-app-bar {
  box-shadow: none !important;
}
*/
</style>