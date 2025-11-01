<template>
    <section-card card-title="クラス選択">
        <template v-slot:cardItem>
            <v-slide-group show-arrows>
                <v-slide-group-item v-for="c in filteredClasses" :key="c.id" :value="c.id">
                    <v-card class="ma-4 selectable-card" variant="elevated" width="280">
                        <v-img :src="c.img" height="120" cover />
                        <v-card-title class="py-2">{{ c.label }}</v-card-title>
                        <v-card-text class="pt-0">
                            <div class="d-flex justify-space-between">
                                <div>
                                    <div class="text-caption text-medium-emphasis">料金</div>
                                    <div class="text-body-1">￥{{ 0 }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">所要時間</div>
                                    <div class="text-body-1">{{ c.duration }}</div>
                                </div>
                            </div>
                        </v-card-text>
                        <v-card-actions class="pt-0">
                            <v-btn block color="primary" :variant="isSelected(c) ? 'flat' : 'outlined'"
                                @click="store.setSelectedClass(c)">
                                <template v-if="isSelected(c)">
                                    <v-icon icon="mdi-check" class="mr-1" />
                                    選択中
                                </template>
                                <template v-else>
                                    このクラスを選ぶ
                                </template>
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-slide-group-item>
            </v-slide-group>
            <!-- <class-card /> -->
        </template>
    </section-card>
</template>

<script setup lang="ts">
import type { LessonClass } from '~/types';
import { useReservationStore } from '#imports'
const store = useReservationStore();

const isSelected = (c: LessonClass) => store.selectedClass?.id === c.id

const filteredClasses = computed(() => {
    return store.allClasses.filter(c => c.courseId === store.selectedCourse?.id)
})
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
