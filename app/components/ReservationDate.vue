<template>
    <section-card card-title="日付選択">
        <template #cardItem>
            <!-- <div class="px-3 py-2"> -->
            <div class="px-3 py-2 date-wrap" ref="dateWrap">
                <VSlideGroup v-model="selectedKey" show-arrows mandatory class="date-slide-group date-arrows-overlay">
                    <template #prev="{ prev }">
                        <v-btn icon="mdi-chevron-left" variant="text" density="compact"
                            class="date-arrow date-arrow--prev" @click="prev" aria-label="前へ" />
                    </template>
                    <template #next="{ next }">
                        <v-btn icon="mdi-chevron-right" variant="text" density="compact"
                            class="date-arrow date-arrow--next" @click="next" aria-label="次へ" />
                    </template>

                    <VSlideGroupItem v-for="d in days" :key="d.key" :value="d.key" v-slot="{ isSelected, toggle }">
                        <div class="date-item" :class="{ 'is-disabled': d.disabled }" @click="!d.disabled && toggle()"
                            :aria-disabled="d.disabled ? 'true' : 'false'">
                            <div class="dow" :style="{ color: d.dowColor }">{{ d.dowLabel }}</div>
                            <div class="date-number" :class="{ selected: isSelected }">
                                {{ d.dateLabel }}
                            </div>
                        </div>
                    </VSlideGroupItem>
                </VSlideGroup>
            </div>

            <VDivider />

            <div class="px-4 py-4">
                <div v-if="selectedDate" class="text-subtitle-1 mb-3">
                    {{ formatYMD(selectedDate) }} の空き時間
                </div>

                <v-row v-if="timeSlots.length" dense>
                    <v-col v-for="(t, i) in timeSlots" :key="t.value" cols="6" sm="4" md="3">
                        <v-btn block :variant="isSelectedTimeSlot(t.label) ? 'flat' : 'outlined'"
                            :color="isSelectedTimeSlot(t.label) ? 'primary' : undefined" :disabled="t.disabled"
                            @click="onSelectedTimeSlot(i, t)">
                            {{ t.label }}（{{ t.instructorLabel }}）
                        </v-btn>
                    </v-col>
                </v-row>

                <div v-else class="text-medium-emphasis text-body-2">
                    選択可能な時間はありません
                </div>
            </div>
        </template>
    </section-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { DayOfWeek, HHmm, SelectedSlot, TimeSlot } from '~/types' // ← あなたの型定義に合わせて
import { useReservationStore } from '#imports';


//-----------------
const dateWrap = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

onMounted(() => {
    const el = dateWrap.value
    if (!el) return
    const setW = () => el.style.setProperty('--wrap-w', `${el.clientWidth}px`)
    ro = new ResizeObserver(setW)
    ro.observe(el)
    setW()
})
onBeforeUnmount(() => {
    ro?.disconnect()
})
//-----------------
// defineEmits<{ (e: 'select', iso: string): void }>()

const store = useReservationStore();

interface SelectedTimeSlotInfo {
    date: string;
    time: string;
}
const selectedTimeSlotInfo = ref<SelectedTimeSlotInfo | null>(null);

watch(() => store.selectedClassInfo, (info) => {
    selectedTimeSlotInfo.value = null;
})

/* Utilities: 日付 */
const start = startOfDay(new Date())     // 今日
const endMax = addMonths(start, 1)       // 1か月先まで
const dowLabels = ['日', '月', '火', '水', '木', '金', '土']
const dowKeys: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/** このクラスで予約できる曜日（数値 0=Sun..6=Sat の Set） */
const allowedDows = computed<Set<number>>(() => {
    const out = new Set<number>()
    const sch = store.selectedClassInfo?.schedule ?? {}
    for (const k in sch) {
        const day = dowKeys.indexOf(k as DayOfWeek)
        if (day >= 0 && (sch as any)[k]?.length) out.add(day)
    }
    return out
})

/** 日付スライダー（今日〜1か月、未対応曜日は disabled） */
const days = computed(() => {
    const out: { key: string; date: Date; dateLabel: string; dowLabel: string; dowColor: string; disabled: boolean }[] = []
    for (let d = new Date(start); d <= endMax; d = addDays(d, 1)) {
        const dow = d.getDay()
        const isSun = dow === 0, isSat = dow === 6
        const selectableByClass = allowedDows.value.has(dow)
        out.push({
            key: ymdKey(d),
            date: new Date(d),
            dateLabel: String(d.getDate()),
            dowLabel: dowLabels[dow] ?? '',
            dowColor: isSun ? 'crimson' : (isSat ? 'deepskyblue' : 'inherit'),
            // 今日未満は不可 + このクラスで許可されていない曜日は不可
            disabled: d < start || !selectableByClass,
        })
    }
    return out
})

/** 選択された日付キーと実体（最初は選べる最初の日に自動セット） */
const selectedKey = ref<string | null>(null)
const firstEnabledKey = computed(() => days.value.find(d => !d.disabled)?.key ?? null)
watch(selectedKey, () => {
    console.log('Selected date key:', selectedKey.value);
})
watchEffect(() => {
    const cur = selectedKey.value
    const curItem = days.value.find(d => d.key === cur)
    if (!cur || !curItem || curItem.disabled) {
        selectedKey.value = firstEnabledKey.value
    }
})
const selectedDate = computed<Date | null>(() => {
    const k = selectedKey.value
    return days.value.find(d => d.key === k)?.date ?? null
})

const isSelectedTimeSlot = computed(() => (time: string) => {
    return selectedTimeSlotInfo.value !== null && selectedTimeSlotInfo.value.time === time && selectedTimeSlotInfo.value.date === selectedKey.value
})

/** 選択日のタイムスロット（クラスのスケジュールから生成） */
type SlotItem = { label: string; value: string; disabled: boolean; instructorLabel: string, dayOfWeek?: DayOfWeek }
const timeSlots = computed<SlotItem[]>(() => {
    if (!selectedDate.value || !store.selectedClassInfo) return []
    const dowStr = dowKeys[selectedDate.value.getDay()] as DayOfWeek
    const slots: TimeSlot[] = store.selectedClassInfo.schedule[dowStr] ?? []
    const now = new Date()

    return slots.map(s => {
        const dt = parseHM(selectedDate.value!, s.time)
        return {
            label: s.time,
            value: dt.toISOString(),
            disabled: dt < now,
            instructorLabel: s.instructor === 'jp' ? '日本人' : 'ネイティブ',
            dayOfWeek: dowStr
        }
    })
})

const onSelectedTimeSlot = (index: number, t: SlotItem) => {
    console.log('Selected time slot:', t)
    selectedTimeSlotInfo.value = {
        date: selectedKey.value!,
        time: t.label
    }
    const selectedSlot: SelectedSlot = {
        day: t.dayOfWeek!,
        date: selectedKey.value!,
        timeslot: {
            time: t.label,
            instructor: t.instructorLabel === '日本人' ? 'jp' : 'native'
        }
    }
    store.selectedSlot = selectedSlot;
}

/* 小ユーティリティ */
function ymdKey(d: Date) { // タイムゾーンズレ防止にローカルYMDを使う
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
function formatYMD(d: Date) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
    return `${y}/${m}/${day}`
}
function parseHM(date: Date, hm: HHmm) {
    const [H = 0, M = 0] = hm.split(':').map(Number)
    const d = new Date(date); d.setHours(H, M, 0, 0); return d
}
</script>

<style scoped>
/* アイテムの幅を揃えると内蔵矢印のスクロールが安定します */
.date-slide-group {
    min-height: 72px;
    position: relative;
    overflow: visible;
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

/* .date-slide-group.wide {
    --item-w: 72px;
    --item-gap: 12px;
} */

.date-slide-group :deep(.v-slide-group__content > .v-slide-group-item) {
    flex: 0 0 auto !important;
    /* 伸縮禁止。中身の幅のまま並べる */
    max-width: none !important;
}

/* 必要なら .wide の指定はそのまま併用可 */
.date-item {
    /* width: 72px; */
    width: 68px;
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

@media (max-width: 600px) {
    .date-item {
        width: 32px;
        margin: 0 4px;
        padding: 4px 2px;
    }

    .date-number {
        width: 28px;
        height: 28px;
        line-height: 28px;
        font-size: 13px;
    }

    .dow {
        font-size: 11px;
    }
}

.date-number {
    width: 34px;
    height: 34px;
    line-height: 34px;
    /* width: 40px;
    height: 40px;
    line-height: 40px; */
    border-radius: 10%;
    text-align: center;
    transition: background-color .15s, color .15s;
    cursor: pointer;
    background-color: transparent;
}

.date-number:hover:not(.selected) {
    background-color: rgba(0, 0, 0, 0.04);
}

.date-item.is-disabled {
    opacity: .25;
    /* 全体を薄く */
    filter: grayscale(1);
    /* 色味を落とす */
    cursor: not-allowed;
    /* ポインタで不可を示す */
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

.date-arrows-overlay :deep(.v-slide-group__container) {
    padding-inline: 2px !important;
}

/* 矢印を端にオーバーレイ＆小型化 */
.date-arrows-overlay {
    position: relative;
}

.date-arrow.v-btn--icon {
    width: 24px;
    height: 24px;
    min-width: 24px;
    padding: 0;
}

.date-arrow .v-icon {
    font-size: 18px;
}

.date-arrow--prev,
.date-arrow--next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
}

.date-arrow--prev {
    left: 0;
}

.date-arrow--next {
    right: 0;
}

/* モバイルはさらに詰めたい場合 */
@media (max-width: 600px) {
    .date-arrow.v-btn--icon {
        width: 22px;
        height: 22px;
    }

    .date-arrow .v-icon {
        font-size: 16px;
    }
}

.date-slide-group {
    position: relative;
}

/* ラッパー自体を絶対配置＝レイアウト幅を消す */
:deep(.v-slide-group__prev),
:deep(.v-slide-group__next) {
    position: absolute !important;
    top: 50%;
    transform: translateY(-50%);
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    z-index: 2;

    /* 矢印ラッパー自体はクリックを拾わない＝中身だけ反応 */
    pointer-events: none;
}

/* 端に寄せる */
:deep(.v-slide-group__prev) {
    left: -12px;
}

:deep(.v-slide-group__next) {
    right: -12px;
}

/* コンテナが確保する左右マージン/パディングをゼロに */
:deep(.v-slide-group__container) {
    margin-inline: 0 !important;
    padding-inline: 2px !important;
    /* 任意で微少だけ残す */
}

/* Vuetifyは「矢印あり」のとき root にこのクラスを付けて margin を足す → それも潰す */
:deep(.v-slide-group--has-affixes .v-slide-group__container) {
    margin-inline: 0 !important;
}

/* 矢印ボタンを小型化（中のボタンだけ） */
.date-arrow.v-btn--icon {
    width: 22px;
    height: 22px;
    min-width: 22px;
    padding: 0;
    pointer-events: auto;
}

.date-arrow .v-icon {
    font-size: 16px;
}

/* モバイルはさらに詰めるなら */
@media (max-width: 600px) {
    :deep(.v-slide-group__container) {
        padding-inline: 1px !important;
    }

    .date-arrow.v-btn--icon {
        width: 20px;
        height: 20px;
    }

    :deep(.v-slide-group__prev) {
        left: -16px;
    }

    :deep(.v-slide-group__next) {
        right: -16px;
    }
}
</style>
