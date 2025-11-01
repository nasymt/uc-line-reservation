import type { InstructorType } from "./lessonSchedule";

export interface LessonClass {
  id: string;
  courseId: string;
  label: string;
  duration: number; // minutes
  recommendedAge?: string;
  instructorType?: InstructorType;
  img: string;
}
