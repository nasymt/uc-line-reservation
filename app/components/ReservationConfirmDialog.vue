<template>
    <v-dialog v-model="model">
        <v-card>
            <v-card-title class="text-h5 text-center">予約内容の確認</v-card-title>
            <v-card-text>
                <v-table class="confirm-table w-100">
                    <tbody>
                        <tr>
                            <td>コース</td>
                            <td>{{ store.selectedCourse?.label }}</td>
                        </tr>
                        <tr>
                            <td>クラス</td>
                            <td>{{ store.selectedClass?.label ?? '未選択' }}</td>
                        </tr>
                        <tr>
                            <td>日付</td>
                            <td>{{ store.selectedSlot?.date ?? '未選択' }}</td>
                        </tr>
                        <tr>
                            <td>時間</td>
                            <td>{{ store.selectedSlot?.timeslot.time ?? '未選択' }}</td>
                        </tr>
                        <tr>
                            <td>体験時間</td>
                            <td>{{ store.selectedClass?.duration }}分(目安)</td>
                        </tr>
                    </tbody>
                </v-table>

                <v-divider class="my-4" />
                <v-alert type="info" variant="tonal" class="mb-2">
                    ・予約を送信した段階では確定しておらず、数日以内にスクールから連絡をいたします。
                    この連絡をもってご予約が確定となります。
                </v-alert>
                <!-- チェック必須 -->
                <v-checkbox v-model="agree" hide-details="auto" density="comfortable" label="上記の確認事項を理解し、同意します" />

                <!-- <div>
                    <div><strong>コース:</strong> {{ store.selectedCourse?.label }}</div>
                    <div><strong>クラス:</strong> {{ store.selectedClass?.label ?? '未選択' }}</div>
                    <div><strong>日付:</strong> {{ store.selectedSlot?.date ?? '未選択' }}</div>
                    <div><strong>時間:</strong> {{ store.selectedSlot?.timeslot.time ?? '未選択' }}</div>
                    <div><strong>体験時間:</strong> {{ store.selectedClass?.duration }}分(目安)</div>
                </div> -->
            </v-card-text>
            <v-card-actions class="d-flex justify-center gap-3 flex-wrap">
                <v-btn color="secondary" variant="flat" @click="model = false">
                    戻る
                </v-btn>

                <v-btn color="primary" variant="flat" :disabled="!agree" @click="/* 予約確定処理をここに追加 */ model = false">
                    予約を確定する
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import { useReservationStore } from '#imports';
const model = defineModel<boolean>({ type: Boolean, required: true, default: false })
const store = useReservationStore();

const agree = ref(false)
</script>

<style scoped>
.confirm-table td:first-child {
    text-align: right;
    white-space: nowrap;
    font-weight: 600;
    padding-right: 12px;
}
</style>