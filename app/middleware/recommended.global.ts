import { useReservationStore } from "~/stores/reservation";

function firstString(v: unknown): string | null {
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : null;
  return typeof v === "string" ? v : null;
}

export default defineNuxtRouteMiddleware((to) => {
  const store = useReservationStore();

  const rc = firstString(to.query.recommendedClass);
  const rco = firstString(to.query.recommendedCourse);

  if (rc) store.recommendedClassId = rc;
  if (rco) store.recommendedCourseId = rco;
});
