<template>
    <!-- 呼び出し側の例 -->
    <!-- <v-btn color="primary" @click="open = true">ベイビークラスの詳細</v-btn> -->

    <!-- 詳細ダイアログ -->
    <v-dialog v-model="open" max-width="760" scrollable transition="dialog-bottom-transition">
    <!-- <v-dialog v-model="open" :fullscreen="xs" max-width="760" scrollable transition="dialog-bottom-transition"> -->
        <v-card class="pa-0 rounded-xl class-dialog">

            <!-- 閉じるのみ -->
            <v-btn class="close-btn" icon="mdi-close" variant="tonal" @click="open = false" />

            <v-card-text class="pa-4 pa-sm-6">
                <!-- タイトル帯 -->
                <div class="hero-title mb-4">{{ props.selectedClass.label }}</div>

                <!-- 大きな画像 -->
                <v-img :src="props.selectedClass.img" :alt="props.selectedClass.label" aspect-ratio="16/9"
                    class="rounded-lg mb-4" cover />

                <!-- チップ（見出しバッジ） -->
                <div class="d-flex flex-wrap ga-2 mb-4">
                    <v-chip class="pill" variant="flat">保護者さま同伴</v-chip>
                    <v-chip class="pill" variant="flat">40分授業</v-chip>
                    <v-chip class="pill" variant="flat">外国人講師</v-chip>
                </div>

                <!-- 情報ボックス -->
                <div class="info-box mb-4">
                    <div class="info-row">
                        <div class="label">対象年齢</div>
                        <div class="value">0〜2歳</div>
                    </div>
                    <div class="info-row">
                        <div class="label">振替授業</div>
                        <div class="value">あり</div>
                    </div>
                </div>

                <!-- 見出し＋本文 -->
                <h3 class="section-lead mb-3">
                    保護者とのふれあいを通じて赤ちゃんがコミュニケーションを学ぶステージ
                </h3>
                <p class="catch mb-4">
                    保護者も一緒に楽しみながら英語を学び、お家で英語の絵本の読み聞かせができるようになります。
                </p>
                <p class="body">
                    ベイビークラスでは、知育玩具などを使って赤ちゃんの探究心や興味を引き出します。
                    外国人講師による英語での語りかけによって言語能力の可能性がグンと広がります。
                </p>
                <p class="body">
                    年齢や成長に合わせて次はペアクラスです。
                </p>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import type { LessonClass } from '~/types';

const open = defineModel({ type: Boolean, required: true, default: false })
const props = defineProps({
    selectedClass: {
        type: Object as () => LessonClass,
        required: true
    }
});

const { xs } = useDisplay()  // xsはモバイル判定 → fullscreenに使用
</script>

<style scoped>
/* カラーパレット（必要に応じて調整） */
:root {
    --accent: #c85a2e;
    --cream: #fbf1e6;
}

/* ダイアログ本体 */
.class-dialog {
    position: relative;
}

/* 閉じるボタン（右上） */
.close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
}

/* タイトル帯（角丸の塗りつぶし） */
.hero-title {
    background: #fa6e37;
    /* background: var(--accent); */
    color: #FFF;
    border-radius: 16px;
    padding: 10px 16px;
    font-weight: 800;
    font-size: clamp(20px, 4.2vw, 28px);
}

/* チップ（画像の下のオレンジのピル） */
.pill {
    background: #fa6e37 !important;
    color: #FFF !important;
    font-weight: 700;
    border-radius: 999px;
}

/* 情報ボックス（薄いクリーム色の角丸） */
.info-box {
    background: #fbf1e6;
    border-radius: 16px;
    padding: 16px;
}

.info-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 6px 0;
}

.label {
    min-width: 96px;
    font-weight: 700;
}

.value {
    font-weight: 600;
}

/* 見出し＆本文の雰囲気 */
.section-lead {
    color: var(--accent);
    font-weight: 800;
    line-height: 1.6;
}

.catch {
    font-weight: 800;
    line-height: 1.8;
}

.body {
    line-height: 1.9;
}

/* 画像の角丸を強めに（元画像に合わせて） */
:deep(.v-img.rounded-lg) {
    border-radius: 16px;
}
</style>