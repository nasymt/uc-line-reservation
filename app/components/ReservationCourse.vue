<template>
  <section-card card-title="コース選択">
    <template v-slot:cardItem>
      <v-row dense class="course-grid">
        <v-col v-for="(course, index) in store.allCourses" :key="index" cols="12" sm="6" md="4" lg="3">
          <v-btn block size="large" class="course-btn"
            :class="{ 'course-btn--active': store.selectedCourse === course }" variant="outlined"
            @click="store.setSelectedCourse(course)" :aria-pressed="store.selectedCourse === course">
            <template #prepend>
              <v-icon :icon="store.selectedCourse === course ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'"
                class="mr-2" />
            </template>

            <span class="course-label">{{ course.label }}<span v-if="store.recommendedCourseId == course.id"
                :style="{ color: store.selectedCourse === course ? '#fff' : '#43C0A2', fontWeight: '600' }">(あなたへのオススメ!)</span></span>
          </v-btn>
        </v-col>
      </v-row>
    </template>
  </section-card>
</template>

<script setup lang="ts">
import { useReservationStore } from '~/stores/reservation';

const store = useReservationStore();
// const selectedCourse = ref<string>("");
</script>

<style scoped>
.course-btn {
  justify-content: flex-start;
  /* 先頭にアイコン＋テキストを寄せる */
  border-width: 1px;
  /* アウトラインをやや太く */
  min-height: 56px;
  /* タッチしやすい高さ */
  transition: background-color .15s, border-color .15s, color .15s, box-shadow .15s;
}

.course-btn--active {
  background-color: #43C0A2;
  color: white;
  border-color: #43C0A2;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .12);
}

.course-btn:not(.course-btn--active):hover {
  border-color: #43C0A2;
}

.course-label {
  /* 2行まで表示し、それ以上は省略（長文対策） */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
  line-height: 1.2;
}
</style>
