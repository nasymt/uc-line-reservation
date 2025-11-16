<template>
    <section-card card-title="クラス選択">
        <template v-slot:cardItem>
            <v-list class="class-list" lines="two" density="comfortable">
                <!-- <v-list-item v-for="c in filteredClasses" :key="c.id" :title="c.label" :subtitle="c.description"
                    :active="store.selectedClass?.id === c.id" @click="store.setSelectedClass(c)"> -->
                <v-list-item v-for="c in filteredClasses" :key="c.id" :title="c.label" :subtitle="c.description"
                    :active="store.selectedClass?.id === c.id">
                    <template #title>
                        <span>{{ c.label }}</span>
                        <span v-if="store.recommendedClassId == c.id"
                            :style="{ color: '#43C0A2', fontWeight: '600' }">(あなたへのオススメ!)</span>
                    </template>
                    <template #prepend>
                        <v-checkbox :model-value="isSelected(c)" @click.stop="store.setSelectedClass(c)"
                            :aria-pressed="isSelected(c)" :label="''" />
                    </template>

                    <!-- 右側のボタン群（共通の詳細／選択） -->
                    <template #append>
                        <div class="d-flex align-center ga-2">
                            <!-- <v-btn variant="outlined" size="small" prepend-icon="mdi-information-outline"> -->
                            <v-btn variant="outlined" size="small" @click="onClickDetail(c)">
                                詳細
                            </v-btn>
                        </div>
                    </template>
                </v-list-item>
            </v-list>

            <!-- <class-card /> -->
        </template>
    </section-card>
    <class-detail-dialog v-if="detailClass" :selected-class="detailClass" v-model="detailDialogOpen"
        @select-class="onSelectClass" />
</template>

<script setup lang="ts">
import type { LessonClass } from '~/types';
import { useReservationStore } from '#imports'
const store = useReservationStore();

const isSelected = (c: LessonClass) => store.selectedClass?.id === c.id
const detailDialogOpen = ref(false);
const detailClass = ref<LessonClass | null>(null);

const filteredClasses = computed(() => {
    return store.allClasses.filter(c => c.courseId === store.selectedCourse?.id)
})
const onClickDetail = (c: LessonClass) => {
    detailClass.value = c;
    detailDialogOpen.value = true;
}

const onSelectClass = (selectedClass: LessonClass) => {
    detailDialogOpen.value = false
    nextTick(() => {
        store.setSelectedClass(selectedClass)
    })
}

</script>

<style scoped>
/* 選択中カードの塗りつぶし（Vuetify v3 のテーマ変数を使用） */
.selectable-card.is-selected {
    background-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
    transform: translateY(-2px);
}

/* 内部テキストも反転させる */
.selectable-card.is-selected .v-card-title,
.selectable-card.is-selected .text-caption,
.selectable-card.is-selected .text-body-1,
.selectable-card.is-selected .text-medium-emphasis {
    color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
