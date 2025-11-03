<template>
    <template v-if="isReservationCompleted"><thank-you-view /></template>
    <template v-else>
        <debug-panel />
        <reservation-course />
        <reservation-class />
        <reservation-date id="dateSection" ref="dateSection" />
        <div class="d-flex justify-center mb-16">
            <v-btn class="my-4" :disabled="store.selectedSlot === undefined || store.selectedSlot === null" rounded
                color="success" size="x-large" @click="showConfirmDialog = true">
                入力内容を確認する
            </v-btn>
        </div>
        <reservation-confirm-dialog v-model="showConfirmDialog" @update:model="onReservationComplete" />
    </template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReservationStore } from '~/stores/reservation';
import { useGoTo } from '#imports';
import liff from '@line/liff';

defineEmits<{ (e: 'select', iso: string): void }>()
const goTo = useGoTo();
const dateSection = ref<HTMLElement | null>(null);

const store = useReservationStore();
const showConfirmDialog = ref(false);
const isReservationCompleted = ref(false);

watch(() => store.selectedClass, (newClass) => {
    if (newClass) {
        // コース選択後に日付セクションへスクロール
        console.log('Class selected, scrolling to date section', newClass);
        if (dateSection.value) {
            goTo(dateSection.value, { offset: -80 });
        }
    }
});

onMounted(async () => {
    store.loadSettings();
    liff.login();
    console.log('ReservationForm mounted')
})

watch(showConfirmDialog, (newVal) => {
    console.log('Show confirm dialog:', store.selectedSlot)
})

const onReservationComplete = () => {
    isReservationCompleted.value = true;
}

</script>

<style scoped>
/* アイテムの幅を揃えると内蔵矢印のスクロールが安定します */
.date-slide-group {
    min-height: 72px;
}

.day-chip {
    margin: 4px;
    width: 88px;
    height: 64px;
    justify-content: center;
}

.day-chip__inner {
    display: grid;
    grid-template-rows: auto auto;
    line-height: 1.1;
    text-align: center;
}

.dow {
    font-size: 12px;
    opacity: .9;
}

.date-slide-group.wide {
    --item-w: 72px;
    /* ←ここで1日の横幅を増やす（例: 64〜80） */
    --item-gap: 12px;
    /* アイテム間の余白 */
}

/* 必要なら .wide の指定はそのまま併用可 */
.date-item {
    width: 72px;
    margin: 0 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 8px 4px;
    border-radius: 8px;
    transition: background-color .15s;
}

.date-item:hover {
    background-color: rgba(0, 0, 0, 0.02);
}

.date-number {
    width: 40px;
    height: 40px;
    line-height: 40px;
    border-radius: 10%;
    text-align: center;
    transition: background-color .15s, color .15s;
    cursor: pointer;
    background-color: transparent;
}

.date-number:hover:not(.selected) {
    background-color: rgba(0, 0, 0, 0.04);
}

/* 選択時の色を明示的に指定 */
.date-number.selected {
    background-color: #1976d2 !important;
    /* プライマリブルー */
    color: white !important;
}

/* Vuetifyテーマ変数が利用可能な場合 */
.v-theme--light .date-number.selected {
    background-color: rgb(var(--v-theme-primary)) !important;
    color: rgb(var(--v-theme-on-primary)) !important;
}

.v-theme--dark .date-number.selected {
    background-color: rgb(var(--v-theme-primary)) !important;
    color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
