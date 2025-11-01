export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type HHmm = string; // 例: "15:30"
export type InstructorType = "jp" | "native"; // 日本人/ネイティブ

export interface SelectedSlot {
    day: DayOfWeek;
    date: string; // "YYYY-MM-DD"
    timeslot: TimeSlot;
}

export interface TimeSlot {
  time: HHmm;
  instructor: InstructorType;
}

export interface ClassInfo {
  classId: string;
  schedule: Partial<Record<DayOfWeek, TimeSlot[]>>;
}

export interface School {
  name?: string;
  classes: Record<string, ClassInfo>;
}

// ルート: schoolId -> School（例: "urawa", "nagatsuta"...）
export type LessonSchedulesFile = Record<string, School>;
