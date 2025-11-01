import { defineStore } from "pinia";
import type { ClassInfo, Course, DayOfWeek, LessonClass, LessonSchedulesFile, SelectedSlot, TimeSlot } from "~/types";

export const useReservationStore = defineStore("reservation", {
  state: () => ({
    schoolId: "urawa" as string,
    selectedCourse: null as Course | null,
    selectedClass: null as LessonClass | null,
    selectedClassInfo: null as ClassInfo | null,
    selectedSlot: null as SelectedSlot | null,
    allCourses: [] as Course[],
    allClasses: [] as LessonClass[],
    allSchedules: {} as LessonSchedulesFile,
    recommendedCourseId: "" as string,
    recommendedClassId: "" as string,
  }),
  actions: {
    async loadSettings() {
      this.allCourses = await $fetch("/api/data?file=courses.json");
      this.allClasses = await $fetch("/api/data?file=classes.json");
      this.allSchedules = await $fetch("/api/data?file=schedule.json");
      console.log("Settings loaded", this.allCourses, this.allClasses);
    },
    setSelectedCourse(course: Course) {
      this.selectedCourse = course;
      this.selectedClass = null;
      this.selectedClassInfo = null;
      this.selectedSlot = null;
    },
    setSelectedClass(lessonClass: LessonClass) {
      this.selectedClass = lessonClass;
      const school = this.allSchedules?.[this.schoolId]
      this.selectedClassInfo = school?.classes?.[lessonClass.id] ?? null;
      this.selectedSlot = null;
      console.log("Selected class info set", this.selectedClassInfo);
    }
    //   this.selectedClass = class;
    // },
    // setSelectedDate(date) {
    //   this.selectedDate = date;
    // },
  },
});
