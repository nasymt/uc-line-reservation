<template>
    <v-container class="fill-height success-container" fluid>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="10" md="8" lg="6">
                <v-sheet class="success-card text-center rounded-xl pa-8 pa-sm-10">
                    <!-- チェックアイコン（丸枠） -->
                    <div class="icon-circle mb-4">
                        <v-icon size="44" color="success">mdi-check</v-icon>
                    </div>

                    <!-- 見出し -->
                    <h1 class="text-h5 text-md-h4 font-weight-bold mb-4">送信が完了しました</h1>

                    <!-- 本文 -->
                    <p class="text-body-1 mb-2">お申し込みいただきありがとうございました。</p>
                    <p class="text-body-1 mb-6">担当者より改めてご連絡いたします。</p>

                    <!-- 必要なら戻るボタン（任意） -->
                    <!-- <v-btn color="primary" variant="flat" @click="goHome">トップへ戻る</v-btn> -->
                </v-sheet>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
const goHome = () => {
    // ルーティングに合わせて書き換え
    // 例）vue-router: router.push('/')
    // window.location.href = '/'
};
</script>

<style scoped>
.success-container {
    background: #fafafa;
    /* うっすら明るい背景（任意） */
}

/* 白カード */
.success-card {
    background: #fff;
    box-shadow: 0 6px 24px rgba(0, 0, 0, .06);
}

/* 丸いチェック（枠＋淡い背景） */
.icon-circle {
    width: 96px;
    height: 96px;
    margin: 0 auto;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 2px solid rgba(var(--v-theme-success), .35);
    background: rgba(var(--v-theme-success), .06);
}
</style>
